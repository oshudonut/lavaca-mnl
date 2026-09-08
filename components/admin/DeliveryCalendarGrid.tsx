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
      <div style={{
        minHeight: 60,
        background: '#F5F4F2',
        border: '1px solid #E8E5E3',
        padding: '6px 5px',
        display: 'flex',
        flexDirection: 'column',
        opacity: 0.55,
      }}>
        <span style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 11,
          fontWeight: 500,
          color: '#8C7B6B',
        }}>{day}</span>
        <span style={{
          marginTop: 'auto',
          fontFamily: "'Jost', sans-serif",
          fontSize: 8,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#8C7B6B',
        }}>Rest</span>
      </div>
    )
  }

  const slots = record?.delivery_slots ?? []
  const totalBooked = slots.reduce((sum, s) => sum + (s.booked_count ?? 0), 0)
  const totalMax = record?.max_orders_total ?? 0

  const borderColor = isSelected
    ? '#A16207'
    : record?.is_open
    ? '#86EFAC'
    : record
    ? '#FCA5A5'
    : '#D6D3D1'

  const bgColor = isSelected
    ? 'rgba(161,98,7,0.05)'
    : record?.is_open
    ? 'rgba(220,252,231,0.5)'
    : record
    ? 'rgba(254,226,226,0.5)'
    : '#FFFFFF'

  return (
    <button
      onClick={onClick}
      style={{
        minHeight: 60,
        width: '100%',
        background: bgColor,
        border: `1px solid ${borderColor}`,
        padding: '6px 5px',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        outline: isSelected ? '1px solid #A16207' : 'none',
        outlineOffset: -1,
        opacity: isPast ? 0.5 : 1,
        transition: 'border-color 0.15s',
        boxSizing: 'border-box',
      }}
    >
      <span style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: 11,
        fontWeight: 600,
        color: isPast ? '#8C7B6B' : '#1C1917',
      }}>{day}</span>

      {record?.is_open ? (
        <>
          <span style={{
            marginTop: 3,
            fontFamily: "'Jost', sans-serif",
            fontSize: 8,
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#15803D',
            display: 'inline-block',
          }}>Open</span>
          {totalMax > 0 && (
            <span style={{
              marginTop: 'auto',
              fontFamily: "'Inter', sans-serif",
              fontSize: 9,
              color: '#57534E',
              fontVariantNumeric: 'tabular-nums',
            }}>{totalBooked}/{totalMax}</span>
          )}
        </>
      ) : record ? (
        <>
          <span style={{
            marginTop: 3,
            fontFamily: "'Jost', sans-serif",
            fontSize: 8,
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#B91C1C',
            display: 'inline-block',
          }}>Closed</span>
          {record.closure_type && (
            <span style={{
              marginTop: 'auto',
              fontFamily: "'Inter', sans-serif",
              fontSize: 9,
              color: '#8C7B6B',
              textTransform: 'capitalize',
            }}>{record.closure_type}</span>
          )}
        </>
      ) : (
        <span style={{
          marginTop: 'auto',
          fontFamily: "'Inter', sans-serif",
          fontSize: 9,
          color: '#C4B8B0',
        }}>No slot</span>
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
  while (cells.length % 7 !== 0) cells.push({ date: null })

  const selectedRecord = selectedDate ? (dateMap.get(selectedDate) ?? null) : null

  const navBtnStyle: React.CSSProperties = {
    background: '#FFFFFF',
    border: '1px solid #D6D3D1',
    padding: '7px 9px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s',
    flexShrink: 0,
  }

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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={prevMonth} style={navBtnStyle} aria-label="Previous month">
                <svg width={14} height={14} fill="none" stroke="#1C1917" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span style={{
                fontFamily: "'Playfair Display SC', serif",
                fontSize: 15,
                fontWeight: 400,
                color: '#1C1917',
                width: 160,
                textAlign: 'center',
                letterSpacing: '0.01em',
              }}>{monthLabel}</span>
              <button onClick={nextMonth} style={navBtnStyle} aria-label="Next month">
                <svg width={14} height={14} fill="none" stroke="#1C1917" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {genMsg && (
                <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 10, letterSpacing: '0.1em', color: '#8C7B6B' }}>{genMsg}</span>
              )}
              <button
                onClick={handleGenerate}
                disabled={generating}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  background: generating ? '#D6D3D1' : '#A16207',
                  color: generating ? '#8C7B6B' : '#FFFFFF',
                  border: 'none',
                  padding: '8px 14px',
                  cursor: generating ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
                  opacity: generating ? 0.7 : 1,
                }}
              >
                {generating ? 'Generating…' : 'Generate month'}
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 2 }}>
            {DOW_LABELS.map(d => (
              <div key={d} style={{
                padding: '6px 0',
                textAlign: 'center',
                fontFamily: "'Jost', sans-serif",
                fontSize: 9,
                fontWeight: 400,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#8C7B6B',
              }}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} style={{ minHeight: 60, background: '#EDE9E8' }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
              {cells.map((cell, i) => {
                if (!cell.date) return <div key={i} style={{ minHeight: 60 }} />
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
                      if (!isMonday) setSelectedDate(cell.date === selectedDate ? null : cell.date!)
                    }}
                  />
                )
              })}
            </div>
          )}

          {/* Legend */}
          <div style={{ marginTop: 16, display: 'flex', gap: 20 }}>
            {[
              { color: '#86EFAC', label: 'Open' },
              { color: '#FCA5A5', label: 'Closed' },
              { color: '#D6D3D1', label: 'Not set up' },
            ].map(({ color, label }) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, background: color, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8C7B6B' }}>{label}</span>
              </span>
            ))}
          </div>
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
