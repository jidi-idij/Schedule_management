import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { useSchedule } from '@/hooks/useSchedule'
import { toDateStr } from '@/hooks/useSchedule'
import { cn } from '@/lib/utils'

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

interface DayCell {
  date: Date
  inMonth: boolean
}

/** 生成日历格子（周一开头，6 行 × 7 列） */
function buildCells(month: Date): DayCell[] {
  const year = month.getFullYear()
  const m = month.getMonth()
  const first = new Date(year, m, 1)
  // getDay(): 周日=0 … 周六=6 → 转成周一=0 … 周日=6
  const startOffset = (first.getDay() + 6) % 7
  const start = new Date(year, m, 1 - startOffset)
  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    return { date, inMonth: date.getMonth() === m }
  })
}

type Schedule = ReturnType<typeof useSchedule>

export default function CalendarView({ schedule }: { schedule: Schedule }) {
  const {
    currentMonth,
    marksByDate,
    selectedDate,
    setSelectedDate,
    goToPrevMonth,
    goToNextMonth,
    goToToday,
  } = schedule

  const cells = buildCells(currentMonth)
  const todayStr = toDateStr(new Date())
  const monthLabel = `${currentMonth.getFullYear()} 年 ${currentMonth.getMonth() + 1} 月`

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      {/* 月份切换 */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{monthLabel}</h2>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={goToToday}>
            今天
          </Button>
          <Button variant="ghost" size="icon" onClick={goToPrevMonth} aria-label="上个月">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={goToNextMonth} aria-label="下个月">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 星期表头 */}
      <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1.5">
            {w}
          </div>
        ))}
      </div>

      {/* 日期格子 */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map(({ date, inMonth }) => {
          const dateStr = toDateStr(date)
          const dayMarks = marksByDate.get(dateStr) ?? []
          const isToday = dateStr === todayStr
          const isSelected = dateStr === selectedDate
          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              className={cn(
                'flex h-14 flex-col items-center justify-start rounded-lg pt-1.5 text-sm transition-colors',
                inMonth ? 'text-foreground' : 'text-muted-foreground/40',
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent',
                isToday && !isSelected && 'font-bold text-primary ring-1 ring-primary/40',
              )}
            >
              <span>{date.getDate()}</span>
              {dayMarks.length > 0 && (
                <span className="mt-1 flex items-center gap-0.5">
                  {dayMarks.slice(0, 3).map((mark) => (
                    <span
                      key={mark.id}
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        isSelected ? 'bg-primary-foreground' : 'bg-orange-500',
                      )}
                    />
                  ))}
                  {dayMarks.length > 3 && (
                    <span className="text-[10px] leading-none">+{dayMarks.length - 3}</span>
                  )}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
