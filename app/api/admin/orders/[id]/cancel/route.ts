import { NextRequest, NextResponse } from 'next/server'
import * as React from 'react'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendEmail } from '@/lib/resend/send'
import Cust05 from '@/lib/resend/templates/cust-05'

const TERMINAL = ['CONFIRMED', 'DELIVERED', 'CANCELLED', 'EXPIRED']

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { reason } = await request.json().catch(() => ({}))
  if (!reason?.trim()) {
    return NextResponse.json({ error: 'Cancellation reason is required.' }, { status: 422 })
  }

  const supabase = createServiceClient()

  const { data: order } = await supabase
    .from('orders')
    .select('id, order_number, status, delivery_slot_id, customers ( name, email )')
    .eq('id', params.id)
    .single()

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  if (TERMINAL.includes(order.status)) {
    return NextResponse.json({ error: 'This order cannot be cancelled.' }, { status: 409 })
  }

  const { error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'CANCELLED',
      cancellation_reason: reason.trim(),
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', params.id)

  if (updateError) return NextResponse.json({ error: 'Failed to cancel order.' }, { status: 500 })

  // Decrement booked_count to free the slot
  if (order.delivery_slot_id) {
    await supabase.rpc('decrement_slot_booking', { p_slot_id: order.delivery_slot_id })
      .then(({ error }) => {
        if (error) console.error('[cancel] decrement_slot_booking error:', error)
      })
  }

  const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers

  sendEmail({
    to: customer?.email ?? '',
    subject: `Your order has been cancelled — Lavaca MNL ${order.order_number}`,
    react: React.createElement(Cust05, {
      order_number: order.order_number,
      customer_name: customer?.name ?? '',
      cancellation_reason: reason.trim(),
    }),
    orderId: params.id,
    templateId: 'CUST-05',
  }).catch((err) => console.error('[cancel] CUST-05 send error:', err))

  return NextResponse.json({ success: true })
}
