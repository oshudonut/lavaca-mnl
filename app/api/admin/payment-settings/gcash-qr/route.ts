import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const BUCKET = 'payment-assets'
const MAX_BYTES = 2 * 1024 * 1024

// MIME detection via magic bytes — never trust the browser-supplied type
const SIGNATURES = [
  { mime: 'image/jpeg', ext: 'jpg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', ext: 'png', bytes: [0x89, 0x50, 0x4e, 0x47] },
]

async function requireAdmin() {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  return user
}

// Updates the latest payment_settings row (or creates one) with the QR URL.
async function saveQrUrl(url: string | null) {
  const supabase = createServiceClient()
  const { data: existing } = await supabase
    .from('payment_settings')
    .select('id, gcash_qr_url')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const payload = { gcash_qr_url: url, updated_at: new Date().toISOString() }
  const { error } = existing
    ? await supabase.from('payment_settings').update(payload).eq('id', existing.id)
    : await supabase.from('payment_settings').insert(payload)

  return { error, previousUrl: existing?.gcash_qr_url ?? null }
}

// Removes a previously uploaded QR file; failures are logged, not fatal.
async function removeStoredFile(publicUrl: string | null) {
  if (!publicUrl) return
  const marker = `/object/public/${BUCKET}/`
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return
  const path = publicUrl.slice(idx + marker.length)
  const { error } = await createServiceClient().storage.from(BUCKET).remove([path])
  if (error) console.error('[gcash-qr] failed to remove old file:', error)
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await request.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Choose an image file to upload.' }, { status: 422 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image must be 2MB or smaller.' }, { status: 422 })
  }

  const buffer = new Uint8Array(await file.arrayBuffer())
  const sig = SIGNATURES.find((s) => s.bytes.every((b, i) => buffer[i] === b))
  if (!sig) {
    return NextResponse.json({ error: 'Upload a JPG or PNG image.' }, { status: 422 })
  }

  const supabase = createServiceClient()
  const path = `gcash-qr-${Date.now()}.${sig.ext}`
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: sig.mime })
  if (uploadError) {
    console.error('[gcash-qr] upload error:', uploadError)
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)
  const { error, previousUrl } = await saveQrUrl(publicUrl)
  if (error) {
    await removeStoredFile(publicUrl)
    return NextResponse.json({ error: 'Failed to save the QR code.' }, { status: 500 })
  }
  await removeStoredFile(previousUrl)

  return NextResponse.json({ gcash_qr_url: publicUrl })
}

export async function DELETE() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error, previousUrl } = await saveQrUrl(null)
  if (error) return NextResponse.json({ error: 'Failed to remove the QR code.' }, { status: 500 })
  await removeStoredFile(previousUrl)

  return NextResponse.json({ gcash_qr_url: null })
}
