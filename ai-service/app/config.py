"""AI 服务的配置：默认值写在 Settings 里，ai-service/.env 里写了的会覆盖默认值。"""
from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")


@dataclass(frozen=True)
class Settings:
    api_key: str = ""                           # DEEPSEEK_API_KEY
    base_url: str = "https://api.deepseek.com"  # DEEPSEEK_BASE_URL
    model: str = "deepseek-flash"               # DEEPSEEK_MODEL
    timeout: float = 15                         # DEEPSEEK_TIMEOUT：每次调用大模型最多等多少秒
    port: int = 7777                            # AI_PORT：AI 服务监听的端口，后端按 tour.ai.base-url 访问


def load_settings() -> Settings:
    default = Settings()
    return Settings(
        api_key=os.getenv("DEEPSEEK_API_KEY", default.api_key).strip(),
        base_url=os.getenv("DEEPSEEK_BASE_URL", default.base_url).strip().rstrip("/"),
        model=os.getenv("DEEPSEEK_MODEL", default.model).strip(),
        timeout=float(os.getenv("DEEPSEEK_TIMEOUT", default.timeout)),
        port=int(os.getenv("AI_PORT", default.port)),
    )
