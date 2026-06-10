'use client'

import { useState, useEffect } from 'react'

interface Props {
  createdAt: string  // ISO string
  expiryHours?: number
}

function formatDuration(ms: number): string {
  if (ms <= 0) return '0:00:00'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function CountdownTimer({ createdAt, expiryHours = 2 }: Props) {
  const expiresAt = new Date(createdAt).getTime() + expiryHours * 60 * 60 * 1000

  const [remaining, setRemaining] = useState(() => expiresAt - Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(expiresAt - Date.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  const isExpired = remaining <= 0

  return (
    <p className={`text-sm ${isExpired ? 'text-destructive' : 'text-muted-foreground'}`}>
      {isExpired
        ? 'Your order has expired.'
        : `Your order will expire in ${formatDuration(remaining)}.`}
    </p>
  )
}
