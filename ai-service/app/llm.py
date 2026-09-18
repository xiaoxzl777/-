"""创建 DeepSeek 模型；调用出错时分成两类：用户可以重试的，和需要管理员处理的。"""
from __future__ import annotations

import logging
from typing import Any

import openai
from langchain_core.runnables import Runnable
from langchain_deepseek import ChatDeepSeek

from .config import Settings

log = logging.getLogger("xiaoxiao.llm")

RETRY = "TIMEOUT"               # 超时、连不上、服务繁忙：用户再试一次
UNAVAILABLE = "LLM_UNAVAILABLE"  # Key 无效、余额不足：要管理员处理
RETRY_MESSAGE = "请求超时了，再试一次吧"
UNAVAILABLE_MESSAGE = "小萧暂时不能用了，已经通知管理员"


class LlmError(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


def create_model(settings: Settings) -> ChatDeepSeek:
    return ChatDeepSeek(
        model=settings.model,
        api_key=settings.api_key,
        base_url=settings.base_url,
        temperature=0.3,
        timeout=settings.timeout,
        max_retries=0,  # 不自动重试，超时就让用户点重试，免得一直等
        # 新版 DeepSeek 模型默认开启思考模式，它不支持结构化输出要用的强制工具调用，所以关掉
        extra_body={"thinking": {"type": "disabled"}},
    )


def invoke(chain: Runnable, inputs: dict[str, Any]) -> Any:
    """调用一条 LangChain 链，把各种出错统一成 LlmError。"""
    try:
        return chain.invoke(inputs)
    except LlmError:
        raise
    except (openai.AuthenticationError, openai.PermissionDeniedError) as e:
        log.error("DeepSeek Key 无效：%s", e)
        raise LlmError(UNAVAILABLE, UNAVAILABLE_MESSAGE) from e
    except openai.APIStatusError as e:
        if e.status_code == 402:
            log.error("DeepSeek 余额不足：%s", e)
            raise LlmError(UNAVAILABLE, UNAVAILABLE_MESSAGE) from e
        log.warning("DeepSeek 返回错误：%s", e)
        raise LlmError(RETRY, RETRY_MESSAGE) from e
    except Exception as e:  # 超时、连不上、返回的内容不符合格式等
        log.warning("调用 DeepSeek 失败：%s", e)
        raise LlmError(RETRY, RETRY_MESSAGE) from e
