import { useState } from 'react'
import { CalendarClock, Download, Eraser, Plus, Trash2 } from 'lucide-react'
import { downloadExport } from '@/api/client'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { useSchedule } from '@/hooks/useSchedule'

type Schedule = ReturnType<typeof useSchedule>

export default function DayDetail({ schedule }: { schedule: Schedule }) {
  const { selectedDate, selectedMarks, addMark, removeMark, clearAll } = schedule
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAdd = async () => {
    const trimmed = title.trim()
    if (!trimmed) return
    setSubmitting(true)
    setError(null)
    try {
      await addMark({ date: selectedDate, title: trimmed, note: note.trim() })
      setTitle('')
      setNote('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '添加失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleExport = async () => {
    try {
      await downloadExport()
    } catch (e) {
      setError(e instanceof Error ? e.message : '导出失败')
    }
  }

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <CalendarClock className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">{selectedDate} 的日程</h2>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => void handleExport()}>
            <Download className="mr-1 h-4 w-4" />
            导出 JSON
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                <Eraser className="mr-1 h-4 w-4" />
                清空全部
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认清空全部日程？</AlertDialogTitle>
                <AlertDialogDescription>
                  该操作会删除所有日期上的全部日程标记，且不可恢复。建议先点击「导出 JSON」备份数据。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={() => void clearAll()}>
                  确认清空
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* 当日标记列表 */}
      {selectedMarks.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">这一天还没有日程标记</p>
      ) : (
        <ul className="mb-4 space-y-2">
          {selectedMarks.map((mark) => (
            <li
              key={mark.id}
              className="group flex items-start justify-between gap-2 rounded-lg border bg-background px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{mark.title}</p>
                {mark.note && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{mark.note}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                onClick={() => void removeMark(mark.id)}
                aria-label="删除标记"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {/* 新增标记 */}
      <div className="space-y-2 border-t pt-3">
        <Input
          placeholder="标记内容，例如：团队周会"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void handleAdd()
          }}
        />
        <Textarea
          placeholder="备注（可选）"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button
          className="w-full"
          size="sm"
          disabled={!title.trim() || submitting}
          onClick={() => void handleAdd()}
        >
          <Plus className="mr-1 h-4 w-4" />
          标记这一天
        </Button>
      </div>
    </div>
  )
}
