'use client'

import { useState, useEffect, useCallback } from 'react'
import { DateSidePanel, type AdminDateRecord } from './DateSidePanel'

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function toYearMonth(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function firstDayOfWeek(yearMonth: string): number {
  const [y, m] = yearMonth.split('-').map(Number)
  return new Date(y, m - 1, 1).getDay()
}

interface CellProps {
  date: string
  record: AdminDateRecord | null
  isMonday: boolean
  isPast: boolean
  isSelected: boolean
  onClick: () => void
}

function DateCell({ date, record, isMonday, isPast, isSelected, onClick }: CellProps) {
  const day = parseInt(date.split('-')[2], 10)

  if (isMonday) {
    return (
      <div className="min-h-[72px] rounded-lg bg-muted/40 border border-border/50 p-2 flex flex-col">
        <span className="text-xs font-medium text-muted-foreground/50">{day}</span>
        <span className="mt-auto text-xs text-muted-foreground/40">Rest day</span>
      </div>
    )
  }

  const slots = record?.delivery_slots ?? []
  const totalBooked = slots.reduce((sum, s) => sum + (s.booked_count ?? 0), 0)
  const totalMax = record?.max_orders_total ?? 0

  return (
    <button
      onClick={onClick}
      className={[
        'min-h-[72px] w-full rounded-lg border p-2 text-left transition-all flex flex-col',
        isSelected
          ? 'border-primary ring-2 ring-primary/30 bg-primary/5'
          : 'hover:border-primary/40 hover:bg-muted/30',
        record?.is_open
          ? 'border-green-300 bg-green-50/60'
          : record
          ? 'border-red-300 bg-red-50/60'
          : 'border-border bg-background',
        isPast ? 'opacity-50' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className={`text-xs font-semibold ${isPast ? 'text-muted-foreground' : 'text-foreground'}`}>
        {day}
      </span>

      {record?.is_open ? (
        <>
          <span className="mt-1 inline-block rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700 leading-none">
            Open
          </span>
          {totalMax > 0 && (
            <span className="mt-auto text-[10px] text-muted-foreground tabular-nums">
              {totalBooked}/{totalMax}
            </span>
          )}
        </>
      ) : record ? (
        <>
          <span className="mt-1 inline-block rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 leading-none">
            Closed
          </span>
          {record.closure_type && (
            <span className="mt-auto text-[10px] text-muted-foreground capitalize">
              {record.closure_type}
            </span>
          )}
        </>
      ) : (
        <span className="mt-auto text-[10px] text-muted-foreground/60">No slot</span>
      )}
    </button>
  )
}

export function DeliveryCalendarGrid() {
  const [currentMonth, setCurrentMonth] = useState<string>(() => toYearMonth(new Date()))
  const [dateMap, setDateMap] = useState<Map<string, AdminDateRecord>>(new Map())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [genMsg, setGenMsg] = useState<string | null>(null)

  const fetchDates = useCallback(async (month: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/delivery-dates?month=${month}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data: AdminDateRecord[] = await res.json()
      const map = new Map<string, AdminDateRecord>()
      for (const d of data) map.set(d.date, d)
      setDateMap(map)
    } catch (err) {
      console.error('[DeliveryCalendarGrid] fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDates(currentMonth)
  }, [currentMonth, fetchDates])

  const [year, mon] = currentMonth.split('-').map(Number)
  const monthLabel = new Date(year, mon - 1, 1).toLocaleDateString('en-PH', {
    month: 'long',
    year: 'numeric',
  })

  function prevMonth() {
    const d = new Date(year, mon - 2, 1)
    setCurrentMonth(toYearMonth(d))
    setSelectedDate(null)
  }

  function nextMonth() {
    const d = new Date(year, mon, 1)
    setCurrentMonth(toYearMonth(d))
    setSelectedDate(null)
  }

  async function handleGenerate() {
    setGenerating(true)
    setGenMsg(null)
    const lastDay = daysInMonth(year, mon)
    const from_date = `${currentMonth}-01`
    const to_date = `${currentMonth}-${String(lastDay).padStart(2, '0')}`
    try {
      const res = await fetch('/api/admin/delivery-dates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_date, to_date }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generate failed')
      setGenMsg(`Created ${data.created}, skipped ${data.skipped}`)
      await fetchDates(currentMonth)
    } catch (err: any) {
      setGenMsg(err.message ?? 'An error occurred')
    } finally {
      setGenerating(false)
    }
  }

  function handleSaved(updated: AdminDateRecord) {
    setDateMap(prev => {
      const next = new Map(prev)
      next.set(updated.date, updated)
      return next
    })
  }

  const totalDays = daysInMonth(year, mon)
  const startDow = firstDayOfWeek(currentMonth)
  const today = new Date().toISOString().split('T')[0]

  const cells: Array<{ date: string | null }> = []
  for (let i = 0; i < startDow; i++) cells.push({ date: null })
  for (let d = 1; d <= totalDays; d++) {
    cells.push({ date: `${currentMonth}-${String(d).padStart(2, '0')}` })
  }
  // pad to complete last row
  while (cells.length % 7 !== 0) cells.push({ date: null })

  const selectedRecord = selectedDate ? (dateMap.get(selectedDate) ?? null) : null

  return (
    <div className="flex gap-6 items-start">
      {/* Calendar */}
      <div className="flex-1 min-w-0">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={prevMonth}
              className="rounded-lg border border-border p-1.5 hover:bg-muted transition-colors"
              aria-label="Previous month"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-base font-semibold text-foreground w-44 text-center">{monthLabel}</h2>
            <button
              onClick={nextMonth}
              className="rounded-lg border border-border p-1.5 hover:bg-muted transition-colors"
              aria-label="Next month"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {genMsg && (
              <span className="text-xs text-muted-foreground">{genMsg}</span>
            )}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate month'}
            </button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DOW_LABELS.map(d => (
            <div key={d} className="py-1 text-center text-xs font-medium text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {loading ? (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="min-h-[72px] rounded-lg bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell, i) => {
              if (!cell.date) {
                return <div key={i} className="min-h-[72px]" />
              }
              const dow = new Date(cell.date + 'T00:00:00Z').getUTCDay()
              const isMonday = dow === 1
              const isPast = cell.date < today
              const record = dateMap.get(cell.date) ?? null

              return (
                <DateCell
                  key={cell.date}
                  date={cell.date}
                  record={record}
                  isMonday={isMonday}
                  isPast={isPast}
                  isSelected={selectedDate === cell.date}
                  onClick={() => {
                    if (!isMonday) setSelectedDate(cell.date === selectedDate ? null : cell.date)
                  }}
                />
              )
            })}
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-green-300 inline-block" />
            Open
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-300 inline-block" />
            Closed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-muted inline-block" />
            Not set up
          </span>
        </div>
      </div>

      {/* Side panel */}
      {selectedDate && (
        <DateSidePanel
          date={selectedDate}
          record={selectedRecord}
          onClose={() => setSelectedDate(null)}
          onSaved={record => {
            handleSaved(record)
            // keep panel open so user can see updated state
          }}
        />
      )}
    </div>
  )
}
