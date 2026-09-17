"""没配 DeepSeek 时，按关键词判断用户是在闲聊还是想规划行程（规则见需求分析 4.3）。"""
from __future__ import annotations

import re
from datetime import date
from typing import Optional

from . import parser
from .schemas import District, Poi

PLAN = "PLAN"
CHAT = "CHAT"

INJECTION = re.compile(r"忽略|无视|扮演|假装你是|你现在是|系统提示|提示词|越狱|prompt", re.I)
TASK = re.compile(r"作业|代码|编程|程序|论文|翻译|作文|数学题|写一篇|写首|报告|简历")
TRIP = re.compile(r"(?<!开)玩(?!笑)|逛|旅游|旅行|出游|游玩|一日游|行程|路线|攻略|景点|打卡|安排|规划|去哪|推荐|好吃的|美食|早茶")
GO = re.compile(r"去|走|出门|出发|带")
MODIFY = re.compile(r"改成|改为|换成|换个|不去|去掉|删掉|加上|加个|再加|预算|轻松|紧凑|适中|老人|长辈|爸妈|父母|孩子|小孩|人数|出发|早点|晚点|便宜")

OTHER_CITIES = ("北京", "上海", "深圳", "杭州", "成都", "重庆", "西安", "南京", "武汉", "长沙", "厦门", "苏州",
                "天津", "青岛", "珠海", "佛山", "东莞", "澳门", "香港", "三亚", "桂林", "丽江", "大理", "昆明",
                "哈尔滨", "拉萨", "台北", "东京", "大阪", "首尔", "曼谷", "新加坡")


def find_other_city(text: str, pois: list[Poi], districts: list[District]) -> Optional[str]:
    """找出广州以外的城市名。先去掉景点名和“北京路”这类路名，免得误判。"""
    masked = text
    names = {a for p in pois for a in parser.poi_aliases(p)} | {a for d in districts for a in parser.district_aliases(d)}
    for name in sorted(names | {"北京路", "上海路"}, key=len, reverse=True):
        masked = masked.replace(name, "＃")
    return next((city for city in OTHER_CITIES if city in masked), None)


def detect(text: str, today: date, has_plan: bool, pois: list[Poi], districts: list[District]) -> str:
    t = text.strip()
    if not t or INJECTION.search(t):
        return CHAT
    places = parser.match_places(t, pois, districts)
    mentions_place = bool(places.must_ids or places.avoid_ids or places.district_ids)
    if not mentions_place and "广州" not in t and find_other_city(t, pois, districts):
        return CHAT
    if mentions_place:
        return PLAN
    if TASK.search(t):
        return CHAT
    if TRIP.search(t):
        return PLAN
    if parser.parse_date(t, today) and GO.search(t):
        return PLAN
    if has_plan and MODIFY.search(t):
        return PLAN
    return CHAT
