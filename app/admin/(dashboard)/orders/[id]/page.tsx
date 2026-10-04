import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getOrderSummary } from '@/lib/orders/get'
import { AdminScreenshotViewer } from '@/components/admin/AdminScreenshotViewer'
import { OrderManage, PaymentReview } from '@/components/admin/OrderActions'
import { Card, ItemChip, StatusBadge } from '@/components/admin/ui'
import { PICKUP_LOCATION } from '@/lib/site'

export const dynamic = 'force-dynamic'

const peso = (n: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(n)

// "+639171234567" -> "+63 917 123 4567"; other formats are shown as typed.
function formatPhone(phone: string): string {
  const m = phone.replace(/\s/g, '').match(/^\+63(\d{3})(\d{3})(\d{4})$/)
  return m ? `+63 ${m[1]} ${m[2]} ${m[3]}` : phone
}

const AMOUNT_LABEL: Record<string, string> = {
  PENDING_PAYMENT: 'Waiting for payment',
  PAYMENT_REVIEW: 'Amount due',
  CANCELLED: 'Order total',
  EXPIRED: 'Order total',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span className="adm-hint">{label}</span>
      <span style={{ fontSize: 17, overflowWrap: 'anywhere' }}>{children}</span>
    </div>
  )
}

interface Props {
  params: { id: string }
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const order = await getOrderSummary(params.id)
  if (!order) notFound()

  const pickupDateLabel = order.pickup_date
    ? new Date(`${order.pickup_date}T00:00:00+08:00`).toLocaleDateString('en-PH', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila',
      })
    : '—'
  const placedLabel = new Date(order.created_at).toLocaleString('en-PH', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila',
  })
  const paymentLabel = order.payment_method === 'gcash' ? 'GCash' : 'Bank transfer'
  const needsReview = order.status === 'PAYMENT_REVIEW'
  const hasScreenshot = !['PENDING_PAYMENT', 'EXPIRED'].includes(order.status)

  const paymentCheck = (
    <Card title={needsReview ? 'Check the payment' : 'Payment'}>
      <div
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12,
          background: '#F6F3EF', borderRadius: 10, padding: '12px 14px',
        }}
      >
        <span className="adm-hint" style={{ fontSize: 15 }}>
          {AMOUNT_LABEL[order.status] ?? 'Paid'} · {paymentLabel}
        </span>
        <span style={{ fontSize: 24, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{peso(order.total_amount)}</span>
      </div>
      {hasScreenshot ? (
        <AdminScreenshotViewer orderId={params.id} />
      ) : (
        <p className="adm-hint">
          {order.status === 'EXPIRED'
            ? 'The customer didn’t send a payment screenshot in time, so this order expired.'
            : 'The customer hasn’t uploaded a payment screenshot yet.'}
        </p>
      )}
      {needsReview && <PaymentReview orderId={params.id} />}
    </Card>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Link href="/admin/orders" style={{ fontSize: 16, textDecoration: 'none', alignSelf: 'flex-start' }}>
        ‹ All orders
      </Link>

      <div className="adm-detail-head">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ alignSelf: 'flex-start' }}><StatusBadge status={order.status} /></span>
          <h1 className="adm-h1">{order.customer.name}</h1>
          <span className="adm-hint" style={{ fontSize: 15 }}>{order.order_number} · placed {placedLabel}</span>
        </div>
        {/* Wide screens: cancel/delete up top so they're reachable without scrolling */}
        <div className="adm-wide-only" style={{ maxWidth: 460 }}>
          <OrderManage orderId={params.id} status={order.status} />
        </div>
      </div>

      {/* Wide screens: payment on the left (stays in view), details on the right.
          Phones: one column with the payment check first. */}
      <div className="adm-detail">
        <div className="adm-detail-main">{paymentCheck}</div>

        <div className="adm-detail-side">
          <Card title="Pickup">
            <span style={{ fontSize: 18, fontWeight: 500 }}>
              {pickupDateLabel} · {order.time_label}
            </span>
            <span className="adm-hint" style={{ fontSize: 15 }}>{PICKUP_LOCATION}</span>
          </Card>

          <Card title="Items">
            <div>
              {order.items.map((item, i) => (
                <div key={i} className="adm-row" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: 17 }}>{item.product_name} · {item.weight_label}</span>
                    <span className="adm-chips" style={{ marginTop: 0 }}>
                      <ItemChip label={`× ${item.quantity}`} style={item.serving_style} />
                    </span>
                  </span>
                  <span style={{ fontSize: 17, fontWeight: 500, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                    {peso(item.subtotal)}
                  </span>
                </div>
              ))}
              <div className="adm-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 600 }}>
                <span>Total</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{peso(order.total_amount)}</span>
              </div>
            </div>
            {order.special_request && (
              <div style={{ background: '#FFF8EC', border: '1px solid #F2DDB0', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#7A4A00' }}>Special request</span>
                <span style={{ fontSize: 17, whiteSpace: 'pre-line' }}>{order.special_request}</span>
              </div>
            )}
          </Card>

          <Card title="Customer">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
              <Field label="Phone">
                <a href={`tel:${order.customer.phone.replace(/\s/g, '')}`}>{formatPhone(order.customer.phone)}</a>
              </Field>
              <Field label="Email">{order.customer.email}</Field>
              {order.address && <Field label="Address">{order.address}</Field>}
              {order.instagram_handle && (
                <Field label="Instagram">
                  <a href={`https://www.instagram.com/${order.instagram_handle}/`} target="_blank" rel="noopener noreferrer">
                    @{order.instagram_handle}
                  </a>
                </Field>
              )}
              <Field label="Paying by">{paymentLabel}</Field>
            </div>
          </Card>

          {/* Phones: cancel/delete stay at the end, away from accidental taps */}
          <Card title="Other actions" className="adm-narrow-only">
            <OrderManage orderId={params.id} status={order.status} />
          </Card>
        </div>
      </div>
    </div>
  )
}
