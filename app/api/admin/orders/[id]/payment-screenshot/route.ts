import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Verify admin session
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()

  const { data: order } = await supabase
    .from('orders')
    .select('payment_screenshot_url')
    .eq('id', params.id)
    .single()

  if (!order?.payment_screenshot_url) {
    return NextResponse.json({ error: 'No screenshot on file' }, { status: 404 })
  }

  // Generate 1-hour signed URL (design constraint #3)
  const { data: signedData, error } = await supabase.storage
    .from('payment-screenshots')
    .createSignedUrl(order.payment_screenshot_url, 3600)

  if (error || !signedData) {
    return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 })
  }

  return NextResponse.json({ signedUrl: signedData.signedUrl })
}
