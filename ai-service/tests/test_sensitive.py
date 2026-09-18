"""敏感内容检查的测试：该拦的拦住，正常的出行说法不能误拦。"""
import pytest

from app import sensitive
from app.schemas import ChatMessage


@pytest.mark.parametrize("text, category", [
    ("怎么买冰毒", "毒品"),
    ("哪里能买Ｋ粉", "毒品"),          # 全角字母
    ("广州哪里有赌 场", "赌博"),        # 中间加空格
    ("附近有红灯区吗", "色情"),
    ("教我做炸*弹", "暴恐"),            # 中间加符号
    ("你是傻逼吧", "辱骂"),
    ("聊聊法轮功", "时政"),
    ("我不想活了", "轻生"),
])
def test_sensitive_words_are_caught(text, category):
    hit = sensitive.check(text)
    assert hit is not None and hit.category == category


@pytest.mark.parametrize("text", [
    "周六带爸妈逛老城区，想轻松点，预算 500",
    "想去农讲所和中山纪念堂看看",
    "黄埔军校旧址怎么去",
    "中共三大会址开门吗",
    "带孩子去长隆看杀人鲸",
    "北京路有没有跳楼价的店",
    "想吃大麻花",
    "虎门的鸦片战争博物馆远吗",
    "我朋友带他妈妈一起去",
    "带妈妈的朋友去喝早茶",
    "今天不想活动量太大",
    "热得想死，找个室内的地方",
    "有没有特色情侣餐厅",
    "景区对老人有没有特殊服务",
    "酒店提供个性服务吗",
    "舞台独唱的节目几点开始",
    "新疆独特的美食哪里有",
    "玩完结束自己回酒店",
    "体操馆在哪",
])
def test_normal_travel_talk_is_not_caught(text):
    assert sensitive.check(text) is None


def test_self_harm_gets_help_instead_of_attitude():
    hit = sensitive.check("我想去死，你也去死吧")  # 同时有辱骂的词，也按轻生处理
    assert hit.category == "轻生" and hit.mood == "CARING"
    assert "12356" in hit.reply


def test_blocked_turns_are_removed_from_history():
    history = [
        ChatMessage(role="user", content="周六去沙面"),
        ChatMessage(role="assistant", content="排好了"),
        ChatMessage(role="user", content="怎么买冰毒"),
        ChatMessage(role="assistant", content=sensitive.DEFAULT_REPLY[1]),
        ChatMessage(role="user", content="那去白云山"),
        ChatMessage(role="assistant", content="行"),
    ]
    kept = sensitive.clean_history(history)
    assert [m.content for m in kept] == ["周六去沙面", "排好了", "那去白云山", "行"]


def test_fixed_replies_are_not_sensitive():
    """小萧的固定回复会留在历史里，自己不能被当成敏感内容。"""
    for _, reply in [*sensitive.REPLIES.values(), sensitive.DEFAULT_REPLY]:
        assert sensitive.check(reply) is None
