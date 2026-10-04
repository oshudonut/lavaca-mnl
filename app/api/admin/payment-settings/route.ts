import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET() {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const { data } = await supabase
    .from('payment_settings')
    .select('id, gcash_number, gcash_account_name, gcash_qr_url, bpi_account, bpi_name, bdo_account, bdo_name, updated_at')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json(data ?? null)
}

export async function PUT(request: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 422 })

  const {
    gcash_number = '',
    gcash_account_name = '',
    bpi_account = '',
    bpi_name = '',
    bdo_account = '',
    bdo_name = '',
  } = body

  const supabase = createServiceClient()

  const payload = {
    gcash_number: String(gcash_number).trim(),
    gcash_account_name: String(gcash_account_name).trim(),
    bpi_account: String(bpi_account).trim(),
    bpi_name: String(bpi_name).trim(),
    bdo_account: String(bdo_account).trim(),
    bdo_name: String(bdo_name).trim(),
    updated_at: new Date().toISOString(),
  }

  // Fetch the most recent row to update, or insert if none exists
  const { data: existing } = await supabase
    .from('payment_settings')
    .select('id')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let result
  if (existing) {
    const { data } = await supabase
      .from('payment_settings')
      .update(payload)
      .eq('id', existing.id)
      .select('id, gcash_number, gcash_account_name, gcash_qr_url, bpi_account, bpi_name, bdo_account, bdo_name, updated_at')
      .single()
    result = data
  } else {
    const { data } = await supabase
      .from('payment_settings')
      .insert(payload)
      .select('id, gcash_number, gcash_account_name, gcash_qr_url, bpi_account, bpi_name, bdo_account, bdo_name, updated_at')
      .single()
    result = data
  }

  if (!result) return NextResponse.json({ error: 'Failed to save payment settings' }, { status: 500 })

  return NextResponse.json(result)
}
