'use client'

import { useState, useEffect } from 'react'

interface Props {
  orderId: string
}

export function AdminScreenshotViewer({ orderId }: Props) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/admin/orders/${orderId}/payment-screenshot`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to load screenshot')
        setSignedUrl(data.signedUrl)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [orderId])

  if (loading) {
    return (
      <div style={{
        height: 160,
        background: '#F5F4F2',
        animation: 'pulse 1.5s ease-in-out infinite',
      }} />
    )
  }

  if (error) {
    return (
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#8C7B6B', margin: 0 }}>
        {error}
      </p>
    )
  }

  if (!signedUrl) return null

  const isPdf = signedUrl.includes('.pdf') || signedUrl.includes('application%2Fpdf')

  return (
    <div>
      {isPdf ? (
        <a
          href={signedUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            fontFamily: "'Inter', sans-serif",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#A16207',
            background: '#FAFAF9',
            border: '1px solid #D6D3D1',
            padding: '10px 16px',
            textDecoration: 'none',
            transition: 'border-color 0.2s',
          }}
        >
          Open PDF Screenshot
        </a>
      ) : (
        <a href={signedUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
          <img
            src={signedUrl}
            alt="Payment screenshot"
            style={{
              maxWidth: '100%',
              maxHeight: 480,
              objectFit: 'contain',
              border: '1px solid #D6D3D1',
              display: 'block',
            }}
          />
        </a>
      )}
      <p style={{
        fontFamily: "'Jost', sans-serif",
        fontSize: 9,
        letterSpacing: '0.16em',
        color: '#8C7B6B',
        marginTop: 10,
        marginBottom: 0,
      }}>
        Click to open full size · Link expires in 1 hour
      </p>
    </div>
  )
}
