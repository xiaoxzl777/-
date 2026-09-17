import pytest

from app import parser
from app.schemas import Conditions
from tests.sample_data import DISTRICTS, POIS, SATURDAY, TODAY


@pytest.mark.parametrize("text,expected", [
    ("500", 500), ("五百", 500), ("一千五", 1500), ("三百五", 350), ("十二", 12), ("两", 2), ("两万", 20000),
])
def test_cn_number(text, expected):
    assert parser.cn_number(text) == expected


@pytest.mark.parametrize("text,expected", [
    ("周六", "2026-09-19"), ("这周六", "2026-09-19"), ("星期天", "2026-09-20"), ("周三", "2026-09-23"),
    ("下周一", "2026-09-21"), ("明天", "2026-09-18"), ("大后天", "2026-09-20"), ("周末", "2026-09-19"),
    ("下周末", "2026-09-26"), ("10月1日", "2026-10-01"), ("十月一号", "2026-10-01"), ("国庆", "2026-10-01"),
    ("5号", "2026-10-05"), ("20号", "2026-09-20"),
])
def test_parse_date(text, expected):
    assert parser.parse_date(text, TODAY).isoformat() == expected


@pytest.mark.parametrize("text", ["一日游", "坐3号线", "随便逛逛"])
def test_parse_date_ignores_other_numbers(text):
    assert parser.parse_date(text, TODAY) is None


@pytest.mark.parametrize("text,expected", [
    ("早上八点半出发", "08:30"), ("下午两点出发", "14:00"), ("9点去陈家祠", "09:00"), ("10:30出发", "10:30"),
    ("12点在广州酒家吃饭", None), ("想睡到自然醒", "10:00"),
])
def test_parse_start_time(text, expected):
    assert parser.parse_start_time(text) == expected


def parse(text, base=None):
    return parser.parse(text, TODAY, POIS, DISTRICTS, base=base)


def test_parse_a_full_sentence():
    result = parse("周六带爸妈逛老城区，想轻松点，预算五百")
    assert result.changes == {"date": SATURDAY, "seniors": 2, "budget": 500.0, "pace": "RELAXED"}
    assert result.places.district_ids == [1]
    assert result.missing == []


def test_missing_fields_are_reported_on_first_plan():
    assert parse("想去陈家祠").missing == ["date", "budget"]
    assert parse("想去陈家祠", base=Conditions(date=SATURDAY)).missing == []


@pytest.mark.parametrize("text,changes", [
    ("我们3个人，带2个孩子", {"children": 2, "adults": 1}),
    ("和女朋友一起", {"adults": 2}),
    ("两位老人和一个小孩", {"seniors": 2, "children": 1}),
    ("人均100", {"budget": 100.0}),
    ("我们一块去广州塔", {}),
    ("预算不限", {"budget": None}),
    ("多排几个景点", {"pace": "TIGHT"}),
])
def test_parse_people_budget_and_pace(text, changes):
    assert parse(text).changes == changes


def test_places_and_negation():
    places = parse("不去沙面，想去陈家祠和小蛮腰").places
    assert places.avoid_ids == [3]
    assert places.must_ids == [1, 5]
    assert parse("沙面不去了").places.avoid_ids == [3]


def test_place_name_is_not_a_district():
    places = parse("想去广州塔").places
    assert places.must_ids == [5]
    assert places.district_ids == []


def test_unknown_places_are_noted_and_not_matched():
    result = parse("想去长隆欢乐世界")
    assert result.places.must_ids == []
    assert "长隆欢乐世界暂未收录，没有排进去" in result.notes


def test_multi_day_and_booking_notes():
    notes = parse("广州玩三天，顺便帮我订酒店").notes
    assert "暂时只支持一日游，先帮你排第一天" in notes
    assert any("订酒店" in n for n in notes)
    assert parse("周六玩一天").notes == []


def test_merge_keeps_what_was_not_mentioned():
    base = Conditions(date=SATURDAY, budget=500, district_ids=[1], must_poi_ids=[3], interests=["拍照"])
    merged = parser.merge(base, parse("带上爸妈，沙面不去了，想看博物馆", base=base))
    assert merged.date == SATURDAY
    assert merged.budget == 500
    assert merged.seniors == 2
    assert merged.district_ids == [1]
    assert merged.must_poi_ids == []
    assert merged.avoid_poi_ids == [3]
    assert merged.interests == ["拍照", "博物馆"]
