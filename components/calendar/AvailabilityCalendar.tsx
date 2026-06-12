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
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
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

  return (
    <div className="w-full max-w-sm mx-auto select-none">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setViewMonth((m) => subMonths(m, 1))}
          disabled={!isBefore(currentMonthStart, viewMonth)}
          aria-label="Previous month"
        >
          &#8249;
        </Button>
        <span className="text-base font-semibold text-foreground">
          {format(viewMonth, 'MMMM yyyy')}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
          aria-label="Next month"
        >
          &#8250;
        </Button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADERS.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-medium text-muted-foreground py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-y-1">
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
              disabled={!isSelectable}
              onClick={() => isSelectable && onSelectDate(dayStr)}
              className={cn(
                'relative flex flex-col items-center justify-center rounded-md py-1.5 text-sm transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                // Selected
                isSelected &&
                  'ring-2 ring-primary bg-primary text-white font-semibold',
                // Available (not selected)
                !isSelected && state === 'available' &&
                  'bg-white border border-green-300 text-foreground cursor-pointer hover:bg-green-50 hover:border-green-500',
                // Limited
                !isSelected && state === 'limited' &&
                  'bg-amber-50 border border-amber-400 text-amber-900 cursor-pointer hover:bg-amber-100',
                // Fully booked / closed / disabled
                (state === 'fully-booked' || state === 'closed' || state === 'disabled') &&
                  'bg-muted text-muted-foreground cursor-not-allowed opacity-60',
                // Today highlight (subtle underline)
                isToday(day) && !isSelected && 'font-bold underline decoration-dotted',
              )}
              aria-label={`${dayStr}${label ? `, ${label}` : ''}`}
              aria-pressed={isSelected}
            >
              <span className="leading-none">{format(day, 'd')}</span>
              {label && (
                <span className="text-[10px] leading-none mt-0.5 font-medium">
                  {label}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 text-xs text-muted-foreground justify-center">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded border border-green-300 bg-white" />
          Available
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded border border-amber-400 bg-amber-50" />
          Limited
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-muted" />
          Unavailable
        </span>
      </div>
    </div>
  )
}
