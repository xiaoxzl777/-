"""校验：不管行程是怎么排出来的，都按规则再独立检查一遍。"""
from __future__ import annotations

from datetime import date

from ..schemas import Conditions, PlanItem, Poi
from .greedy import LUNCH_LATEST, LUNCH_START, PACES, open_windows
from .timeutil import to_minutes


def check(items: list[PlanItem], cond: Conditions, pois: list[Poi]) -> list[str]:
    """返回发现的问题，没有问题时返回空列表。"""
    by_id = {p.id: p for p in pois}
    day = date.fromisoformat(cond.date)
    day_end = PACES[cond.pace][2]
    problems = []
    seen: set[int] = set()
    total = 0.0
    for i, item in enumerate(items):
        poi = by_id.get(item.poi_id)
        if poi is None:
            problems.append(f"第 {item.seq} 站的地点不存在")
            continue
        start, end = to_minutes(item.start_time), to_minutes(item.end_time)
        # 同一个地点的第二段（中午吃完回来接着玩）不再检查入场时间
        if item.poi_id not in seen and not _is_open(poi, day, start, end):
            problems.append(f"{poi.name}不在开放时间内")
        seen.add(item.poi_id)
        if poi.type == "RESTAURANT" and not LUNCH_START <= start <= LUNCH_LATEST:
            problems.append(f"{poi.name}不在午饭时间")
        if i + 1 < len(items) and end + (item.next_minutes or 0) > to_minutes(items[i + 1].start_time):
            problems.append(f"{poi.name}到下一站的时间来不及")
        if end > day_end:
            problems.append(f"{poi.name}结束得太晚")
        total += item.cost + (item.next_cost or 0)
    if cond.budget is not None and total > cond.budget + 0.001:
        problems.append("总花费超出预算")
    return problems


def _is_open(poi: Poi, day: date, start: int, end: int) -> bool:
    return any(open_time <= start <= last_entry and end <= close for open_time, last_entry, close in open_windows(poi, day))
