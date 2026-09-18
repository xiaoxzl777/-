"""接口的数据结构。JSON 里用驼峰命名（和后端一致），Python 里用下划线命名。"""
from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

Pace = Literal["RELAXED", "NORMAL", "TIGHT"]

# 兴趣标签，要和数据库里景点的标签一致
INTERESTS = ["历史人文", "岭南建筑", "博物馆", "自然风光", "城市地标", "夜景", "拍照", "美食", "购物", "宗教文化", "动物", "亲子"]
Mood = Literal["PROUD", "ANNOYED", "CARING"]
Intent = Literal["PLAN", "CHAT"]
Mode = Literal["WALK", "METRO", "TAXI"]


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class OpenRule(CamelModel):
    weekdays: list[int]  # 1 表示周一，7 表示周日
    open_time: str
    close_time: str
    last_entry_time: Optional[str] = None


class Poi(CamelModel):
    id: int
    type: Literal["SCENIC", "RESTAURANT"]
    name: str
    district_id: Optional[int] = None
    lng: float
    lat: float
    stay_minutes: int = 60
    full_day: bool = False
    ticket_price: Optional[float] = None
    avg_cost: Optional[float] = None
    rating: Optional[float] = None
    tags: list[str] = Field(default_factory=list)
    open_rules: list[OpenRule] = Field(default_factory=list)
    closed_dates: list[str] = Field(default_factory=list)


class District(CamelModel):
    id: int
    name: str


class Conditions(CamelModel):
    date: str
    start_time: str = "09:00"
    adults: int = 1
    seniors: int = 0
    children: int = 0
    budget: Optional[float] = None  # 为空表示不限
    pace: Pace = "NORMAL"
    district_ids: list[int] = Field(default_factory=list)
    must_poi_ids: list[int] = Field(default_factory=list)
    avoid_poi_ids: list[int] = Field(default_factory=list)
    interests: list[str] = Field(default_factory=list)


class ChatMessage(CamelModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(CamelModel):
    message: str
    history: list[ChatMessage] = Field(default_factory=list)
    conditions: Optional[Conditions] = None  # 已有行程时的条件
    today: str
    districts: list[District] = Field(default_factory=list)
    pois: list[Poi] = Field(default_factory=list)


class PlanRequest(CamelModel):
    conditions: Conditions
    today: str
    districts: list[District] = Field(default_factory=list)
    pois: list[Poi] = Field(default_factory=list)


class PlanItem(CamelModel):
    seq: int
    poi_id: int
    start_time: str
    end_time: str
    cost: float
    next_mode: Optional[Mode] = None
    next_minutes: Optional[int] = None
    next_meters: Optional[int] = None
    next_cost: Optional[float] = None


class Step(CamelModel):
    title: str
    detail: str


class Plan(CamelModel):
    conditions: Conditions
    items: list[PlanItem]
    total_cost: float
    steps: list[Step]
    warnings: list[str]


class ChatReply(CamelModel):
    intent: Intent
    mood: Mood
    reply: str
    plan: Optional[Plan] = None


class Greeting(CamelModel):
    mood: Mood
    reply: str
