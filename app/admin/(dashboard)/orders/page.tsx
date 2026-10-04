import { createServiceClient } from '@/lib/supabase/service'
import { expireStaleOrders } from '@/lib/orders/expire'
import { OrdersTable } from '@/components/admin/OrdersTable'
import type { OrderTableRow } from '@/components/admin/OrdersTable'
import { orderTimeLabel } from '@/lib/delivery/pickup'
import { PageHeader } from '@/components/admin/ui'

export const dynamic = 'force-dynamic'

function manilaDate(offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 86400000)
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
}

function pickupDayLabel(date: string | undefined, today: string, tomorrow: string): string {
  if (!date) return '—'
  if (date === today) return 'Today'
  if (date === tomorrow) return 'Tomorrow'
  return new Date(`${date}T00:00:00+08:00`).toLocaleDateString('en-PH', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Manila',
  })
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  // Expire stale orders on every admin page load so the list stays current
  await expireStaleOrders({ deferEmails: true })

  const supabase = createServiceClient()

  const { data: rows } = await supabase
    .from('orders')
    .select(`
      id, order_number, created_at, status, total_amount, pickup_time,
      customers ( name ),
      delivery_dates ( date ),
      delivery_slots ( slot_window ),
      order_items (
        quantity, serving_style,
        products ( name, weight_label )
      )
    `)
    .order('created_at', { ascending: false })

  const today = manilaDate()
  const tomorrow = manilaDate(1)

  const orders: OrderTableRow[] = (rows ?? []).map((row: any) => {
    const customer = Array.isArray(row.customers) ? row.customers[0] : row.customers
    const slot = Array.isArray(row.delivery_slots) ? row.delivery_slots[0] : row.delivery_slots
    const dateRow = Array.isArray(row.delivery_dates) ? row.delivery_dates[0] : row.delivery_dates

    return {
      id: row.id,
      order_number: row.order_number,
      created_at: row.created_at,
      status: row.status,
      total_amount: row.total_amount,
      customer_name: customer?.name ?? '—',
      pickup_day: pickupDayLabel(dateRow?.date, today, tomorrow),
      time_label: orderTimeLabel({ pickup_time: row.pickup_time, slot_window: slot?.slot_window }),
      items: (row.order_items ?? []).map((item: any) => ({
        label: `${/slab/i.test(item.products?.name ?? '') ? 'Whole Slab' : item.products?.weight_label ?? 'Item'} × ${item.quantity}`,
        serving_style: item.serving_style ?? null,
      })),
    }
  })

  return (
    <>
      <PageHeader title="Orders" />
      <OrdersTable orders={orders} initialStatus={searchParams.status} />
    </>
  )
}
