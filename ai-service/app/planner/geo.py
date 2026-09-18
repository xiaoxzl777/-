"""按两点直线距离估算交通方式、耗时和费用（业务规则见需求分析第 5 节）。"""
from __future__ import annotations

import math
from dataclasses import dataclass

from ..schemas import Poi

WALK_MAX_METERS = 1500   # 1.5 公里内步行
METRO_MAX_METERS = 10000  # 10 公里内坐地铁，更远打车
DETOUR = 1.3             # 实际路程大约是直线距离的 1.3 倍


@dataclass
class Leg:
    """从一站到下一站的交通。"""
    mode: str     # WALK 步行 / METRO 地铁 / TAXI 打车
    minutes: int
    meters: int   # 估算的实际路程
    cost: float   # 所有人的交通费合计


def distance_m(a: Poi, b: Poi) -> int:
    """两点之间的直线距离（米）。"""
    lng1, lat1, lng2, lat2 = map(math.radians, (a.lng, a.lat, b.lng, b.lat))
    h = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin((lng2 - lng1) / 2) ** 2
    return round(2 * 6371000 * math.asin(math.sqrt(h)))


def metro_fare(km: float) -> int:
    """广州地铁单程票价：4 公里内 2 元；4 到 12 公里每 4 公里加 1 元；12 到 24 公里每 6 公里加 1 元；再远每 8 公里加 1 元。"""
    if km <= 4:
        return 2
    if km <= 12:
        return 2 + math.ceil((km - 4) / 4)
    if km <= 24:
        return 4 + math.ceil((km - 12) / 6)
    return 6 + math.ceil((km - 24) / 8)


def taxi_fare(km: float) -> float:
    """广州出租车：起步价 12 元（含 3 公里），之后每公里 2.6 元。"""
    return 12 + max(0.0, km - 3) * 2.6


def _round_up_5(minutes: float) -> int:
    return max(5, math.ceil(minutes / 5) * 5)


def estimate(a: Poi, b: Poi, people: int) -> Leg:
    straight = distance_m(a, b)
    meters = round(straight * DETOUR)
    km = meters / 1000
    if straight <= WALK_MAX_METERS:
        # 步行每分钟约 70 米
        return Leg("WALK", _round_up_5(meters / 70), meters, 0.0)
    if straight <= METRO_MAX_METERS:
        # 进出站和等车约 15 分钟，列车平均每公里约 2.5 分钟（含换乘）
        return Leg("METRO", _round_up_5(15 + km * 2.5), meters, float(metro_fare(km) * people))
    # 等车约 10 分钟，市区平均每公里约 2.2 分钟；每车最多坐 4 人
    cars = math.ceil(people / 4)
    return Leg("TAXI", _round_up_5(10 + km * 2.2), meters, float(round(taxi_fare(km)) * cars))
