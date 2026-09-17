import random

from fastapi.testclient import TestClient

from app.main import create_app
from app.service import XiaoXiao
from tests.sample_data import DISTRICTS, POIS, SATURDAY, TODAY

client = TestClient(create_app(XiaoXiao(rng=random.Random(7))))


def body(message=None, conditions=None, history=None):
    data = {
        "today": TODAY.isoformat(),
        "districts": [d.model_dump(by_alias=True) for d in DISTRICTS],
        "pois": [p.model_dump(by_alias=True) for p in POIS],
        "conditions": conditions,
    }
    if message is not None:
        data["message"] = message
        data["history"] = history or []
    return data


def test_health():
    assert client.get("/health").json() == {"status": "ok", "llm": "rule"}


def test_greeting():
    data = client.get("/greeting", params={"nickname": "小林"}).json()
    assert data["mood"] == "PROUD"
    assert data["reply"]


def test_small_talk_does_not_plan():
    data = client.post("/chat", json=body("你好呀")).json()
    assert data["intent"] == "CHAT"
    assert data["plan"] is None
    assert data["reply"]


def test_other_city_is_refused():
    data = client.post("/chat", json=body("杭州有什么好玩的")).json()
    assert data["intent"] == "CHAT"
    assert data["mood"] == "ANNOYED"
    assert "杭州" in data["reply"]


def test_plan_then_follow_up():
    first = client.post("/chat", json=body("周六想去老城区逛逛，预算500")).json()
    assert first["intent"] == "PLAN"
    plan = first["plan"]
    assert plan["items"] and {"poiId", "startTime", "endTime", "nextMode"} <= plan["items"][0].keys()
    assert plan["conditions"]["date"] == SATURDAY
    assert "官网" in first["reply"]
    assert [s["title"] for s in plan["steps"]] == ["识别意图", "理解需求", "筛选景点", "排出行程", "校验"]

    history = [{"role": "user", "content": "周六想去老城区逛逛，预算500"},
               {"role": "assistant", "content": first["reply"]}]
    second = client.post("/chat", json=body("带上爸妈", plan["conditions"], history)).json()
    assert second["intent"] == "PLAN"
    cond = second["plan"]["conditions"]
    assert cond["date"] == SATURDAY and cond["seniors"] == 2 and cond["budget"] == 500
    assert second["plan"]["totalCost"] <= 500


def test_replan_with_edited_conditions():
    conditions = {"date": SATURDAY, "startTime": "09:00", "adults": 1, "seniors": 0, "children": 0,
                  "budget": None, "pace": "NORMAL", "districtIds": [1], "mustPoiIds": [],
                  "avoidPoiIds": [1], "interests": []}
    data = client.post("/plan", json=body(conditions=conditions)).json()
    assert data["intent"] == "PLAN"
    assert all(it["poiId"] != 1 for it in data["plan"]["items"])
    assert data["plan"]["steps"][0]["title"] == "按修改后的条件"


def test_bad_request_is_rejected():
    assert client.post("/chat", json={"message": "hi"}).status_code == 422
