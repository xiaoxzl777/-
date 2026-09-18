"""四条 LangChain 链：识别意图、闲聊回复、理解需求、写回复。流程图的节点通过它们调用大模型。"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal, Optional

from langchain_core.language_models import BaseChatModel
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import Runnable, RunnableLambda
from pydantic import BaseModel, Field

from . import prompts
from .llm import UNAVAILABLE, UNAVAILABLE_MESSAGE, LlmError


class IntentResult(BaseModel):
    """用户最新一条消息的意图，以及小萧回应时的表情"""
    intent: Literal["PLAN", "CHAT"] = Field(description="PLAN：想规划或修改广州一日游行程；CHAT：其余所有消息")
    mood: Literal["PROUD", "ANNOYED", "CARING"] = Field(
        description="PROUD：普通闲聊或规划行程；ANNOYED：和出行无关的请求、问其他城市、让你忽略规则；"
                    "CARING：问天气路况等实时信息、订酒店买票、身体健康相关")


class ParsedRequest(BaseModel):
    """从对话里整理出的出行条件"""
    date: str = Field(description="出行日期，格式 YYYY-MM-DD")
    start_time: str = Field(description="出发时间，格式 HH:MM")
    adults: int = Field(description="成人数，用户本人算 1 位")
    seniors: int = Field(description="老人数，“爸妈”算 2 位")
    children: int = Field(description="儿童数")
    budget: Optional[float] = Field(description="所有人合计的预算（元），不限时为 null")
    pace: Literal["RELAXED", "NORMAL", "TIGHT"] = Field(description="节奏：RELAXED 轻松、NORMAL 适中、TIGHT 紧凑")
    district_ids: list[int] = Field(description="想去的片区 id")
    must_poi_ids: list[int] = Field(description="一定要去的地点 id")
    avoid_poi_ids: list[int] = Field(description="不去的地点 id")
    interests: list[str] = Field(description="兴趣标签")
    missing: list[Literal["date", "budget"]] = Field(description="第一次规划时用户没说、用了默认值的条件；已有条件时为空")
    notes: list[str] = Field(description="需要提醒用户的事；没有就为空")


@dataclass
class Chains:
    classify: Runnable    # 输入消息，输出 IntentResult
    chat: Runnable        # 输入消息，输出闲聊回复
    understand: Runnable  # 输入消息和当前条件，输出 ParsedRequest
    write: Runnable       # 输入行程信息，输出小萧的回复


def build_chains(model: BaseChatModel) -> Chains:
    return Chains(
        classify=prompts.CLASSIFY | model.with_structured_output(IntentResult),
        chat=prompts.CHAT | model | StrOutputParser(),
        understand=prompts.UNDERSTAND | model.with_structured_output(ParsedRequest),
        write=prompts.WRITE | model | StrOutputParser(),
    )


def unavailable_chains() -> Chains:
    """没配 Key 时用：一调用就报“需要管理员处理”。"""
    def fail(_):
        raise LlmError(UNAVAILABLE, UNAVAILABLE_MESSAGE)

    runnable = RunnableLambda(fail)
    return Chains(classify=runnable, chat=runnable, understand=runnable, write=runnable)
