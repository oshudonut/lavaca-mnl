import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getOrderSummary } from '@/lib/orders/get'
import { AdminScreenshotViewer } from '@/components/admin/AdminScreenshotViewer'
import { OrderActions } from '@/components/admin/OrderActions'

export const dynamic = 'force-dynamic'

type StatusStyle = { bg: string; color: string }
const STATUS_STYLES: Record<string, StatusStyle> = {
  PENDING_PAYMENT:  { bg: '#FEF3C7', color: '#92400E' },
  PAYMENT_REVIEW:   { bg: '#DBEAFE', color: '#1E40AF' },
  CONFIRMED:        { bg: '#D1FAE5', color: '#065F46' },
  AWAITING_PICKUP:  { bg: '#EDE9FE', color: '#5B21B6' },
  OUT_FOR_DELIVERY: { bg: '#E0E7FF', color: '#3730A3' },
  DELIVERED:        { bg: '#F3F4F6', color: '#4B5563' },
  CANCELLED:        { bg: '#FEE2E2', color: '#B91C1C' },
  EXPIRED:          { bg: '#F3F4F6', color: '#6B7280' },
}


const fmt = (n: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n)

interface Props {
  params: { id: string }
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const order = await getOrderSummary(params.id)
  if (!order) notFound()

  const pickupDateLabel = order.pickup_date
    ? new Date(`${order.pickup_date}T00:00:00+08:00`).toLocaleDateString('en-PH', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Manila',
      })
    : '—'

  const statusStyle = STATUS_STYLES[order.status] ?? { bg: '#F3F4F6', color: '#6B7280' }

  const cardStyle: React.CSSProperties = {
    background: '#FFFFFF',
    border: '1px solid #D6D3D1',
    padding: '22px 24px',
    marginBottom: 16,
  }

  const sectionHeading: React.CSSProperties = {
    fontFamily: "'Playfair Display SC', serif",
    fontSize: 15,
    fontWeight: 400,
    color: '#1C1917',
    margin: '0 0 16px',
    letterSpacing: '0.01em',
  }

  const fieldRow: React.CSSProperties = {
    display: 'flex',
    gap: 8,
    marginBottom: 8,
    fontFamily: "'Inter', sans-serif",
    fontSize: 13,
    lineHeight: 1.5,
  }

  return (
    <div style={{ maxWidth: 680 }}>
      {/* Back link */}
      <Link
        href="/admin/orders"
        style={{
          fontFamily: "'Jost', sans-serif",
          fontSize: 9,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: '#A16207',
          textDecoration: 'none',
          display: 'inline-block',
          marginBottom: 28,
        }}
      >
        ← Orders
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{
            fontFamily: "'Playfair Display SC', serif",
            fontSize: 22,
            fontWeight: 400,
            color: '#1C1917',
            margin: '0 0 6px',
            letterSpacing: '0.01em',
          }}>
            {order.order_number}
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#8C7B6B', margin: 0 }}>
            Placed {new Date(order.created_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}
          </p>
        </div>
        <span style={{
          fontFamily: "'Jost', sans-serif",
          fontSize: 9,
          fontWeight: 500,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          background: statusStyle.bg,
          color: statusStyle.color,
          padding: '5px 10px',
          flexShrink: 0,
        }}>
          {order.status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Customer */}
      <div style={cardStyle}>
        <h2 style={sectionHeading}>Customer</h2>
        <div>
          {[
            ['Name',           order.customer.name],
            ['Email',          order.customer.email],
            ['Phone',          order.customer.phone],
            ...(order.special_request ? [['Special request', order.special_request]] : []),
            ...(order.address ? [['Address', order.address]] : []),
            ...(order.instagram_handle ? [['Instagram', `@${order.instagram_handle}`]] : []),
            ['Payment method', order.payment_method === 'gcash' ? 'GCash' : 'Bank Transfer'],
          ].map(([label, value]) => (
            <div key={label} style={fieldRow}>
              <span style={{ fontWeight: 600, color: '#1C1917', flexShrink: 0, minWidth: 110 }}>{label}</span>
              <span style={{ color: '#57534E' }}>{value ?? '—'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pickup */}
      <div style={cardStyle}>
        <h2 style={sectionHeading}>Pickup</h2>
        <div>
          {[
            ['Date', pickupDateLabel],
            ['Time', order.time_label],
          ].map(([label, value]) => (
            <div key={label} style={fieldRow}>
              <span style={{ fontWeight: 600, color: '#1C1917', flexShrink: 0, minWidth: 110 }}>{label}</span>
              <span style={{ color: '#57534E' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Items */}
      <div style={cardStyle}>
        <h2 style={sectionHeading}>Items</h2>
        <div>
          {order.items.map((item, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: 12,
              paddingBottom: 10,
              marginBottom: 10,
              borderBottom: '1px solid #F5F4F2',
              fontFamily: "'Inter', sans-serif",
              fontSize: 13,
            }}>
              <span style={{ color: '#57534E' }}>
                {item.product_name} · {item.weight_label}{item.serving ? ` · ${item.serving}` : ''} × {item.quantity}
              </span>
              <span style={{ fontWeight: 600, color: '#1C1917', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                {fmt(item.subtotal)}
              </span>
            </div>
          ))}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 12,
            paddingTop: 4,
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
            fontWeight: 700,
            color: '#1C1917',
          }}>
            <span>Total</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(order.total_amount)}</span>
          </div>
        </div>
      </div>

      {/* Payment screenshot */}
      {order.status !== 'PENDING_PAYMENT' && (
        <div style={cardStyle}>
          <h2 style={sectionHeading}>Payment Screenshot</h2>
          <AdminScreenshotViewer orderId={params.id} />
        </div>
      )}

      {/* Actions */}
      <div style={cardStyle}>
        <h2 style={sectionHeading}>Actions</h2>
        <OrderActions orderId={params.id} status={order.status} />
      </div>
    </div>
  )
}
