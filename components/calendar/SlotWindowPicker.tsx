'use client'

import { useState } from 'react'
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
  const [hoveredKey, setHoveredKey] = useState<'AM' | 'PM' | null>(null)

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
      <div
        style={{
          width: '100%',
          background: '#FFFFFF',
          border: '1px solid #D6D3D1',
          padding: 20,
          textAlign: 'center',
          fontFamily: "'Inter', sans-serif",
          fontSize: 13,
          color: '#57534E',
        }}
      >
        No slots available for this date.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 12, width: '100%' }}>
      {windows.map(({ key, slot }) => {
        const isDisabled = !slot || !slot.is_open || slot.remaining === 0
        const isSelected = selectedWindow === key
        const capacity = slot ? capacityText(slot) : 'Unavailable'
        const isFull = capacity === 'Full' || capacity === 'Unavailable'
        const isHovered = hoveredKey === key

        const buttonStyle: React.CSSProperties = {
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          padding: '20px 12px',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s',
          borderRadius: 0,
        }

        if (isSelected && !isDisabled) {
          Object.assign(buttonStyle, {
            background: '#A16207',
            color: '#FFFFFF',
            outline: '2px solid #A16207',
          })
        } else if (!isDisabled) {
          Object.assign(buttonStyle, {
            background: '#FFFFFF',
            border: `1px solid ${isHovered ? '#A16207' : '#D6D3D1'}`,
            color: '#1C1917',
          })
        } else {
          Object.assign(buttonStyle, {
            background: '#F5F4F2',
            color: '#A8A29E',
            cursor: 'not-allowed',
            opacity: 0.6,
            border: '1px solid #F5F4F2',
          })
        }

        let capacityColor = '#A8A29E'
        if (isSelected && !isDisabled) {
          capacityColor = 'rgba(255,255,255,0.8)'
        } else if (!isDisabled && !isFull) {
          capacityColor = slot && slot.remaining <= 2 ? '#92400E' : '#57534E'
        }

        return (
          <button
            key={key}
            type="button"
            disabled={isDisabled}
            onClick={() => !isDisabled && onSelectWindow(key)}
            onMouseEnter={() => setHoveredKey(key)}
            onMouseLeave={() => setHoveredKey(null)}
            style={buttonStyle}
            aria-pressed={isSelected}
            aria-label={`${WINDOW_LABELS[key].label}, ${WINDOW_LABELS[key].time}, ${capacity}`}
          >
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 16,
                fontWeight: 500,
                lineHeight: 1,
              }}
            >
              {WINDOW_LABELS[key].time}
            </span>
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 11,
                lineHeight: 1,
                color: capacityColor,
              }}
            >
              {capacity}
            </span>
          </button>
        )
      })}
    </div>
  )
}
