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
    <main style={{ minHeight: '100vh', background: '#FAFAF9' }}>
      <div style={{ maxWidth: 540, margin: '0 auto', padding: '64px 24px 80px' }}>
        {/* Hero section */}
        <section
          style={{
            background: '#0C0A09',
            padding: '56px 24px 52px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 36,
              height: 1,
              background: '#A16207',
              margin: '0 auto 28px',
            }}
          />
          <svg
            width={32}
            height={32}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            style={{ display: 'block', margin: '0 auto 20px' }}
          >
            <polyline
              points="4 12 9 17 20 6"
              stroke="#A16207"
              strokeWidth={1.5}
              fill="none"
            />
          </svg>
          <p
            style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: 10,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: '#A16207',
              margin: '0 0 18px',
            }}
          >
            Order Confirmed
          </p>
          <h1
            style={{
              fontFamily: "'Playfair Display SC', serif",
              fontSize: 'clamp(36px, 8vw, 52px)',
              fontWeight: 400,
              color: '#FAFAF9',
              lineHeight: 1.05,
              margin: '0 0 20px',
              whiteSpace: 'pre-line',
            }}
          >
            {'Your Order\nIs Placed.'}
          </h1>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 300,
              fontSize: 13,
              color: 'rgba(250,250,249,0.55)',
              margin: 0,
            }}
          >
            We&apos;ll review your payment and confirm within 4 hours.
          </p>
        </section>

        {/* Order number block */}
        <section
          style={{
            background: '#FAFAF9',
            textAlign: 'center',
            padding: '36px 24px 32px',
            borderBottom: '1px solid rgba(161,98,7,0.2)',
          }}
        >
          <p
            style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: 9,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: '#A16207',
              margin: '0 0 10px',
            }}
          >
            Order Number
          </p>
          <p
            style={{
              fontFamily: "'Playfair Display SC', serif",
              fontSize: 28,
              color: '#1C1917',
              margin: 0,
            }}
          >
            {order.order_number}
          </p>
        </section>

        {/* Order summary card */}
        <section
          style={{
            background: '#FFFFFF',
            border: '1px solid #D6D3D1',
            padding: 28,
            marginTop: 40,
          }}
        >
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 18,
              fontWeight: 500,
              color: '#1C1917',
              margin: '0 0 20px',
            }}
          >
            Order Summary
          </h2>
          <div>
            {order.items.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 16,
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 13,
                  marginBottom: 10,
                }}
              >
                <span style={{ color: '#1C1917' }}>
                  {item.product_name} · {item.weight_label} × {item.quantity}
                </span>
                <span
                  style={{
                    color: '#1C1917',
                    fontVariantNumeric: 'tabular-nums',
                    textAlign: 'right',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {fmt(item.subtotal)}
                </span>
              </div>
            ))}
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderTop: '1px solid #D6D3D1',
              paddingTop: 16,
              marginTop: 16,
              fontFamily: "'Playfair Display', serif",
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            <span style={{ color: '#1C1917' }}>Total</span>
            <span style={{ color: '#A16207', fontVariantNumeric: 'tabular-nums' }}>
              {fmt(order.total_amount)}
            </span>
          </div>
        </section>

        {/* Delivery details card */}
        <section
          style={{
            background: '#FFFFFF',
            border: '1px solid #D6D3D1',
            padding: 28,
            marginTop: 24,
          }}
        >
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 18,
              fontWeight: 500,
              color: '#1C1917',
              margin: '0 0 20px',
            }}
          >
            Delivery Details
          </h2>
          <div style={{ paddingBottom: 14, borderBottom: '1px solid rgba(161,98,7,0.08)' }}>
            <p
              style={{
                fontFamily: "'Jost', sans-serif",
                fontSize: 9,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: '#A16207',
                margin: '0 0 6px',
              }}
            >
              Date
            </p>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                color: '#1C1917',
                margin: 0,
              }}
            >
              {deliveryDateLabel}
            </p>
          </div>
          <div
            style={{
              padding: '14px 0',
              borderBottom: '1px solid rgba(161,98,7,0.08)',
            }}
          >
            <p
              style={{
                fontFamily: "'Jost', sans-serif",
                fontSize: 9,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: '#A16207',
                margin: '0 0 6px',
              }}
            >
              Time
            </p>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                color: '#1C1917',
                margin: 0,
              }}
            >
              {WINDOW_LABELS[order.slot_window]}
            </p>
          </div>
          <div style={{ paddingTop: 14 }}>
            <p
              style={{
                fontFamily: "'Jost', sans-serif",
                fontSize: 9,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: '#A16207',
                margin: '0 0 6px',
              }}
            >
              Address
            </p>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                color: '#1C1917',
                margin: 0,
              }}
            >
              {order.delivery_address}
            </p>
          </div>
        </section>

        {/* Status note */}
        <div
          style={{
            background: '#1C1917',
            padding: '20px 24px',
            marginTop: 24,
            borderLeft: '3px solid #A16207',
            paddingLeft: 20,
          }}
        >
          <p
            style={{
              fontFamily: "'Playfair Display', serif",
              fontStyle: 'italic',
              fontSize: 15,
              color: '#FAFAF9',
              margin: '0 0 8px',
            }}
          >
            Payment under review
          </p>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 300,
              fontSize: 12,
              color: 'rgba(250,250,249,0.6)',
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            We&apos;ll send a confirmation email to{' '}
            <span style={{ fontWeight: 600, color: 'rgba(250,250,249,0.85)' }}>
              {order.customer.email}
            </span>{' '}
            once your payment is verified. This typically takes less than 4 hours.
          </p>
        </div>

        {/* Footer */}
        <p
          style={{
            textAlign: 'center',
            fontFamily: "'Inter', sans-serif",
            fontSize: 12,
            color: '#8C7B6B',
            marginTop: 48,
            marginBottom: 0,
          }}
        >
          Questions? Message us on{' '}
          <span
            style={{
              fontFamily: "'Playfair Display', serif",
              fontStyle: 'italic',
              color: '#A16207',
            }}
          >
            Facebook Messenger
          </span>
          .
        </p>
      </div>
    </main>
  )
}
