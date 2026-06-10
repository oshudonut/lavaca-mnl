import { NextRequest, NextResponse } from 'next/server'
import * as React from 'react'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendEmail } from '@/lib/resend/send'
import Cust04 from '@/lib/resend/templates/cust-04'
import { syncOrderToCalendar } from '@/lib/orders/calendar-sync'

const WINDOW_LABELS: Record<string, string> = {
  AM: '9:00 AM – 12:00 PM',
  PM: '1:00 PM – 5:00 PM',
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { payment_reference } = await request.json().catch(() => ({}))
  if (!payment_reference?.trim()) {
    return NextResponse.json({ error: 'Payment reference is required.' }, { status: 422 })
  }

  const supabase = createServiceClient()

  const { data: order } = await supabase
    .from('orders')
    .select(`
      id, order_number, status, total_amount,
      customers ( name, email ),
      delivery_slots (
        slot_window,
        delivery_dates ( date )
      ),
      order_items (
        quantity, subtotal,
        products ( name, weight_label )
      )
    `)
    .eq('id', params.id)
    .single()

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  if (order.status !== 'PAYMENT_REVIEW') {
    return NextResponse.json({ error: 'Order is not awaiting payment review.' }, { status: 409 })
  }

  const { error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'CONFIRMED',
      payment_reference: payment_reference.trim(),
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', params.id)

  if (updateError) return NextResponse.json({ error: 'Failed to confirm order.' }, { status: 500 })

  // Fire EVT-004 (GCal sync) non-blocking
  syncOrderToCalendar(params.id).catch((err) =>
    console.error('[confirm] EVT-004 calendar sync error:', err)
  )

  // Send CUST-04 non-blocking
  const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers
  const slot = Array.isArray(order.delivery_slots) ? order.delivery_slots[0] : order.delivery_slots
  const dateRow = Array.isArray(slot?.delivery_dates) ? slot.delivery_dates[0] : slot?.delivery_dates
  const deliveryDate = dateRow?.date
    ? new Date(`${dateRow.date}T00:00:00+08:00`).toLocaleDateString('en-PH', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Manila',
      })
    : ''

  sendEmail({
    to: customer?.email ?? '',
    subject: `✅ Order Confirmed! Lavaca MNL ${order.order_number}`,
    react: React.createElement(Cust04, {
      order_number: order.order_number,
      customer_name: customer?.name ?? '',
      delivery_date: deliveryDate,
      delivery_window: WINDOW_LABELS[slot?.slot_window ?? 'AM'] ?? '',
      items: (order.order_items ?? []).map((item: any) => ({
        name: item.products?.name ?? '',
        weight_label: item.products?.weight_label ?? '',
        quantity: item.quantity,
        subtotal: item.subtotal,
      })),
      total_amount: order.total_amount,
    }),
    orderId: params.id,
    templateId: 'CUST-04',
  }).catch((err) => console.error('[confirm] CUST-04 send error:', err))

  return NextResponse.json({ success: true })
}
