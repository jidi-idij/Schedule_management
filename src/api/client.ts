import type { AgentChatResponse, ChatMessage, MarkCreateInput, ScheduleMark } from '@/types'

const BASE = '/api'

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

/** 与 LangGraph Agent 对话 */
export function chatWithAgent(message: string, history: ChatMessage[]): Promise<AgentChatResponse> {
  return request<AgentChatResponse>('/agent/chat', {
    method: 'POST',
    body: JSON.stringify({ message, history }),
  })
}
