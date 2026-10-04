'use client'

import { useRef, useState } from 'react'

type Props = {
  initialUrl: string | null
}

const buttonStyle = (variant: 'dark' | 'outline', disabled: boolean): React.CSSProperties => ({
  fontFamily: "'Jost', sans-serif",
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  padding: '9px 14px',
  cursor: disabled ? 'not-allowed' : 'pointer',
  background: variant === 'dark' ? (disabled ? '#D6D3D1' : '#1C1917') : 'transparent',
  color: variant === 'dark' ? '#FAFAF8' : '#B91C1C',
  border: variant === 'dark' ? 'none' : '1px solid #FECACA',
})

export function GcashQrUploader({ initialUrl }: Props) {
  const [url, setUrl] = useState<string | null>(initialUrl)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setBusy(true)
    setError(null)
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/admin/payment-settings/gcash-qr', { method: 'POST', body })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      setUrl(data.gcash_qr_url)
    } catch (err: any) {
      setError(err.message ?? 'Upload failed')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleRemove() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/payment-settings/gcash-qr', { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Remove failed')
      setUrl(null)
      setConfirmRemove(false)
    } catch (err: any) {
      setError(err.message ?? 'Remove failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
      <span
        style={{
          fontFamily: "'Jost', sans-serif",
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#57534E',
        }}
      >
        GCash QR code
      </span>

      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt="Current GCash QR code"
          style={{ width: 160, height: 'auto', border: '1px solid #D6D3D1', background: '#FFFFFF', padding: 8 }}
        />
      ) : (
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#8C7B6B', margin: 0 }}>
          No QR code uploaded. Customers will only see the GCash number.
        </p>
      )}

      <input
        ref={inputRef}
        id="gcash-qr-file"
        type="file"
        accept="image/png,image/jpeg"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          style={buttonStyle('dark', busy)}
        >
          {busy ? 'Working…' : url ? 'Replace QR code' : 'Upload QR code'}
        </button>
        {url && !confirmRemove && (
          <button type="button" disabled={busy} onClick={() => setConfirmRemove(true)} style={buttonStyle('outline', busy)}>
            Remove
          </button>
        )}
        {url && confirmRemove && (
          <>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#57534E' }}>Remove the QR code?</span>
            <button type="button" disabled={busy} onClick={handleRemove} style={buttonStyle('outline', busy)}>
              Yes, remove
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirmRemove(false)}
              style={{ ...buttonStyle('outline', busy), color: '#57534E', border: '1px solid #D6D3D1' }}
            >
              Cancel
            </button>
          </>
        )}
      </div>

      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#8C7B6B', margin: 0 }}>
        JPG or PNG, up to 2MB. Changes apply right away; no need to click Save.
      </p>

      {error && (
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#B91C1C', margin: 0 }}>{error}</p>
      )}
    </div>
  )
}
