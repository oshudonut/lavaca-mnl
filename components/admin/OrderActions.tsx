'use client'

import { useState } from 'react'

type Action = 'confirm' | 'reject' | 'cancel' | null

interface Props {
  orderId: string
  status: string
}

const TERMINAL = ['CONFIRMED', 'DELIVERED', 'CANCELLED', 'EXPIRED']

export function OrderActions({ orderId, status }: Props) {
  const [activeAction, setActiveAction] = useState<Action>(null)
  const [paymentReference, setPaymentReference] = useState('')
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const canConfirm = status === 'PAYMENT_REVIEW'
  const canReject  = status === 'PAYMENT_REVIEW'
  const canCancel  = !TERMINAL.includes(status)

  if (!canConfirm && !canReject && !canCancel) {
    return (
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#8C7B6B', margin: 0 }}>
        No actions available for this order status.
      </p>
    )
  }

  const handleSubmit = async () => {
    setError(null)
    setIsSubmitting(true)
    const endpoint = `/api/admin/orders/${orderId}/${activeAction}`
    const body = activeAction === 'confirm'
      ? { payment_reference: paymentReference }
      : { reason }
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return }
      window.location.reload()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const cancel = () => {
    setActiveAction(null)
    setPaymentReference('')
    setReason('')
    setError(null)
  }

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
    resize: 'vertical' as const,
    transition: 'border-color 0.2s',
  })

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: "'Jost', sans-serif",
    fontSize: 9,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color: '#8C7B6B',
    marginBottom: 8,
  }

  return (
    <div>
      {/* Action buttons */}
      {!activeAction && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {canConfirm && (
            <button
              onClick={() => setActiveAction('confirm')}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                background: '#A16207',
                color: '#FFFFFF',
                border: 'none',
                padding: '10px 18px',
                cursor: 'pointer',
                borderRadius: 0,
              }}
            >
              Confirm Payment
            </button>
          )}
          {canReject && (
            <button
              onClick={() => setActiveAction('reject')}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                background: '#FFFFFF',
                color: '#1C1917',
                border: '1px solid #D6D3D1',
                padding: '10px 18px',
                cursor: 'pointer',
                borderRadius: 0,
              }}
            >
              Reject Screenshot
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => setActiveAction('cancel')}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                background: '#FFFFFF',
                color: '#B91C1C',
                border: '1px solid #FCA5A5',
                padding: '10px 18px',
                cursor: 'pointer',
                borderRadius: 0,
              }}
            >
              Cancel Order
            </button>
          )}
        </div>
      )}

      {/* Confirm form */}
      {activeAction === 'confirm' && (
        <div style={{ border: '1px solid #D6D3D1', padding: '18px 20px', background: '#FAFAF9' }}>
          <p style={{
            fontFamily: "'Playfair Display SC', serif",
            fontSize: 13,
            color: '#1C1917',
            margin: '0 0 16px',
          }}>Confirm Payment</p>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Payment reference / GCash reference number</label>
            <input
              value={paymentReference}
              onChange={e => setPaymentReference(e.target.value)}
              onFocus={() => setFocusedField('ref')}
              onBlur={() => setFocusedField(null)}
              placeholder="e.g. GCash ref 1234567890"
              style={inputStyle('ref')}
            />
          </div>
          {error && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#B91C1C', margin: '0 0 12px' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !paymentReference.trim()}
              style={{
                fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase',
                background: isSubmitting || !paymentReference.trim() ? '#D6D3D1' : '#A16207',
                color: isSubmitting || !paymentReference.trim() ? '#8C7B6B' : '#FFFFFF',
                border: 'none', padding: '10px 18px', cursor: isSubmitting ? 'not-allowed' : 'pointer', borderRadius: 0,
              }}
            >
              {isSubmitting ? 'Confirming…' : 'Confirm'}
            </button>
            <button
              onClick={cancel}
              style={{
                fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase',
                background: 'none', color: '#8C7B6B', border: 'none', padding: '10px 14px', cursor: 'pointer', borderRadius: 0,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Reject form */}
      {activeAction === 'reject' && (
        <div style={{ border: '1px solid #D6D3D1', padding: '18px 20px', background: '#FAFAF9' }}>
          <p style={{
            fontFamily: "'Playfair Display SC', serif",
            fontSize: 13,
            color: '#1C1917',
            margin: '0 0 16px',
          }}>Reject Screenshot</p>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Reason (shown to customer)</label>
            <textarea
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              onFocus={() => setFocusedField('rejectReason')}
              onBlur={() => setFocusedField(null)}
              placeholder="e.g. Screenshot is blurry, amount doesn't match, wrong account…"
              style={inputStyle('rejectReason')}
            />
          </div>
          {error && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#B91C1C', margin: '0 0 12px' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !reason.trim()}
              style={{
                fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase',
                background: '#FFFFFF', color: isSubmitting || !reason.trim() ? '#8C7B6B' : '#1C1917',
                border: `1px solid ${isSubmitting || !reason.trim() ? '#D6D3D1' : '#1C1917'}`,
                padding: '10px 18px', cursor: isSubmitting ? 'not-allowed' : 'pointer', borderRadius: 0,
              }}
            >
              {isSubmitting ? 'Rejecting…' : 'Reject'}
            </button>
            <button
              onClick={cancel}
              style={{
                fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase',
                background: 'none', color: '#8C7B6B', border: 'none', padding: '10px 14px', cursor: 'pointer', borderRadius: 0,
              }}
            >
              Back
            </button>
          </div>
        </div>
      )}

      {/* Cancel form */}
      {activeAction === 'cancel' && (
        <div style={{ border: '1px solid #FCA5A5', padding: '18px 20px', background: '#FEF2F2' }}>
          <p style={{
            fontFamily: "'Playfair Display SC', serif",
            fontSize: 13,
            color: '#B91C1C',
            margin: '0 0 16px',
          }}>Cancel Order</p>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Reason (shown to customer)</label>
            <textarea
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              onFocus={() => setFocusedField('cancelReason')}
              onBlur={() => setFocusedField(null)}
              placeholder="e.g. Out of stock, unable to deliver to address…"
              style={inputStyle('cancelReason')}
            />
          </div>
          {error && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#B91C1C', margin: '0 0 12px' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !reason.trim()}
              style={{
                fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase',
                background: isSubmitting || !reason.trim() ? '#D6D3D1' : '#B91C1C',
                color: isSubmitting || !reason.trim() ? '#8C7B6B' : '#FFFFFF',
                border: 'none', padding: '10px 18px', cursor: isSubmitting ? 'not-allowed' : 'pointer', borderRadius: 0,
              }}
            >
              {isSubmitting ? 'Cancelling…' : 'Cancel Order'}
            </button>
            <button
              onClick={cancel}
              style={{
                fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase',
                background: 'none', color: '#8C7B6B', border: 'none', padding: '10px 14px', cursor: 'pointer', borderRadius: 0,
              }}
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
