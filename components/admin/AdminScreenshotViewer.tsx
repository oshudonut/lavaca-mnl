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
    return <div className="h-48 rounded-lg bg-muted animate-pulse" />
  }
  if (error) {
    return <p className="text-sm text-muted-foreground">{error}</p>
  }
  if (!signedUrl) return null

  const isPdf = signedUrl.includes('.pdf') || signedUrl.includes('application%2Fpdf')

  return (
    <div className="space-y-2">
      {isPdf ? (
        <a
          href={signedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md border border-border bg-muted px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
        >
          Open PDF Screenshot
        </a>
      ) : (
        <a href={signedUrl} target="_blank" rel="noopener noreferrer">
          <img
            src={signedUrl}
            alt="Payment screenshot"
            className="max-w-full rounded-lg border border-border shadow-sm"
            style={{ maxHeight: '480px', objectFit: 'contain' }}
          />
        </a>
      )}
      <p className="text-xs text-muted-foreground">Click to open full size · Link expires in 1 hour</p>
    </div>
  )
}
