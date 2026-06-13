'use client'

import { useState } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isBefore,
  isToday,
} from 'date-fns'
import type { SlotsResponse, AvailableDate } from '@/lib/delivery/slots'

type Props = {
  slotsData: SlotsResponse
  selectedDate: string | null         // "YYYY-MM-DD"
  onSelectDate: (date: string) => void
}

type DateState =
  | 'available'
  | 'limited'
  | 'fully-booked'
  | 'closed'
  | 'disabled'

function getDateState(
  dateStr: string,
  availableDate: AvailableDate | undefined,
  isPast: boolean,
): { state: DateState; label?: string } {
  if (isPast) return { state: 'disabled' }

  if (!availableDate) return { state: 'disabled' }

  if (!availableDate.is_open) return { state: 'closed', label: 'Closed' }

  const openSlots = availableDate.slots.filter((s) => s.is_open)
  if (openSlots.length === 0) {
    // All slots closed (48hr or DB closed) or fully booked
    const allFull = availableDate.slots.every((s) => s.remaining === 0)
    if (allFull) return { state: 'fully-booked', label: 'Full' }
    return { state: 'disabled' }
  }

  const allFull = openSlots.every((s) => s.remaining === 0)
  if (allFull) return { state: 'fully-booked', label: 'Full' }

  const hasLimited = openSlots.some((s) => s.remaining <= 2 && s.remaining > 0)
  if (hasLimited) {
    const minRemaining = Math.min(...openSlots.map((s) => s.remaining))
    return { state: 'limited', label: `${minRemaining} left` }
  }

  return { state: 'available' }
}

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const navButtonStyle = (disabled: boolean): React.CSSProperties => ({
  width: 32,
  height: 32,
  background: '#FFFFFF',
  border: `1px solid ${disabled ? '#F5F4F2' : '#D6D3D1'}`,
  color: disabled ? '#D6D3D1' : '#1C1917',
  fontSize: 20,
  cursor: disabled ? 'not-allowed' : 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'border-color 0.2s',
  borderRadius: 0,
  padding: 0,
})

function dayCellStyle(
  state: DateState,
  isSelected: boolean,
  isSelectable: boolean,
): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 2px',
    position: 'relative',
    border: '1px solid transparent',
    borderRadius: 0,
    transition: 'all 0.2s',
    cursor: isSelectable ? 'pointer' : 'not-allowed',
  }

  if (isSelected) {
    return {
      ...base,
      outline: '2px solid #A16207',
      outlineOffset: 1,
      background: '#A16207',
      color: '#FFFFFF',
      fontWeight: 600,
    }
  }
  if (state === 'available') {
    return {
      ...base,
      border: '1px solid #86EFAC',
      background: '#F0FDF4',
      color: '#14532D',
    }
  }
  if (state === 'limited') {
    return {
      ...base,
      border: '1px solid #FCD34D',
      background: '#FFFBEB',
      color: '#92400E',
    }
  }
  // fully-booked / closed / disabled
  return {
    ...base,
    background: '#F5F4F2',
    color: '#A8A29E',
    opacity: 0.6,
  }
}

export function AvailabilityCalendar({ slotsData, selectedDate, onSelectDate }: Props) {
  const today = new Date()
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(today))

  // Build a lookup map from date string -> AvailableDate
  const dateMap = new Map<string, AvailableDate>()
  for (const d of slotsData.dates) {
    dateMap.set(d.date, d)
  }

  const monthStart = startOfMonth(viewMonth)
  const monthEnd = endOfMonth(viewMonth)
  // Grid starts on Sunday of the week containing monthStart
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  // Build array of all days in the grid
  const gridDays: Date[] = []
  let cursor = gridStart
  while (cursor <= gridEnd) {
    gridDays.push(cursor)
    cursor = addDays(cursor, 1)
  }

  const currentMonthStart = startOfMonth(today)
  const prevDisabled = !isBefore(currentMonthStart, viewMonth)

  return (
    <div style={{ width: '100%', maxWidth: 384, margin: '0 auto', userSelect: 'none' }}>
      {/* Month navigation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <button
          type="button"
          onClick={() => setViewMonth((m) => subMonths(m, 1))}
          disabled={prevDisabled}
          aria-label="Previous month"
          style={navButtonStyle(prevDisabled)}
        >
          &#8249;
        </button>
        <span
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 16,
            fontWeight: 500,
            color: '#1C1917',
          }}
        >
          {format(viewMonth, 'MMMM yyyy')}
        </span>
        <button
          type="button"
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
          aria-label="Next month"
          style={navButtonStyle(false)}
        >
          &#8250;
        </button>
      </div>

      {/* Day-of-week headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
        {DAY_HEADERS.map((d) => (
          <div
            key={d}
            style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: 9,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: '#A16207',
              textAlign: 'center',
              padding: '6px 0',
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: 4 }}>
        {gridDays.map((day) => {
          const isCurrentMonth = isSameMonth(day, viewMonth)
          const dayStr = format(day, 'yyyy-MM-dd')
          const dayOfWeek = day.getDay() // 0=Sun, 1=Mon
          const isMonday = dayOfWeek === 1
          const isPast = isBefore(day, today) && !isToday(day)
          const isSelected = dayStr === selectedDate

          // Days outside the current month: empty cell
          if (!isCurrentMonth) {
            return <div key={dayStr} />
          }

          // Monday: visually blank, non-interactive
          if (isMonday) {
            return <div key={dayStr} />
          }

          const availableDate = dateMap.get(dayStr)
          const { state, label } = getDateState(dayStr, availableDate, isPast)

          const isSelectable = state === 'available' || state === 'limited'

          return (
            <button
              key={dayStr}
              type="button"
              disabled={!isSelectable}
              onClick={() => isSelectable && onSelectDate(dayStr)}
              style={dayCellStyle(state, isSelected, isSelectable)}
              aria-label={`${dayStr}${label ? `, ${label}` : ''}`}
              aria-pressed={isSelected}
            >
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 13,
                  lineHeight: 1,
                  textDecoration:
                    isToday(day) && !isSelected ? 'underline dotted' : undefined,
                }}
              >
                {format(day, 'd')}
              </span>
              {label && (
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 9,
                    lineHeight: 1,
                    marginTop: 2,
                  }}
                >
                  {label}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          marginTop: 16,
          justifyContent: 'center',
          fontFamily: "'Inter', sans-serif",
          fontSize: 10,
          color: '#8C7B6B',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              border: '1px solid #86EFAC',
              background: '#F0FDF4',
            }}
          />
          Available
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              border: '1px solid #FCD34D',
              background: '#FFFBEB',
            }}
          />
          Limited
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              border: '1px solid #D6D3D1',
              background: '#F5F4F2',
            }}
          />
          Unavailable
        </span>
      </div>
    </div>
  )
}
