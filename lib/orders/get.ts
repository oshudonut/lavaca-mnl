import { createServiceClient } from '@/lib/supabase/service'

export type OrderSummary = {
  id: string
  order_number: string
  status: string
  created_at: string
  subtotal: number
  total_amount: number
  delivery_address: string
  payment_method: 'gcash' | 'bank_transfer'
  customer: {
    name: string
    email: string
    phone: string
  }
  delivery_date: string        // "YYYY-MM-DD"
  slot_window: 'AM' | 'PM'
  window_start: string
  window_end: string
  items: {
    product_name: string
    weight_label: string
    quantity: number
    unit_price: number
    subtotal: number
  }[]
}

export async function getOrderSummary(orderId: string): Promise<OrderSummary | null> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('orders')
    .select(`
      id, order_number, status, created_at, subtotal, total_amount,
      delivery_address, payment_method,
      customers ( name, email, phone ),
      delivery_slots (
        slot_window, window_start, window_end,
        delivery_dates ( date )
      ),
      order_items (
        quantity, unit_price, subtotal,
        products ( name, weight_label )
      )
    `)
    .eq('id', orderId)
    .single()

  if (error || !data) return null

  const slot = Array.isArray(data.delivery_slots) ? data.delivery_slots[0] : data.delivery_slots
  const customer = Array.isArray(data.customers) ? data.customers[0] : data.customers
  const deliveryDate = Array.isArray(slot?.delivery_dates)
    ? slot.delivery_dates[0]
    : slot?.delivery_dates

  return {
    id: data.id,
    order_number: data.order_number,
    status: data.status,
    created_at: data.created_at,
    subtotal: data.subtotal,
    total_amount: data.total_amount,
    delivery_address: data.delivery_address,
    payment_method: data.payment_method,
    customer: {
      name: customer?.name ?? '',
      email: customer?.email ?? '',
      phone: customer?.phone ?? '',
    },
    delivery_date: deliveryDate?.date ?? '',
    slot_window: slot?.slot_window ?? 'AM',
    window_start: slot?.window_start ?? '',
    window_end: slot?.window_end ?? '',
    items: (data.order_items ?? []).map((item: any) => ({
      product_name: item.products?.name ?? '',
      weight_label: item.products?.weight_label ?? '',
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal,
    })),
  }
}
