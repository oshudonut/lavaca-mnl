import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function manilaToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
}

function manilaStartOfMonth(): string {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }))
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00+08:00`)
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n)

// ---------------------------------------------------------------------------
// Dashboard data fetching
// ---------------------------------------------------------------------------

async function getDashboardStats() {
  const supabase = createServiceClient()
  const today = manilaToday()
  const in7Days = addDays(today, 7)
  const in14Days = addDays(today, 14)
  const startOfMonth = manilaStartOfMonth()

  const { data: todayDateRows } = await supabase
    .from('delivery_dates')
    .select('id')
    .eq('date', today)

  const todayDateIds = (todayDateRows ?? []).map((r) => r.id)

  const { data: todaySlotRows } = todayDateIds.length
    ? await supabase.from('delivery_slots').select('id').in('delivery_date_id', todayDateIds)
    : { data: [] }

  const todaySlotIds = (todaySlotRows ?? []).map((r) => r.id)

  const { data: weekDateRows } = await supabase
    .from('delivery_dates')
    .select('id')
    .gte('date', today)
    .lte('date', in7Days)

  const weekDateIds = (weekDateRows ?? []).map((r) => r.id)

  const { data: weekSlotRows } = weekDateIds.length
    ? await supabase.from('delivery_slots').select('id').in('delivery_date_id', weekDateIds)
    : { data: [] }

  const weekSlotIds = (weekSlotRows ?? []).map((r) => r.id)

  const { count: pendingPaymentsCount } = todaySlotIds.length
    ? await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PAYMENT_REVIEW')
        .in('delivery_slot_id', todaySlotIds)
    : { count: 0 }

  const { count: weekConfirmedCount } = weekSlotIds.length
    ? await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'CONFIRMED')
        .in('delivery_slot_id', weekSlotIds)
    : { count: 0 }

  const { count: activeOrdersCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .not('status', 'in', '("DELIVERED","CANCELLED","EXPIRED")')

  const { data: revenueRows } = await supabase
    .from('orders')
    .select('total_amount')
    .eq('status', 'CONFIRMED')
    .gte('created_at', `${startOfMonth}T00:00:00+08:00`)

  const revenueThisMonth = (revenueRows ?? []).reduce(
    (sum, row) => sum + (row.total_amount ?? 0),
    0
  )

  const { data: capacityDates } = await supabase
    .from('delivery_dates')
    .select('date, max_orders_total, delivery_slots(slot_window, max_orders, booked_count)')
    .gte('date', today)
    .lte('date', in14Days)
    .order('date', { ascending: true })

  return {
    pendingPaymentsCount: pendingPaymentsCount ?? 0,
    weekConfirmedCount: weekConfirmedCount ?? 0,
    activeOrdersCount: activeOrdersCount ?? 0,
    revenueThisMonth,
    capacityDates: (capacityDates ?? []) as CapacityDate[],
  }
}

type CapacityDate = {
  date: string
  max_orders_total: number
  delivery_slots: { slot_window: string; max_orders: number; booked_count: number }[]
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #D6D3D1',
      padding: '24px 22px',
    }}>
      <p style={{
        fontFamily: "'Jost', sans-serif",
        fontSize: 9,
        fontWeight: 400,
        letterSpacing: '0.24em',
        textTransform: 'uppercase',
        color: '#A16207',
        margin: '0 0 12px',
      }}>
        {label}
      </p>
      <p style={{
        fontFamily: "'Playfair Display SC', serif",
        fontSize: 32,
        fontWeight: 400,
        color: '#1C1917',
        margin: 0,
        lineHeight: 1,
        letterSpacing: '-0.01em',
      }}>
        {value}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminDashboard() {
  const stats = await getDashboardStats()

  return (
    <div>
      {/* Page heading */}
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
          margin: 0,
          letterSpacing: '0.01em',
        }}>
          Dashboard
        </h1>
      </div>

      {/* Stat cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 1,
        marginBottom: 40,
        background: '#D6D3D1',
        border: '1px solid #D6D3D1',
      }}>
        <StatCard label="Pending payments today"  value={stats.pendingPaymentsCount} />
        <StatCard label="Confirmed this week"      value={stats.weekConfirmedCount} />
        <StatCard label="Active orders"            value={stats.activeOrdersCount} />
        <StatCard label="Revenue this month"       value={fmt(stats.revenueThisMonth)} />
      </div>

      {/* Capacity — next 14 days */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #D6D3D1',
        overflow: 'hidden',
      }}>
        {/* Section header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #D6D3D1',
          display: 'flex',
          alignItems: 'baseline',
          gap: 16,
        }}>
          <h2 style={{
            fontFamily: "'Playfair Display SC', serif",
            fontSize: 16,
            fontWeight: 400,
            color: '#1C1917',
            margin: 0,
          }}>
            Capacity
          </h2>
          <span style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: 9,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#8C7B6B',
          }}>
            Next 14 days
          </span>
        </div>

        {stats.capacityDates.length === 0 ? (
          <p style={{
            padding: '32px 24px',
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            color: '#8C7B6B',
            margin: 0,
          }}>
            No delivery dates configured for the next 14 days.
          </p>
        ) : (
          <div>
            {stats.capacityDates.map((row, i) => {
              const dateLabel = new Date(`${row.date}T00:00:00+08:00`).toLocaleDateString('en-PH', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                timeZone: 'Asia/Manila',
              })
              const totalBooked = row.delivery_slots.reduce((s, sl) => s + sl.booked_count, 0)
              const pct = row.max_orders_total > 0
                ? Math.round((totalBooked / row.max_orders_total) * 100)
                : 0
              const barColor = pct >= 100 ? '#DC2626' : pct >= 75 ? '#D97706' : '#16A34A'

              return (
                <div
                  key={row.date}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '14px 24px',
                    borderTop: i === 0 ? 'none' : '1px solid #F5F4F2',
                  }}
                >
                  {/* Date */}
                  <span style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#1C1917',
                    width: 108,
                    flexShrink: 0,
                  }}>
                    {dateLabel}
                  </span>

                  {/* Slot breakdown */}
                  <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                    {row.delivery_slots
                      .sort((a, b) => (a.slot_window < b.slot_window ? -1 : 1))
                      .map((sl) => (
                        <span
                          key={sl.slot_window}
                          style={{
                            fontFamily: "'Jost', sans-serif",
                            fontSize: 10,
                            letterSpacing: '0.1em',
                            color: '#8C7B6B',
                          }}
                        >
                          {sl.slot_window} {sl.booked_count}/{sl.max_orders}
                        </span>
                      ))}
                  </div>

                  {/* Progress bar */}
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      flex: 1,
                      height: 3,
                      background: '#EDE9E8',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(pct, 100)}%`,
                        background: barColor,
                        transition: 'width 0.3s',
                      }} />
                    </div>
                    <span style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 11,
                      color: '#8C7B6B',
                      width: 32,
                      textAlign: 'right',
                      flexShrink: 0,
                    }}>
                      {pct}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
