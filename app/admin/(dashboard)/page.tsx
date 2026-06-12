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

  // Slot IDs for today
  const { data: todayDateRows } = await supabase
    .from('delivery_dates')
    .select('id')
    .eq('date', today)

  const todayDateIds = (todayDateRows ?? []).map((r) => r.id)

  const { data: todaySlotRows } = todayDateIds.length
    ? await supabase.from('delivery_slots').select('id').in('delivery_date_id', todayDateIds)
    : { data: [] }

  const todaySlotIds = (todaySlotRows ?? []).map((r) => r.id)

  // Slot IDs for next 7 days
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

  // 1. Today's pending payments
  const { count: pendingPaymentsCount } = todaySlotIds.length
    ? await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PAYMENT_REVIEW')
        .in('delivery_slot_id', todaySlotIds)
    : { count: 0 }

  // 2. This week's confirmed deliveries
  const { count: weekConfirmedCount } = weekSlotIds.length
    ? await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'CONFIRMED')
        .in('delivery_slot_id', weekSlotIds)
    : { count: 0 }

  // 3. Total active orders
  const { count: activeOrdersCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .not('status', 'in', '("DELIVERED","CANCELLED","EXPIRED")')

  // 4. Revenue this month (CONFIRMED orders)
  const { data: revenueRows } = await supabase
    .from('orders')
    .select('total_amount')
    .eq('status', 'CONFIRMED')
    .gte('created_at', `${startOfMonth}T00:00:00+08:00`)

  const revenueThisMonth = (revenueRows ?? []).reduce(
    (sum, row) => sum + (row.total_amount ?? 0),
    0
  )

  // 5. Capacity utilisation next 14 days
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
// Stat card component
// ---------------------------------------------------------------------------

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-3xl font-bold text-foreground tabular-nums">{value}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminDashboard() {
  const stats = await getDashboardStats()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Operations overview</p>
      </div>

      {/* Top 4 stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Pending payments today"
          value={stats.pendingPaymentsCount}
        />
        <StatCard
          label="Confirmed this week"
          value={stats.weekConfirmedCount}
        />
        <StatCard
          label="Active orders"
          value={stats.activeOrdersCount}
        />
        <StatCard
          label="Revenue this month"
          value={fmt(stats.revenueThisMonth)}
        />
      </div>

      {/* Capacity utilisation next 14 days */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Capacity — next 14 days</h2>
        </div>
        {stats.capacityDates.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">
            No delivery dates configured for the next 14 days.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {stats.capacityDates.map((row) => {
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

              return (
                <div key={row.date} className="flex items-center gap-4 px-5 py-3">
                  <span className="w-28 shrink-0 text-sm font-medium text-foreground">
                    {dateLabel}
                  </span>

                  {/* Per-slot breakdown */}
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    {row.delivery_slots
                      .sort((a, b) => (a.slot_window < b.slot_window ? -1 : 1))
                      .map((sl) => (
                        <span key={sl.slot_window}>
                          {sl.slot_window}: {sl.booked_count}/{sl.max_orders}
                        </span>
                      ))}
                  </div>

                  {/* Progress bar */}
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pct >= 100 ? 'bg-destructive' : pct >= 75 ? 'bg-amber-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs tabular-nums text-muted-foreground w-10 text-right">
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
