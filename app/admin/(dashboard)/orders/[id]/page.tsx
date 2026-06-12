import { notFound } from 'next/navigation'
import { getOrderSummary } from '@/lib/orders/get'
import { AdminScreenshotViewer } from '@/components/admin/AdminScreenshotViewer'
import { OrderActions } from '@/components/admin/OrderActions'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const STATUS_STYLES: Record<string, string> = {
  PENDING_PAYMENT: 'bg-yellow-100 text-yellow-800',
  PAYMENT_REVIEW:  'bg-blue-100 text-blue-800',
  CONFIRMED:       'bg-green-100 text-green-800',
  CANCELLED:       'bg-red-100 text-red-700',
  EXPIRED:         'bg-gray-100 text-gray-500',
}

const WINDOW_LABELS: Record<string, string> = {
  AM: '9:00 AM – 12:00 PM',
  PM: '1:00 PM – 5:00 PM',
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n)

interface Props {
  params: { id: string }
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const order = await getOrderSummary(params.id)
  if (!order) notFound()

  const deliveryDateLabel = order.delivery_date
    ? new Date(`${order.delivery_date}T00:00:00+08:00`).toLocaleDateString('en-PH', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Manila',
      })
    : '—'

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{order.order_number}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Placed {new Date(order.created_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}
          </p>
        </div>
        <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-600')}>
          {order.status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Customer */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-2">
        <h2 className="font-semibold text-foreground">Customer</h2>
        <div className="text-sm space-y-1 text-muted-foreground">
          <p><span className="font-medium text-foreground">Name:</span> {order.customer.name}</p>
          <p><span className="font-medium text-foreground">Email:</span> {order.customer.email}</p>
          <p><span className="font-medium text-foreground">Phone:</span> {order.customer.phone}</p>
          <p><span className="font-medium text-foreground">Address:</span> {order.delivery_address}</p>
          <p><span className="font-medium text-foreground">Payment method:</span> {order.payment_method === 'gcash' ? 'GCash' : 'Bank Transfer'}</p>
        </div>
      </section>

      {/* Delivery */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-2">
        <h2 className="font-semibold text-foreground">Delivery</h2>
        <div className="text-sm space-y-1 text-muted-foreground">
          <p><span className="font-medium text-foreground">Date:</span> {deliveryDateLabel}</p>
          <p><span className="font-medium text-foreground">Time:</span> {WINDOW_LABELS[order.slot_window] ?? order.slot_window}</p>
        </div>
      </section>

      {/* Items */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="font-semibold text-foreground">Items</h2>
        <div className="space-y-2">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {item.product_name} · {item.weight_label} × {item.quantity}
              </span>
              <span className="font-medium tabular-nums">{fmt(item.subtotal)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm font-semibold border-t border-border pt-3">
          <span>Total</span>
          <span className="tabular-nums">{fmt(order.total_amount)}</span>
        </div>
      </section>

      {/* Payment screenshot */}
      {order.status !== 'PENDING_PAYMENT' && (
        <section className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="font-semibold text-foreground">Payment Screenshot</h2>
          <AdminScreenshotViewer orderId={params.id} />
        </section>
      )}

      {/* Actions */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="font-semibold text-foreground">Actions</h2>
        <OrderActions orderId={params.id} status={order.status} />
      </section>
    </div>
  )
}
