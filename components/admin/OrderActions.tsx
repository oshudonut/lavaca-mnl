'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Action = 'confirm' | 'reject' | 'cancel' | null

interface Props {
  orderId: string
  status: string
}

const TERMINAL      = ['CONFIRMED', 'DELIVERED', 'CANCELLED', 'EXPIRED']
const NO_CANCEL     = ['DELIVERED', 'CANCELLED', 'EXPIRED']

export function OrderActions({ orderId, status }: Props) {
  const router = useRouter()
  const [activeAction, setActiveAction] = useState<Action>(null)
  const [paymentReference, setPaymentReference] = useState('')
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleDelete() {
    setIsDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/delete`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { setDeleteError(data.error ?? 'Delete failed'); setIsDeleting(false); return }
      router.push('/admin/orders')
      router.refresh()
    } catch {
      setDeleteError('Network error. Please try again.')
      setIsDeleting(false)
    }
  }

  const canConfirm = status === 'PAYMENT_REVIEW'
  const canReject  = status === 'PAYMENT_REVIEW'
  const canCancel  = !NO_CANCEL.includes(status)

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
      const msgs: Record<string, string> = {
        confirm: 'Payment confirmed — customer notified.',
        reject:  'Screenshot rejected — customer notified to re-upload.',
        cancel:  'Order cancelled — customer notified.',
      }
      setSuccessMsg(msgs[activeAction ?? ''] ?? 'Done.')
      setActiveAction(null)
      router.refresh()
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
      {successMsg && (
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 12,
          color: '#065F46',
          background: '#D1FAE5',
          border: '1px solid #6EE7B7',
          padding: '10px 14px',
          margin: '0 0 16px',
        }}>
          {successMsg}
        </p>
      )}

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

      {/* Delete order — always visible */}
      {!activeAction && (
        <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid #F5F4F2' }}>
          {!confirmingDelete ? (
            <button
              onClick={() => setConfirmingDelete(true)}
              style={{
                fontFamily: "'Jost', sans-serif",
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                background: 'transparent',
                color: '#B91C1C',
                border: '1px solid #FECACA',
                padding: '7px 14px',
                cursor: 'pointer',
              }}
            >
              Delete Order
            </button>
          ) : (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '14px 16px' }}>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#B91C1C', margin: '0 0 12px' }}>
                Permanently delete this order? This cannot be undone.
              </p>
              {deleteError && (
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#B91C1C', margin: '0 0 10px' }}>
                  {deleteError}
                </p>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  style={{
                    fontFamily: "'Jost', sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: '0.16em',
                    textTransform: 'uppercase', background: '#B91C1C', color: '#FFFFFF',
                    border: 'none', padding: '8px 16px', cursor: isDeleting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isDeleting ? 'Deleting…' : 'Delete'}
                </button>
                <button
                  onClick={() => setConfirmingDelete(false)}
                  style={{
                    fontFamily: "'Jost', sans-serif", fontSize: 9, letterSpacing: '0.16em',
                    textTransform: 'uppercase', background: 'transparent', color: '#78716C',
                    border: '1px solid #D6D3D1', padding: '8px 14px', cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
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
              placeholder="e.g. Out of stock, unable to fulfill this order…"
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
