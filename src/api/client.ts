import type { AgentChatResponse, ChatMessage, MarkCreateInput, ScheduleMark } from '@/types'

// 后端地址：默认同源 /api；前端单独部署（如 GitHub Pages）时，
// 通过 VITE_API_BASE 指向后端服务，例如 https://your-backend.onrender.com/api
const BASE: string = import.meta.env.VITE_API_BASE || '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `请求失败：${res.status}`)
  }
  return res.json() as Promise<T>
}

/** 按月查询日程标记，month 格式 YYYY-MM */
export function fetchMarks(month: string): Promise<ScheduleMark[]> {
  return request<ScheduleMark[]>(`/marks?month=${month}`)
}

export function createMark(input: MarkCreateInput): Promise<ScheduleMark> {
  return request<ScheduleMark>('/marks', { method: 'POST', body: JSON.stringify(input) })
}

export function deleteMark(id: number): Promise<void> {
  return request<void>(`/marks/${id}`, { method: 'DELETE' })
}

/** 清空全部日程标记（初始化） */
export function clearAllMarks(): Promise<{ deleted: number }> {
  return request<{ deleted: number }>('/marks', { method: 'DELETE' })
}

/** 导出全部日程为 JSON 文件并触发浏览器下载 */
export async function downloadExport(): Promise<void> {
  const res = await fetch(`${BASE}/export`)
  if (!res.ok) {
    throw new Error(`导出失败：${res.status}`)
  }
  const blob = await res.blob()
  const disposition = res.headers.get('Content-Disposition') ?? ''
  const filename = disposition.match(/filename=([^;]+)/)?.[1] ?? 'schedule-export.json'
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** 与 LangGraph Agent 对话 */
export function chatWithAgent(message: string, history: ChatMessage[]): Promise<AgentChatResponse> {
  return request<AgentChatResponse>('/agent/chat', {
    method: 'POST',
    body: JSON.stringify({ message, history }),
  })
}

