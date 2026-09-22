'use client'

import { useState, useEffect } from 'react'

interface PaymentSettingsRow {
  id: string
  gcash_number: string
  gcash_account_name: string
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
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/payment-settings')
      .then(r => r.json())
      .then((data: PaymentSettingsRow | null) => setForm(defaultForm(data)))
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

  const inputStyle = (field: string): React.CSSProperties => ({
    width: '100%',
    border: focusedField === field ? '1px solid #A16207' : '1px solid #D6D3D1',
    background: '#FAFAF8',
    padding: '9px 12px',
    fontFamily: "'Inter', sans-serif",
    fontSize: 13,
    color: '#1C1917',
    outline: 'none',
    boxSizing: 'border-box',
    boxShadow: focusedField === field ? '0 0 0 2px #FEF3C7' : 'none',
  })

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: "'Jost', sans-serif",
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: '#78716C',
    marginBottom: 8,
  }

  const groupLabel: React.CSSProperties = {
    fontFamily: "'Jost', sans-serif",
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: '#A8A29E',
    margin: '0 0 6px',
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            height: 40,
            background: '#F5F5F4',
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* GCash */}
      <div>
        <p style={groupLabel}>GCash</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label htmlFor="gcash_number" style={labelStyle}>Number</label>
            <input
              id="gcash_number"
              value={form.gcash_number}
              onChange={e => set('gcash_number', e.target.value)}
              onFocus={() => setFocusedField('gcash_number')}
              onBlur={() => setFocusedField(null)}
              placeholder="e.g. 0917 123 4567"
              style={inputStyle('gcash_number')}
            />
          </div>
          <div>
            <label htmlFor="gcash_account_name" style={labelStyle}>Account name</label>
            <input
              id="gcash_account_name"
              value={form.gcash_account_name}
              onChange={e => set('gcash_account_name', e.target.value)}
              onFocus={() => setFocusedField('gcash_account_name')}
              onBlur={() => setFocusedField(null)}
              placeholder="e.g. Lavaca MNL"
              style={inputStyle('gcash_account_name')}
            />
          </div>
        </div>
      </div>

      {/* BPI */}
      <div>
        <p style={groupLabel}>BPI</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label htmlFor="bpi_account" style={labelStyle}>Account number</label>
            <input
              id="bpi_account"
              value={form.bpi_account}
              onChange={e => set('bpi_account', e.target.value)}
              onFocus={() => setFocusedField('bpi_account')}
              onBlur={() => setFocusedField(null)}
              style={inputStyle('bpi_account')}
            />
          </div>
          <div>
            <label htmlFor="bpi_name" style={labelStyle}>Account name</label>
            <input
              id="bpi_name"
              value={form.bpi_name}
              onChange={e => set('bpi_name', e.target.value)}
              onFocus={() => setFocusedField('bpi_name')}
              onBlur={() => setFocusedField(null)}
              style={inputStyle('bpi_name')}
            />
          </div>
        </div>
      </div>

      {/* BDO */}
      <div>
        <p style={groupLabel}>BDO</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label htmlFor="bdo_account" style={labelStyle}>Account number</label>
            <input
              id="bdo_account"
              value={form.bdo_account}
              onChange={e => set('bdo_account', e.target.value)}
              onFocus={() => setFocusedField('bdo_account')}
              onBlur={() => setFocusedField(null)}
              style={inputStyle('bdo_account')}
            />
          </div>
          <div>
            <label htmlFor="bdo_name" style={labelStyle}>Account name</label>
            <input
              id="bdo_name"
              value={form.bdo_name}
              onChange={e => set('bdo_name', e.target.value)}
              onFocus={() => setFocusedField('bdo_name')}
              onBlur={() => setFocusedField(null)}
              style={inputStyle('bdo_name')}
            />
          </div>
        </div>
      </div>

      {error && (
        <p style={{
          border: '1px solid #FECACA',
          background: '#FEF2F2',
          padding: '10px 14px',
          fontFamily: "'Inter', sans-serif",
          fontSize: 13,
          color: '#B91C1C',
          margin: 0,
        }}>
          {error}
        </p>
      )}

      {success && (
        <p style={{
          border: '1px solid #BBF7D0',
          background: '#F0FDF4',
          padding: '10px 14px',
          fontFamily: "'Inter', sans-serif",
          fontSize: 13,
          color: '#15803D',
          margin: 0,
        }}>
          Payment details saved.
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: '100%',
          background: saving ? '#D6D3D1' : '#1C1917',
          color: '#FAFAF8',
          border: 'none',
          padding: '12px 0',
          fontFamily: "'Jost', sans-serif",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          cursor: saving ? 'not-allowed' : 'pointer',
        }}
      >
        {saving ? 'Saving...' : 'Save payment details'}
      </button>
    </div>
  )
}
