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
    <p
      style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: 13,
        fontWeight: 300,
        letterSpacing: '0.02em',
        color: isExpired ? '#DC2626' : 'rgba(250,250,249,0.65)',
        margin: 0,
      }}
    >
      {isExpired ? (
        'Your order has expired.'
      ) : (
        <>
          Your order expires in{' '}
          <span style={{ fontFamily: "'Playfair Display SC', serif", color: '#A16207', fontWeight: 400 }}>
            {formatDuration(remaining)}
          </span>
        </>
      )}
    </p>
  )
}
