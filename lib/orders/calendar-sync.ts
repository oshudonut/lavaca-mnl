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
      customers ( name ),
      delivery_slots (
        window_start,
        window_end,
        delivery_dates ( date )
      )
    `)
    .eq('id', orderId)
    .single()

  if (!order) return

  const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers
  const slot = Array.isArray(order.delivery_slots) ? order.delivery_slots[0] : order.delivery_slots
  const dateRow = Array.isArray(slot?.delivery_dates) ? slot.delivery_dates[0] : slot?.delivery_dates

  if (!slot || !dateRow) return

  const input: OrderEventInput = {
    order_number: order.order_number,
    customer_name: customer?.name ?? 'Unknown',
    delivery_date: dateRow.date,
    window_start: slot.window_start,
    window_end: slot.window_end,
  }

  const eventId = await createOrderEvent(input)

  if (eventId) {
    await supabase
      .from('orders')
      .update({ calendar_event_id: eventId })
      .eq('id', orderId)
  }
}
