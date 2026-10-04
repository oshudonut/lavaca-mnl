// Plain-language names and colour tones for order statuses, shared by the
// admin screens so every badge and filter says the same thing.

export type StatusTone = 'review' | 'waiting' | 'confirmed' | 'done' | 'cancelled'

export const ORDER_STATUS: Record<string, { label: string; tone: StatusTone }> = {
  PENDING_PAYMENT:  { label: 'Waiting for payment', tone: 'waiting' },
  PAYMENT_REVIEW:   { label: 'To review',           tone: 'review' },
  CONFIRMED:        { label: 'Confirmed',           tone: 'confirmed' },
  AWAITING_PICKUP:  { label: 'Ready for pickup',    tone: 'confirmed' },
  OUT_FOR_DELIVERY: { label: 'Out for delivery',    tone: 'confirmed' },
  DELIVERED:        { label: 'Completed',           tone: 'done' },
  CANCELLED:        { label: 'Cancelled',           tone: 'cancelled' },
  EXPIRED:          { label: 'Expired',             tone: 'done' },
}

export function orderStatus(status: string): { label: string; tone: StatusTone } {
  return ORDER_STATUS[status] ?? { label: status.replace(/_/g, ' ').toLowerCase(), tone: 'done' }
}
