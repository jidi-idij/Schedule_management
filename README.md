# 日程管理

网页版日程管理小工具：日历查看 / 标记日期，支持手动操作和 LangGraph Agent 对话操作两种方式。

## 功能

- **查看日期**：月视图日历，支持切换月份、回到今天、选中任意日期查看当日日程
- **标记日期**：为选中的日期添加 / 删除日程标记（标题 + 备注）
- **Agent 对话**：通过自然语言让 LangGraph Agent 完成查看与标记，例如「把明天标记为项目评审」「这个月我有哪些安排」

## 项目结构

```
.
├── Dockerfile              # 一体化部署：前端构建 + Python 后端运行
├── backend/                # Python 后端（FastAPI + LangGraph）
│   ├── .env.example        # Agent 环境变量模板
│   ├── requirements.txt
│   └── app/
│       ├── main.py         # FastAPI 入口：REST API + Agent 接口 + 静态资源托管
│       ├── agent.py        # LangGraph ReAct Agent 与日程工具
│       ├── db.py           # SQLite 存储层
│       └── schemas.py      # Pydantic 模型
└── src/                    # React 前端（TypeScript + Tailwind + shadcn/ui）
    ├── api/client.ts       # 后端 API 封装
    ├── hooks/useSchedule.ts
    ├── sections/           # CalendarView / DayDetail / ChatPanel
    └── types/
```

## 本地开发

**后端**（端口 8000）：

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # 填入真实 ANTHROPIC_AUTH_TOKEN
uvicorn app.main:app --reload
```

**前端**（端口 3000，已配置 /api 代理到 8000）：

```bash
npm install
npm run dev
```

## Agent 配置

通过环境变量接入 Anthropic 兼容端点（阿里云 DashScope）：

| 变量 | 说明 | 示例 |
| --- | --- | --- |
| `ANTHROPIC_BASE_URL` | 端点地址 | `https://dashscope.aliyuncs.com/apps/anthropic` |
| `ANTHROPIC_AUTH_TOKEN` | API Key | 你的 DashScope Key |
| `ANTHROPIC_MODEL` | 模型名 | `qwen3.6-flash` |

## Docker 部署

```bash
docker build -t schedule-app .
docker run -p 8000:8000 \
  -e ANTHROPIC_AUTH_TOKEN=你的Key \
  -e ANTHROPIC_BASE_URL=https://dashscope.aliyuncs.com/apps/anthropic \
  -e ANTHROPIC_MODEL=qwen3.6-flash \
  schedule-app
```

访问 `http://localhost:8000`。日程数据保存在容器内 SQLite（`/app/data/schedule.db`），可挂载卷持久化。
