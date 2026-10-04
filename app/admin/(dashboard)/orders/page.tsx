import { createServiceClient } from '@/lib/supabase/service'
import { expireStaleOrders } from '@/lib/orders/expire'
import { OrdersTable } from '@/components/admin/OrdersTable'
import type { OrderTableRow } from '@/components/admin/OrdersTable'
import { orderTimeLabel } from '@/lib/delivery/pickup'
import { servingStyleLabel } from '@/lib/orders/validation'

export const dynamic = 'force-dynamic'

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

  const orders: OrderTableRow[] = (rows ?? []).map((row: any) => {
    const customer = Array.isArray(row.customers) ? row.customers[0] : row.customers
    const slot = Array.isArray(row.delivery_slots) ? row.delivery_slots[0] : row.delivery_slots
    const dateRow = Array.isArray(row.delivery_dates) ? row.delivery_dates[0] : row.delivery_dates

    const itemsSummary = (row.order_items ?? [])
      .map((item: any) => {
        const serving = servingStyleLabel(item.serving_style)
        return `${item.products?.name ?? ''} ×${item.quantity}${serving ? ` (${serving})` : ''}`
      })
      .join(', ')

    return {
      id: row.id,
      order_number: row.order_number,
      created_at: row.created_at,
      status: row.status,
      total_amount: row.total_amount,
      customer_name: customer?.name ?? '—',
      pickup_date: dateRow?.date ?? '—',
      time_label: orderTimeLabel({ pickup_time: row.pickup_time, slot_window: slot?.slot_window }),
      items_summary: itemsSummary || '—',
    }
  })

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
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
          Orders
        </h1>
      </div>
      <OrdersTable orders={orders} initialStatus={searchParams.status} />
    </div>
  )
}
