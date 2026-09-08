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
  const [focusedField, setFocusedField] = useState<string | null>(null)

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

  const slots = record?.delivery_slots ?? []
  const amSlot = slots.find(s => s.slot_window === 'AM')
  const pmSlot = slots.find(s => s.slot_window === 'PM')

  const inputStyle = (field: string): React.CSSProperties => ({
    width: '100%',
    fontFamily: "'Inter', sans-serif",
    fontSize: 13,
    color: '#1C1917',
    background: '#FAFAF9',
    border: `1px solid ${focusedField === field ? '#A16207' : '#D6D3D1'}`,
    padding: '10px 12px',
    outline: 'none',
    borderRadius: 0,
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  })

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: "'Jost', sans-serif",
    fontSize: 9,
    fontWeight: 400,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color: '#8C7B6B',
    marginBottom: 8,
  }

  const toggleBtn = (active: boolean, activeStyle: { border: string; bg: string; color: string }): React.CSSProperties => ({
    flex: 1,
    fontFamily: "'Inter', sans-serif",
    fontSize: 12,
    fontWeight: active ? 600 : 400,
    background: active ? activeStyle.bg : '#FFFFFF',
    color: active ? activeStyle.color : '#8C7B6B',
    border: `1px solid ${active ? activeStyle.border : '#D6D3D1'}`,
    padding: '9px 0',
    cursor: 'pointer',
    borderRadius: 0,
    transition: 'all 0.15s',
  })

  const panelStyle: React.CSSProperties = isMobileOverlay
    ? {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: '#FFFFFF',
        borderTop: '2px solid #A16207',
        maxHeight: '85vh',
        overflowY: 'auto',
      }
    : {
        width: 304,
        flexShrink: 0,
        background: '#FFFFFF',
        border: '1px solid #D6D3D1',
        overflowY: 'auto',
        maxHeight: 'calc(100vh - 120px)',
        position: 'sticky',
        top: 80,
      }

  return (
    <aside style={panelStyle}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 8,
        padding: '16px 20px',
        borderBottom: '1px solid #D6D3D1',
      }}>
        <div>
          <p style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: 9,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#A16207',
            margin: '0 0 4px',
          }}>{date}</p>
          <h2 style={{
            fontFamily: "'Playfair Display SC', serif",
            fontSize: 14,
            fontWeight: 400,
            color: '#1C1917',
            margin: 0,
            letterSpacing: '0.01em',
          }}>{dateLabel}</h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            color: '#8C7B6B',
            flexShrink: 0,
            marginTop: 2,
          }}
        >
          <svg width={16} height={16} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Open / Closed toggle */}
        <div>
          <label style={labelStyle}>Status</label>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              type="button"
              onClick={() => set('is_open', true)}
              style={toggleBtn(form.is_open, { border: '#16A34A', bg: '#F0FDF4', color: '#15803D' })}
            >
              Open
            </button>
            <button
              type="button"
              onClick={() => set('is_open', false)}
              style={toggleBtn(!form.is_open, { border: '#DC2626', bg: '#FEF2F2', color: '#B91C1C' })}
            >
              Closed
            </button>
          </div>
        </div>

        {form.is_open ? (
          <>
            {/* Max orders */}
            <div>
              <label style={labelStyle}>Max orders (day total)</label>
              <input
                type="number"
                min={0}
                max={999}
                value={form.max_orders_total}
                onChange={e => set('max_orders_total', e.target.value)}
                onFocus={() => setFocusedField('maxTotal')}
                onBlur={() => setFocusedField(null)}
                style={inputStyle('maxTotal')}
              />
            </div>

            {/* AM slot */}
            <SlotSection
              label="AM Slot"
              time="9:00 AM – 12:00 PM"
              slot={amSlot}
              enabled={form.am_enabled}
              maxVal={form.am_max}
              enabledKey="am_enabled"
              maxKey="am_max"
              focusKey="am_max_input"
              focusedField={focusedField}
              setFocusedField={setFocusedField}
              onToggle={(v) => set('am_enabled', v)}
              onMaxChange={(v) => set('am_max', v)}
            />

            {/* PM slot */}
            <SlotSection
              label="PM Slot"
              time="1:00 PM – 5:00 PM"
              slot={pmSlot}
              enabled={form.pm_enabled}
              maxVal={form.pm_max}
              enabledKey="pm_enabled"
              maxKey="pm_max"
              focusKey="pm_max_input"
              focusedField={focusedField}
              setFocusedField={setFocusedField}
              onToggle={(v) => set('pm_enabled', v)}
              onMaxChange={(v) => set('pm_max', v)}
            />

            {/* Products available */}
            <div>
              <label style={labelStyle}>Products available</label>
              {products.length === 0 ? (
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#8C7B6B', margin: 0 }}>
                  No available products to list.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {products.map((p) => {
                    const checked = !form.excluded_product_ids.has(p.id)
                    return (
                      <label
                        key={p.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontFamily: "'Inter', sans-serif",
                          fontSize: 13,
                          color: '#1C1917',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const next = new Set(form.excluded_product_ids)
                            if (checked) next.add(p.id)
                            else next.delete(p.id)
                            set('excluded_product_ids', next)
                          }}
                          style={{ accentColor: '#A16207' }}
                        />
                        {p.name} — {p.weight_label}
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Closure type */}
            <div>
              <label style={labelStyle}>Closure type</label>
              <select
                value={form.closure_type}
                onChange={e => set('closure_type', e.target.value as FormState['closure_type'])}
                onFocus={() => setFocusedField('closureType')}
                onBlur={() => setFocusedField(null)}
                style={{
                  width: '100%',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 13,
                  color: '#1C1917',
                  background: '#FAFAF9',
                  border: `1px solid ${focusedField === 'closureType' ? '#A16207' : '#D6D3D1'}`,
                  padding: '10px 12px',
                  outline: 'none',
                  borderRadius: 0,
                  cursor: 'pointer',
                }}
              >
                <option value="operational">Operational</option>
                <option value="holiday">Holiday</option>
                <option value="vacation">Vacation</option>
              </select>
              {form.closure_type !== 'operational' && (
                <p style={{ marginTop: 6, fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#8C7B6B' }}>
                  A calendar event will be created for this closure.
                </p>
              )}
            </div>

            {/* Closure reason */}
            <div>
              <label style={labelStyle}>Closure reason (optional)</label>
              <textarea
                rows={3}
                value={form.closure_reason}
                onChange={e => set('closure_reason', e.target.value)}
                onFocus={() => setFocusedField('reason')}
                onBlur={() => setFocusedField(null)}
                placeholder="e.g. National holiday, staff leave..."
                style={{
                  ...inputStyle('reason'),
                  resize: 'none',
                  lineHeight: 1.5,
                }}
              />
            </div>
          </>
        )}

        {error && (
          <p style={{
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            padding: '10px 12px',
            fontFamily: "'Inter', sans-serif",
            fontSize: 12,
            color: '#B91C1C',
            margin: 0,
          }}>{error}</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%',
            fontFamily: "'Inter', sans-serif",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            background: saving ? '#D6D3D1' : '#A16207',
            color: saving ? '#8C7B6B' : '#FFFFFF',
            border: 'none',
            padding: '14px 0',
            cursor: saving ? 'not-allowed' : 'pointer',
            borderRadius: 0,
            transition: 'background 0.2s',
          }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </aside>
  )
}

// ---------------------------------------------------------------------------
// SlotSection sub-component
// ---------------------------------------------------------------------------

interface SlotSectionProps {
  label: string
  time: string
  slot: DateSlot | undefined
  enabled: boolean
  maxVal: string
  enabledKey: string
  maxKey: string
  focusKey: string
  focusedField: string | null
  setFocusedField: (f: string | null) => void
  onToggle: (v: boolean) => void
  onMaxChange: (v: string) => void
}

function SlotSection({
  label, time, slot, enabled, maxVal,
  focusKey, focusedField, setFocusedField, onToggle, onMaxChange,
}: SlotSectionProps) {
  return (
    <div style={{
      border: '1px solid #D6D3D1',
      padding: '14px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 13,
          fontWeight: 600,
          color: '#1C1917',
        }}>{label}</span>
        <span style={{
          fontFamily: "'Jost', sans-serif",
          fontSize: 9,
          letterSpacing: '0.12em',
          color: '#8C7B6B',
        }}>{time}</span>
      </div>

      {slot && (
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 11,
          color: '#57534E',
          margin: 0,
        }}>
          {slot.booked_count} booked of {slot.max_orders}
        </p>
      )}

      <div style={{ display: 'flex', gap: 4 }}>
        <button
          type="button"
          onClick={() => onToggle(true)}
          style={{
            flex: 1,
            fontFamily: "'Inter', sans-serif",
            fontSize: 11,
            fontWeight: enabled ? 600 : 400,
            background: enabled ? 'rgba(161,98,7,0.08)' : '#FFFFFF',
            color: enabled ? '#A16207' : '#8C7B6B',
            border: `1px solid ${enabled ? '#A16207' : '#D6D3D1'}`,
            padding: '7px 0',
            cursor: 'pointer',
            borderRadius: 0,
            transition: 'all 0.15s',
          }}
        >
          On
        </button>
        <button
          type="button"
          onClick={() => onToggle(false)}
          style={{
            flex: 1,
            fontFamily: "'Inter', sans-serif",
            fontSize: 11,
            fontWeight: !enabled ? 600 : 400,
            background: !enabled ? '#FEF2F2' : '#FFFFFF',
            color: !enabled ? '#B91C1C' : '#8C7B6B',
            border: `1px solid ${!enabled ? '#DC2626' : '#D6D3D1'}`,
            padding: '7px 0',
            cursor: 'pointer',
            borderRadius: 0,
            transition: 'all 0.15s',
          }}
        >
          Off
        </button>
      </div>

      {enabled && (
        <div>
          <label style={{
            display: 'block',
            fontFamily: "'Jost', sans-serif",
            fontSize: 9,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#8C7B6B',
            marginBottom: 6,
          }}>
            Max orders
          </label>
          <input
            type="number"
            min={0}
            max={999}
            value={maxVal}
            onChange={e => onMaxChange(e.target.value)}
            onFocus={() => setFocusedField(focusKey)}
            onBlur={() => setFocusedField(null)}
            style={{
              width: '100%',
              fontFamily: "'Inter', sans-serif",
              fontSize: 13,
              color: '#1C1917',
              background: '#FAFAF9',
              border: `1px solid ${focusedField === focusKey ? '#A16207' : '#D6D3D1'}`,
              padding: '8px 10px',
              outline: 'none',
              borderRadius: 0,
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
          />
        </div>
      )}
    </div>
  )
}
