"""小萧 AI 服务的入口。在 ai-service 目录下启动：uvicorn app.main:app --port 8000"""
from __future__ import annotations

import logging
import time
from datetime import date
from typing import Callable, Optional

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from . import status
from .chains import Chains, build_chains, unavailable_chains
from .config import Settings, load_settings
from .graph import build_graph
from .greeting import greet
from .llm import LlmError, create_model
from .schemas import ChatReply, ChatRequest, Greeting, Plan, PlanRequest

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s - %(message)s")
log = logging.getLogger("xiaoxiao")


def create_app(chains: Optional[Chains] = None, settings: Optional[Settings] = None,
               check_status: Optional[Callable[[], dict]] = None) -> FastAPI:
    settings = settings or load_settings()
    if chains is None:
        chains = build_chains(create_model(settings)) if settings.api_key else unavailable_chains()
    graph = build_graph(chains)
    app = FastAPI(title="小萧 AI 服务")

    @app.exception_handler(LlmError)
    async def llm_error(_: Request, exc: LlmError):
        return JSONResponse(status_code=503, content={"detail": {"code": exc.code, "message": exc.message}})

    @app.get("/health")
    def health():
        return check_status() if check_status else status.check(settings)

    @app.get("/greeting", response_model=Greeting)
    def greeting(nickname: str = ""):
        return Greeting(mood="PROUD", reply=greet(nickname))

    @app.post("/chat", response_model=ChatReply)
    def chat(req: ChatRequest):
        return run(graph, {"message": req.message, "history": req.history, "conditions": req.conditions},
                   req.today, req)

    @app.post("/plan", response_model=ChatReply)
    def plan(req: PlanRequest):
        return run(graph, {"conditions": req.conditions}, req.today, req)

    return app


def run(graph, inputs: dict, today: str, req: ChatRequest | PlanRequest) -> ChatReply:
    started = time.perf_counter()
    state = graph.invoke({**inputs, "today": date.fromisoformat(today), "pois": req.pois, "districts": req.districts})
    reply = to_reply(state)
    log.info("%s，用时 %.1f 秒", "闲聊" if reply.intent == "CHAT" else "规划", time.perf_counter() - started)
    return reply


def to_reply(state: dict) -> ChatReply:
    """把流程图最后的状态整理成接口返回的格式。"""
    if state.get("intent") == "CHAT":
        return ChatReply(intent="CHAT", mood=state["mood"], reply=state["reply"])
    result = state["result"]
    plan = Plan(conditions=state["conditions"], items=result.items, total_cost=result.total_cost,
                steps=state["steps"], warnings=state["warnings"])
    return ChatReply(intent="PLAN", mood=state["mood"], reply=state["reply"], plan=plan)


app = create_app()
