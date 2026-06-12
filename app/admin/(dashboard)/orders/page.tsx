import { createServiceClient } from '@/lib/supabase/service'
import { OrdersTable } from '@/components/admin/OrdersTable'
import type { OrderTableRow } from '@/components/admin/OrdersTable'

export const dynamic = 'force-dynamic'

export default async function AdminOrdersPage() {
  const supabase = createServiceClient()

  const { data: rows } = await supabase
    .from('orders')
    .select(`
      id, order_number, created_at, status, total_amount,
      customers ( name ),
      delivery_slots (
        slot_window,
        delivery_dates ( date )
      ),
      order_items (
        quantity,
        products ( name, weight_label )
      )
    `)
    .order('created_at', { ascending: false })

  const orders: OrderTableRow[] = (rows ?? []).map((row: any) => {
    const customer = Array.isArray(row.customers) ? row.customers[0] : row.customers
    const slot = Array.isArray(row.delivery_slots) ? row.delivery_slots[0] : row.delivery_slots
    const dateRow = Array.isArray(slot?.delivery_dates) ? slot.delivery_dates[0] : slot?.delivery_dates

    const itemsSummary = (row.order_items ?? [])
      .map((item: any) => `${item.products?.name ?? ''} ×${item.quantity}`)
      .join(', ')

    return {
      id: row.id,
      order_number: row.order_number,
      created_at: row.created_at,
      status: row.status,
      total_amount: row.total_amount,
      customer_name: customer?.name ?? '—',
      delivery_date: dateRow?.date ?? '—',
      slot_window: slot?.slot_window ?? '—',
      items_summary: itemsSummary || '—',
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">All customer orders</p>
      </div>
      <OrdersTable orders={orders} />
    </div>
  )
}
