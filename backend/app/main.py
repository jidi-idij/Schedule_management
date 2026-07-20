"""FastAPI 入口：日程标记 REST API + LangGraph Agent 对话接口 + 前端静态资源。"""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from . import agent, db
from .schemas import AgentChatRequest, AgentChatResponse, MarkCreate, MarkOut

app = FastAPI(title="日程管理 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- 日程标记 API ----------

@app.get("/api/marks", response_model=list[MarkOut])
def get_marks(month: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}$")):
    """按月查询标记，month 格式 YYYY-MM；不传则返回全部。"""
    return db.list_marks(month=month)


@app.post("/api/marks", response_model=MarkOut, status_code=201)
def post_mark(payload: MarkCreate):
    return db.add_mark(payload.date, payload.title.strip(), payload.note.strip())


@app.delete("/api/marks/{mark_id}", status_code=204)
def remove_mark(mark_id: int):
    if not db.delete_mark(mark_id):
        raise HTTPException(status_code=404, detail="标记不存在")


# ---------- Agent 对话 API ----------

@app.post("/api/agent/chat", response_model=AgentChatResponse)
def agent_chat(payload: AgentChatRequest):
    try:
        reply = agent.chat(payload.message, [m.model_dump() for m in payload.history])
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Agent 调用失败：{e}")
    return AgentChatResponse(reply=reply)


@app.get("/api/health")
def health():
    return {"status": "ok"}


# ---------- 前端静态资源（生产模式，SPA 回退到 index.html） ----------

STATIC_DIR = Path(os.environ.get("STATIC_DIR", Path(__file__).resolve().parents[2] / "dist"))

if STATIC_DIR.is_dir():
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa_fallback(full_path: str):
        file = STATIC_DIR / full_path
        if full_path and file.is_file():
            return FileResponse(file)
        return FileResponse(STATIC_DIR / "index.html")
