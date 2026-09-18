from app.planner import greedy as planner
from app.planner.timeutil import to_minutes
from app.schemas import Conditions
from tests.sample_data import DISTRICTS, MONDAY, POIS, SATURDAY

BY_ID = {p.id: p for p in POIS}


def run(pois=POIS, **kwargs):
    kwargs.setdefault("date", SATURDAY)
    cond = Conditions(**kwargs)
    return cond, planner.plan(cond, pois, DISTRICTS)


def ids(result):
    return [it.poi_id for it in result.items]


def assert_valid(cond, result):
    """每份行程都要满足的基本规则。"""
    items = result.items
    day_end = planner.PACES[cond.pace][2]
    for a, b in zip(items, items[1:]):
        assert to_minutes(a.end_time) + (a.next_minutes or 0) <= to_minutes(b.start_time)
    for it in items:
        assert to_minutes(it.end_time) <= day_end
    lunches = [it for it in items if BY_ID[it.poi_id].type == "RESTAURANT"]
    assert len(lunches) <= 1
    for lunch in lunches:
        assert "11:30" <= lunch.start_time <= "13:30"
    total = sum(it.cost + (it.next_cost or 0) for it in items)
    assert abs(total - result.total_cost) < 0.01
    if cond.budget is not None:
        assert result.total_cost <= cond.budget
    scenic = [it for it in items if BY_ID[it.poi_id].type == "SCENIC"]
    assert len({BY_ID[it.poi_id].district_id for it in scenic}) <= planner.MAX_DISTRICTS
    assert len({it.poi_id for it in scenic}) <= planner.PACES[cond.pace][1]


def test_relaxed_day_in_old_town_with_parents():
    cond, result = run(pace="RELAXED", seniors=2, district_ids=[1])
    assert_valid(cond, result)
    scenic = [i for i in ids(result) if BY_ID[i].type == "SCENIC"]
    assert len(scenic) == 3
    assert all(BY_ID[i].district_id == 1 for i in scenic)
    assert any(BY_ID[i].type == "RESTAURANT" for i in ids(result))
    assert result.warnings == []


def test_museum_closed_on_monday_is_explained():
    cond, result = run(date=MONDAY, must_poi_ids=[4])
    assert_valid(cond, result)
    assert 4 not in ids(result)
    assert any("广东省博物馆周一闭馆" in w for w in result.warnings)


def test_empty_district_suggests_another_district():
    # 周一省博闭馆，广州塔又说了不去：这个片区当天没有能去的景点
    cond, result = run(date=MONDAY, district_ids=[2], avoid_poi_ids=[5])
    assert result.items == []
    assert result.warnings == ["珠江新城与广州塔这天没有能去的景点，可以换个片区"]


def test_closed_date_is_explained():
    closed = [p.model_copy(update={"closed_dates": [SATURDAY]}) if p.id == 1 else p for p in POIS]
    cond, result = run(pois=closed, must_poi_ids=[1])
    assert 1 not in ids(result)
    assert any("9月19日闭馆" in w for w in result.warnings)


def test_must_visit_is_scheduled():
    cond, result = run(must_poi_ids=[5])
    assert_valid(cond, result)
    assert 5 in ids(result)


def test_ticket_over_budget_is_skipped():
    cond, result = run(budget=100, must_poi_ids=[5])
    assert_valid(cond, result)
    assert 5 not in ids(result)
    assert any("门票超出预算" in w for w in result.warnings)


def test_budget_includes_everyone():
    cond, result = run(adults=2, seniors=2, budget=600)
    assert_valid(cond, result)


def test_full_day_park_with_lunch_in_the_middle():
    cond, result = run(must_poi_ids=[6], children=1)
    assert_valid(cond, result)
    assert ids(result) == [6, 10, 6]
    assert result.items[0].cost == 600  # 门票只算一次：300 × 2 人
    assert result.items[2].cost == 0


def test_full_day_park_pushes_out_other_must_visits():
    cond, result = run(must_poi_ids=[6, 1])
    assert 1 not in ids(result)
    assert any("要玩一整天" in w for w in result.warnings)


def test_no_lunch_when_starting_in_the_afternoon():
    cond, result = run(start_time="14:00")
    assert_valid(cond, result)
    assert all(BY_ID[i].type == "SCENIC" for i in ids(result))
    assert result.items[0].start_time >= "14:00"


def test_avoided_places_are_not_used():
    cond, result = run(district_ids=[1], avoid_poi_ids=[1, 8])
    assert_valid(cond, result)
    assert 1 not in ids(result) and 8 not in ids(result)


def test_tight_pace_keeps_two_districts_at_most():
    cond, result = run(pace="TIGHT", interests=["历史人文", "拍照", "博物馆"])
    assert_valid(cond, result)


def test_chosen_districts_are_respected():
    cond, result = run(district_ids=[2], pace="TIGHT")
    assert_valid(cond, result)
    assert {BY_ID[i].district_id for i in ids(result) if BY_ID[i].type == "SCENIC"} == {2}
    # 点名要去的景点不受片区限制
    cond, result = run(district_ids=[2], must_poi_ids=[1])
    assert 1 in ids(result)


def test_no_lunch_when_restaurants_are_far_away():
    # 番禺片区里去掉园区餐厅后，最近的餐厅也在十几公里外，不应该为了吃饭跑那么远
    cond, result = run(district_ids=[5], avoid_poi_ids=[10])
    assert_valid(cond, result)
    assert ids(result) == [7]
    assert "附近没有收录合适的餐厅，午餐请自行安排" in result.warnings


def test_nothing_can_be_planned():
    museum_only = [p for p in POIS if p.id in (4, 9)]
    cond, result = run(pois=museum_only, date=MONDAY, must_poi_ids=[4])
    assert result.items == []
    assert result.total_cost == 0
    assert any("周一闭馆" in w for w in result.warnings)


def test_travel_modes_follow_distance():
    cond, result = run(must_poi_ids=[1, 4], district_ids=[1, 2], pace="TIGHT")
    assert_valid(cond, result)
    modes = {it.next_mode for it in result.items if it.next_mode}
    assert modes <= {"WALK", "METRO", "TAXI"}
    for it in result.items:
        if it.next_mode == "WALK":
            assert it.next_cost == 0
