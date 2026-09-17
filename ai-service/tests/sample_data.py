"""测试用的一小份示例数据，和数据库里的正式数据无关。今天按 2026-09-17（周四）算。"""
from datetime import date

from app.schemas import District, OpenRule, Poi

TODAY = date(2026, 9, 17)
SATURDAY = "2026-09-19"
MONDAY = "2026-09-21"

ALL_DAYS = [1, 2, 3, 4, 5, 6, 7]

DISTRICTS = [
    District(id=1, name="老城区（越秀、荔湾）"),
    District(id=2, name="珠江新城与广州塔"),
    District(id=5, name="番禺（长隆、沙湾）"),
]


def _rule(open_time, close_time, last_entry=None, weekdays=ALL_DAYS):
    return OpenRule(weekdays=weekdays, open_time=open_time, close_time=close_time, last_entry_time=last_entry)


POIS = [
    Poi(id=1, type="SCENIC", name="陈家祠（广东民间工艺博物馆）", district_id=1, lng=113.2497, lat=23.1257,
        stay_minutes=90, ticket_price=10, rating=4.7, tags=["历史人文", "岭南建筑", "适合长辈", "室内"],
        open_rules=[_rule("09:00", "17:30", "17:00")]),
    Poi(id=2, type="SCENIC", name="永庆坊", district_id=1, lng=113.2440, lat=23.1238,
        stay_minutes=90, ticket_price=0, rating=4.6, tags=["历史人文", "岭南建筑", "拍照", "美食"],
        open_rules=[_rule("10:00", "22:00")]),
    Poi(id=3, type="SCENIC", name="沙面", district_id=1, lng=113.2449, lat=23.1093,
        stay_minutes=90, ticket_price=0, rating=4.6, tags=["历史人文", "拍照", "适合长辈", "室外"],
        open_rules=[_rule("08:00", "22:00")]),
    Poi(id=4, type="SCENIC", name="广东省博物馆", district_id=2, lng=113.3302, lat=23.1176,
        stay_minutes=120, ticket_price=0, rating=4.8, tags=["博物馆", "历史人文", "亲子", "适合长辈", "室内"],
        open_rules=[_rule("09:00", "17:00", "16:00", weekdays=[2, 3, 4, 5, 6, 7])]),
    Poi(id=5, type="SCENIC", name="广州塔", district_id=2, lng=113.3308, lat=23.1066,
        stay_minutes=120, ticket_price=150, rating=4.7, tags=["城市地标", "夜景", "拍照"],
        open_rules=[_rule("09:30", "22:30", "22:00")]),
    Poi(id=6, type="SCENIC", name="长隆野生动物世界", district_id=5, lng=113.3242, lat=22.9993,
        stay_minutes=420, full_day=True, ticket_price=300, rating=4.8, tags=["动物", "亲子", "室外"],
        open_rules=[_rule("09:30", "18:00", "16:00")]),
    Poi(id=7, type="SCENIC", name="余荫山房", district_id=5, lng=113.3918, lat=22.9854,
        stay_minutes=90, ticket_price=18, rating=4.5, tags=["岭南建筑", "历史人文", "适合长辈"],
        open_rules=[_rule("08:30", "17:30", "17:00")]),
    Poi(id=8, type="RESTAURANT", name="广州酒家（文昌总店）", district_id=1, lng=113.2530, lat=23.1217,
        stay_minutes=60, avg_cost=120, rating=4.5, tags=["早茶", "粤菜", "老字号"],
        open_rules=[_rule("07:00", "22:00")]),
    Poi(id=9, type="RESTAURANT", name="珠江新城粤菜馆", district_id=2, lng=113.3260, lat=23.1190,
        stay_minutes=60, avg_cost=100, rating=4.4, tags=["粤菜"],
        open_rules=[_rule("11:00", "22:00")]),
    Poi(id=10, type="RESTAURANT", name="长隆园区餐厅", district_id=5, lng=113.3255, lat=23.0005,
        stay_minutes=60, avg_cost=80, rating=4.2, tags=["亲子"],
        open_rules=[_rule("10:00", "18:00")]),
]
