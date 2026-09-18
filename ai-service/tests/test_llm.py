"""大模型出错时的分类，以及后台状态查询。不联网：用构造出来的异常和假的 HTTP 响应。"""
import httpx
import openai
import pytest
from langchain_core.runnables import RunnableLambda

from app import status
from app.config import Settings
from app.llm import RETRY, UNAVAILABLE, LlmError, invoke

REQUEST = httpx.Request("POST", "https://api.deepseek.com/chat/completions")
SETTINGS = Settings(api_key="sk-test", base_url="https://api.deepseek.com", model="deepseek-flash", timeout=5)


def raising(error):
    def run(_):
        raise error
    return RunnableLambda(run)


def status_error(cls, code):
    return cls("出错了", response=httpx.Response(code, request=REQUEST), body=None)


@pytest.mark.parametrize("error, code", [
    (status_error(openai.AuthenticationError, 401), UNAVAILABLE),
    (status_error(openai.APIStatusError, 402), UNAVAILABLE),
    (status_error(openai.RateLimitError, 429), RETRY),
    (status_error(openai.InternalServerError, 500), RETRY),
    (openai.APITimeoutError(request=REQUEST), RETRY),
    (ValueError("返回的内容不符合格式"), RETRY),
])
def test_errors_are_classified(error, code):
    with pytest.raises(LlmError) as info:
        invoke(raising(error), {})
    assert info.value.code == code


def test_success_passes_through():
    assert invoke(RunnableLambda(lambda x: x["a"] + 1), {"a": 1}) == 2


@pytest.fixture
def fake_balance(monkeypatch):
    def use(response):
        def get(url, **kwargs):
            if isinstance(response, Exception):
                raise response
            return response
        monkeypatch.setattr(httpx, "get", get)
    return use


def test_status_without_key():
    result = status.check(Settings(api_key="", base_url="x", model="m", timeout=5))
    assert result["available"] is False and "没有配置" in result["problem"]


def test_status_ok(fake_balance):
    fake_balance(httpx.Response(200, json={"is_available": True, "balance_infos": [{"total_balance": "5.32"}]}))
    assert status.check(SETTINGS) == {"status": "ok", "available": True, "problem": None, "balance": "5.32"}


@pytest.mark.parametrize("response, problem", [
    (httpx.Response(200, json={"is_available": False, "balance_infos": [{"total_balance": "0.00"}]}), "DeepSeek 余额不足，请充值"),
    (httpx.Response(401, json={}), "DeepSeek Key 无效，请检查 ai-service/.env"),
    (httpx.ConnectError("连不上"), "连不上 DeepSeek，请检查网络"),
])
def test_status_problems(fake_balance, response, problem):
    fake_balance(response)
    result = status.check(SETTINGS)
    assert result["available"] is False and result["problem"] == problem
