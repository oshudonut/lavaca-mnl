import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import { orderTimeLabel } from '@/lib/delivery/pickup'
import { servingStyleLabel } from '@/lib/orders/validation'
import { PICKUP_LOCATION } from '@/lib/site'
import { Card, ItemChip, PageHeader, Stat, StatusBadge } from '@/components/admin/ui'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Helpers (all dates in Manila time)
// ---------------------------------------------------------------------------

function manilaToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
}

function manilaStartOfMonth(): string {
  return `${manilaToday().slice(0, 7)}-01`
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00+08:00`)
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
}

function dateLabel(dateStr: string, opts: Intl.DateTimeFormatOptions): string {
  return new Date(`${dateStr}T00:00:00+08:00`).toLocaleDateString('en-PH', { ...opts, timeZone: 'Asia/Manila' })
}

function greeting(): string {
  const hour = Number(new Date().toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: 'Asia/Manila' }))
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
}

const peso = (n: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(n)

const PAYMENT_WINDOW_MS = 2 * 60 * 60 * 1000 // unpaid orders expire after 2 hours

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

type PickupOrder = {
  id: string
  status: string
  pickup_time: string | null
  delivery_date_id: string
  customers: { name: string } | { name: string }[] | null
  delivery_slots: { slot_window: string } | { slot_window: string }[] | null
  order_items: {
    quantity: number
    serving_style: string | null
    products: { name: string; weight_label: string } | null
  }[]
}

const one = <T,>(v: T | T[] | null | undefined): T | undefined => (Array.isArray(v) ? v[0] : v ?? undefined)

async function getDashboard() {
  const supabase = createServiceClient()
  const today = manilaToday()
  const tomorrow = addDays(today, 1)
  const in6 = addDays(today, 6)
  const startOfMonth = manilaStartOfMonth()
  const weekStart = addDays(today, -6)

  // Round 1: independent queries in parallel.
  const [
    { data: dateRows },
    { count: reviewCount },
    { data: waitingRows },
    { count: inProgressCount },
    { data: revenueRows },
    { count: confirmedThisWeek },
  ] = await Promise.all([
    supabase
      .from('delivery_dates')
      .select('id, date, is_open, closure_type')
      .gte('date', today)
      .lte('date', in6)
      .order('date', { ascending: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'PAYMENT_REVIEW'),
    supabase.from('orders').select('id, created_at').eq('status', 'PENDING_PAYMENT').order('created_at', { ascending: true }),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .in('status', ['PENDING_PAYMENT', 'PAYMENT_REVIEW', 'CONFIRMED', 'AWAITING_PICKUP']),
    supabase
      .from('orders')
      .select('total_amount')
      .eq('status', 'CONFIRMED')
      .gte('created_at', `${startOfMonth}T00:00:00+08:00`),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'CONFIRMED')
      .gte('confirmed_at', `${weekStart}T00:00:00+08:00`),
  ])

  const dates = dateRows ?? []
  const todayRow = dates.find((d) => d.date === today)
  const tomorrowRow = dates.find((d) => d.date === tomorrow)
  const pickupDateIds = [todayRow?.id, tomorrowRow?.id].filter(Boolean) as string[]

  // Round 2: today's/tomorrow's pickups and the week's order counts.
  const [{ data: pickupRows }, { data: weekOrderRows }] = await Promise.all([
    pickupDateIds.length
      ? supabase
          .from('orders')
          .select(`
            id, status, pickup_time, delivery_date_id,
            customers ( name ),
            delivery_slots ( slot_window ),
            order_items ( quantity, serving_style, products ( name, weight_label ) )
          `)
          .in('delivery_date_id', pickupDateIds)
          .not('status', 'in', '("CANCELLED","EXPIRED")')
      : Promise.resolve({ data: [] as PickupOrder[] }),
    dates.length
      ? supabase
          .from('orders')
          .select('delivery_date_id')
          .in('delivery_date_id', dates.map((d) => d.id))
          .not('status', 'in', '("CANCELLED","EXPIRED")')
      : Promise.resolve({ data: [] as { delivery_date_id: string }[] }),
  ])

  const byTime = (a: PickupOrder, b: PickupOrder) => (a.pickup_time ?? '99').localeCompare(b.pickup_time ?? '99')
  const pickups = (pickupRows ?? []) as unknown as PickupOrder[]
  const todayPickups = pickups.filter((o) => o.delivery_date_id === todayRow?.id).sort(byTime)
  const tomorrowPickups = pickups.filter((o) => o.delivery_date_id === tomorrowRow?.id).sort(byTime)

  const countByDate = new Map<string, number>()
  for (const r of weekOrderRows ?? []) countByDate.set(r.delivery_date_id, (countByDate.get(r.delivery_date_id) ?? 0) + 1)

  const waiting = waitingRows ?? []
  const soonestExpiry = waiting.length
    ? new Date(waiting[0].created_at).getTime() + PAYMENT_WINDOW_MS - Date.now()
    : null

  const revenueThisMonth = (revenueRows ?? []).reduce((sum, r) => sum + (r.total_amount ?? 0), 0)

  // Next 7 days, including days with no calendar entry ("not set up").
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i)
    const row = dates.find((d) => d.date === date)
    return {
      date,
      isToday: i === 0,
      state: !row ? ('unset' as const) : row.is_open ? ('open' as const) : ('closed' as const),
      closureType: row?.closure_type ?? null,
      count: row ? countByDate.get(row.id) ?? 0 : 0,
    }
  })

  return {
    today,
    tomorrow,
    reviewCount: reviewCount ?? 0,
    waitingCount: waiting.length,
    soonestExpiryMinutes: soonestExpiry === null ? null : Math.max(0, Math.round(soonestExpiry / 60000)),
    todayPickups,
    tomorrowPickups,
    inProgressCount: inProgressCount ?? 0,
    revenueThisMonth,
    confirmedThisWeek: confirmedThisWeek ?? 0,
    week,
  }
}

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

function itemLabel(item: PickupOrder['order_items'][number]): string {
  const p = item.products
  if (!p) return `× ${item.quantity}`
  const short = /slab/i.test(p.name) ? 'Whole Slab' : p.weight_label
  return `${short} × ${item.quantity}`
}

function PickupList({ orders, empty }: { orders: PickupOrder[]; empty: string }) {
  if (!orders.length) return <p className="adm-empty">{empty}</p>
  return (
    <div>
      {orders.map((o) => (
        <div key={o.id} className="adm-row">
          <Link href={`/admin/orders/${o.id}`} className="adm-pickup-row">
            <span className="adm-pickup-time">
              {orderTimeLabel({ pickup_time: o.pickup_time, slot_window: one(o.delivery_slots)?.slot_window })}
            </span>
            <div>
              <span className="adm-pickup-name">{one(o.customers)?.name ?? '—'}</span>
              <div className="adm-chips">
                {o.order_items.map((item, i) => (
                  <ItemChip key={i} label={itemLabel(item)} style={item.serving_style} />
                ))}
              </div>
            </div>
            <StatusBadge status={o.status} />
          </Link>
        </div>
      ))}
    </div>
  )
}

// What to prepare: total quantity per product size and serving style.
function prepSummary(orders: PickupOrder[]): string {
  const totals = new Map<string, number>()
  for (const o of orders) {
    for (const item of o.order_items) {
      const p = item.products
      const size = p ? (/slab/i.test(p.name) ? 'Whole Slab' : p.weight_label) : 'Item'
      const key = `${size}${item.serving_style ? ` ${servingStyleLabel(item.serving_style)}` : ''}`
      totals.set(key, (totals.get(key) ?? 0) + item.quantity)
    }
  }
  return Array.from(totals, ([k, n]) => `${n} × ${k}`).join(' · ')
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminDashboard() {
  const d = await getDashboard()
  const nothingToDo = d.reviewCount === 0 && d.waitingCount === 0

  return (
    <>
      <PageHeader
        eyebrow={dateLabel(d.today, { weekday: 'long', month: 'long', day: 'numeric' })}
        title={greeting()}
      />

      <Card title="Needs your attention">
        {nothingToDo ? (
          <div className="adm-alert is-clear">
            <span className="adm-alert-text">All caught up. No payments to check right now.</span>
          </div>
        ) : (
          <div className="adm-grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            {d.reviewCount > 0 && (
              <Link href="/admin/orders?status=PAYMENT_REVIEW" className="adm-alert is-review">
                <span>
                  <span className="adm-alert-num">{d.reviewCount}</span>
                  <span className="adm-alert-text">
                    {d.reviewCount === 1 ? 'payment to review' : 'payments to review'}
                  </span>
                </span>
                <span className="adm-btn adm-btn-blue">Review</span>
              </Link>
            )}
            {d.waitingCount > 0 && (
              <Link href="/admin/orders?status=PENDING_PAYMENT" className="adm-alert is-waiting">
                <span>
                  <span className="adm-alert-num">{d.waitingCount}</span>
                  <span className="adm-alert-text">
                    {d.waitingCount === 1 ? 'order waiting for payment' : 'orders waiting for payment'}
                    {d.soonestExpiryMinutes !== null && (
                      <>, {d.waitingCount === 1 ? 'expires' : 'first expires'} in {d.soonestExpiryMinutes} min</>
                    )}
                  </span>
                </span>
                <span className="adm-btn adm-btn-outline">View</span>
              </Link>
            )}
          </div>
        )}
      </Card>

      <div className="adm-split">
        <Card title="Today’s pickups" note={`${PICKUP_LOCATION} · ${d.todayPickups.length} ${d.todayPickups.length === 1 ? 'order' : 'orders'}`}>
          <PickupList orders={d.todayPickups} empty="No pickups today." />
        </Card>

        <Card title="Tomorrow" note={dateLabel(d.tomorrow, { weekday: 'short', month: 'short', day: 'numeric' })}>
          <PickupList orders={d.tomorrowPickups} empty="No pickups tomorrow yet." />
          {d.tomorrowPickups.length > 0 && (
            <div className="adm-prep">
              <span className="adm-prep-label">To prepare</span>
              <span className="adm-prep-value">{prepSummary(d.tomorrowPickups)}</span>
            </div>
          )}
        </Card>
      </div>

      <div className="adm-grid-3">
        <Stat label="Confirmed this week" value={d.confirmedThisWeek} />
        <Stat label="Revenue this month" value={peso(d.revenueThisMonth)} />
        <Stat label="Orders in progress" value={d.inProgressCount} />
      </div>

      <Card title="Next 7 days" note={<Link href="/admin/calendar">Open calendar</Link>}>
        <div className="adm-week">
          {d.week.map((day) => (
            <div
              key={day.date}
              className={`adm-day${day.isToday ? ' is-today' : ''}${day.state === 'closed' ? ' is-closed' : ''}`}
            >
              <span className="adm-day-name">{dateLabel(day.date, { weekday: 'short', day: 'numeric' })}</span>
              {day.state === 'closed' ? (
                <>
                  <span className="adm-day-count">Closed</span>
                  <span className="adm-day-unit" style={{ textTransform: 'capitalize' }}>{day.closureType ?? ''}</span>
                </>
              ) : day.state === 'unset' ? (
                <>
                  <span className="adm-day-count" style={{ fontSize: 16, color: '#6B5D52' }}>Not set up</span>
                  <span className="adm-day-unit">&nbsp;</span>
                </>
              ) : (
                <>
                  <span className="adm-day-count">{day.count}</span>
                  <span className="adm-day-unit">{day.count === 1 ? 'order' : 'orders'}</span>
                </>
              )}
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}
