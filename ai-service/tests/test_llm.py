"""DeepSeek 接入的测试：不真正联网，用固定的返回内容检查解析、清洗和兜底。"""
import json
import random

from app.llm import DeepSeek
from app.schemas import ChatRequest, Conditions
from app.service import XiaoXiao
from tests.sample_data import DISTRICTS, POIS, SATURDAY, TODAY


class FakeDeepSeek(DeepSeek):
    def __init__(self, *answers):
        super().__init__(api_key="test-key")
        self.answers = list(answers)
        self.calls = []

    def _complete(self, messages, json_mode, max_tokens=800):
        self.calls.append((messages, json_mode))
        return self.answers.pop(0) if self.answers else None


def request(message, conditions=None):
    return ChatRequest(message=message, conditions=conditions, today=TODAY.isoformat(), districts=DISTRICTS, pois=POIS)


def test_chat_intent_uses_model_reply():
    llm = FakeDeepSeek(json.dumps({"intent": "CHAT", "mood": "ANNOYED", "reply": "喂，我只管广州行程。", "conditions": None}))
    result = llm.understand(request("帮我写作业"))
    assert result.intent == "CHAT"
    assert result.mood == "ANNOYED"
    assert result.reply == "喂，我只管广州行程。"


def test_plan_conditions_are_cleaned():
    answer = {
        "intent": "PLAN", "mood": "PROUD", "reply": "",
        "conditions": {"date": "2020-01-01", "startTime": "9点", "adults": 0, "seniors": 2, "children": 0, "budget": -5,
                       "pace": "RELAXED", "districtIds": [1, 99], "mustPoiIds": [1, 3, 999], "avoidPoiIds": [3],
                       "interests": ["历史人文", "瞎编的兴趣"]},
        "missing": ["date"], "notes": ["xx暂未收录，没有排进去"],
    }
    result = FakeDeepSeek(json.dumps(answer)).understand(request("周六带爸妈去陈家祠"))
    c = result.conditions
    assert result.intent == "PLAN"
    assert c.date == "2026-09-18"          # 过去的日期改成明天
    assert c.start_time == "09:00"          # 格式不对用默认
    assert c.adults == 1 and c.seniors == 2
    assert c.budget == 0
    assert c.district_ids == [1]            # 不存在的片区去掉
    assert c.must_poi_ids == [1]            # 不存在的、同时在“不去”里的都去掉
    assert c.avoid_poi_ids == [3]
    assert c.interests == ["历史人文"]
    assert result.missing == ["date"]
    assert result.notes == ["xx暂未收录，没有排进去"]


def test_follow_up_keeps_fields_the_model_left_out():
    base = Conditions(date=SATURDAY, budget=500, district_ids=[1])
    answer = {"intent": "PLAN", "conditions": {"seniors": 2}, "missing": ["date"], "notes": []}
    result = FakeDeepSeek(json.dumps(answer)).understand(request("带上爸妈", conditions=base))
    assert result.conditions.date == SATURDAY
    assert result.conditions.budget == 500
    assert result.conditions.seniors == 2
    assert result.missing == []  # 已有条件时不算“用了默认值”


def test_broken_output_falls_back_to_rules():
    llm = FakeDeepSeek("这不是 JSON", None)
    xiaoxiao = XiaoXiao(llm=llm, rng=random.Random(1))
    reply = xiaoxiao.chat(request("周六想去老城区逛逛"))
    assert reply.intent == "PLAN"           # 规则识别出来的
    assert reply.plan and reply.plan.items
    assert "官网" in reply.reply             # 写回复也失败了，用的模板


def test_reply_gets_official_site_notice():
    llm = FakeDeepSeek("哼，排好了，上午先去陈家祠。")
    text = llm.write_reply({"items": [{"place": "陈家祠"}], "warnings": []})
    assert text.endswith("开放时间和票价以官网为准。")


def test_disabled_without_key():
    assert not DeepSeek(api_key="").enabled
    assert XiaoXiao(llm=DeepSeek(api_key="")).mode == "rule"
