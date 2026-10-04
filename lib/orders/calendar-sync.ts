import { createServiceClient } from '@/lib/supabase/service'
import { createOrderEvent, type OrderEventInput } from '@/lib/calendar/service'

// EVT-004: called non-blocking from the confirm API route after EVT-003.
// Fetches order data, creates a Google Calendar event, and stores the event ID.
// Never throws — all errors are absorbed by createOrderEvent's internal logging.
export async function syncOrderToCalendar(orderId: string): Promise<void> {
  const supabase = createServiceClient()

  const { data: order } = await supabase
    .from('orders')
    .select(`
      order_number,
      pickup_time,
      customers ( name ),
      delivery_dates ( date ),
      delivery_slots ( window_start, window_end )
    `)
    .eq('id', orderId)
    .single()

  if (!order) return

  const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers
  const slot = Array.isArray(order.delivery_slots) ? order.delivery_slots[0] : order.delivery_slots
  const dateRow = Array.isArray(order.delivery_dates) ? order.delivery_dates[0] : order.delivery_dates

  if (!dateRow) return

  // Pickup orders get a 30-minute event at the pickup time; legacy delivery
  // orders keep their slot window.
  let window_start: string
  let window_end: string
  if (order.pickup_time) {
    const [h, m] = order.pickup_time.split(':').map(Number)
    const endMinutes = h * 60 + m + 30
    window_start = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    window_end = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`
  } else if (slot) {
    window_start = slot.window_start
    window_end = slot.window_end
  } else {
    return
  }

  const input: OrderEventInput = {
    order_number: order.order_number,
    customer_name: customer?.name ?? 'Unknown',
    delivery_date: dateRow.date,
    window_start,
    window_end,
  }

  const eventId = await createOrderEvent(input)

  if (eventId) {
    await supabase
      .from('orders')
      .update({ calendar_event_id: eventId })
      .eq('id', orderId)
  }
}
