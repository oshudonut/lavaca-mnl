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


  if (loading) {
    return (
      <div className="adm-skeleton" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[1, 2, 3].map((i) => <div key={i} className="adm-skel-bar" style={{ height: 44 }} />)}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* On / off */}
      <fieldset style={{ border: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <legend className="adm-label" style={{ padding: 0, marginBottom: 8 }}>Are you taking orders?</legend>
        <div className="adm-segmented">
          <button
            type="button"
            aria-pressed={!form.is_active}
            className={!form.is_active ? 'is-on is-open' : ''}
            onClick={() => set('is_active', false)}
          >
            Yes, open for orders
          </button>
          <button
            type="button"
            aria-pressed={form.is_active}
            className={form.is_active ? 'is-on is-closed' : ''}
            onClick={() => set('is_active', true)}
          >
            No, show the closed banner
          </button>
        </div>
        {form.is_active && (
          <p className="adm-hint" style={{ color: '#7A4A00' }}>
            Customers will see only your message on the order page and can’t place orders until you switch this back.
          </p>
        )}
      </fieldset>

      <div className="adm-field">
        <label htmlFor="banner-message" className="adm-label">Banner message</label>
        <textarea
          id="banner-message"
          className="adm-textarea"
          rows={3}
          value={form.message}
          onChange={(e) => set('message', e.target.value)}
          placeholder="e.g. We are taking a short break and will reopen on December 2."
        />
        <p className="adm-hint">This is the only text customers see, so include anything they need, like when you’ll reopen.</p>
      </div>

      <div className="adm-form-grid">
        <div className="adm-field">
          <label htmlFor="closed-from" className="adm-label">Closed from</label>
          <input id="closed-from" type="date" className="adm-input" value={form.closed_from} onChange={(e) => set('closed_from', e.target.value)} />
        </div>
        <div className="adm-field">
          <label htmlFor="closed-until" className="adm-label">Reopens on (optional)</label>
          <input id="closed-until" type="date" className="adm-input" value={form.closed_until} onChange={(e) => set('closed_until', e.target.value)} />
          <p className="adm-hint">For your records only. Customers don’t see these dates.</p>
        </div>
      </div>

      {form.is_active && form.message.trim() && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="adm-label">What customers will see</span>
          <div style={{ background: '#1C1917', borderLeft: '3px solid #A16207', padding: '18px 20px', borderRadius: 6 }}>
            <p style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: 17, color: '#FAFAF9', whiteSpace: 'pre-line' }}>
              {form.message}
            </p>
          </div>
        </div>
      )}

      {error && <p className="adm-error" role="alert">{error}</p>}
      {success && <p className="adm-success" role="status">Saved.</p>}

      <button type="button" className="adm-btn adm-btn-primary" onClick={handleSave} disabled={saving} style={{ alignSelf: 'flex-start' }}>
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  )
}
