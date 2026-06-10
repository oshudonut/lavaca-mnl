import { notFound } from 'next/navigation'
import { getOrderSummary } from '@/lib/orders/get'

const WINDOW_LABELS: Record<'AM' | 'PM', string> = {
  AM: '9:00 AM – 12:00 PM',
  PM: '1:00 PM – 5:00 PM',
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n)

interface Props {
  searchParams: { order_id?: string }
}

export default async function ConfirmationPage({ searchParams }: Props) {
  const orderId = searchParams.order_id
  if (!orderId) notFound()

  const order = await getOrderSummary(orderId)
  if (!order) notFound()

  const deliveryDateLabel = order.delivery_date
    ? new Date(`${order.delivery_date}T00:00:00+08:00`).toLocaleDateString('en-PH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Manila',
      })
    : '—'

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 py-10 space-y-8">
        {/* Success header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600 text-2xl">
            ✓
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Screenshot Received!
          </h1>
          <p className="text-sm text-muted-foreground">
            We'll review your payment and confirm your order within 4 hours.
          </p>
        </div>

        {/* Order number */}
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Order Number</p>
          <p className="text-lg font-bold text-foreground">{order.order_number}</p>
        </div>

        {/* Order summary */}
        <section className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h2 className="font-semibold text-foreground text-sm">Order Summary</h2>
          <div className="space-y-1.5">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {item.product_name} · {item.weight_label} × {item.quantity}
                </span>
                <span className="font-medium tabular-nums">{fmt(item.subtotal)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm font-semibold border-t border-border pt-2">
            <span>Total</span>
            <span className="tabular-nums">{fmt(order.total_amount)}</span>
          </div>
        </section>

        {/* Delivery details */}
        <section className="rounded-lg border border-border bg-card p-4 space-y-2 text-sm">
          <h2 className="font-semibold text-foreground">Delivery Details</h2>
          <div className="space-y-1 text-muted-foreground">
            <p><span className="font-medium text-foreground">Date:</span> {deliveryDateLabel}</p>
            <p><span className="font-medium text-foreground">Time:</span> {WINDOW_LABELS[order.slot_window]}</p>
            <p><span className="font-medium text-foreground">Address:</span> {order.delivery_address}</p>
          </div>
        </section>

        {/* Status note */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <p className="font-semibold mb-0.5">Payment under review</p>
          <p>
            We'll send a confirmation email to{' '}
            <span className="font-medium">{order.customer.email}</span> once your payment is
            verified. This typically takes less than 4 hours.
          </p>
        </div>

        {/* Messenger link */}
        <p className="text-center text-sm text-muted-foreground">
          Questions? Message us on{' '}
          <span className="font-medium text-foreground">Facebook Messenger</span>.
        </p>
      </div>
    </main>
  )
}
