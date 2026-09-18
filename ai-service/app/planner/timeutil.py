"""时间小工具。一天里的时间统一换算成“从 0 点起的分钟数”来计算。"""
from __future__ import annotations

from datetime import date

WEEKDAY_NAMES = "一二三四五六日"


def to_minutes(hhmm: str) -> int:
    """"09:30" 或 "09:30:00" 转成 570。"""
    hour, minute = hhmm.split(":")[:2]
    return int(hour) * 60 + int(minute)


def to_hhmm(minutes: int) -> str:
    return f"{minutes // 60:02d}:{minutes % 60:02d}"


def weekday_name(day: date) -> str:
    return "周" + WEEKDAY_NAMES[day.isoweekday() - 1]


def date_label(day: date) -> str:
    """2026-09-19 转成“9月19日（周六）”。"""
    return f"{day.month}月{day.day}日（{weekday_name(day)}）"
