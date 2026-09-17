"""小萧的处理流程：主动问候、处理一条消息、按条件重排。"""
from __future__ import annotations

import logging
import random
from datetime import date
from typing import Optional

from . import intent as intent_rules
from . import parser, planner, replies
from .llm import DeepSeek, Understanding
from .schemas import ChatReply, ChatRequest, Conditions, District, Greeting, Plan, PlanRequest, Poi, Step
from .timeutil import date_label

log = logging.getLogger("xiaoxiao")

PACE_NAMES = {"RELAXED": "轻松", "NORMAL": "适中", "TIGHT": "紧凑"}
MODE_NAMES = {"WALK": "步行", "METRO": "地铁", "TAXI": "打车"}
DEFAULT_NOTES = {"date": "没说日期，按明天算", "budget": "没说预算，按不限算"}


def describe_conditions(cond: Conditions, pois: list[Poi], districts: list[District]) -> str:
    """条件写成一句话，比如“9月19日（周六），3 人（含 2 位老人），预算 ¥500，节奏轻松，09:00 出发”。"""
    extra = []
    if cond.seniors:
        extra.append(f"{cond.seniors} 位老人")
    if cond.children:
        extra.append(f"{cond.children} 个儿童")
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


class XiaoXiao:
    def __init__(self, llm: Optional[DeepSeek] = None, rng: Optional[random.Random] = None):
        self.llm = llm if llm is not None and llm.enabled else None
        self.rng = rng or random.Random()

    @property
    def mode(self) -> str:
        return "deepseek" if self.llm else "rule"

    def greet(self, nickname: str) -> Greeting:
        return Greeting(mood="PROUD", reply=replies.greeting(nickname, self.rng))

    def chat(self, req: ChatRequest) -> ChatReply:
        today = date.fromisoformat(req.today)
        has_plan = req.conditions is not None
        understood = self.llm.understand(req) if self.llm else None
        source = "deepseek" if understood else "rule"
        if understood is None:
            understood = self._understand_by_rules(req, today)
        log.info("意图=%s（%s）：%s", understood.intent, source, req.message[:50])

        if understood.intent == "CHAT":
            return ChatReply(intent="CHAT", mood=understood.mood, reply=understood.reply)
        steps = [Step(title="识别意图", detail="规划行程，在原来的条件上修改" if has_plan else "规划行程")]
        return self._plan(understood.conditions, req.pois, req.districts, steps, "理解需求",
                          notes=understood.notes, missing=understood.missing, modified=has_plan)

    def replan(self, req: PlanRequest) -> ChatReply:
        return self._plan(req.conditions, req.pois, req.districts, [], "按修改后的条件", notes=[], missing=[],
                          modified=True)

    def _understand_by_rules(self, req: ChatRequest, today: date) -> Understanding:
        has_plan = req.conditions is not None
        if intent_rules.detect(req.message, today, has_plan, req.pois, req.districts) == intent_rules.CHAT:
            city = None if "广州" in req.message else intent_rules.find_other_city(req.message, req.pois, req.districts)
            mood, reply = replies.chat_reply(req.message, self.rng, city=city)
            return Understanding(intent="CHAT", mood=mood, reply=reply)
        parsed = parser.parse(req.message, today, req.pois, req.districts, base=req.conditions)
        base = req.conditions or parser.default_conditions(today)
        return Understanding(intent="PLAN", conditions=parser.merge(base, parsed), notes=parsed.notes,
                             missing=parsed.missing)

    def _plan(self, cond: Conditions, pois: list[Poi], districts: list[District], steps: list[Step],
              condition_title: str, notes: list[str], missing: list[str], modified: bool) -> ChatReply:
        detail = describe_conditions(cond, pois, districts)
        if missing:
            detail += "（" + "；".join(DEFAULT_NOTES[m] for m in missing) + "）"
        steps.append(Step(title=condition_title, detail=detail))

        result = planner.plan(cond, pois, districts)
        warnings = notes + result.warnings
        by_id = {p.id: p for p in pois}

        reply = None
        if self.llm:
            reply = self.llm.write_reply({
                "modified": modified,
                "missing": missing,
                "conditions": detail,
                "items": [{
                    "time": f"{it.start_time}-{it.end_time}",
                    "place": replies.short_name(by_id[it.poi_id].name),
                    "kind": "午餐" if by_id[it.poi_id].type == "RESTAURANT" else "景点",
                    "toNext": f"{MODE_NAMES[it.next_mode]}约 {it.next_minutes} 分钟" if it.next_mode else None,
                } for it in result.items],
                "totalCost": result.total_cost,
                "warnings": warnings,
            })
        if reply is None:
            reply = replies.plan_reply(result.items, by_id, result.total_cost, warnings, self.rng,
                                       modified=modified, date_defaulted="date" in missing)

        plan = Plan(conditions=cond, items=result.items, total_cost=result.total_cost,
                    steps=steps + result.steps, warnings=warnings)
        return ChatReply(intent="PLAN", mood="CARING" if warnings else "PROUD", reply=reply, plan=plan)
