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
  unavailable_product_ids: string[]
  delivery_slots: DateSlot[]
}

interface Props {
  date: string
  record: AdminDateRecord | null
  products: { id: string; sku: string; name: string; weight_label: string }[]
  onClose: () => void
  onSaved: (updated: AdminDateRecord) => void
  isMobileOverlay?: boolean
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
  excluded_product_ids: Set<string>
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
      excluded_product_ids: new Set(),
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
    excluded_product_ids: new Set(record.unavailable_product_ids ?? []),
  }
}

const DATE_LABEL_OPTIONS: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
}

export function DateSidePanel({ date, record, products, onClose, onSaved, isMobileOverlay }: Props) {
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
            ...(form.is_open ? { unavailable_product_ids: Array.from(form.excluded_product_ids) } : {}),
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
            ...(form.is_open ? { unavailable_product_ids: Array.from(form.excluded_product_ids) } : {}),
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

  const panelStyle: React.CSSProperties = isMobileOverlay
    ? {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 60,
        background: '#FFFFFF',
        borderTop: '3px solid #A16207',
        borderRadius: '16px 16px 0 0',
        maxHeight: '88vh',
        overflowY: 'auto',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }
    : {
        width: 330,
        flexShrink: 0,
        background: '#FFFFFF',
        border: '1px solid #E5DDD5',
        borderRadius: 14,
        overflowY: 'auto',
        maxHeight: 'calc(100vh - 110px)',
        position: 'sticky',
        top: 84,
      }

  return (
    <aside style={panelStyle} aria-label={`Settings for ${dateLabel}`}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, padding: '18px 20px', borderBottom: '1px solid #EFE8E1' }}>
        <h2 className="adm-h2">{dateLabel}</h2>
        <button type="button" onClick={onClose} aria-label="Close" className="adm-btn adm-btn-outline" style={{ padding: '6px 12px', fontSize: 15 }}>
          Close
        </button>
      </div>

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <fieldset style={{ border: 'none', margin: 0, padding: 0 }}>
          <legend className="adm-label" style={{ padding: 0, marginBottom: 8 }}>Can customers pick up on this day?</legend>
          <div className="adm-segmented">
            <button type="button" aria-pressed={form.is_open} className={form.is_open ? 'is-on is-open' : ''} onClick={() => set('is_open', true)}>
              Open
            </button>
            <button type="button" aria-pressed={!form.is_open} className={!form.is_open ? 'is-on is-closed' : ''} onClick={() => set('is_open', false)}>
              Closed
            </button>
          </div>
        </fieldset>

        {form.is_open ? (
          <fieldset style={{ border: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <legend className="adm-label" style={{ padding: 0, marginBottom: 6 }}>Products customers can order for this day</legend>
            {products.length === 0 ? (
              <p className="adm-hint">No products are available right now.</p>
            ) : (
              products.map((p) => {
                const checked = !form.excluded_product_ids.has(p.id)
                return (
                  <label key={p.id} className="adm-checkline">
                    <input
                      type="checkbox"
                      className="adm-check"
                      checked={checked}
                      onChange={() => {
                        const next = new Set(form.excluded_product_ids)
                        if (checked) next.add(p.id)
                        else next.delete(p.id)
                        set('excluded_product_ids', next)
                      }}
                    />
                    {p.name} · {p.weight_label}
                  </label>
                )
              })
            )}
            <p className="adm-hint">Untick a product if it’s sold out for this day only.</p>
          </fieldset>
        ) : (
          <>
            <div className="adm-field">
              <label htmlFor="closure-type" className="adm-label">Why is it closed?</label>
              <select
                id="closure-type"
                className="adm-select"
                value={form.closure_type}
                onChange={(e) => set('closure_type', e.target.value as FormState['closure_type'])}
              >
                <option value="operational">Regular day off</option>
                <option value="holiday">Holiday</option>
                <option value="vacation">Vacation</option>
              </select>
              {form.closure_type !== 'operational' && (
                <p className="adm-hint">This will also be added to your Google Calendar.</p>
              )}
            </div>
            <div className="adm-field">
              <label htmlFor="closure-reason" className="adm-label">Note for yourself (optional)</label>
              <textarea
                id="closure-reason"
                className="adm-textarea"
                rows={3}
                value={form.closure_reason}
                onChange={(e) => set('closure_reason', e.target.value)}
                placeholder="e.g. Christmas break"
              />
            </div>
          </>
        )}

        {error && <p className="adm-error" role="alert">{error}</p>}

        <button type="button" className="adm-btn adm-btn-primary" onClick={handleSave} disabled={saving} style={{ width: '100%' }}>
          {saving ? 'Saving…' : 'Save this day'}
        </button>
      </div>
    </aside>
  )
}
