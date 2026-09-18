"""测试用的假链：不联网，按设定返回固定内容，并记下每次调用的输入。"""
from langchain_core.runnables import RunnableLambda

from app.chains import Chains, IntentResult, ParsedRequest
from tests.sample_data import SATURDAY


def parsed(**kwargs) -> ParsedRequest:
    values = {"date": SATURDAY, "start_time": "09:00", "adults": 1, "seniors": 0, "children": 0, "budget": None,
              "pace": "NORMAL", "district_ids": [], "must_poi_ids": [], "avoid_poi_ids": [], "interests": [],
              "missing": [], "notes": []}
    return ParsedRequest(**{**values, **kwargs})


def fake_chains(intent="PLAN", mood="PROUD", understood=None, chat_reply="招呼打完了？说正事。",
                write_reply="哼，排好了。", calls=None) -> Chains:
    calls = calls if calls is not None else []

    def record(name, output):
        def run(inputs):
            calls.append((name, inputs))
            if isinstance(output, Exception):
                raise output
            return output
        return RunnableLambda(run)

    return Chains(
        classify=record("classify", IntentResult(intent=intent, mood=mood)),
        chat=record("chat", chat_reply),
        understand=record("understand", understood or parsed()),
        write=record("write", write_reply),
    )
