import { createServiceClient } from '@/lib/supabase/service'
import { orderTimeLabel } from '@/lib/delivery/pickup'
import { servingStyleLabel } from '@/lib/orders/validation'

export type OrderSummary = {
  id: string
  order_number: string
  status: string
  created_at: string
  subtotal: number
  total_amount: number
  special_request: string | null
  address: string | null        // "street, village, city zip"
  instagram_handle: string | null
  payment_method: 'gcash' | 'bank_transfer'
  customer: {
    name: string
    email: string
    phone: string
  }
  pickup_date: string          // "YYYY-MM-DD"
  time_label: string           // "1:00 PM", or the legacy delivery window
  items: {
    product_name: string
    weight_label: string
    serving: string              // "Ready to Serve" / "Frozen for Later", or ""
    serving_style: string | null // raw value: 'warm' | 'frozen' | null
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
      special_request, payment_method, pickup_time,
      address_street, address_village, address_city, address_zip, instagram_handle,
      customers ( name, email, phone ),
      delivery_dates ( date ),
      delivery_slots ( slot_window ),
      order_items (
        quantity, unit_price, subtotal, serving_style,
        products ( name, weight_label )
      )
    `)
    .eq('id', orderId)
    .single()

  if (error || !data) return null

  const slot = Array.isArray(data.delivery_slots) ? data.delivery_slots[0] : data.delivery_slots
  const customer = Array.isArray(data.customers) ? data.customers[0] : data.customers
  const dateRow = Array.isArray(data.delivery_dates) ? data.delivery_dates[0] : data.delivery_dates

  return {
    id: data.id,
    order_number: data.order_number,
    status: data.status,
    created_at: data.created_at,
    subtotal: data.subtotal,
    total_amount: data.total_amount,
    special_request: data.special_request,
    address: data.address_street
      ? [data.address_street, data.address_village, `${data.address_city ?? ''} ${data.address_zip ?? ''}`.trim()]
          .filter(Boolean)
          .join(', ')
      : null,
    instagram_handle: data.instagram_handle,
    payment_method: data.payment_method,
    customer: {
      name: customer?.name ?? '',
      email: customer?.email ?? '',
      phone: customer?.phone ?? '',
    },
    pickup_date: dateRow?.date ?? '',
    time_label: orderTimeLabel({ pickup_time: data.pickup_time, slot_window: slot?.slot_window }),
    items: (data.order_items ?? []).map((item: any) => ({
      product_name: item.products?.name ?? '',
      weight_label: item.products?.weight_label ?? '',
      serving: servingStyleLabel(item.serving_style),
      serving_style: item.serving_style ?? null,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal,
    })),
  }
}
