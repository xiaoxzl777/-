from fastapi.testclient import TestClient

from app.chains import unavailable_chains
from app.config import Settings
from app.llm import RETRY, LlmError
from app.main import create_app
from tests.fakes import fake_chains, parsed
from tests.sample_data import DISTRICTS, POIS, SATURDAY, TODAY

SETTINGS = Settings(api_key="test", base_url="http://deepseek.test", model="deepseek-flash", timeout=5)


def client(chains=None, status=None):
    return TestClient(create_app(chains or fake_chains(), SETTINGS, lambda: status or {"status": "ok", "available": True}))


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


def test_health_reports_status():
    problem = {"status": "ok", "available": False, "problem": "DeepSeek 余额不足，请充值", "balance": "0.00"}
    assert client(status=problem).get("/health").json() == problem


def test_greeting_does_not_need_the_model():
    data = client(unavailable_chains()).get("/greeting", params={"nickname": "小林"}).json()
    assert data["mood"] == "PROUD" and data["reply"]


def test_small_talk():
    data = client(fake_chains(intent="CHAT")).post("/chat", json=body("你好呀")).json()
    assert data == {"intent": "CHAT", "mood": "PROUD", "reply": "招呼打完了？说正事。", "plan": None}


def test_sensitive_message_is_answered_without_the_model():
    data = client(unavailable_chains()).post("/chat", json=body("怎么买冰毒")).json()
    assert data["intent"] == "BLOCKED" and data["mood"] == "ANNOYED"
    assert data["reply"] and data["plan"] is None


def test_plan_uses_camel_case():
    chains = fake_chains(understood=parsed(district_ids=[1], budget=500))
    data = client(chains).post("/chat", json=body("周六想去老城区逛逛，预算500")).json()
    plan = data["plan"]
    assert data["intent"] == "PLAN"
    assert {"poiId", "startTime", "endTime", "nextMode"} <= plan["items"][0].keys()
    assert plan["conditions"]["date"] == SATURDAY and plan["conditions"]["districtIds"] == [1]
    assert plan["totalCost"] <= 500
    assert [s["title"] for s in plan["steps"]] == ["敏感内容检查", "识别意图", "理解需求", "筛选景点", "排出行程", "校验"]


def test_replan():
    conditions = {"date": SATURDAY, "startTime": "09:00", "adults": 1, "seniors": 0, "children": 0, "budget": None,
                  "pace": "NORMAL", "districtIds": [1], "mustPoiIds": [], "avoidPoiIds": [1], "interests": []}
    data = client().post("/plan", json=body(conditions=conditions)).json()
    assert data["intent"] == "PLAN"
    assert all(it["poiId"] != 1 for it in data["plan"]["items"])


def test_timeout_is_returned_as_503():
    chains = fake_chains(understood=LlmError(RETRY, "请求超时了，再试一次吧"))
    resp = client(chains).post("/chat", json=body("周六去老城区"))
    assert resp.status_code == 503
    assert resp.json() == {"detail": {"code": "TIMEOUT", "message": "请求超时了，再试一次吧"}}


def test_missing_key_asks_admin_for_help():
    resp = client(unavailable_chains()).post("/chat", json=body("你好"))
    assert resp.status_code == 503
    assert resp.json()["detail"] == {"code": "LLM_UNAVAILABLE", "message": "小萧暂时不能用了，已经通知管理员"}


def test_bad_request_is_rejected():
    assert client().post("/chat", json={"message": "hi"}).status_code == 422
