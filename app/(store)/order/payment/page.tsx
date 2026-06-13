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

  const cardStyle: React.CSSProperties = {
    background: '#FFFFFF',
    border: '1px solid #D6D3D1',
    padding: 28,
  }

  const sectionLabelStyle: React.CSSProperties = {
    fontFamily: "'Jost', sans-serif",
    fontSize: 9,
    letterSpacing: '0.28em',
    textTransform: 'uppercase',
    color: '#A16207',
    margin: 0,
  }

  return (
    <main style={{ background: '#FAFAF9', minHeight: '100vh' }}>
      {/* Dark hero header */}
      <header style={{ background: '#0C0A09', padding: '48px 24px 44px', textAlign: 'center' }}>
        <div style={{ width: 36, height: 1, background: '#A16207', margin: '0 auto 18px' }} />
        <p style={sectionLabelStyle}>Send Your Payment</p>
        <h1
          style={{
            fontFamily: "'Playfair Display SC', serif",
            fontSize: 32,
            fontWeight: 400,
            color: '#FAFAF9',
            whiteSpace: 'pre-line',
            lineHeight: 1.25,
            margin: '14px 0 10px',
          }}
        >
          {`Order\n${order.order_number}`}
        </h1>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 300,
            fontSize: 12,
            color: 'rgba(250,250,249,0.5)',
            margin: 0,
          }}
        >
          Complete your payment to confirm your order.
        </p>
      </header>

      {/* Countdown strip */}
      <div
        style={{
          background: '#1C1917',
          padding: '14px 24px',
          textAlign: 'center',
          borderBottom: '1px solid rgba(161,98,7,0.15)',
        }}
      >
        <CountdownTimer createdAt={order.created_at} />
      </div>

      {/* Content */}
      <div
        style={{
          maxWidth: 540,
          margin: '0 auto',
          padding: '40px 24px 80px',
          display: 'flex',
          flexDirection: 'column',
          gap: 32,
        }}
      >
        {/* Order summary */}
        <section style={cardStyle}>
          <p style={{ ...sectionLabelStyle, marginBottom: 18 }}>Order Summary</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {order.items.map((item, i) => (
              <div
                key={i}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}
              >
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#1C1917' }}>
                  {item.product_name} · {item.weight_label} × {item.quantity}
                </span>
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 13,
                    color: '#1C1917',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {fmt(item.subtotal)}
                </span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #D6D3D1', margin: '16px 0 14px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: '#1C1917' }}>
              Total
            </span>
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 16,
                fontWeight: 700,
                color: '#A16207',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {fmt(order.total_amount)}
            </span>
          </div>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#57534E', margin: 0 }}>
              Delivery: {deliveryDateLabel}
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#57534E', margin: 0 }}>
              Time: {WINDOW_LABELS[order.slot_window]}
            </p>
          </div>
        </section>

        {/* Payment details */}
        <section style={cardStyle}>
          <p style={{ ...sectionLabelStyle, marginBottom: 10 }}>Payment Details</p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#57534E', margin: '0 0 20px' }}>
            Send the exact amount shown above and take a screenshot of your confirmation.
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
        <section style={cardStyle}>
          <p style={{ ...sectionLabelStyle, marginBottom: 18 }}>Upload Screenshot</p>
          <ScreenshotUpload orderId={orderId} />
        </section>
      </div>
    </main>
  )
}
