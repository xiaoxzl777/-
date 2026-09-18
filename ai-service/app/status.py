"""查询小萧能不能用：调用 DeepSeek 的余额接口（不收费），后台据此显示提醒。"""
from __future__ import annotations

from typing import Optional

import httpx

from .config import Settings


def check(settings: Settings) -> dict:
    if not settings.api_key:
        return _unavailable("没有配置 DeepSeek Key，请在 ai-service/.env 里填写")
    try:
        resp = httpx.get(f"{settings.base_url}/user/balance", timeout=8,
                         headers={"Authorization": f"Bearer {settings.api_key}"})
    except httpx.HTTPError:
        return _unavailable("连不上 DeepSeek，请检查网络")
    if resp.status_code == 401:
        return _unavailable("DeepSeek Key 无效，请检查 ai-service/.env")
    if resp.status_code != 200:
        return _unavailable(f"DeepSeek 暂时不可用（状态码 {resp.status_code}）")

    data = resp.json()
    infos = data.get("balance_infos") or [{}]
    balance = infos[0].get("total_balance")
    if not data.get("is_available", False):
        return _unavailable("DeepSeek 余额不足，请充值", balance)
    return {"status": "ok", "available": True, "problem": None, "balance": balance}


def _unavailable(problem: str, balance: Optional[str] = None) -> dict:
    return {"status": "ok", "available": False, "problem": problem, "balance": balance}
