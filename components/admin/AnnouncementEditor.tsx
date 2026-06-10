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
    setSaving(true)
    setError(null)
    setSuccess(false)

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
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-10 rounded-lg bg-muted/40 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Active toggle */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Announcement status
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => set('is_active', false)}
            className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
              !form.is_active
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background text-muted-foreground hover:bg-muted'
            }`}
          >
            Inactive
          </button>
          <button
            type="button"
            onClick={() => set('is_active', true)}
            className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
              form.is_active
                ? 'border-amber-500 bg-amber-50 text-amber-700'
                : 'border-border bg-background text-muted-foreground hover:bg-muted'
            }`}
          >
            Active
          </button>
        </div>
        {form.is_active && (
          <p className="mt-2 text-xs text-amber-600">
            When active, the order page shows the closure banner instead of the availability calendar.
          </p>
        )}
      </div>

      {/* Message */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Banner message
        </label>
        <textarea
          rows={3}
          value={form.message}
          onChange={e => set('message', e.target.value)}
          placeholder="e.g. We are currently taking a short break from deliveries."
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Shown at the top of the banner. Leave blank to show the resume/return message only.
        </p>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Closed from
          </label>
          <input
            type="date"
            value={form.closed_from}
            onChange={e => set('closed_from', e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Resumes on <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <input
            type="date"
            value={form.closed_until}
            onChange={e => set('closed_until', e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Leave blank to show "We will announce our return on Facebook."
          </p>
        </div>
      </div>

      {/* Preview */}
      {form.is_active && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-2">Banner preview</p>
          {form.message && (
            <p className="text-amber-900 font-semibold mb-1">{form.message}</p>
          )}
          <p className="text-amber-800">
            {form.closed_until
              ? `Lavaca MNL will resume accepting deliveries on ${new Date(form.closed_until + 'T00:00:00').toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}.`
              : 'We will announce our return on our Facebook page.'}
          </p>
          <p className="text-amber-700 text-xs mt-1">For inquiries, message us on Messenger.</p>
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}
      {success && (
        <p className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
          Announcement saved.
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-60 hover:opacity-90"
      >
        {saving ? 'Saving...' : 'Save announcement'}
      </button>
    </div>
  )
}
