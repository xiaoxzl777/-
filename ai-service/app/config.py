"""AI 服务的配置，从 ai-service/.env 读取。"""
from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")


@dataclass(frozen=True)
class Settings:
    api_key: str
    base_url: str
    model: str
    timeout: float  # 每次调用大模型最多等多少秒


def load_settings() -> Settings:
    return Settings(
        api_key=os.getenv("DEEPSEEK_API_KEY", "").strip(),
        base_url=os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com").strip().rstrip("/"),
        model=os.getenv("DEEPSEEK_MODEL", "deepseek-flash").strip(),
        timeout=float(os.getenv("DEEPSEEK_TIMEOUT", "15")),
    )
