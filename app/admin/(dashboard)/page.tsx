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

  // Round 1: every date in the next 14 days (covers today, this week and
  // the upcoming list) alongside the queries that don't depend on dates.
  const [{ data: dateRows }, { count: activeOrdersCount }, { data: revenueRows }] = await Promise.all([
    supabase
      .from('delivery_dates')
      .select('id, date, is_open')
      .gte('date', today)
      .lte('date', in14Days)
      .order('date', { ascending: true }),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .not('status', 'in', '("DELIVERED","CANCELLED","EXPIRED")'),
    supabase
      .from('orders')
      .select('total_amount')
      .eq('status', 'CONFIRMED')
      .gte('created_at', `${startOfMonth}T00:00:00+08:00`),
  ])

  const dates = dateRows ?? []
  const todayDateIds = dates.filter((d) => d.date === today).map((d) => d.id)
  const weekDateIds = dates.filter((d) => d.date <= in7Days).map((d) => d.id)
  const upcomingDateRows = dates.filter((d) => d.is_open)
  const upcomingDateIds = upcomingDateRows.map((d) => d.id)

  // Round 2: order queries that need the date ids, in parallel.
  const [{ count: pendingPaymentsCount }, { count: weekConfirmedCount }, { data: upcomingOrderRows }] =
    await Promise.all([
      todayDateIds.length
        ? supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'PAYMENT_REVIEW')
            .in('delivery_date_id', todayDateIds)
        : Promise.resolve({ count: 0 }),
      weekDateIds.length
        ? supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'CONFIRMED')
            .in('delivery_date_id', weekDateIds)
        : Promise.resolve({ count: 0 }),
      upcomingDateIds.length
        ? supabase
            .from('orders')
            .select('delivery_date_id')
            .in('delivery_date_id', upcomingDateIds)
            .not('status', 'in', '("CANCELLED","EXPIRED")')
        : Promise.resolve({ data: [] as { delivery_date_id: string }[] }),
    ])

  const revenueThisMonth = (revenueRows ?? []).reduce(
    (sum, row) => sum + (row.total_amount ?? 0),
    0
  )

  const ordersPerDate = new Map<string, number>()
  for (const row of upcomingOrderRows ?? []) {
    ordersPerDate.set(row.delivery_date_id, (ordersPerDate.get(row.delivery_date_id) ?? 0) + 1)
  }

  const upcomingDates: UpcomingDate[] = upcomingDateRows.map((r) => ({
    date: r.date,
    order_count: ordersPerDate.get(r.id) ?? 0,
  }))

  return {
    pendingPaymentsCount: pendingPaymentsCount ?? 0,
    weekConfirmedCount: weekConfirmedCount ?? 0,
    activeOrdersCount: activeOrdersCount ?? 0,
    revenueThisMonth,
    upcomingDates,
  }
}

type UpcomingDate = {
  date: string
  order_count: number
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

      {/* Upcoming pickups — next 14 days */}
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
            Upcoming Pickups
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

        {stats.upcomingDates.length === 0 ? (
          <p style={{
            padding: '32px 24px',
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            color: '#8C7B6B',
            margin: 0,
          }}>
            No open pickup dates in the next 14 days.
          </p>
        ) : (
          <div>
            {stats.upcomingDates.map((row, i) => {
              const dateLabel = new Date(`${row.date}T00:00:00+08:00`).toLocaleDateString('en-PH', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                timeZone: 'Asia/Manila',
              })

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

                  {/* Order count */}
                  <span style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 13,
                    color: row.order_count > 0 ? '#1C1917' : '#8C7B6B',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {row.order_count} {row.order_count === 1 ? 'order' : 'orders'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
