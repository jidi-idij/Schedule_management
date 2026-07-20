"""Pydantic 请求/响应模型。"""
from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


class MarkOut(BaseModel):
    id: int
    date: str
    title: str
    note: str
    created_at: str


class MarkCreate(BaseModel):
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="YYYY-MM-DD")
    title: str = Field(..., min_length=1, max_length=100)
    note: str = Field(default="", max_length=500)


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class AgentChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    history: list[ChatMessage] = Field(default_factory=list)


class AgentChatResponse(BaseModel):
    reply: str
