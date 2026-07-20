# ---------- 前端构建 ----------
FROM node:20-alpine AS frontend
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json \
     tailwind.config.js postcss.config.js components.json ./
COPY src ./src
RUN npm run build

# ---------- 运行时：Python 后端托管 API + 静态资源 ----------
FROM python:3.12-slim
WORKDIR /app

COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend ./backend
COPY --from=frontend /build/dist ./dist

# 运行时通过 -e 注入：ANTHROPIC_AUTH_TOKEN / ANTHROPIC_BASE_URL / ANTHROPIC_MODEL
ENV STATIC_DIR=/app/dist \
    SCHEDULE_DB=/app/data/schedule.db
RUN mkdir -p /app/data

EXPOSE 8000
WORKDIR /app/backend
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
