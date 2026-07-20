import { useCallback, useEffect, useMemo, useState } from 'react'
import { createMark, deleteMark, fetchMarks } from '@/api/client'
import type { MarkCreateInput, ScheduleMark } from '@/types'

export function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function toMonthStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

/** 当前月份日程标记的状态管理 */
export function useSchedule() {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [marks, setMarks] = useState<ScheduleMark[]>([])
  const [selectedDate, setSelectedDate] = useState<string>(() => toDateStr(new Date()))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchMarks(toMonthStr(currentMonth))
      setMarks(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [currentMonth])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const addMark = useCallback(
    async (input: MarkCreateInput) => {
      await createMark(input)
      await refresh()
    },
    [refresh],
  )

  const removeMark = useCallback(
    async (id: number) => {
      await deleteMark(id)
      await refresh()
    },
    [refresh],
  )

  const goToPrevMonth = useCallback(() => {
    setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  }, [])

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  }, [])

  const goToToday = useCallback(() => {
    const now = new Date()
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1))
    setSelectedDate(toDateStr(now))
  }, [])

  /** 按日期分组的标记，供日历格子渲染 */
  const marksByDate = useMemo(() => {
    const map = new Map<string, ScheduleMark[]>()
    for (const mark of marks) {
      const list = map.get(mark.date) ?? []
      list.push(mark)
      map.set(mark.date, list)
    }
    return map
  }, [marks])

  const selectedMarks = useMemo(
    () => marksByDate.get(selectedDate) ?? [],
    [marksByDate, selectedDate],
  )

  return {
    currentMonth,
    marks,
    marksByDate,
    selectedDate,
    selectedMarks,
    loading,
    error,
    setSelectedDate,
    addMark,
    removeMark,
    refresh,
    goToPrevMonth,
    goToNextMonth,
    goToToday,
  }
}
