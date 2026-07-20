import { CalendarDays } from 'lucide-react'
import CalendarView from '@/sections/CalendarView'
import ChatPanel from '@/sections/ChatPanel'
import DayDetail from '@/sections/DayDetail'
import { useSchedule } from '@/hooks/useSchedule'

export default function Home() {
  const schedule = useSchedule()

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
          <CalendarDays className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">日程管理</h1>
          <span className="ml-auto text-xs text-muted-foreground">
            手动标记 + LangGraph Agent 智能管理
          </span>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-4 px-4 py-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <CalendarView schedule={schedule} />
          <DayDetail schedule={schedule} />
        </div>
        <ChatPanel schedule={schedule} />
      </main>
    </div>
  )
}
