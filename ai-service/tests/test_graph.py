"""流程图的测试：用假链代替大模型，检查走哪条分支、条件怎么清洗、步骤怎么记录。"""
import pytest

from app import prompts
from app.graph import build_graph
from app.graph.nodes import calendar
from app.llm import RETRY, LlmError
from app.schemas import ChatMessage, Conditions
from tests.fakes import fake_chains, parsed
from tests.sample_data import DISTRICTS, MONDAY, POIS, SATURDAY, TODAY


def run(chains, **inputs):
    return build_graph(chains).invoke({"today": TODAY, "pois": POIS, "districts": DISTRICTS, **inputs})


def titles(state):
    return [s.title for s in state["steps"]]


def test_small_talk_only_calls_classify_and_chat():
    calls = []
    state = run(fake_chains(intent="CHAT", mood="ANNOYED", calls=calls), message="帮我写作业")
    assert state["intent"] == "CHAT" and state["mood"] == "ANNOYED"
    assert state["reply"] == "招呼打完了？说正事。"
    assert [name for name, _ in calls] == ["classify", "chat"]
    assert "result" not in state


def test_planning_goes_through_every_step():
    calls = []
    state = run(fake_chains(understood=parsed(seniors=2, pace="RELAXED", district_ids=[1]), calls=calls),
                message="周六带爸妈逛老城区")
    assert [name for name, _ in calls] == ["classify", "understand", "write"]
    assert titles(state) == ["识别意图", "理解需求", "筛选景点", "排出行程", "校验"]
    assert state["conditions"].seniors == 2
    assert state["result"].items
    assert state["mood"] == "PROUD" and state["warnings"] == []
    assert state["reply"] == "哼，排好了。开放时间和票价以官网为准。"  # 大模型漏了提醒时自动补上


def test_model_output_is_cleaned():
    understood = parsed(date="2020-01-01", start_time="九点", adults=0, budget=-5, district_ids=[1, 99],
                        must_poi_ids=[1, 3, 999], avoid_poi_ids=[3], interests=["历史人文", "瞎编的"],
                        missing=["date"])
    state = run(fake_chains(understood=understood), message="想去陈家祠")
    c = state["conditions"]
    assert c.date == "2026-09-18"  # 过去的日期不要，第一次规划用默认的明天
    assert c.start_time == "09:00"
    assert c.adults == 1 and c.budget == 0
    assert c.district_ids == [1]
    assert c.must_poi_ids == [1] and c.avoid_poi_ids == [3]
    assert c.interests == ["历史人文"]
    assert state["missing"] == ["date"]
    assert "没说日期，按明天算" in state["steps"][1].detail


def test_follow_up_is_marked_as_modified():
    calls = []
    current = Conditions(date=SATURDAY, budget=500)
    history = [ChatMessage(role="user", content="周六去老城区"), ChatMessage(role="assistant", content="排好了")]
    state = run(fake_chains(understood=parsed(seniors=2, budget=500, missing=["date"]), calls=calls),
                message="带上爸妈", conditions=current, history=history)
    assert state["steps"][0].detail == "规划行程，在原来的条件上修改"
    assert state["modified"] is True and state["missing"] == []
    classify_inputs = calls[0][1]
    assert [m.type for m in classify_inputs["history"]] == ["human", "ai"]
    assert classify_inputs["plan_state"] == "已经有行程"


def test_warnings_make_xiaoxiao_caring():
    understood = parsed(date=MONDAY, must_poi_ids=[4], notes=["某地暂未收录，没有排进去"])
    state = run(fake_chains(understood=understood), message="下周一去省博")
    assert state["mood"] == "CARING"
    assert state["warnings"][0] == "某地暂未收录，没有排进去"
    assert any("周一闭馆" in w for w in state["warnings"])


def test_replan_skips_understanding():
    calls = []
    state = run(fake_chains(calls=calls), conditions=Conditions(date=SATURDAY, avoid_poi_ids=[1]))
    assert [name for name, _ in calls] == ["write"]
    assert titles(state) == ["按修改后的条件", "筛选景点", "排出行程", "校验"]
    assert all(it.poi_id != 1 for it in state["result"].items)


@pytest.mark.parametrize("intent, message", [("PLAN", "周六带爸妈逛老城区"), ("CHAT", "你好")])
def test_node_inputs_fit_the_prompts(intent, message):
    """假链替换了“提示词 + 模型”，这里用节点实际传的输入把提示词填一遍，防止变量名对不上。"""
    calls = []
    run(fake_chains(intent=intent, calls=calls), message=message, history=[ChatMessage(role="user", content="在吗")])
    templates = {"classify": prompts.CLASSIFY, "chat": prompts.CHAT, "understand": prompts.UNDERSTAND, "write": prompts.WRITE}
    for name, inputs in calls:
        messages = templates[name].invoke(inputs).to_messages()
        assert "{" not in messages[0].content.replace("{{", "")  # 系统提示词里没有漏填的变量


def test_calendar_marks_this_week_and_next_week():
    lines = calendar(TODAY).splitlines()  # 2026-09-17 是周四
    assert lines[0] == "2026-09-17 周四（本周，今天）"
    assert lines[3] == "2026-09-20 周日（本周）"
    assert lines[4] == "2026-09-21 周一（下周）"
    assert len(lines) == 14


def test_model_errors_stop_the_flow():
    with pytest.raises(LlmError) as info:
        run(fake_chains(understood=LlmError(RETRY, "请求超时了，再试一次吧")), message="周六去老城区")
    assert info.value.code == RETRY
