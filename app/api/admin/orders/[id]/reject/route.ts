import { NextRequest, NextResponse } from 'next/server'
import * as React from 'react'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendEmail } from '@/lib/resend/send'
import Cust03 from '@/lib/resend/templates/cust-03'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { reason } = await request.json().catch(() => ({}))
  if (!reason?.trim()) {
    return NextResponse.json({ error: 'Rejection reason is required.' }, { status: 422 })
  }

  const supabase = createServiceClient()

  const { data: order } = await supabase
    .from('orders')
    .select('id, order_number, status, customers ( name, email )')
    .eq('id', params.id)
    .single()

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  if (order.status !== 'PAYMENT_REVIEW') {
    return NextResponse.json({ error: 'Order is not awaiting payment review.' }, { status: 409 })
  }

  const { error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'PENDING_PAYMENT',
      payment_screenshot_url: null,
      screenshot_uploaded_at: null,
    })
    .eq('id', params.id)

  if (updateError) return NextResponse.json({ error: 'Failed to reject payment.' }, { status: 500 })

  const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  sendEmail({
    to: customer?.email ?? '',
    subject: `Your payment was not accepted — Lavaca MNL ${order.order_number}`,
    react: React.createElement(Cust03, {
      order_number: order.order_number,
      customer_name: customer?.name ?? '',
      rejection_reason: reason.trim(),
      payment_url: `${baseUrl}/order/payment?order_id=${params.id}`,
    }),
    orderId: params.id,
    templateId: 'CUST-03',
  }).catch((err) => console.error('[reject] CUST-03 send error:', err))

  return NextResponse.json({ success: true })
}
