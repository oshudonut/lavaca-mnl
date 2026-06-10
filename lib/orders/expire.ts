import * as React from 'react'
import { createServiceClient } from '@/lib/supabase/service'
import { sendEmail } from '@/lib/resend/send'
import Cust06 from '@/lib/resend/templates/cust-06'

export async function expireStaleOrders(): Promise<{ expired: number }> {
  const supabase = createServiceClient()
  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()

  const { data: stale, error } = await supabase
    .from('orders')
    .select('id, order_number, delivery_slot_id, customers ( name, email )')
    .eq('status', 'PENDING_PAYMENT')
    .lt('created_at', cutoff)

  if (error) {
    console.error('[expire] failed to fetch stale orders:', error)
    return { expired: 0 }
  }

  let expired = 0

  for (const order of stale ?? []) {
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'EXPIRED', expired_at: new Date().toISOString() })
      .eq('id', order.id)

    if (updateError) {
      console.error('[expire] failed to expire order:', order.id, updateError)
      continue
    }

    // Release the delivery slot
    if (order.delivery_slot_id) {
      const { error: rpcError } = await supabase.rpc('decrement_slot_booking', {
        p_slot_id: order.delivery_slot_id,
      })
      if (rpcError) console.error('[expire] decrement_slot_booking error:', order.id, rpcError)
    }

    expired++

    const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers

    sendEmail({
      to: customer?.email ?? '',
      subject: `Your order has expired — please reorder`,
      react: React.createElement(Cust06, {
        order_number: order.order_number,
        customer_name: customer?.name ?? '',
      }),
      orderId: order.id,
      templateId: 'CUST-06',
    }).catch(err => console.error('[expire] CUST-06 send error:', order.id, err))
  }

  return { expired }
}
