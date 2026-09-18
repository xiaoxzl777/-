"""打开小萧页面时的主动问候：从几句固定的话里随机挑一句，不调用大模型，打开页面马上能看到。"""
from __future__ import annotations

import random
from typing import Optional

GREETINGS = (
    "哼，{nick}，又来找我了？说吧，这次想去广州哪儿玩？",
    "来得正好，我刚好有空。哪天出门、几个人、预算多少，一次说清楚。",
    "又是你啊，{nick}……先说好，太离谱的行程我可不排。想去哪？",
    "我可不是特意在这等你的。说吧，这回想怎么逛广州？",
    "{nick}，别光看着我。想去哪、带谁去，直接说。",
)


def greet(nickname: str, rng: Optional[random.Random] = None) -> str:
    nickname = nickname.strip()
    templates = GREETINGS if nickname else [t for t in GREETINGS if "{nick}" not in t]
    return (rng or random).choice(templates).format(nick=nickname)
