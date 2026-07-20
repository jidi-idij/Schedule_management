"""LangGraph Agent：通过工具调用完成日程的查看与标记。

模型接入 Anthropic 兼容端点（如阿里云 DashScope），通过环境变量配置：
- ANTHROPIC_BASE_URL   端点地址，如 https://dashscope.aliyuncs.com/apps/anthropic
- ANTHROPIC_AUTH_TOKEN API Key
- ANTHROPIC_MODEL      模型名，如 qwen3.6-flash
"""
from __future__ import annotations

import os
from datetime import date

from langchain_anthropic import ChatAnthropic
from langchain_core.tools import tool

from . import db


@tool
def get_today_date() -> str:
    """获取今天的日期，返回 YYYY-MM-DD。涉及「今天/明天/后天」等相对日期时必须先调用。"""
    return date.today().isoformat()


@tool
def list_schedule(start_date: str, end_date: str) -> str:
    """查询日期区间内的日程标记。参数为 YYYY-MM-DD，区间闭区间。查看某天或某月日程时使用。"""
    marks = db.list_marks_between(start_date, end_date)
    if not marks:
        return f"{start_date} 至 {end_date} 没有日程标记。"
    lines = [f"{m['date']}：{m['title']}" + (f"（备注：{m['note']}）" if m["note"] else "") for m in marks]
    return f"{start_date} 至 {end_date} 的日程：\n" + "\n".join(lines)


@tool
def add_schedule_mark(date_str: str, title: str, note: str = "") -> str:
    """给指定日期添加日程标记。date_str 为 YYYY-MM-DD，title 为标记内容，note 为可选备注。"""
    mark = db.add_mark(date_str, title, note)
    return f"已在 {mark['date']} 添加标记「{mark['title']}」。"


@tool
def remove_schedule_mark(date_str: str, title: str) -> str:
    """删除指定日期上标题包含 title 的日程标记。date_str 为 YYYY-MM-DD。"""
    count = db.delete_marks_by_title(date_str, title)
    if count:
        return f"已删除 {date_str} 上 {count} 条包含「{title}」的标记。"
    return f"{date_str} 没有找到包含「{title}」的标记。"


SYSTEM_PROMPT = """你是一个日程管理助手，帮助用户查看日期上的日程标记、给日期添加或删除标记。

规则：
1. 所有日期使用 YYYY-MM-DD 格式；涉及「今天、明天、下周」等相对日期时，先调用 get_today_date 再推算。
2. 查询单月日程时，区间取该月 1 日至月末。
3. 用户只说「标记某日期」但未给内容时，先问清楚标记内容再调用 add_schedule_mark。
4. 操作完成后用简洁的中文回复结果，不要输出工具调用的中间过程。"""

TOOLS = [get_today_date, list_schedule, add_schedule_mark, remove_schedule_mark]


def _build_agent(llm):
    """构建 ReAct Agent，兼容 langchain v1 与 langgraph prebuilt 两种入口。"""
    try:
        from langchain.agents import create_agent

        return create_agent(llm, tools=TOOLS, system_prompt=SYSTEM_PROMPT)
    except ImportError:
        from langgraph.prebuilt import create_react_agent

        return create_react_agent(llm, tools=TOOLS, prompt=SYSTEM_PROMPT)


_agent = None


def _get_agent():
    global _agent
    if _agent is None:
        token = os.environ.get("ANTHROPIC_AUTH_TOKEN", "sk-ws-H.RYDIHEI.lko8.MEUCIBfa4jz5s4x_eKTSvEab6m-xjrV9OZNu6M9S-JECmMmPAiEAukWscoqVYhoVjU8s5f27nY26zNjHIDdVBZZU2bAvaF8")
        if not token or token == "xxx":
            raise RuntimeError(
                "Agent 未配置：请设置环境变量 ANTHROPIC_AUTH_TOKEN（以及可选的 ANTHROPIC_BASE_URL、ANTHROPIC_MODEL）"
            )
        llm = ChatAnthropic(
            model=os.environ.get("ANTHROPIC_MODEL", "qwen3.6-flash"),
            api_key=token,
            base_url=os.environ.get("ANTHROPIC_BASE_URL", "https://dashscope.aliyuncs.com/apps/anthropic"),
            max_tokens=2048,
        )
        _agent = _build_agent(llm)
    return _agent


def _extract_text(content) -> str:
    """从模型输出中提取纯文本（跳过 thinking 等非文本块）。"""
    if isinstance(content, str):
        return content
    parts: list[str] = []
    for block in content:
        if isinstance(block, dict):
            if block.get("type") == "text":
                parts.append(block.get("text", ""))
        else:
            parts.append(str(block))
    return "".join(parts)


def chat(message: str, history: list[dict]) -> str:
    """与 Agent 单轮对话，history 为 [{role, content}] 形式的上下文。"""
    agent = _get_agent()
    messages = [(m["role"], m["content"]) for m in history[-10:]]
    messages.append(("user", message))
    result = agent.invoke({"messages": messages})
    return _extract_text(result["messages"][-1].content)
