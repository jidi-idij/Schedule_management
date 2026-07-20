import { useEffect, useRef, useState } from 'react'
import { Bot, Loader2, Send, User } from 'lucide-react'
import { chatWithAgent } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { useSchedule } from '@/hooks/useSchedule'
import type { ChatMessage } from '@/types'
import { cn } from '@/lib/utils'

type Schedule = ReturnType<typeof useSchedule>

const SUGGESTIONS = ['帮我查看今天的日程', '把明天标记为「项目评审」', '这个月我都有哪些安排？']

export default function ChatPanel({ schedule }: { schedule: Schedule }) {
  const { refresh } = schedule
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: '你好，我是你的日程助手。你可以让我查看某天的日程，或给某个日期添加/删除标记。' },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    const history = messages.slice(-10)
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }])
    setInput('')
    setSending(true)
    try {
      const { reply } = await chatWithAgent(trimmed, history)
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
      // Agent 可能增删了标记，刷新日历
      await refresh()
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `对话出错：${e instanceof Error ? e.message : '未知错误'}。请检查后端 Agent 配置（ANTHROPIC_AUTH_TOKEN 等环境变量）。`,
        },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-full min-h-[420px] flex-col rounded-xl border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Bot className="h-5 w-5 text-primary" />
        <h2 className="font-semibold">日程助手</h2>
        <span className="ml-auto text-xs text-muted-foreground">LangGraph Agent</span>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn('flex gap-2', msg.role === 'user' && 'flex-row-reverse')}
          >
            <div
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted',
              )}
            >
              {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            <div
              className={cn(
                'max-w-[80%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm',
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground',
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            助手思考中…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 快捷指令 */}
      <div className="flex flex-wrap gap-1.5 px-4 pb-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => void send(s)}
            className="rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {s}
          </button>
        ))}
      </div>

      {/* 输入区 */}
      <div className="flex gap-2 border-t p-3">
        <Input
          placeholder="例如：把 7 月 25 日标记为「面试」"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void send(input)
          }}
        />
        <Button size="icon" disabled={!input.trim() || sending} onClick={() => void send(input)}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
