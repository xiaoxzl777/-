"""用 LangGraph 把小萧处理一条消息的过程组装成一张固定的流程图：

    敏感内容检查 ─(命中)→ 用写好的话回复，不调用大模型
                └─(通过)→ 识别意图 ─(闲聊)→ 闲聊回复
                                  └─(规划)→ 理解需求 → 排行程 → 校验 → 写回复

按条件重排（页面上改了条件或删了站）时没有新消息，从“按修改后的条件”直接进入排行程。
"""
from langgraph.graph import END, START, StateGraph

from ..chains import Chains
from .nodes import Nodes
from .state import TripState


def build_graph(chains: Chains):
    nodes = Nodes(chains)
    graph = StateGraph(TripState)
    graph.add_node("guard", nodes.guard)
    graph.add_node("classify", nodes.classify)
    graph.add_node("chat", nodes.chat)
    graph.add_node("understand", nodes.understand)
    graph.add_node("use_conditions", nodes.use_conditions)
    graph.add_node("plan", nodes.plan)
    graph.add_node("check", nodes.check)
    graph.add_node("write", nodes.write)

    # 有消息就先做敏感内容检查，通过了再识别意图；没有消息说明是按条件重排
    graph.add_conditional_edges(START, lambda s: "guard" if s.get("message") else "use_conditions",
                                ["guard", "use_conditions"])
    graph.add_conditional_edges("guard", lambda s: END if s.get("intent") == "BLOCKED" else "classify",
                                [END, "classify"])
    graph.add_conditional_edges("classify", lambda s: "chat" if s["intent"] == "CHAT" else "understand",
                                ["chat", "understand"])
    graph.add_edge("chat", END)
    graph.add_edge("understand", "plan")
    graph.add_edge("use_conditions", "plan")
    graph.add_edge("plan", "check")
    graph.add_edge("check", "write")
    graph.add_edge("write", END)
    return graph.compile()
