'use client'

import { useState, useEffect } from 'react'
import { GcashQrUploader } from '@/components/admin/GcashQrUploader'

interface PaymentSettingsRow {
  id: string
  gcash_number: string
  gcash_account_name: string
  gcash_qr_url: string | null
  bpi_account: string
  bpi_name: string
  bdo_account: string
  bdo_name: string
}

interface FormState {
  gcash_number: string
  gcash_account_name: string
  bpi_account: string
  bpi_name: string
  bdo_account: string
  bdo_name: string
}

function defaultForm(s: PaymentSettingsRow | null): FormState {
  return {
    gcash_number: s?.gcash_number ?? '',
    gcash_account_name: s?.gcash_account_name ?? '',
    bpi_account: s?.bpi_account ?? '',
    bpi_name: s?.bpi_name ?? '',
    bdo_account: s?.bdo_account ?? '',
    bdo_name: s?.bdo_name ?? '',
  }
}

export function PaymentSettingsEditor() {
  const [form, setForm] = useState<FormState>(defaultForm(null))
  const [loading, setLoading] = useState(true)
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch('/api/admin/payment-settings')
      .then(r => r.json())
      .then((data: PaymentSettingsRow | null) => {
        setForm(defaultForm(data))
        setQrUrl(data?.gcash_qr_url ?? null)
      })
      .catch(err => console.error('[PaymentSettingsEditor] fetch error:', err))
      .finally(() => setLoading(false))
  }, [])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setSuccess(false)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/admin/payment-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Save failed')
      }
      const updated: PaymentSettingsRow = await res.json()
      setForm(defaultForm(updated))
      setSuccess(true)
    } catch (err: any) {
      setError(err.message ?? 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="adm-skeleton" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[1, 2, 3].map((i) => <div key={i} className="adm-skel-bar" style={{ height: 44 }} />)}
      </div>
    )
  }

  const field = (key: keyof FormState, label: string, placeholder?: string) => (
    <div className="adm-field">
      <label htmlFor={key} className="adm-label">{label}</label>
      <input
        id={key}
        className="adm-input"
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 className="adm-h3">GCash</h3>
        <div className="adm-form-grid">
          {field('gcash_number', 'GCash number', 'e.g. 0917 123 4567')}
          {field('gcash_account_name', 'Account name', 'e.g. Lavaca MNL')}
        </div>
        <GcashQrUploader initialUrl={qrUrl} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 className="adm-h3">BPI</h3>
        <div className="adm-form-grid">
          {field('bpi_account', 'Account number')}
          {field('bpi_name', 'Account name')}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 className="adm-h3">BDO</h3>
        <div className="adm-form-grid">
          {field('bdo_account', 'Account number')}
          {field('bdo_name', 'Account name')}
        </div>
      </div>

      {error && <p className="adm-error" role="alert">{error}</p>}
      {success && <p className="adm-success" role="status">Payment details saved. Customers will see them on the payment page.</p>}

      <button type="button" className="adm-btn adm-btn-primary" onClick={handleSave} disabled={saving} style={{ alignSelf: 'flex-start' }}>
        {saving ? 'Saving…' : 'Save payment details'}
      </button>
    </div>
  )
}
