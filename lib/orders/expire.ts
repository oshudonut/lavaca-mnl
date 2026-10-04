import * as React from 'react'
import { waitUntil } from '@vercel/functions'
import { createServiceClient } from '@/lib/supabase/service'
import { sendEmail } from '@/lib/resend/send'
import Cust06 from '@/lib/resend/templates/cust-06'

/**
 * Expires PENDING_PAYMENT orders older than 2 hours.
 *
 * Statuses are updated in a single query so callers see accurate data right
 * away. With `deferEmails`, the CUST-06 emails are sent after the response
 * (via waitUntil) so a page load isn't held up by email delivery.
 */
export async function expireStaleOrders(
  { deferEmails = false }: { deferEmails?: boolean } = {}
): Promise<{ expired: number }> {
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
  if (!stale?.length) return { expired: 0 }

  // Re-check the status in the update so an order whose screenshot arrived
  // in the meantime isn't expired.
  const { data: updated, error: updateError } = await supabase
    .from('orders')
    .update({ status: 'EXPIRED', expired_at: new Date().toISOString() })
    .in('id', stale.map((o) => o.id))
    .eq('status', 'PENDING_PAYMENT')
    .select('id')

  if (updateError) {
    console.error('[expire] failed to expire orders:', updateError)
    return { expired: 0 }
  }

  const expiredIds = new Set((updated ?? []).map((o) => o.id))
  const expiredOrders = stale.filter((o) => expiredIds.has(o.id))

  // Release legacy delivery slots (pickup orders have none)
  await Promise.all(
    expiredOrders
      .filter((o) => o.delivery_slot_id)
      .map(async (o) => {
        const { error: rpcError } = await supabase.rpc('decrement_slot_booking', {
          p_slot_id: o.delivery_slot_id,
        })
        if (rpcError) console.error('[expire] decrement_slot_booking error:', o.id, rpcError)
      })
  )

  const sendAll = () =>
    Promise.allSettled(
      expiredOrders.map((order) => {
        const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers
        return sendEmail({
          to: customer?.email ?? '',
          subject: `Your order has expired — please reorder`,
          react: React.createElement(Cust06, {
            order_number: order.order_number,
            customer_name: customer?.name ?? '',
          }),
          orderId: order.id,
          templateId: 'CUST-06',
        })
      })
    )

  if (deferEmails) waitUntil(sendAll())
  else await sendAll()

  return { expired: expiredOrders.length }
}
