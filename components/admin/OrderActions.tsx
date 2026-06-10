'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type Action = 'confirm' | 'reject' | 'cancel' | null

interface Props {
  orderId: string
  status: string
}

const TERMINAL = ['CONFIRMED', 'DELIVERED', 'CANCELLED', 'EXPIRED']

export function OrderActions({ orderId, status }: Props) {
  const router = useRouter()
  const [activeAction, setActiveAction] = useState<Action>(null)
  const [paymentReference, setPaymentReference] = useState('')
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canConfirm = status === 'PAYMENT_REVIEW'
  const canReject = status === 'PAYMENT_REVIEW'
  const canCancel = !TERMINAL.includes(status)

  if (!canConfirm && !canReject && !canCancel) return null

  const handleSubmit = async () => {
    setError(null)
    setIsSubmitting(true)

    const endpoint = `/api/admin/orders/${orderId}/${activeAction}`
    const body =
      activeAction === 'confirm'
        ? { payment_reference: paymentReference }
        : { reason }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.')
        return
      }
      router.refresh()
      setActiveAction(null)
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

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      {!activeAction && (
        <div className="flex flex-wrap gap-2">
          {canConfirm && (
            <Button onClick={() => setActiveAction('confirm')} variant="default" size="sm">
              Confirm Payment
            </Button>
          )}
          {canReject && (
            <Button onClick={() => setActiveAction('reject')} variant="outline" size="sm">
              Reject Screenshot
            </Button>
          )}
          {canCancel && (
            <Button onClick={() => setActiveAction('cancel')} variant="destructive" size="sm">
              Cancel Order
            </Button>
          )}
        </div>
      )}

      {/* Inline confirm form */}
      {activeAction === 'confirm' && (
        <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground">Confirm Payment</p>
          <div className="space-y-1.5">
            <Label htmlFor="payment_reference">Payment reference / GCash reference number</Label>
            <Input
              id="payment_reference"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="e.g. GCash ref 1234567890"
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={isSubmitting || !paymentReference.trim()} size="sm">
              {isSubmitting ? 'Confirming…' : 'Confirm'}
            </Button>
            <Button onClick={cancel} variant="ghost" size="sm">Cancel</Button>
          </div>
        </div>
      )}

      {/* Inline reject form */}
      {activeAction === 'reject' && (
        <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground">Reject Screenshot</p>
          <div className="space-y-1.5">
            <Label htmlFor="reject_reason">Reason (shown to customer)</Label>
            <Textarea
              id="reject_reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Screenshot is blurry, amount doesn't match, wrong account…"
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={isSubmitting || !reason.trim()} variant="outline" size="sm">
              {isSubmitting ? 'Rejecting…' : 'Reject'}
            </Button>
            <Button onClick={cancel} variant="ghost" size="sm">Cancel</Button>
          </div>
        </div>
      )}

      {/* Inline cancel form */}
      {activeAction === 'cancel' && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground">Cancel Order</p>
          <div className="space-y-1.5">
            <Label htmlFor="cancel_reason">Reason (shown to customer)</Label>
            <Textarea
              id="cancel_reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Out of stock, unable to deliver to address…"
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={isSubmitting || !reason.trim()} variant="destructive" size="sm">
              {isSubmitting ? 'Cancelling…' : 'Cancel Order'}
            </Button>
            <Button onClick={cancel} variant="ghost" size="sm">Back</Button>
          </div>
        </div>
      )}
    </div>
  )
}
