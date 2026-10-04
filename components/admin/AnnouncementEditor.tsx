'use client'

import { useState, useEffect } from 'react'

interface Announcement {
  id: string
  is_active: boolean
  message: string
  closed_from: string | null
  closed_until: string | null
}

interface FormState {
  is_active: boolean
  message: string
  closed_from: string
  closed_until: string
}

function defaultForm(a: Announcement | null): FormState {
  return {
    is_active: a?.is_active ?? false,
    message: a?.message ?? '',
    closed_from: a?.closed_from ?? '',
    closed_until: a?.closed_until ?? '',
  }
}

export function AnnouncementEditor() {
  const [form, setForm] = useState<FormState>(defaultForm(null))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/announcements')
      .then(r => r.json())
      .then((data: Announcement | null) => setForm(defaultForm(data)))
      .catch(err => console.error('[AnnouncementEditor] fetch error:', err))
      .finally(() => setLoading(false))
  }, [])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setSuccess(false)
  }

  async function handleSave() {
    setError(null)
    setSuccess(false)
    if (form.is_active && !form.message.trim()) {
      setError('Please type a banner message before turning the banner on.')
      return
    }
    setSaving(true)

    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_active: form.is_active,
          message: form.message,
          closed_from: form.closed_from || null,
          closed_until: form.closed_until || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Save failed')
      }
      const updated: Announcement = await res.json()
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Active toggle */}
      <div>
        <label style={labelStyle}>Announcement status</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => set('is_active', false)}
            style={{
              flex: 1,
              border: !form.is_active ? '1px solid #D6D3D1' : '1px solid #E7E5E4',
              background: !form.is_active ? '#1C1917' : '#FAFAF8',
              color: !form.is_active ? '#FAFAF8' : '#78716C',
              padding: '10px 0',
              fontFamily: "'Jost', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Inactive
          </button>
          <button
            type="button"
            onClick={() => set('is_active', true)}
            style={{
              flex: 1,
              border: form.is_active ? '1px solid #A16207' : '1px solid #E7E5E4',
              background: form.is_active ? '#A16207' : '#FAFAF8',
              color: form.is_active ? '#FFFFFF' : '#78716C',
              padding: '10px 0',
              fontFamily: "'Jost', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Active
          </button>
        </div>
        {form.is_active && (
          <p style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: 11,
            color: '#92400E',
            margin: '8px 0 0',
            lineHeight: 1.5,
          }}>
            When active, the order page shows the closure banner instead of the availability calendar.
          </p>
        )}
      </div>

      {/* Message */}
      <div>
        <label style={labelStyle}>Banner message</label>
        <textarea
          rows={3}
          value={form.message}
          onChange={e => set('message', e.target.value)}
          onFocus={() => setFocusedField('message')}
          onBlur={() => setFocusedField(null)}
          placeholder="e.g. We are currently taking a short break from orders."
          style={{ ...inputStyle('message'), resize: 'none' }}
        />
        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, color: '#A8A29E', margin: '6px 0 0', lineHeight: 1.5 }}>
          This is the message customers will see on the order page.
        </p>
      </div>

      {/* Dates */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Closed from</label>
          <input
            type="date"
            value={form.closed_from}
            onChange={e => set('closed_from', e.target.value)}
            onFocus={() => setFocusedField('closed_from')}
            onBlur={() => setFocusedField(null)}
            style={inputStyle('closed_from')}
          />
        </div>
        <div>
          <label style={labelStyle}>
            Resumes on{' '}
            <span style={{ color: '#A8A29E', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>optional</span>
          </label>
          <input
            type="date"
            value={form.closed_until}
            onChange={e => set('closed_until', e.target.value)}
            onFocus={() => setFocusedField('closed_until')}
            onBlur={() => setFocusedField(null)}
            style={inputStyle('closed_until')}
          />
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, color: '#A8A29E', margin: '6px 0 0', lineHeight: 1.5 }}>
            Leave blank to show &ldquo;We will announce our return on Facebook.&rdquo;
          </p>
        </div>
      </div>

      {/* Preview */}
      {form.is_active && (
        <div style={{
          border: '1px solid #FDE68A',
          background: '#FFFBEB',
          padding: '14px 16px',
        }}>
          <p style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#92400E',
            margin: '0 0 8px',
          }}>
            Banner preview
          </p>
          {form.message && (
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: '#78350F', margin: 0 }}>
              {form.message}
            </p>
          )}
        </div>
      )}

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
          Announcement saved.
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
        {saving ? 'Saving...' : 'Save announcement'}
      </button>
    </div>
  )
}
