import pytest

from app.planner import greedy, verify
from app.schemas import Conditions, PlanItem
from tests.sample_data import DISTRICTS, MONDAY, POIS, SATURDAY


@pytest.mark.parametrize("kwargs", [
    {"pace": "RELAXED", "seniors": 2, "district_ids": [1]},
    {"must_poi_ids": [6], "children": 1},
    {"pace": "TIGHT", "budget": 300},
    {"date": MONDAY, "must_poi_ids": [4]},
    {"start_time": "14:00"},
])
def test_planner_output_passes_verification(kwargs):
    cond = Conditions(**{"date": SATURDAY, **kwargs})
    result = greedy.plan(cond, POIS, DISTRICTS)
    assert verify.check(result.items, cond, POIS) == []


def item(seq, poi_id, start, end, cost=0, next_minutes=None):
    return PlanItem(seq=seq, poi_id=poi_id, start_time=start, end_time=end, cost=cost,
                    next_mode="WALK" if next_minutes else None, next_minutes=next_minutes)


def test_finds_closed_places():
    cond = Conditions(date=MONDAY)
    assert verify.check([item(1, 4, "10:00", "12:00")], cond, POIS) == ["广东省博物馆不在开放时间内"]


def test_finds_entry_after_last_entry_time():
    cond = Conditions(date=SATURDAY)
    assert verify.check([item(1, 1, "17:10", "17:25")], cond, POIS) == ["陈家祠（广东民间工艺博物馆）不在开放时间内"]


def test_finds_tight_connections_and_late_finish():
    cond = Conditions(date=SATURDAY, pace="RELAXED")
    problems = verify.check([item(1, 2, "10:00", "11:00", next_minutes=20), item(2, 3, "11:10", "18:00")], cond, POIS)
    assert "永庆坊到下一站的时间来不及" in problems
    assert "沙面结束得太晚" in problems


def test_finds_lunch_outside_lunch_time_and_over_budget():
    cond = Conditions(date=SATURDAY, budget=100)
    problems = verify.check([item(1, 8, "15:00", "16:00", cost=120)], cond, POIS)
    assert problems == ["广州酒家（文昌总店）不在午饭时间", "总花费超出预算"]
