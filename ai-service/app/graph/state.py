"""流程图在各个节点之间传递的状态。"""
import operator
from datetime import date
from typing import Annotated, Optional, TypedDict

from ..planner.greedy import PlanResult
from ..schemas import ChatMessage, Conditions, District, Poi, Step


class TripState(TypedDict, total=False):
    # 输入
    message: str                     # 用户这条消息；按条件重排时没有
    history: list[ChatMessage]       # 最近几条对话
    today: date
    pois: list[Poi]
    districts: list[District]
    conditions: Optional[Conditions]  # 进来时是当前条件，“理解需求”之后是新条件

    # 各节点写入
    intent: str                      # PLAN / CHAT / BLOCKED（敏感内容，没有发给大模型）
    mood: str                        # PROUD / ANNOYED / CARING
    modified: bool                   # 是否在原来的条件上修改
    missing: list[str]               # 第一次规划时用了默认值的条件
    notes: list[str]                 # 理解需求时发现、要提醒用户的事
    result: PlanResult               # 排出来的行程
    warnings: list[str]              # 最终给用户的提醒
    steps: Annotated[list[Step], operator.add]  # 每个节点追加一条执行步骤
    reply: str                       # 小萧的回复
