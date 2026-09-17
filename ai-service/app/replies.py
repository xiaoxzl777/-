"""小萧的回复模板。没配 DeepSeek 时用这里的话；主动问候始终用模板。

人设：傲娇的小男生。傲娇只放在开头或结尾，行程和提醒要说清楚；不嘲讽、不说脏话。
"""
from __future__ import annotations

import random
import re
from typing import Optional

from .schemas import PlanItem, Poi

GREETINGS = (
    "哼，{nick}，又来找我了？说吧，这次想去广州哪儿玩？",
    "来得正好，我刚好有空。哪天出门、几个人、预算多少，一次说清楚。",
    "又是你啊，{nick}……先说好，太离谱的行程我可不排。想去哪？",
    "我可不是特意在这等你的。说吧，这回想怎么逛广州？",
    "{nick}，别光看着我。想去哪、带谁去，直接说。",
)

# 闲聊：(关键词, 表情, 回复)，从上往下找第一个匹配的
_CHAT_RULES = (
    (r"忽略|无视|扮演|假装你是|你现在是|系统提示|提示词|越狱|prompt", "ANNOYED", (
        "少来，这招对我没用。想去广州哪儿玩，直接说。",
        "我只听规则的，不听这个。说说你的出行想法吧。",
    )),
    (r"身份证|手机号|电话号码|银行卡|密码", "CARING", (
        "身份证、手机号这些别发给我，我也用不上。说说哪天出门、想去哪就行。",
    )),
    (r"生病|吃药|高血压|心脏|怀孕|身体不舒服|腿脚不好|头晕", "CARING", (
        "身体的事我不懂，得听医生的。要是腿脚不方便，我可以挑轻松点、适合长辈的地方。",
    )),
    (r"作业|代码|编程|程序|论文|翻译|作文|数学题|写一篇|写首|报告|简历", "ANNOYED", (
        "喂，我是帮你排广州行程的，可不是来写作业的。说说你想去哪玩吧。",
        "这种事别找我，我只管广州一日游。想去哪儿？",
    )),
    (r"天气|下雨|气温|台风|路况|堵车|余票", "CARING", (
        "天气和路况这些实时消息我查不到，出门前看看官方预报。行程的话，我可以先帮你排好。",
    )),
    (r"酒店|住宿|民宿|宾馆|订房|机票|航班|高铁|动车|火车票|订票|买票", "CARING", (
        "订酒店、买票这些我管不了。不过在广州怎么逛，我可以帮你排。",
    )),
    (r"你是谁|你叫什么|介绍一下你|你能做什么|你会什么|你会干嘛", "PROUD", (
        "连我都不认识？我是小萧，广州一日游归我管。说说你想去哪。",
        "我是小萧。告诉我哪天、几个人、想去哪，我就给你排一天的行程。",
    )),
    (r"谢谢|感谢|厉害|真棒|好棒|太强|辛苦", "PROUD", (
        "哼，那是当然。还想去哪，接着说。",
        "知道我厉害就好。下次出门还来找我。",
    )),
    (r"笨|傻|垃圾|没用|差劲|讨厌", "ANNOYED", (
        "……随你怎么说。想要行程的话，把需求说清楚点。",
    )),
    (r"你好|您好|在吗|在不在|哈喽|嗨|hello|hi|早上好|中午好|晚上好", "PROUD", (
        "招呼打完了？那就说正事，哪天出门、带几个人？",
        "在呢，别喊了。想去广州哪儿玩？",
    )),
)
_CHAT_DEFAULT = (
    "没听懂你想去哪。说说哪天出门、几个人、想去哪个区，我来排。",
    "闲聊就到这儿。想去广州哪儿玩，告诉我。",
)
_OTHER_CITY = (
    "{city}？我只熟广州。想在广州玩的话，我勉强帮你排一下。",
    "{city}不归我管。广州的话，我倒是可以帮你排。",
)

_OPEN_PROUD = ("哼，这种行程对我来说小菜一碟。", "排好了，看在你说得还算清楚的份上。", "搞定，也不看看是谁排的。")
_OPEN_CARING = ("排是排好了，不过有几件事你得注意。", "先别急着走，有些情况得跟你说清楚。")
_OPEN_MODIFIED = ("又改？……行吧，改好了。", "真拿你没办法，已经按新要求重排了。")
_OPEN_NO_DATE = "连日期都不说？那我先按明天排了，不满意自己改。"
_ENDINGS = ("，别迟到，我可不等你。", "，出门前自己再看一眼。", "。玩得开心点……我才不是在关心你。")
_MODE_WORDS = {"WALK": "步行", "METRO": "坐地铁", "TAXI": "打车"}


def greeting(nickname: str, rng: random.Random) -> str:
    nickname = nickname.strip()
    templates = GREETINGS if nickname else [t for t in GREETINGS if "{nick}" not in t]
    return rng.choice(templates).format(nick=nickname)


def chat_reply(text: str, rng: random.Random, city: Optional[str] = None) -> tuple[str, str]:
    """返回（表情, 回复）。"""
    if city:
        return "ANNOYED", rng.choice(_OTHER_CITY).format(city=city)
    for pattern, mood, templates in _CHAT_RULES:
        if re.search(pattern, text, re.I):
            return mood, rng.choice(templates)
    return "PROUD", rng.choice(_CHAT_DEFAULT)


def short_name(name: str) -> str:
    """回复里去掉括号里的补充说明，“陈家祠（广东民间工艺博物馆）”说成“陈家祠”。"""
    return re.sub(r"[（(].*?[）)]", "", name).strip() or name


def describe_route(items: list[PlanItem], pois: dict[int, Poi]) -> str:
    """把行程说成一句话，比如“09:00 先去陈家祠，步行去永庆坊，12:00 在广州酒家吃午饭……”。"""
    parts = []
    seen: set[int] = set()
    for i, item in enumerate(items):
        poi = pois[item.poi_id]
        name = short_name(poi.name)
        if poi.type == "RESTAURANT":
            parts.append(f"{item.start_time} 在{name}吃午饭")
        elif i == 0:
            parts.append(f"{item.start_time} 先去{name}")
        elif item.poi_id in seen:
            parts.append(f"吃完回{name}接着玩")
        else:
            parts.append(f"{_MODE_WORDS.get(items[i - 1].next_mode or '', '')}去{name}")
        seen.add(item.poi_id)
    return "，".join(parts) + f"，{items[-1].end_time} 结束。"


def plan_reply(items: list[PlanItem], pois: dict[int, Poi], total_cost: float, warnings: list[str],
               rng: random.Random, modified: bool = False, date_defaulted: bool = False) -> str:
    notice = "要注意：" + "；".join(warnings) + "。" if warnings else ""
    if not items:
        return "……这次真排不出来。" + notice + "换个日期或者放宽点条件，再来找我。"

    if modified:
        opening = rng.choice(_OPEN_MODIFIED)
    elif date_defaulted:
        opening = _OPEN_NO_DATE
    else:
        opening = rng.choice(_OPEN_CARING if warnings else _OPEN_PROUD)
    cost = f"全程预计花费 ¥{total_cost:.0f}。" if total_cost > 0 else "全程基本不花钱。"
    return opening + describe_route(items, pois) + cost + notice + "开放时间和票价以官网为准" + rng.choice(_ENDINGS)
