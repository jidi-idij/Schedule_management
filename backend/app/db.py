"""SQLite 存储层：日程标记的增删查。"""
from __future__ import annotations

import os
import sqlite3
import threading
from typing import Optional

DB_PATH = os.environ.get("SCHEDULE_DB", os.path.join(os.path.dirname(__file__), "..", "schedule.db"))

_lock = threading.Lock()
_conn: Optional[sqlite3.Connection] = None


def _get_conn() -> sqlite3.Connection:
    global _conn
    if _conn is None:
        _conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        _conn.row_factory = sqlite3.Row
        with _conn:
            _conn.execute(
                """
                CREATE TABLE IF NOT EXISTS marks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    date TEXT NOT NULL,
                    title TEXT NOT NULL,
                    note TEXT NOT NULL DEFAULT '',
                    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
                )
                """
            )
            _conn.execute("CREATE INDEX IF NOT EXISTS idx_marks_date ON marks(date)")
    return _conn


def list_marks(month: Optional[str] = None, date: Optional[str] = None) -> list[dict]:
    """按月（YYYY-MM）或按日（YYYY-MM-DD）查询标记，默认查全部。"""
    conn = _get_conn()
    with _lock:
        if date:
            rows = conn.execute(
                "SELECT * FROM marks WHERE date = ? ORDER BY id", (date,)
            ).fetchall()
        elif month:
            rows = conn.execute(
                "SELECT * FROM marks WHERE date LIKE ? ORDER BY date, id", (f"{month}-%",)
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM marks ORDER BY date, id").fetchall()
    return [dict(r) for r in rows]


def list_marks_between(start_date: str, end_date: str) -> list[dict]:
    """查询日期区间 [start_date, end_date] 内的标记（供 Agent 工具使用）。"""
    conn = _get_conn()
    with _lock:
        rows = conn.execute(
            "SELECT * FROM marks WHERE date BETWEEN ? AND ? ORDER BY date, id",
            (start_date, end_date),
        ).fetchall()
    return [dict(r) for r in rows]


def add_mark(date: str, title: str, note: str = "") -> dict:
    conn = _get_conn()
    with _lock, conn:
        cur = conn.execute(
            "INSERT INTO marks (date, title, note) VALUES (?, ?, ?)", (date, title, note)
        )
        row = conn.execute("SELECT * FROM marks WHERE id = ?", (cur.lastrowid,)).fetchone()
    return dict(row)


def delete_mark(mark_id: int) -> bool:
    conn = _get_conn()
    with _lock, conn:
        cur = conn.execute("DELETE FROM marks WHERE id = ?", (mark_id,))
    return cur.rowcount > 0


def delete_marks_by_title(date: str, title: str) -> int:
    """按日期+标题删除标记，返回删除条数（供 Agent 工具使用）。"""
    conn = _get_conn()
    with _lock, conn:
        cur = conn.execute(
            "DELETE FROM marks WHERE date = ? AND title LIKE ?", (date, f"%{title}%")
        )
    return cur.rowcount
