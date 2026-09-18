"""贪心排程：从出发时间开始一站一站往后排。排完的校验在 verify.py 里单独做。

规则见需求分析 3.2 和第 5 节：
- 到达时已开门、没过停止入场时间，离开时不晚于关门，当天不是闭馆日；
- 累计花费不超过预算，结束时间不超过节奏规定的时间；
- 11:30 到 13:30 之间在附近安排一次午餐；
- 说了想去的片区就只在这些片区里挑，没说时一天最多跨两个片区；
- 用户点名要去全天型景点时，当天只排它，外加午餐。
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Optional

from ..schemas import Conditions, District, PlanItem, Poi
from . import geo
from .timeutil import to_hhmm, to_minutes, weekday_name

LUNCH_START = 11 * 60 + 30   # 午餐最早 11:30 开始
LUNCH_LATEST = 13 * 60 + 30  # 最晚 13:30 开始
LUNCH_MINUTES = 60
LUNCH_MAX_METERS = 6000      # 午餐只在上一站 6 公里内找餐厅，太远就提醒自行安排
LUNCH_NEAR_METERS = 3000     # 全天型景点 3 公里内有餐厅，才安排中午出来吃饭
MAX_WAIT = 60                # 到了还没开门，最多等 60 分钟
MAX_DISTRICTS = 2

# 节奏：名称、最多几个景点、最晚几点结束
PACES = {
    "RELAXED": ("轻松", 3, 17 * 60 + 30),
    "NORMAL": ("适中", 4, 18 * 60),
    "TIGHT": ("紧凑", 6, 20 * 60),
}


@dataclass
class Visit:
    poi: Poi
    start: int
    end: int
    cost: float               # 这一站所有人的门票或餐费
    leg: Optional[geo.Leg]    # 从上一站过来的交通，第一站为空


@dataclass
class PlanResult:
    items: list[PlanItem]
    total_cost: float
    warnings: list[str]
    filter_detail: str   # “筛选景点”这一步的说明
    arrange_detail: str  # “排出行程”这一步的说明


def open_windows(poi: Poi, day: date) -> list[tuple[int, int, int]]:
    """某天的开放时段：(开门, 停止入场, 关门)。当天闭馆返回空列表。"""
    if day.isoformat() in poi.closed_dates:
        return []
    windows = []
    for rule in poi.open_rules:
        if day.isoweekday() in rule.weekdays:
            close = to_minutes(rule.close_time)
            last_entry = to_minutes(rule.last_entry_time) if rule.last_entry_time else close
            windows.append((to_minutes(rule.open_time), last_entry, close))
    return sorted(windows)


def plan(conditions: Conditions, pois: list[Poi], districts: list[District]) -> PlanResult:
    return DayPlanner(conditions, pois, districts).run()


class DayPlanner:
    def __init__(self, conditions: Conditions, pois: list[Poi], districts: list[District]):
        self.cond = conditions
        self.day = date.fromisoformat(conditions.date)
        self.people = max(1, conditions.adults + conditions.seniors + conditions.children)
        self.pace_name, self.max_stops, self.day_end = PACES[conditions.pace]
        self.by_id = {p.id: p for p in pois}
        self.district_names = {d.id: d.name for d in districts}

        avoid = set(conditions.avoid_poi_ids)
        self.scenic = [p for p in pois if p.type == "SCENIC" and p.id not in avoid and open_windows(p, self.day)]
        self.restaurants = [p for p in pois if p.type == "RESTAURANT" and p.id not in avoid and open_windows(p, self.day)]

        self.time = to_minutes(conditions.start_time)
        self.pos: Optional[Poi] = None
        self.spent = 0.0
        self.visits: list[Visit] = []
        self.warnings: list[str] = []
        self.explained: set[int] = set()  # 已经说明过原因的必去景点
        self.full_day: Optional[Poi] = None
        # 出发时已经过了午饭时间，就不安排午餐
        self.lunch_done = self.time >= LUNCH_LATEST
        if not self.lunch_done and not self.restaurants:
            self.lunch_done = True
            self.warnings.append("当天没有营业的餐厅数据，午餐请自行安排")

    # ---------- 主流程 ----------

    def run(self) -> PlanResult:
        full_day = next((p for p in self.scenic if p.full_day and p.id in self.cond.must_poi_ids), None)
        if full_day is None or not self._plan_full_day(full_day):
            self._plan_greedy([p for p in self.scenic if not p.full_day])

        if self._scenic_count() == 0:
            # 一个景点都排不进去时，只剩一顿午餐没有意义
            self.visits.clear()
            self.spent = 0.0
            self.warnings.append(self._empty_warning())

        self._check_must_visits()
        return PlanResult(
            items=self._build_items(),
            total_cost=round(self.spent, 2),
            warnings=self.warnings,
            filter_detail=self._filter_detail(),
            arrange_detail=self._arrange_detail(),
        )

    def _empty_warning(self) -> str:
        """一个景点都排不进去时的提醒：选的片区当天没有能去的景点（闭馆或说了不去），就建议换个片区。"""
        if self.cond.district_ids and not any(p.district_id in self.cond.district_ids for p in self.scenic):
            names = "、".join(self.district_names[i] for i in self.cond.district_ids if i in self.district_names)
            return f"{names}这天没有能去的景点，可以换个片区"
        return "按现在的条件排不出景点，可以换个日期或放宽条件"

    def _plan_greedy(self, candidates: list[Poi]) -> None:
        candidates = list(candidates)
        while True:
            if not self.lunch_done and self.time >= LUNCH_START:
                self._add_lunch()
                continue
            if self._scenic_count() >= self.max_stops:
                break
            choice = self._pick_next(candidates)
            if choice is not None:
                poi, leg, start = choice
                self._append(poi, leg, start, start + poi.stay_minutes, self._ticket(poi))
                candidates.remove(poi)
            elif not self.lunch_done:
                self._add_lunch()  # 午饭前已经排不进景点了，先去吃饭，下午再排
            else:
                break
        if not self.lunch_done and self.visits:
            self._add_lunch()

    def _pick_next(self, candidates: list[Poi]) -> Optional[tuple[Poi, Optional[geo.Leg], int]]:
        """在所有候选里挑“得分高、路程近、此时能进、不超预算”的下一站。"""
        used_districts = {v.poi.district_id for v in self.visits if v.poi.type == "SCENIC"}
        lunch_reserve = 0.0 if self.lunch_done else self._cheapest_lunch()
        best, best_value = None, 0.0
        for poi in candidates:
            # 说了想去的片区，就只在这些片区里挑（点名要去的景点除外）；没说时一天最多跨两个片区
            must = poi.id in self.cond.must_poi_ids
            if self.cond.district_ids and poi.district_id not in self.cond.district_ids and not must:
                continue
            if poi.district_id not in used_districts and len(used_districts) >= MAX_DISTRICTS:
                continue
            leg = self._leg_to(poi)
            travel = leg.minutes if leg else 0
            arrive = self.time + travel
            # 第一站可以晚点出发，不限制等待时间
            start = self._fit(poi, arrive, poi.stay_minutes, None if self.pos is None else MAX_WAIT)
            if start is None:
                continue
            end = start + poi.stay_minutes
            if end > self.day_end:
                continue
            cost = (leg.cost if leg else 0) + self._ticket(poi)
            if not self.lunch_done and end > LUNCH_START and end + self._minutes_to_lunch(poi, cost) > LUNCH_LATEST:
                continue  # 玩完这一站就赶不上午饭了
            if self._over_budget(cost + lunch_reserve):
                continue
            value = self._score(poi) - 0.08 * travel - 0.02 * (start - arrive)
            if best is None or value > best_value:
                best, best_value = (poi, leg, start), value
        return best

    def _plan_full_day(self, poi: Poi) -> bool:
        """全天型景点：上午游玩，中午在附近吃饭，下午回去接着玩。"""
        start = self._fit(poi, self.time, 60, None)
        if start is None:
            return False
        ticket = self._ticket(poi)
        if self._over_budget(ticket):
            self.explained.add(poi.id)
            self.warnings.append(f"{poi.name}门票约 ¥{ticket:.0f}，超出预算，没有排进去")
            return False

        self.full_day = poi
        others = [i for i in self.cond.must_poi_ids if i != poi.id and i in self.by_id and self.by_id[i].type == "SCENIC"]
        if others:
            self.explained.update(others)
            names = "、".join(self.by_id[i].name for i in others)
            self.warnings.append(f"{poi.name}要玩一整天，{names}这次排不进去，换一天再去吧")

        close = next(c for o, last, c in open_windows(poi, self.day) if o <= start <= last)
        day_end = min(close, self.day_end)
        near = [r for r in self.restaurants if geo.distance_m(poi, r) <= LUNCH_NEAR_METERS]

        if not self.lunch_done and near and start <= LUNCH_START - 60:
            self._append(poi, None, start, LUNCH_START, ticket)
            self._add_lunch(near)
            if self.visits[-1].poi.type == "RESTAURANT":
                leg = geo.estimate(self.visits[-1].poi, poi, self.people)
                back = self.time + leg.minutes
                if back < day_end:
                    self._append(poi, leg, back, day_end, 0.0)
        else:
            self._append(poi, None, start, day_end, ticket)
            if not self.lunch_done:
                self.lunch_done = True
                self.warnings.append(f"{poi.name}附近没有收录的餐厅，午餐请在园区里解决")
        return True

    def _add_lunch(self, candidates: Optional[list[Poi]] = None) -> None:
        self.lunch_done = True
        best = None
        over_budget = False
        for r in self._nearby_restaurants() if candidates is None else candidates:
            leg = self._leg_to(r)
            arrive = max(self.time + (leg.minutes if leg else 0), LUNCH_START)
            start = self._fit(r, arrive, LUNCH_MINUTES, MAX_WAIT)
            if start is None or start > LUNCH_LATEST or start + LUNCH_MINUTES > self.day_end:
                continue
            cost = (r.avg_cost or 0) * self.people
            if self._over_budget((leg.cost if leg else 0) + cost):
                over_budget = True
                continue
            # 优先用户点名的餐厅，其次开饭早、离得近、便宜的
            rank = (r.id not in self.cond.must_poi_ids, start, leg.minutes if leg else 0, cost)
            if best is None or rank < best[0]:
                best = (rank, r, leg, start, cost)
        if best is None:
            self.warnings.append("预算不够安排午餐，请自行解决" if over_budget else "附近没有收录合适的餐厅，午餐请自行安排")
            return
        _, r, leg, start, cost = best
        self._append(r, leg, start, start + LUNCH_MINUTES, cost)

    # ---------- 小工具 ----------

    def _fit(self, poi: Poi, arrive: int, stay: int, wait_limit: Optional[int]) -> Optional[int]:
        """最早能开始游玩的时间；排不进去返回 None。"""
        for open_time, last_entry, close in open_windows(poi, self.day):
            start = max(arrive, open_time)
            if wait_limit is not None and start - arrive > wait_limit:
                continue
            if start <= last_entry and start + stay <= close:
                return start
        return None

    def _append(self, poi: Poi, leg: Optional[geo.Leg], start: int, end: int, cost: float) -> None:
        self.visits.append(Visit(poi, start, end, cost, leg))
        self.spent += cost + (leg.cost if leg else 0)
        self.time = end
        self.pos = poi

    def _leg_to(self, poi: Poi) -> Optional[geo.Leg]:
        return None if self.pos is None else geo.estimate(self.pos, poi, self.people)

    def _ticket(self, poi: Poi) -> float:
        return (poi.ticket_price or 0) * self.people

    def _over_budget(self, extra: float) -> bool:
        return self.cond.budget is not None and self.spent + extra > self.cond.budget + 0.001

    def _nearby_restaurants(self, around: Optional[Poi] = None) -> list[Poi]:
        """某个位置（默认是当前所在的站）附近能去吃午饭的餐厅。"""
        center = around or self.pos
        if center is None:
            return self.restaurants
        return [r for r in self.restaurants if geo.distance_m(center, r) <= LUNCH_MAX_METERS]

    def _cheapest_lunch(self) -> float:
        """给午餐预留的钱；附近没有餐厅，或者连最便宜的一顿都吃不起时不预留（到时候提醒）。"""
        costs = [(r.avg_cost or 0) * self.people for r in self._nearby_restaurants()]
        cheapest = min(costs, default=0.0)
        if self._over_budget(cheapest):
            return 0.0
        return cheapest

    def _minutes_to_lunch(self, poi: Poi, extra_cost: float) -> int:
        """玩完这一站后，去附近吃得起的最近餐厅要多久；附近没有这样的餐厅就不限制（到时候提醒）。"""
        minutes = []
        for r in self._nearby_restaurants(poi):
            leg = geo.estimate(poi, r, self.people)
            if not self._over_budget(extra_cost + leg.cost + (r.avg_cost or 0) * self.people):
                minutes.append(leg.minutes)
        return min(minutes, default=0)

    def _score(self, poi: Poi) -> float:
        score = poi.rating or 4.0
        score += 1.5 * len(set(poi.tags) & set(self.cond.interests))
        if self.cond.seniors and "适合长辈" in poi.tags:
            score += 1
        if self.cond.children and "亲子" in poi.tags:
            score += 1
        if poi.id in self.cond.must_poi_ids:
            score += 100
        return score

    def _scenic_count(self) -> int:
        return len({v.poi.id for v in self.visits if v.poi.type == "SCENIC"})

    def _check_must_visits(self) -> None:
        planned = {v.poi.id for v in self.visits}
        for poi_id in self.cond.must_poi_ids:
            poi = self.by_id.get(poi_id)
            if poi is None or poi_id in planned or poi_id in self.explained or poi_id in self.cond.avoid_poi_ids:
                continue
            self.warnings.append(f"{poi.name}{self._reason(poi)}，没有排进去")

    def _reason(self, poi: Poi) -> str:
        closed_word = "闭馆" if poi.type == "SCENIC" else "不营业"
        if self.day.isoformat() in poi.closed_dates:
            return f"{self.day.month}月{self.day.day}日{closed_word}"
        if not open_windows(poi, self.day):
            return f"{weekday_name(self.day)}{closed_word}"
        if self.cond.budget is not None and self._ticket(poi) > self.cond.budget:
            return "门票超出预算"
        if poi.full_day:
            return "要玩一整天，当天时间不够"
        return "当天时间排不下"

    def _build_items(self) -> list[PlanItem]:
        items = []
        for i, v in enumerate(self.visits):
            nxt = self.visits[i + 1].leg if i + 1 < len(self.visits) else None
            items.append(PlanItem(
                seq=i + 1,
                poi_id=v.poi.id,
                start_time=to_hhmm(v.start),
                end_time=to_hhmm(v.end),
                cost=round(v.cost, 2),
                next_mode=nxt.mode if nxt else None,
                next_minutes=nxt.minutes if nxt else None,
                next_meters=nxt.meters if nxt else None,
                next_cost=round(nxt.cost, 2) if nxt else None,
            ))
        return items

    # ---------- 执行步骤的说明文字 ----------

    def _filter_detail(self) -> str:
        text = f"{weekday_name(self.day)}开放的景点 {len(self.scenic)} 个、餐厅 {len(self.restaurants)} 家"
        names = [self.district_names[i] for i in self.cond.district_ids if i in self.district_names]
        if names:
            text += "，只在" + "、".join(names) + "里挑"
        return text

    def _arrange_detail(self) -> str:
        count = self._scenic_count()
        lunch = any(v.poi.type == "RESTAURANT" for v in self.visits)
        if count == 0:
            return "没有能排进去的景点"
        if self.full_day is not None:
            return f"{self.full_day.name}需要一整天" + ("，中午在附近吃饭后接着玩" if lunch else "")
        return f"按开放时间和路程依次安排 {count} 个景点" + ("，午餐 1 次" if lunch else "")
