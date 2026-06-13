import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Auth check — same pattern as all other admin API routes
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = params
  if (!id) return NextResponse.json({ error: 'Missing order id' }, { status: 400 })

  const supabase = createServiceClient()

  // Fetch order to get storage path for cleanup
  const { data: order } = await supabase
    .from('orders')
    .select('id, payment_screenshot_url')
    .eq('id', id)
    .single()

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  // Delete dependent rows first to satisfy FK constraints
  const { error: itemsError } = await supabase.from('order_items').delete().eq('order_id', id)
  if (itemsError) console.error('[delete] order_items error:', itemsError.message)

  const { error: notifError } = await supabase.from('notifications').delete().eq('order_id', id)
  if (notifError) console.error('[delete] notifications error:', notifError.message)

  // Clean up payment screenshot from storage if one was uploaded
  if (order.payment_screenshot_url) {
    await supabase.storage
      .from('payment-screenshots')
      .remove([order.payment_screenshot_url])
      .catch((err: unknown) => console.error('[delete] storage cleanup error:', err))
  }

  const { error } = await supabase.from('orders').delete().eq('id', id)
  if (error) {
    console.error('[delete] orders error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
