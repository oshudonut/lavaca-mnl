import { notFound, redirect } from 'next/navigation'
import { getOrderSummary } from '@/lib/orders/get'
import { PaymentInstructions } from '@/components/order/PaymentInstructions'
import { ScreenshotUpload } from '@/components/order/ScreenshotUpload'
import { CountdownTimer } from '@/components/order/CountdownTimer'

const WINDOW_LABELS: Record<'AM' | 'PM', string> = {
  AM: '9:00 AM – 12:00 PM',
  PM: '1:00 PM – 5:00 PM',
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n)

interface Props {
  searchParams: { order_id?: string }
}

export default async function PaymentPage({ searchParams }: Props) {
  const orderId = searchParams.order_id
  if (!orderId) notFound()

  const order = await getOrderSummary(orderId)
  if (!order) notFound()

  // Already submitted — send to confirmation
  if (order.status === 'PAYMENT_REVIEW') {
    redirect(`/order/confirmation?order_id=${orderId}`)
  }

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
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Send Your Payment</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Order <span className="font-medium text-foreground">{order.order_number}</span>
          </p>
        </div>

        {/* Countdown */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <CountdownTimer createdAt={order.created_at} />
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
          <div className="text-xs text-muted-foreground pt-1 space-y-0.5">
            <p><span className="font-medium">Delivery:</span> {deliveryDateLabel}</p>
            <p><span className="font-medium">Time:</span> {WINDOW_LABELS[order.slot_window]}</p>
          </div>
        </section>

        {/* Payment instructions */}
        <section className="space-y-3">
          <h2 className="font-semibold text-foreground">Payment Details</h2>
          <p className="text-sm text-muted-foreground">
            Send the exact amount shown above and take a screenshot of the confirmation.
          </p>
          <PaymentInstructions
            defaultMethod={order.payment_method}
            gcashNumber={process.env.GCASH_NUMBER ?? ''}
            gcashAccountName={process.env.GCASH_ACCOUNT_NAME ?? ''}
            bpiAccount={process.env.BANK_BPI_ACCOUNT ?? ''}
            bpiName={process.env.BANK_BPI_NAME ?? ''}
            bdoAccount={process.env.BANK_BDO_ACCOUNT ?? ''}
            bdoName={process.env.BANK_BDO_NAME ?? ''}
          />
        </section>

        {/* Screenshot upload */}
        <section className="space-y-3">
          <h2 className="font-semibold text-foreground">Upload Screenshot</h2>
          <p className="text-sm text-muted-foreground">
            Upload your payment screenshot to complete your order.
          </p>
          <ScreenshotUpload orderId={orderId} />
        </section>
      </div>
    </main>
  )
}
