/** 日程标记 */
export interface ScheduleMark {
  id: number
  /** YYYY-MM-DD */
  date: string
  title: string
  note: string
  created_at: string
}

export interface MarkCreateInput {
  date: string
  title: string
  note?: string
}

/** 对话消息 */
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AgentChatResponse {
  reply: string
}
