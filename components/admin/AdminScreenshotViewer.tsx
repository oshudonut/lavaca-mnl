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
    return <div className="adm-skeleton adm-skel-bar" style={{ height: 280, borderRadius: 10 }} />
  }

  if (error) {
    return <p className="adm-hint">{error}</p>
  }

  if (!signedUrl) return null

  const isPdf = signedUrl.includes('.pdf') || signedUrl.includes('application%2Fpdf')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {isPdf ? (
        <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="adm-btn adm-btn-outline" style={{ alignSelf: 'flex-start' }}>
          Open the PDF screenshot
        </a>
      ) : (
        <a href={signedUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={signedUrl}
            alt="Customer's payment screenshot"
            className="adm-shot"
            style={{
              width: '100%',
              objectFit: 'contain',
              background: '#FBF9F6',
              border: '1px solid #E5DDD5',
              borderRadius: 10,
              display: 'block',
            }}
          />
        </a>
      )}
      <p className="adm-hint">Tap to open full size. If it stops opening, refresh the page (the link expires after an hour).</p>
    </div>
  )
}
