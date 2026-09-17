"""小萧 AI 服务的入口。在 ai-service 目录下启动：uvicorn app.main:app --port 8000"""
from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI

from .llm import DeepSeek
from .schemas import ChatReply, ChatRequest, Greeting, PlanRequest
from .service import XiaoXiao

load_dotenv(Path(__file__).resolve().parent.parent / ".env")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s - %(message)s")


def create_app(xiaoxiao: Optional[XiaoXiao] = None) -> FastAPI:
    if xiaoxiao is None:
        xiaoxiao = XiaoXiao(DeepSeek(
            api_key=os.getenv("DEEPSEEK_API_KEY", ""),
            base_url=os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com"),
            model=os.getenv("DEEPSEEK_MODEL", "deepseek-chat"),
        ))
    app = FastAPI(title="小萧 AI 服务")

    @app.get("/health")
    def health():
        return {"status": "ok", "llm": xiaoxiao.mode}

    @app.get("/greeting", response_model=Greeting)
    def greeting(nickname: str = ""):
        return xiaoxiao.greet(nickname)

    @app.post("/chat", response_model=ChatReply)
    def chat(req: ChatRequest):
        return xiaoxiao.chat(req)

    @app.post("/plan", response_model=ChatReply)
    def plan(req: PlanRequest):
        return xiaoxiao.replan(req)

    return app


app = create_app()
