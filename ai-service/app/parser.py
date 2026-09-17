"""没配 DeepSeek 时，用规则理解用户的话：识别日期、出发时间、人数、预算、节奏、兴趣和地点。

只返回这句话提到的条件，再用 merge() 合并到原来的条件上。
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Optional

from .schemas import Conditions, District, Poi

NUM = r"[0-9]+|[零〇一二两三四五六七八九十百千万]+"

_DIGITS = {"零": 0, "〇": 0, "一": 1, "二": 2, "两": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9}
_UNITS = {"十": 10, "百": 100, "千": 1000, "万": 10000}


def cn_number(text: str) -> Optional[int]:
    """把“500”“五百”“一千五”这类写法转成整数。"""
    if text.isdigit():
        return int(text)
    total = section = num = 0
    last_unit = 1
    for ch in text:
        if ch in _DIGITS:
            num = _DIGITS[ch]
        elif ch in _UNITS:
            unit = _UNITS[ch]
            if unit == 10000:
                total += (section + num) * unit
                section = 0
            else:
                section += (num or 1) * unit
            num, last_unit = 0, unit
        else:
            return None
    if num and last_unit >= 100:
        num *= last_unit // 10  # “一千五”是 1500，“三百五”是 350
    return total + section + num


# ---------- 日期和出发时间 ----------

_WEEK = {"一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6, "日": 7, "天": 7}
_HOLIDAYS = {"元旦": (1, 1), "五一": (5, 1), "劳动节": (5, 1), "国庆": (10, 1), "圣诞": (12, 25)}


def _safe_date(year: int, month: Optional[int], day: Optional[int]) -> Optional[date]:
    try:
        return date(year, month, day) if month and day else None
    except ValueError:
        return None


def _week_offset(prefix: Optional[str]) -> int:
    prefix = prefix or ""
    if prefix.startswith("下下"):
        return 2
    return 1 if prefix.startswith("下") else 0


def parse_date(text: str, today: date) -> Optional[date]:
    for word, days in (("大后天", 3), ("后天", 2), ("明天", 1), ("明日", 1), ("今天", 0), ("今日", 0)):
        if word in text:
            return today + timedelta(days=days)

    monday = today - timedelta(days=today.isoweekday() - 1)
    m = re.search(r"(下下|下个?|这个?|本)?(?:周|星期|礼拜)([一二三四五六日天])", text)
    if m:
        day = monday + timedelta(weeks=_week_offset(m.group(1)), days=_WEEK[m.group(2)] - 1)
        return day if day >= today else day + timedelta(weeks=1)
    m = re.search(r"(下下|下个?|这个?|本)?周末", text)
    if m:
        day = monday + timedelta(weeks=_week_offset(m.group(1)), days=5)
        return day if day >= today else day + timedelta(weeks=1)

    m = re.search(rf"({NUM})月({NUM})[日号]?", text)
    if m:
        month, dom = cn_number(m.group(1)), cn_number(m.group(2))
        day = _safe_date(today.year, month, dom)
        if day and day < today:
            day = _safe_date(today.year + 1, month, dom)
        if day:
            return day
    m = re.search(rf"({NUM})[日号](?![游线楼])", text)
    if m:
        dom = cn_number(m.group(1))
        day = _safe_date(today.year, today.month, dom)
        if day and day < today:
            year, month = (today.year + 1, 1) if today.month == 12 else (today.year, today.month + 1)
            day = _safe_date(year, month, dom)
        if day:
            return day

    for word, (month, dom) in _HOLIDAYS.items():
        if word in text:
            day = date(today.year, month, dom)
            return day if day >= today else date(today.year + 1, month, dom)
    return None


def parse_start_time(text: str) -> Optional[str]:
    if re.search("睡到自然醒|睡个懒觉|晚点出发|不想早起", text):
        return "10:00"
    pattern = rf"(早上|早晨|上午|中午|下午|晚上)?\s*({NUM})\s*(?:点|:|：)\s*(半|{NUM})?\s*分?\s*(出发|出门|开始|走|去|到)?"
    for m in re.finditer(pattern, text):
        period, verb = m.group(1), m.group(4)
        if not period and not verb:
            continue  # “12点在广州酒家吃饭”这种不算出发时间
        hour = cn_number(m.group(2))
        minute = 30 if m.group(3) == "半" else (cn_number(m.group(3)) if m.group(3) else 0)
        if hour is None or minute is None or minute >= 60:
            continue
        if period in ("下午", "晚上") and hour < 12:
            hour += 12
        if period == "中午" and hour <= 2:
            hour += 12
        if 5 <= hour <= 20:
            return f"{hour:02d}:{minute:02d}"
    return None


# ---------- 人数、预算、节奏、兴趣 ----------

_SENIOR_PAIR = "爸妈|父母|爸爸妈妈|老爸老妈|爷爷奶奶|外公外婆|公公婆婆|岳父岳母"
_SENIOR_ONE = "老人|长辈|爸爸|妈妈|老爸|老妈|爷爷|奶奶|外公|外婆|姥姥|姥爷"
_CHILD = "孩子|小孩|娃|宝宝|儿童|小朋友|儿子|女儿"
_COMPANION = "朋友|同学|同事|对象|女朋友|男朋友|老婆|老公|媳妇|爱人|情侣"


def parse_people(text: str, base: Optional[Conditions]) -> dict:
    changes: dict = {}
    m = re.search(rf"({NUM})\s*(?:个|位|名)?\s*(?:老人|长辈)", text)
    if m and cn_number(m.group(1)) is not None:
        changes["seniors"] = cn_number(m.group(1))
    elif re.search(_SENIOR_PAIR, text):
        changes["seniors"] = 2
    elif re.search(_SENIOR_ONE, text):
        changes["seniors"] = 1

    m = re.search(rf"({NUM})\s*(?:个|位|名)?\s*(?:{_CHILD})", text)
    if m and cn_number(m.group(1)) is not None:
        changes["children"] = cn_number(m.group(1))
    elif re.search(_CHILD, text):
        changes["children"] = 1

    m = re.search(rf"({NUM})\s*(?:个|位|名)?\s*(?:大人|成人|成年人)", text)
    total = re.search(rf"({NUM})\s*(?:个人|位|人|口)(?!老|长辈|孩|小孩|娃|宝|儿童|小朋友)", text)
    if m and cn_number(m.group(1)):
        changes["adults"] = cn_number(m.group(1))
    elif total and cn_number(total.group(1)):
        seniors = changes.get("seniors", base.seniors if base else 0)
        children = changes.get("children", base.children if base else 0)
        changes["adults"] = max(1, cn_number(total.group(1)) - seniors - children)
    elif re.search("一个人|自己一个|独自|我自己", text):
        changes["adults"] = 1
    elif re.search(_COMPANION, text):
        changes["adults"] = max(2, base.adults if base else 1)

    for key, limit in (("adults", 20), ("seniors", 10), ("children", 10)):
        if key in changes:
            changes[key] = min(changes[key], limit)
    return changes


def parse_budget(text: str, people: int) -> tuple[bool, Optional[float]]:
    """返回（是否提到了预算, 预算）。预算为 None 表示不限。"""
    if re.search("预算不限|不限预算|没有预算|不差钱|随便花|钱不是问题|不在乎钱", text):
        return True, None
    if re.search("不花钱|不想花钱|只去免费|免费的地方", text):
        return True, 0.0
    m = re.search(rf"人均\s*(?:预算)?\s*({NUM})", text)
    if m and cn_number(m.group(1)):
        return True, float(cn_number(m.group(1)) * people)
    m = (re.search(rf"预算\s*(?:是|为|大概|大约|改成|改为|调到|调成|只有|在|有)?\s*({NUM})", text)
         or re.search(rf"(?:不超过|不要超过|别超过|控制在|最多花)\s*({NUM})", text)
         or re.search(rf"({NUM})\s*(?:块钱|块|元)", text))
    if m:
        value = cn_number(m.group(1))
        # 少于 10 元不当成预算，避免把“一块去”理解成 1 块钱
        if value and 10 <= value <= 100000:
            return True, float(value)
    return False, None


_PACE_WORDS = (
    ("RELAXED", "轻松|悠闲|休闲|慢慢|慢点|别太累|不要太累|不想太累|佛系|腿脚不好|走不动|怕累|少走路"),
    ("TIGHT", "紧凑|特种兵|暴走|多去几个|多逛几个|充实|多排几个|多排点"),
    ("NORMAL", "适中|正常节奏|普通节奏|不紧不慢"),
)

# 兴趣标签和对应的说法；标签要和数据库里景点的标签一致
INTEREST_WORDS = {
    "历史人文": "历史|文化|古迹|人文|古建|老建筑|文物",
    "岭南建筑": "岭南|骑楼|西关|祠堂|园林",
    "博物馆": "博物馆|展览|看展",
    "自然风光": "自然|爬山|登山|湿地|风景|看花|大自然",
    "城市地标": "地标|高楼",
    "夜景": "夜景|灯光|看夜",
    "拍照": "拍照|出片|摄影|打卡",
    "美食": "美食|好吃|小吃|早茶|吃吃",
    "购物": "购物|逛街|买东西|商场",
    "宗教文化": "寺|庙|拜佛|祈福",
    "动物": "动物|熊猫|老虎|考拉|长颈鹿",
    "亲子": "亲子|遛娃|带娃",
}


# ---------- 地点 ----------

# 名称的常见简称：去掉后缀，或者换成更短的说法
_SHORTEN = (("风景名胜区", ""), ("风景区", ""), ("国家湿地公园", "湿地"), ("野生动物世界", ""),
            ("步行街", ""), ("文化旅游区", ""), ("博物院", ""), ("古镇", ""))
_EXTRA_ALIASES = {"广州塔": ["小蛮腰"], "广东省博物馆": ["省博"], "陈家祠": ["陈氏书院"], "越秀公园": ["镇海楼", "五羊石像"]}

# 常被问到、但还没收录的地方，提到时提醒“暂未收录”
UNKNOWN_PLACES = ("珠江夜游", "中山纪念堂", "圣心大教堂", "石室", "黄埔军校", "华南植物园", "宝墨园", "莲花山",
                  "南沙湿地", "大夫山", "百万葵园", "长隆欢乐世界", "长隆水上乐园", "长隆大马戏", "上下九",
                  "海心沙", "二沙岛", "太古仓", "黄埔古港", "东山口", "天河路", "正佳广场")

_NEG_BEFORE = re.compile(r"(不去|不想去|别去|不要去|不逛|去掉|删掉|删除|取消|不要|不想|别|换掉)\s*$")
_NEG_AFTER = re.compile(r"^\s*(就不去了|不去了|不去|算了|去掉|删掉|不要了|别去了|不想去了|换掉)")


def poi_aliases(poi: Poi) -> set[str]:
    base = re.sub(r"[（(].*?[）)]", "", poi.name).strip()
    names = {base}
    for inner in re.findall(r"[（(](.*?)[）)]", poi.name):
        names.update(part.strip() for part in re.split(r"[、,，/ ]", inner))
    for suffix, short in _SHORTEN:
        if base.endswith(suffix) and len(base) - len(suffix) >= 2:
            names.add(base[: -len(suffix)] + short)
    names.update(_EXTRA_ALIASES.get(base, []))
    return {n for n in names if len(n) >= 2}


def district_aliases(district: District) -> set[str]:
    return {part for part in re.split(r"[（）()、与和 ]", district.name) if len(part) >= 2}


@dataclass
class PlaceMatch:
    must_ids: list[int] = field(default_factory=list)
    avoid_ids: list[int] = field(default_factory=list)
    district_ids: list[int] = field(default_factory=list)
    unknown: list[str] = field(default_factory=list)


def match_places(text: str, pois: list[Poi], districts: list[District]) -> PlaceMatch:
    result = PlaceMatch()
    all_aliases = {a for p in pois for a in poi_aliases(p)}
    masked = text
    for word in UNKNOWN_PLACES:
        if word in masked and word not in all_aliases and not any(word in p.name for p in pois):
            result.unknown.append(word)
            masked = masked.replace(word, "＃" * len(word))

    # 长的名字先匹配，匹配过的位置不再参与，避免“广州塔”同时算作地点和片区
    taken = [False] * len(masked)
    candidates = [(a, "poi", p.id) for p in pois for a in poi_aliases(p)]
    candidates += [(a, "district", d.id) for d in districts for a in district_aliases(d)]
    candidates.sort(key=lambda c: (-len(c[0]), c[1] != "poi"))
    for alias, kind, target in candidates:
        for m in re.finditer(re.escape(alias), masked):
            start, end = m.span()
            if any(taken[start:end]):
                continue
            taken[start:end] = [True] * (end - start)
            negative = _NEG_BEFORE.search(masked[max(0, start - 4):start]) or _NEG_AFTER.search(masked[end:end + 5])
            if kind == "district":
                if not negative and target not in result.district_ids:
                    result.district_ids.append(target)
            elif negative:
                if target not in result.avoid_ids:
                    result.avoid_ids.append(target)
            elif target not in result.must_ids:
                result.must_ids.append(target)
    return result


# ---------- 合并 ----------

@dataclass
class ParseResult:
    changes: dict = field(default_factory=dict)  # date、start_time、adults、seniors、children、budget、pace
    places: PlaceMatch = field(default_factory=PlaceMatch)
    interests: list[str] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)    # 需要提醒用户的事
    missing: list[str] = field(default_factory=list)  # 第一次规划时没说、用了默认值的条件


def default_conditions(today: date) -> Conditions:
    return Conditions(date=(today + timedelta(days=1)).isoformat())


def parse(text: str, today: date, pois: list[Poi], districts: list[District],
          base: Optional[Conditions] = None) -> ParseResult:
    result = ParseResult()
    changes = result.changes

    day = parse_date(text, today)
    if day:
        changes["date"] = day.isoformat()
    start_time = parse_start_time(text)
    if start_time:
        changes["start_time"] = start_time
    changes.update(parse_people(text, base))

    people = sum(changes.get(k, getattr(base, k) if base else (1 if k == "adults" else 0))
                 for k in ("adults", "seniors", "children"))
    mentioned, budget = parse_budget(text, max(1, people))
    if mentioned:
        changes["budget"] = budget

    for pace, words in _PACE_WORDS:
        if re.search(words, text):
            changes["pace"] = pace
            break

    result.interests = [tag for tag, words in INTEREST_WORDS.items() if re.search(words, text)]
    result.places = match_places(text, pois, districts)

    if re.search(rf"({NUM})\s*(?:天|日游)", text) and any(
            (cn_number(n) or 0) >= 2 for n in re.findall(rf"({NUM})\s*(?:天|日游)", text)):
        result.notes.append("暂时只支持一日游，先帮你排第一天")
    if re.search("酒店|住宿|民宿|宾馆|订房|机票|航班|高铁|动车|火车票|订票|买票", text):
        result.notes.append("订酒店、买票这些暂不支持，只帮你排当天的行程")
    if re.search("天气|下雨|下不下雨|气温|台风|路况|堵车|余票", text):
        result.notes.append("天气、路况这些实时信息我查不到，出门前看看官方消息")
    for word in result.places.unknown:
        result.notes.append(f"{word}暂未收录，没有排进去")

    if base is None:
        result.missing = [k for k in ("date", "budget") if k not in changes]
    return result


def merge(base: Conditions, parsed: ParseResult) -> Conditions:
    """把这句话提到的条件覆盖到原来的条件上，没提到的保持不变。"""
    data = base.model_dump()
    data.update(parsed.changes)

    places = parsed.places
    must = [i for i in data["must_poi_ids"] if i not in places.avoid_ids]
    must += [i for i in places.must_ids if i not in must]
    avoid = [i for i in data["avoid_poi_ids"] if i not in places.must_ids]
    avoid += [i for i in places.avoid_ids if i not in avoid]
    data["must_poi_ids"], data["avoid_poi_ids"] = must, avoid

    if places.district_ids:
        data["district_ids"] = places.district_ids
    data["interests"] = list(dict.fromkeys(data["interests"] + parsed.interests))
    return Conditions(**data)
