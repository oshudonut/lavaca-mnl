'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Posts an admin order action and returns an error message, or null on success.
async function postAction(orderId: string, action: 'confirm' | 'reject' | 'cancel', body: object) {
  try {
    const res = await fetch(`/api/admin/orders/${orderId}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    return res.ok ? null : (data.error ?? 'Something went wrong. Please try again.')
  } catch {
    return 'Network error. Please check your connection and try again.'
  }
}

// ---------------------------------------------------------------------------
// Confirm / reject a payment screenshot (orders in PAYMENT_REVIEW)
// ---------------------------------------------------------------------------

export function PaymentReview({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [reference, setReference] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  async function run(action: 'confirm' | 'reject') {
    setBusy(true)
    setError(null)
    const err = await postAction(
      orderId,
      action,
      action === 'confirm' ? { payment_reference: reference.trim() } : { reason: reason.trim() }
    )
    setBusy(false)
    if (err) return setError(err)
    setDone(
      action === 'confirm'
        ? 'Payment confirmed. The customer has been emailed.'
        : 'Screenshot rejected. The customer has been asked to upload a new one.'
    )
    router.refresh()
  }

  if (done) return <p className="adm-success" role="status">{done}</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {!rejecting ? (
        <>
          <div className="adm-field">
            <label htmlFor="pay-ref" className="adm-label">GCash / bank reference number</label>
            <input
              id="pay-ref"
              className="adm-input"
              placeholder="From the screenshot"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              autoComplete="off"
            />
          </div>
          <button
            type="button"
            className="adm-btn adm-btn-green"
            style={{ padding: '15px 20px', fontSize: 17 }}
            disabled={busy || !reference.trim()}
            onClick={() => run('confirm')}
          >
            {busy ? 'Confirming…' : 'Confirm payment'}
          </button>
          {!reference.trim() && <p className="adm-hint">Type the reference number to confirm.</p>}
          <button type="button" className="adm-btn adm-btn-danger" disabled={busy} onClick={() => setRejecting(true)}>
            Reject screenshot
          </button>
        </>
      ) : (
        <>
          <div className="adm-field">
            <label htmlFor="reject-reason" className="adm-label">Why are you rejecting it? The customer will see this.</label>
            <textarea
              id="reject-reason"
              className="adm-textarea"
              placeholder="e.g. The amount doesn't match, or the screenshot is blurry"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="adm-btn adm-btn-danger"
            disabled={busy || !reason.trim()}
            onClick={() => run('reject')}
          >
            {busy ? 'Rejecting…' : 'Reject and ask for a new screenshot'}
          </button>
          <button type="button" className="adm-btn adm-btn-outline" disabled={busy} onClick={() => { setRejecting(false); setError(null) }}>
            Go back
          </button>
        </>
      )}
      {error && <p className="adm-error" role="alert">{error}</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Cancel (keeps a record, emails the customer) and delete (erases)
// ---------------------------------------------------------------------------

const NO_CANCEL = ['DELIVERED', 'CANCELLED', 'EXPIRED']

export function OrderManage({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter()
  const [mode, setMode] = useState<'idle' | 'cancel' | 'delete'>('idle')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const canCancel = !NO_CANCEL.includes(status)

  async function cancelOrder() {
    setBusy(true)
    setError(null)
    const err = await postAction(orderId, 'cancel', { reason: reason.trim() })
    setBusy(false)
    if (err) return setError(err)
    setDone('Order cancelled. The customer has been emailed.')
    setMode('idle')
    router.refresh()
  }

  async function deleteOrder() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/delete`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'Delete failed.')
        setBusy(false)
        return
      }
      router.push('/admin/orders')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {done && <p className="adm-success" role="status">{done}</p>}

      {mode === 'idle' && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {canCancel && (
            <button type="button" className="adm-btn adm-btn-danger" onClick={() => setMode('cancel')}>
              Cancel this order
            </button>
          )}
          <button type="button" className="adm-btn adm-btn-outline" onClick={() => setMode('delete')}>
            Delete order
          </button>
        </div>
      )}

      {mode === 'cancel' && (
        <>
          <div className="adm-field">
            <label htmlFor="cancel-reason" className="adm-label">Reason for cancelling. The customer will see this.</label>
            <textarea
              id="cancel-reason"
              className="adm-textarea"
              placeholder="e.g. Out of stock on that date"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className="adm-btn adm-btn-danger" disabled={busy || !reason.trim()} onClick={cancelOrder}>
              {busy ? 'Cancelling…' : 'Cancel order and email customer'}
            </button>
            <button type="button" className="adm-btn adm-btn-outline" disabled={busy} onClick={() => setMode('idle')}>
              Keep order
            </button>
          </div>
        </>
      )}

      {mode === 'delete' && (
        <>
          <p className="adm-error" style={{ background: '#FFFFFF' }}>
            Deleting erases this order completely and doesn’t tell the customer. Use it only for test orders,
            duplicates or spam. To stop a real order, cancel it instead.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className="adm-btn adm-btn-danger" disabled={busy} onClick={deleteOrder}>
              {busy ? 'Deleting…' : 'Yes, delete forever'}
            </button>
            <button type="button" className="adm-btn adm-btn-outline" disabled={busy} onClick={() => setMode('idle')}>
              Keep order
            </button>
          </div>
        </>
      )}

      {error && <p className="adm-error" role="alert">{error}</p>}
    </div>
  )
}
