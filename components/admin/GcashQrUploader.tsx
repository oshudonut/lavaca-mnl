'use client'

import { useRef, useState } from 'react'

type Props = {
  initialUrl: string | null
}

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
    <div className="adm-field" style={{ gap: 10 }}>
      <span className="adm-label">GCash QR code</span>

      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt="Current GCash QR code"
          style={{ width: 180, height: 'auto', border: '1px solid #E5DDD5', borderRadius: 10, background: '#FFFFFF', padding: 8 }}
        />
      ) : (
        <p className="adm-hint" style={{ fontSize: 15 }}>No QR code yet. Customers only see the GCash number.</p>
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

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" className="adm-btn adm-btn-outline" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? 'Working…' : url ? 'Replace QR code' : 'Upload QR code'}
        </button>
        {url && !confirmRemove && (
          <button type="button" className="adm-btn adm-btn-danger" disabled={busy} onClick={() => setConfirmRemove(true)}>
            Remove
          </button>
        )}
        {url && confirmRemove && (
          <>
            <span>Remove the QR code?</span>
            <button type="button" className="adm-btn adm-btn-danger" disabled={busy} onClick={handleRemove}>
              Yes, remove
            </button>
            <button type="button" className="adm-btn adm-btn-outline" disabled={busy} onClick={() => setConfirmRemove(false)}>
              Keep it
            </button>
          </>
        )}
      </div>

      <p className="adm-hint">JPG or PNG, up to 2MB. It shows on the payment page right away, no need to click Save.</p>
      {error && <p className="adm-error" role="alert">{error}</p>}
    </div>
  )
}
