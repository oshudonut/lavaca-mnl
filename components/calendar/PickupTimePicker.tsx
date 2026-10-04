'use client'

import { useState } from 'react'
import { PICKUP_TIMES, formatPickupTime } from '@/lib/delivery/pickup'

type Props = {
  availableTimes: string[]          // "HH:MM" times still bookable for the date
  selectedTime: string | null
  onSelectTime: (time: string) => void
  hasError?: boolean
}

export function PickupTimePicker({ availableTimes, selectedTime, onSelectTime, hasError }: Props) {
  const [focused, setFocused] = useState(false)

  return (
    <select
      aria-label="Pickup time"
      value={selectedTime ?? ''}
      onChange={(e) => onSelectTime(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: 14,
        color: selectedTime ? '#1C1917' : '#8C7B6B',
        background: '#FFFFFF',
        border: `1px solid ${hasError ? '#DC2626' : focused ? '#A16207' : '#D6D3D1'}`,
        padding: '11px 14px',
        width: '100%',
        outline: 'none',
        borderRadius: 0,
        transition: 'border-color 0.2s',
        cursor: 'pointer',
      }}
    >
      <option value="" disabled>
        Choose a pickup time
      </option>
      {PICKUP_TIMES.map((t) => {
        const available = availableTimes.includes(t)
        return (
          <option key={t} value={t} disabled={!available}>
            {formatPickupTime(t)}{available ? '' : ' — unavailable'}
          </option>
        )
      })}
    </select>
  )
}
