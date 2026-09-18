"""敏感内容检查：用户的话交给大模型之前，先按固定的词表查一遍。

命中了就不调用大模型，由小萧用写好的话回复，免得大模型顺着话头说出不该说的内容。
词表只拦明显的说法，是演示用的，可以按需要增删；换成谐音、拼音、繁体就拦不住了。
"""
from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from typing import Optional

from .schemas import ChatMessage

# 按类别列出敏感词（简体、小写）。按顺序检查，轻生放在最前面：同一句话里还有别的词，也按轻生处理。
# 选词时避开了正常出行会说到的字眼，比如“台独”会误拦“舞台独唱”，“特殊服务”会误拦“老人有没有特殊服务”。
WORDS: dict[str, list[str]] = {
    "轻生": ["自杀", "轻生", "不想活了", "活不下去", "想去死", "结束生命", "结束自己的生命", "割腕", "自残"],
    "时政": ["法轮功", "六四事件", "天安门事件", "颠覆国家", "推翻政府", "反政府", "国家领导人"],
    "色情": ["黄片", "黄色网站", "成人网站", "色情网站", "色情服务", "约炮", "一夜情", "嫖娼", "卖淫", "招嫖",
             "援交", "裸聊", "性交易", "红灯区"],
    "赌博": ["赌博", "赌场", "赌钱", "赌球", "网赌", "博彩", "六合彩", "百家乐", "老虎机"],
    "毒品": ["毒品", "吸毒", "贩毒", "冰毒", "海洛因", "大麻", "摇头丸", "k粉", "可卡因"],
    "暴恐": ["炸弹", "炸药", "爆炸物", "恐怖袭击", "恐袭", "枪支", "买枪", "手枪", "管制刀具", "杀人", "砍人",
             "投毒", "纵火", "报复社会"],
    "辱骂": ["傻逼", "傻b", "煞笔", "脑残", "智障", "操你妈", "草你妈", "cnm", "nmsl", "去死", "滚蛋", "贱人"],
}

# 带敏感字眼、但本身没问题的说法，检查前先去掉，避免误拦
ALLOWED = ["大麻花", "杀人鲸", "杀人游戏", "芝士炸弹"]

# 命中后小萧的回复：(表情, 回复)。轻生不用傲娇的语气，给出求助方式。
REPLIES = {
    "轻生": ("CARING", "听起来你现在很难受。这件事我帮不上忙，但你不用一个人扛着，可以打 12356 心理援助热线找人聊聊；"
                      "如果有危险，马上打 110 或 120。"),
    "辱骂": ("ANNOYED", "喂，好好说话。想去哪玩，正常说我就帮你排。"),
}
DEFAULT_REPLY = ("ANNOYED", "这个我可不接。我只管广州一日游，说说你想去哪吧。")


@dataclass(frozen=True)
class Hit:
    category: str
    word: str
    mood: str
    reply: str


def normalize(text: str) -> str:
    """全角转半角、转小写，去掉空格和标点，这样“赌 博”“赌*博”也能查出来。"""
    text = unicodedata.normalize("NFKC", text).lower()
    return re.sub(r"[\W_]+", "", text)


def check(text: str) -> Optional[Hit]:
    """检查一句话：命中返回类别、命中的词和小萧的回复，没命中返回 None。"""
    text = normalize(text)
    for safe in ALLOWED:
        text = text.replace(safe, "")
    for category, words in WORDS.items():
        for word in words:
            if word in text:
                mood, reply = REPLIES.get(category, DEFAULT_REPLY)
                return Hit(category, word, mood, reply)
    return None


def clean_history(history: list[ChatMessage]) -> list[ChatMessage]:
    """去掉历史对话里的敏感消息：用户的敏感消息连同小萧对它的回复一起去掉，都不发给大模型。"""
    kept: list[ChatMessage] = []
    skip_reply = False
    for msg in history:
        if skip_reply and msg.role == "assistant":
            skip_reply = False
            continue
        skip_reply = False
        if check(msg.content):
            skip_reply = msg.role == "user"
            continue
        kept.append(msg)
    return kept
