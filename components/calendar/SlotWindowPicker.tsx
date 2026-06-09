'use client'

import { cn } from '@/lib/utils'
import type { SlotWindow } from '@/lib/delivery/slots'

type Props = {
  slots: SlotWindow[]
  selectedWindow: 'AM' | 'PM' | null
  onSelectWindow: (window: 'AM' | 'PM') => void
}

const WINDOW_LABELS: Record<'AM' | 'PM', { time: string; label: string }> = {
  AM: { time: '9AM – 12PM', label: 'Morning' },
  PM: { time: '1PM – 5PM', label: 'Afternoon' },
}

function capacityText(slot: SlotWindow): string {
  if (!slot.is_open) return 'Unavailable'
  if (slot.remaining === 0) return 'Full'
  if (slot.remaining === 1) return '1 left'
  if (slot.remaining <= 2) return `${slot.remaining} left`
  return `${slot.remaining} remaining`
}

export function SlotWindowPicker({ slots, selectedWindow, onSelectWindow }: Props) {
  const amSlot = slots.find((s) => s.window === 'AM')
  const pmSlot = slots.find((s) => s.window === 'PM')

  const windows: Array<{ key: 'AM' | 'PM'; slot: SlotWindow | undefined }> = [
    { key: 'AM', slot: amSlot },
    { key: 'PM', slot: pmSlot },
  ]

  const anyAvailable = windows.some(
    ({ slot }) => slot && slot.is_open && slot.remaining > 0
  )

  if (!anyAvailable) {
    return (
      <div className="w-full rounded-lg border border-border bg-muted px-4 py-5 text-center text-muted-foreground text-sm">
        No slots available for this date.
      </div>
    )
  }

  return (
    <div className="flex gap-3 w-full">
      {windows.map(({ key, slot }) => {
        const isDisabled = !slot || !slot.is_open || slot.remaining === 0
        const isSelected = selectedWindow === key
        const capacity = slot ? capacityText(slot) : 'Unavailable'
        const isFull = capacity === 'Full' || capacity === 'Unavailable'

        return (
          <button
            key={key}
            disabled={isDisabled}
            onClick={() => !isDisabled && onSelectWindow(key)}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-1 rounded-lg border-2 px-4 py-4 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              // Selected
              isSelected && !isDisabled &&
                'border-primary bg-primary text-primary-foreground',
              // Available (not selected)
              !isSelected && !isDisabled &&
                'border-input bg-white text-foreground cursor-pointer hover:border-primary/60 hover:bg-accent',
              // Disabled
              isDisabled &&
                'border-border bg-muted text-muted-foreground cursor-not-allowed opacity-60',
            )}
            aria-pressed={isSelected}
            aria-label={`${WINDOW_LABELS[key].label}, ${WINDOW_LABELS[key].time}, ${capacity}`}
          >
            <span className="font-semibold text-base leading-none">
              {WINDOW_LABELS[key].time}
            </span>
            <span
              className={cn(
                'text-xs font-medium leading-none',
                isSelected && !isDisabled && 'text-primary-foreground/80',
                !isSelected && !isDisabled && !isFull && 'text-green-600',
                !isSelected && !isDisabled && slot?.remaining === 1 && 'text-amber-600',
                isFull && 'text-muted-foreground',
              )}
            >
              {capacity}
            </span>
          </button>
        )
      })}
    </div>
  )
}
