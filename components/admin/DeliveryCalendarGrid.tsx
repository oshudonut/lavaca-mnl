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
  isPast: boolean
  isSelected: boolean
  onClick: () => void
}

function DateCell({ date, record, isPast, isSelected, onClick }: CellProps) {
  const day = parseInt(date.split('-')[2], 10)
  const state = record ? (record.is_open ? 'open' : 'closed') : 'unset'
  const label = state === 'open' ? 'Open' : state === 'closed' ? 'Closed' : 'Not set up'

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      aria-label={`${date}: ${label}${record?.closure_type ? `, ${record.closure_type}` : ''}`}
      className={`adm-cal-cell is-${state}${isSelected ? ' is-selected' : ''}${isPast ? ' is-past' : ''}`}
    >
      <span className="adm-cal-day">{day}</span>
      <span className="adm-cal-state">{label}</span>
      {state === 'closed' && record?.closure_type && (
        <span className="adm-cal-note">{record.closure_type}</span>
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
  const [isMobile, setIsMobile] = useState(false)
  const [products, setProducts] = useState<{ id: string; sku: string; name: string; weight_label: string }[]>([])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    fetch('/api/admin/products')
      .then((res) => res.json())
      .then((all: Array<{ id: string; sku: string; name: string; weight_label: string; is_available: boolean }>) => {
        setProducts(
          all
            .filter((p) => p.is_available)
            .map(({ id, sku, name, weight_label }) => ({ id, sku, name, weight_label }))
        )
      })
      .catch((err) => console.error('[DeliveryCalendarGrid] products fetch error:', err))
  }, [])

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
      setGenMsg(
        data.created > 0
          ? `Opened ${data.created} new day${data.created === 1 ? '' : 's'}. Days already set up were left as they are.`
          : 'Every day this month is already set up.'
      )
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
  while (cells.length % 7 !== 0) cells.push({ date: null })

  const selectedRecord = selectedDate ? (dateMap.get(selectedDate) ?? null) : null

  return (
    <div>
      {/* Mobile backdrop */}
      {selectedDate && isMobile && (
        <div
          onClick={() => setSelectedDate(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(12,10,9,0.5)',
            zIndex: 40,
          }}
        />
      )}

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* Calendar */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Navigation */}
          <div className="adm-cal-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button type="button" onClick={prevMonth} className="adm-btn adm-btn-outline adm-cal-arrow" aria-label="Previous month">‹</button>
              <h2 className="adm-h2" style={{ minWidth: 170, textAlign: 'center' }}>{monthLabel}</h2>
              <button type="button" onClick={nextMonth} className="adm-btn adm-btn-outline adm-cal-arrow" aria-label="Next month">›</button>
            </div>
            <button type="button" className="adm-btn adm-btn-primary" onClick={handleGenerate} disabled={generating}>
              {generating ? 'Opening days…' : 'Open all days this month'}
            </button>
          </div>
          {genMsg && <p className="adm-success" role="status" style={{ marginBottom: 12 }}>{genMsg}</p>}

          {/* Day headers */}
          <div className="adm-cal-grid adm-cal-dow">
            {DOW_LABELS.map((d) => <div key={d}>{d}</div>)}
          </div>

          {/* Calendar grid */}
          {loading ? (
            <div className="adm-cal-grid adm-skeleton">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="adm-skel-bar" style={{ minHeight: 72 }} />
              ))}
            </div>
          ) : (
            <div className="adm-cal-grid">
              {cells.map((cell, i) => {
                if (!cell.date) return <div key={i} />
                const isPast = cell.date < today
                const record = dateMap.get(cell.date) ?? null
                return (
                  <DateCell
                    key={cell.date}
                    date={cell.date}
                    record={record}
                    isPast={isPast}
                    isSelected={selectedDate === cell.date}
                    onClick={() => setSelectedDate(cell.date === selectedDate ? null : cell.date!)}
                  />
                )
              })}
            </div>
          )}

          {/* Legend */}
          <div className="adm-cal-legend">
            <span><i className="is-open" />Open for pickups</span>
            <span><i className="is-closed" />Closed</span>
            <span><i className="is-unset" />Not set up (customers can’t pick it)</span>
          </div>
          <p className="adm-hint" style={{ marginTop: 8 }}>Tap a date to open or close it, or to hide a product for that day.</p>
        </div>

        {/* Side panel — desktop only inline, mobile is fixed overlay */}
        {selectedDate && !isMobile && (
          <DateSidePanel
            date={selectedDate}
            record={selectedRecord}
            products={products}
            onClose={() => setSelectedDate(null)}
            onSaved={handleSaved}
          />
        )}
      </div>

      {/* Mobile side panel — fixed bottom sheet */}
      {selectedDate && isMobile && (
        <DateSidePanel
          date={selectedDate}
          record={selectedRecord}
          products={products}
          onClose={() => setSelectedDate(null)}
          onSaved={handleSaved}
          isMobileOverlay
        />
      )}
    </div>
  )
}
