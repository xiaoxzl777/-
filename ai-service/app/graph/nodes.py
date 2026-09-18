"""流程图的各个节点。识别意图、闲聊回复、理解需求、写回复调用大模型；排行程、校验调用算法。"""
from __future__ import annotations

import json
import re
from datetime import date, timedelta

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage

from .. import llm
from ..chains import Chains, ParsedRequest
from ..planner import greedy, verify
from ..planner.timeutil import date_label, weekday_name
from ..schemas import INTERESTS, ChatMessage, Conditions, District, Poi, Step
from .state import TripState

PACE_NAMES = {"RELAXED": "轻松", "NORMAL": "适中", "TIGHT": "紧凑"}
MODE_NAMES = {"WALK": "步行", "METRO": "地铁", "TAXI": "打车"}
DEFAULT_NOTES = {"date": "没说日期，按明天算", "budget": "没说预算，按不限算"}
OFFICIAL_NOTICE = "开放时间和票价以官网为准"


class Nodes:
    def __init__(self, chains: Chains):
        self.chains = chains

    def classify(self, state: TripState) -> dict:
        has_plan = state.get("conditions") is not None
        result = llm.invoke(self.chains.classify, {
            "message": state["message"],
            "history": to_messages(state.get("history", [])),
            "plan_state": "已经有行程" if has_plan else "还没有行程",
        })
        if result.intent == "CHAT":
            detail = "闲聊"
        else:
            detail = "规划行程，在原来的条件上修改" if has_plan else "规划行程"
        return {"intent": result.intent, "mood": result.mood, "steps": [Step(title="识别意图", detail=detail)]}

    def chat(self, state: TripState) -> dict:
        reply = llm.invoke(self.chains.chat, {
            "message": state["message"],
            "history": to_messages(state.get("history", [])),
        })
        return {"reply": reply.strip()}

    def understand(self, state: TripState) -> dict:
        today = state["today"]
        current = state.get("conditions")
        base = current or default_conditions(today)
        parsed: ParsedRequest = llm.invoke(self.chains.understand, {
            "message": state["message"],
            "history": to_messages(state.get("history", [])),
            "calendar": calendar(today),
            "districts": "\n".join(f"{d.id}：{d.name}" for d in state["districts"]),
            "places": "\n".join(f"{p.id}：{p.name}（{'餐厅' if p.type == 'RESTAURANT' else '景点'}）" for p in state["pois"]),
            "interests": "、".join(INTERESTS),
            "current": current.model_dump_json() if current else "无",
        })
        conditions = merge(parsed, base, state["pois"], state["districts"], today)
        missing = [] if current else list(dict.fromkeys(parsed.missing))
        detail = describe(conditions, state["pois"], state["districts"])
        if missing:
            detail += "（" + "；".join(DEFAULT_NOTES[m] for m in missing) + "）"
        return {
            "conditions": conditions,
            "modified": current is not None,
            "missing": missing,
            "notes": [n.strip() for n in parsed.notes if n.strip()][:5],
            "steps": [Step(title="理解需求", detail=detail)],
        }

    def use_conditions(self, state: TripState) -> dict:
        """按条件重排的入口：条件是用户在页面上改好的，不用再理解。"""
        detail = describe(state["conditions"], state["pois"], state["districts"])
        return {"modified": True, "missing": [], "notes": [], "steps": [Step(title="按修改后的条件", detail=detail)]}

    def plan(self, state: TripState) -> dict:
        result = greedy.plan(state["conditions"], state["pois"], state["districts"])
        return {
            "result": result,
            "steps": [Step(title="筛选景点", detail=result.filter_detail), Step(title="排出行程", detail=result.arrange_detail)],
        }

    def check(self, state: TripState) -> dict:
        result, conditions = state["result"], state["conditions"]
        problems = verify.check(result.items, conditions, state["pois"])
        warnings = state.get("notes", []) + result.warnings + [f"校验发现：{p}" for p in problems]
        if problems:
            detail = "发现问题：" + "；".join(problems)
        elif conditions.budget is None:
            detail = "开放时间、衔接时间都已通过，预算不限"
        else:
            detail = "开放时间、衔接时间、预算都已通过"
        return {"warnings": warnings, "mood": "CARING" if warnings else "PROUD", "steps": [Step(title="校验", detail=detail)]}

    def write(self, state: TripState) -> dict:
        result = state["result"]
        by_id = {p.id: p for p in state["pois"]}
        facts = {
            "modified": state.get("modified", False),
            "missing": state.get("missing", []),
            "conditions": describe(state["conditions"], state["pois"], state["districts"]),
            "items": [{
                "time": f"{it.start_time}-{it.end_time}",
                "place": short_name(by_id[it.poi_id].name),
                "kind": "午餐" if by_id[it.poi_id].type == "RESTAURANT" else "景点",
                "toNext": f"{MODE_NAMES[it.next_mode]}约 {it.next_minutes} 分钟" if it.next_mode else None,
            } for it in result.items],
            "totalCost": result.total_cost,
            "warnings": state.get("warnings", []),
        }
        reply = llm.invoke(self.chains.write, {"facts": json.dumps(facts, ensure_ascii=False)}).strip()
        if result.items and OFFICIAL_NOTICE not in reply:
            reply += OFFICIAL_NOTICE + "。"
        return {"reply": reply}


def to_messages(history: list[ChatMessage]) -> list[BaseMessage]:
    return [HumanMessage(m.content) if m.role == "user" else AIMessage(m.content) for m in history[-10:]]


def calendar(today: date, days: int = 14) -> str:
    """接下来两周的日期、星期和所在的周，给大模型查日期用，比如“2026-09-21 周一（下周）”。"""
    weeks = {0: "本周", 1: "下周", 2: "下下周"}
    nearby = {0: "今天", 1: "明天", 2: "后天"}
    monday = today - timedelta(days=today.isoweekday() - 1)
    lines = []
    for i in range(days):
        day = today + timedelta(days=i)
        label = weeks[(day - monday).days // 7] + (f"，{nearby[i]}" if i in nearby else "")
        lines.append(f"{day.isoformat()} {weekday_name(day)}（{label}）")
    return "\n".join(lines)


def default_conditions(today: date) -> Conditions:
    return Conditions(date=(today + timedelta(days=1)).isoformat())


def merge(parsed: ParsedRequest, base: Conditions, pois: list[Poi], districts: list[District], today: date) -> Conditions:
    """大模型给的条件不能全信：去掉不存在的 id，把日期、人数、预算限制在合理范围，格式不对的沿用原来的值。"""
    poi_ids = {p.id for p in pois}
    district_ids = {d.id for d in districts}
    avoid = [i for i in dict.fromkeys(parsed.avoid_poi_ids) if i in poi_ids]
    return Conditions(
        date=_valid_date(parsed.date, today) or base.date,
        start_time=parsed.start_time if re.fullmatch(r"([01]\d|2[0-3]):[0-5]\d", parsed.start_time) else base.start_time,
        adults=min(max(parsed.adults, 1), 20),
        seniors=min(max(parsed.seniors, 0), 10),
        children=min(max(parsed.children, 0), 10),
        budget=None if parsed.budget is None else min(max(parsed.budget, 0.0), 100000.0),
        pace=parsed.pace,
        district_ids=[i for i in dict.fromkeys(parsed.district_ids) if i in district_ids],
        must_poi_ids=[i for i in dict.fromkeys(parsed.must_poi_ids) if i in poi_ids and i not in avoid],
        avoid_poi_ids=avoid,
        interests=[t for t in dict.fromkeys(parsed.interests) if t in INTERESTS],
    )


def _valid_date(text: str, today: date) -> str | None:
    try:
        day = date.fromisoformat(text)
    except ValueError:
        return None
    return day.isoformat() if day >= today else None


def describe(cond: Conditions, pois: list[Poi], districts: list[District]) -> str:
    """条件写成一句话，比如“9月19日（周六），3 人（含 2 位老人），预算 ¥500，节奏轻松，09:00 出发”。"""
    extra = [f"{cond.seniors} 位老人" if cond.seniors else "", f"{cond.children} 个儿童" if cond.children else ""]
    extra = [e for e in extra if e]
    people = cond.adults + cond.seniors + cond.children
    text = f"{date_label(date.fromisoformat(cond.date))}，{people} 人" + (f"（含 {'、'.join(extra)}）" if extra else "")
    text += "，预算不限" if cond.budget is None else f"，预算 ¥{cond.budget:.0f}"
    text += f"，节奏{PACE_NAMES[cond.pace]}，{cond.start_time} 出发"

    poi_names = {p.id: p.name for p in pois}
    district_names = {d.id: d.name for d in districts}
    for label, ids, names in (("片区", cond.district_ids, district_names), ("想去", cond.must_poi_ids, poi_names),
                              ("不去", cond.avoid_poi_ids, poi_names)):
        shown = [names[i] for i in ids if i in names]
        if shown:
            text += f"；{label}：" + "、".join(shown)
    if cond.interests:
        text += "；兴趣：" + "、".join(cond.interests)
    return text


def short_name(name: str) -> str:
    """去掉括号里的补充说明，“陈家祠（广东民间工艺博物馆）”说成“陈家祠”。"""
    return re.sub(r"[（(].*?[）)]", "", name).strip() or name
