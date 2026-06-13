import { DeliveryCalendarGrid } from '@/components/admin/DeliveryCalendarGrid'

export const dynamic = 'force-dynamic'

export default function AdminCalendarPage() {
  return (
    <div>
      <div style={{ marginBottom: 40 }}>
        <p style={{
          fontFamily: "'Jost', sans-serif",
          fontSize: 9,
          fontWeight: 400,
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: '#A16207',
          margin: '0 0 10px',
        }}>
          Operations
        </p>
        <h1 style={{
          fontFamily: "'Playfair Display SC', serif",
          fontSize: 28,
          fontWeight: 400,
          color: '#1C1917',
          margin: '0 0 6px',
          letterSpacing: '0.01em',
        }}>
          Delivery Calendar
        </h1>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 13,
          color: '#57534E',
          margin: 0,
        }}>
          Manage open dates, slot capacity, and closures.
        </p>
      </div>
      <DeliveryCalendarGrid />
    </div>
  )
}
