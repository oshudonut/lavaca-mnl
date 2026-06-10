import { NextRequest, NextResponse } from 'next/server'
import * as React from 'react'
import { createServiceClient } from '@/lib/supabase/service'
import { sendEmail } from '@/lib/resend/send'
import Admin02 from '@/lib/resend/templates/admin-02'

// ---------------------------------------------------------------------------
// MIME detection via magic bytes
// ---------------------------------------------------------------------------
const MIME_SIGNATURES = [
  { mime: 'image/jpeg', bytes: [0xFF, 0xD8, 0xFF] },
  { mime: 'image/png',  bytes: [0x89, 0x50, 0x4E, 0x47] },
  { mime: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] },
]

function detectMime(buffer: Uint8Array): string | null {
  for (const sig of MIME_SIGNATURES) {
    if (sig.bytes.every((b, i) => buffer[i] === b)) return sig.mime
  }
  return null
}

const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/pdf': 'pdf',
}

// ---------------------------------------------------------------------------
// POST /api/orders/[id]/payment-screenshot — EVT-002
// ---------------------------------------------------------------------------
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const orderId = params.id
  if (!orderId) {
    return NextResponse.json({ error: 'Missing order ID' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Fetch order to verify it exists and is in PENDING_PAYMENT
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      id, order_number, status, payment_method,
      customers ( name, email )
    `)
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }
  if (order.status !== 'PENDING_PAYMENT') {
    return NextResponse.json(
      { error: 'Screenshot already submitted for this order.' },
      { status: 409 }
    )
  }

  // Parse multipart form data
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('screenshot')
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Max 5 MB
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File exceeds 5 MB limit' }, { status: 422 })
  }

  // Server-side MIME validation via magic bytes
  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)
  const mime = detectMime(buffer)

  if (!mime) {
    return NextResponse.json(
      { error: 'Invalid file type. Only JPEG, PNG, and PDF are accepted.' },
      { status: 422 }
    )
  }

  // Upload to private storage bucket
  const ext = MIME_EXT[mime]
  const storagePath = `${orderId}/${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('payment-screenshots')
    .upload(storagePath, buffer, { contentType: mime })

  if (uploadError) {
    console.error('[payment-screenshot] Storage upload failed:', uploadError)
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
  }

  // Update order status
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      payment_screenshot_url: storagePath,
      status: 'PAYMENT_REVIEW',
      screenshot_uploaded_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  if (updateError) {
    console.error('[payment-screenshot] Order update failed:', updateError)
    return NextResponse.json({ error: 'Failed to update order.' }, { status: 500 })
  }

  // Fire ADMIN-02 email non-blocking
  const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  sendEmail({
    to: process.env.OWNER_EMAIL ?? '',
    subject: `Payment Screenshot Uploaded — ${order.order_number}`,
    react: React.createElement(Admin02, {
      order_id: orderId,
      order_number: order.order_number,
      customer_name: customer?.name ?? '',
      customer_email: customer?.email ?? '',
      admin_url: `${baseUrl}/admin/orders/${orderId}`,
    }),
    orderId,
    templateId: 'ADMIN-02',
  }).catch((err) => console.error('[payment-screenshot] ADMIN-02 send error:', err))

  return NextResponse.json({ success: true })
}
