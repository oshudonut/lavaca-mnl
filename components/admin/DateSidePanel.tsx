'use client'

import { useState, useEffect } from 'react'

export interface DateSlot {
  id: string
  slot_window: 'AM' | 'PM'
  max_orders: number
  booked_count: number
  is_open: boolean
  window_start: string
  window_end: string
}

export interface AdminDateRecord {
  id: string
  date: string
  is_open: boolean
  max_orders_total: number
  closure_reason: string | null
  closure_type: string | null
  cal_availability_event_id: string | null
  delivery_slots: DateSlot[]
}

interface Props {
  date: string
  record: AdminDateRecord | null
  onClose: () => void
  onSaved: (updated: AdminDateRecord) => void
}

interface FormState {
  is_open: boolean
  max_orders_total: string
  am_enabled: boolean
  am_max: string
  pm_enabled: boolean
  pm_max: string
  closure_reason: string
  closure_type: 'operational' | 'holiday' | 'vacation'
}

function defaultForm(record: AdminDateRecord | null): FormState {
  if (!record) {
    return {
      is_open: true,
      max_orders_total: '10',
      am_enabled: true,
      am_max: '5',
      pm_enabled: true,
      pm_max: '5',
      closure_reason: '',
      closure_type: 'operational',
    }
  }

  const slots = record.delivery_slots ?? []
  const am = slots.find(s => s.slot_window === 'AM')
  const pm = slots.find(s => s.slot_window === 'PM')

  return {
    is_open: record.is_open,
    max_orders_total: String(record.max_orders_total ?? 10),
    am_enabled: am?.is_open ?? true,
    am_max: String(am?.max_orders ?? 5),
    pm_enabled: pm?.is_open ?? true,
    pm_max: String(pm?.max_orders ?? 5),
    closure_reason: record.closure_reason ?? '',
    closure_type: (record.closure_type as FormState['closure_type']) ?? 'operational',
  }
}

const DATE_LABEL_OPTIONS: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
}

export function DateSidePanel({ date, record, onClose, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(() => defaultForm(record))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setForm(defaultForm(record))
    setError(null)
  }, [date, record])

  const dateLabel = new Date(date + 'T00:00:00Z').toLocaleDateString('en-PH', DATE_LABEL_OPTIONS)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(prev => ({ ...prev, [key]: value }))

  async function handleSave() {
    setSaving(true)
    setError(null)

    const amMax = parseInt(form.am_max, 10) || 0
    const pmMax = parseInt(form.pm_max, 10) || 0
    const totalMax = parseInt(form.max_orders_total, 10) || 0

    try {
      let res: Response
      if (!record) {
        res = await fetch('/api/admin/delivery-dates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date,
            is_open: form.is_open,
            max_orders_total: totalMax,
            am_enabled: form.am_enabled,
            am_max: amMax,
            pm_enabled: form.pm_enabled,
            pm_max: pmMax,
          }),
        })
      } else {
        res = await fetch(`/api/admin/delivery-dates/${record.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            is_open: form.is_open,
            max_orders_total: totalMax,
            am_enabled: form.am_enabled,
            am_max: amMax,
            pm_enabled: form.pm_enabled,
            pm_max: pmMax,
            closure_reason: form.closure_reason || null,
            closure_type: form.closure_type,
          }),
        })
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Save failed')
      }

      const updated: AdminDateRecord = await res.json()
      onSaved(updated)
    } catch (err: any) {
      setError(err.message ?? 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const slots = record?.delivery_slots ?? []
  const amSlot = slots.find(s => s.slot_window === 'AM')
  const pmSlot = slots.find(s => s.slot_window === 'PM')

  return (
    <aside className="w-80 shrink-0 rounded-xl border border-border bg-card shadow-sm overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 p-4 border-b border-border">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            {date}
          </p>
          <h2 className="font-semibold text-foreground leading-tight mt-0.5">{dateLabel}</h2>
        </div>
        <button
          onClick={onClose}
          className="mt-0.5 rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Close"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-4 space-y-5">
        {/* Open / Closed toggle */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Status
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => set('is_open', true)}
              className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                form.is_open
                  ? 'border-green-600 bg-green-50 text-green-700'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              Open
            </button>
            <button
              type="button"
              onClick={() => set('is_open', false)}
              className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                !form.is_open
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              Closed
            </button>
          </div>
        </div>

        {form.is_open ? (
          <>
            {/* Max orders */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                Max orders (day total)
              </label>
              <input
                type="number"
                min={0}
                max={999}
                value={form.max_orders_total}
                onChange={e => set('max_orders_total', e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* AM slot */}
            <div className="rounded-lg border border-border p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">AM Slot</span>
                <span className="text-xs text-muted-foreground">9:00 AM – 12:00 PM</span>
              </div>
              {amSlot && (
                <p className="text-xs text-muted-foreground">
                  {amSlot.booked_count} booked of {amSlot.max_orders}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => set('am_enabled', true)}
                  className={`flex-1 rounded border py-1.5 text-xs font-medium transition-colors ${
                    form.am_enabled
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:bg-muted'
                  }`}
                >
                  On
                </button>
                <button
                  type="button"
                  onClick={() => set('am_enabled', false)}
                  className={`flex-1 rounded border py-1.5 text-xs font-medium transition-colors ${
                    !form.am_enabled
                      ? 'border-destructive bg-destructive/10 text-destructive'
                      : 'border-border bg-background text-muted-foreground hover:bg-muted'
                  }`}
                >
                  Off
                </button>
              </div>
              {form.am_enabled && (
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Max orders</label>
                  <input
                    type="number"
                    min={0}
                    max={999}
                    value={form.am_max}
                    onChange={e => set('am_max', e.target.value)}
                    className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              )}
            </div>

            {/* PM slot */}
            <div className="rounded-lg border border-border p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">PM Slot</span>
                <span className="text-xs text-muted-foreground">1:00 PM – 5:00 PM</span>
              </div>
              {pmSlot && (
                <p className="text-xs text-muted-foreground">
                  {pmSlot.booked_count} booked of {pmSlot.max_orders}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => set('pm_enabled', true)}
                  className={`flex-1 rounded border py-1.5 text-xs font-medium transition-colors ${
                    form.pm_enabled
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:bg-muted'
                  }`}
                >
                  On
                </button>
                <button
                  type="button"
                  onClick={() => set('pm_enabled', false)}
                  className={`flex-1 rounded border py-1.5 text-xs font-medium transition-colors ${
                    !form.pm_enabled
                      ? 'border-destructive bg-destructive/10 text-destructive'
                      : 'border-border bg-background text-muted-foreground hover:bg-muted'
                  }`}
                >
                  Off
                </button>
              </div>
              {form.pm_enabled && (
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Max orders</label>
                  <input
                    type="number"
                    min={0}
                    max={999}
                    value={form.pm_max}
                    onChange={e => set('pm_max', e.target.value)}
                    className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Closure type */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                Closure type
              </label>
              <select
                value={form.closure_type}
                onChange={e => set('closure_type', e.target.value as FormState['closure_type'])}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="operational">Operational</option>
                <option value="holiday">Holiday</option>
                <option value="vacation">Vacation</option>
              </select>
              {form.closure_type !== 'operational' && (
                <p className="mt-1 text-xs text-muted-foreground">
                  A calendar event will be created for this closure.
                </p>
              )}
            </div>

            {/* Closure reason */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                Closure reason (optional)
              </label>
              <textarea
                rows={3}
                value={form.closure_reason}
                onChange={e => set('closure_reason', e.target.value)}
                placeholder="e.g. National holiday, staff leave..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </>
        )}

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-60 hover:opacity-90"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </aside>
  )
}
