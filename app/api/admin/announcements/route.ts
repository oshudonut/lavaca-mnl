import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET() {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const { data } = await supabase
    .from('business_announcements')
    .select('id, is_active, message, closed_from, closed_until, created_at, updated_at')
    .order('created_at', { ascending: false })
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
    is_active = false,
    message = '',
    closed_from = null,
    closed_until = null,
  } = body

  const supabase = createServiceClient()

  // Deactivate all existing active announcements before activating a new one
  if (is_active) {
    await supabase
      .from('business_announcements')
      .update({ is_active: false })
      .eq('is_active', true)
  }

  const payload = {
    is_active,
    message: message?.trim() ?? '',
    closed_from: closed_from || null,
    closed_until: closed_until || null,
    updated_at: new Date().toISOString(),
  }

  // Fetch the most recent row to update, or insert if none exists
  const { data: existing } = await supabase
    .from('business_announcements')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let result
  if (existing) {
    const { data } = await supabase
      .from('business_announcements')
      .update(payload)
      .eq('id', existing.id)
      .select('id, is_active, message, closed_from, closed_until, updated_at')
      .single()
    result = data
  } else {
    const { data } = await supabase
      .from('business_announcements')
      .insert(payload)
      .select('id, is_active, message, closed_from, closed_until, updated_at')
      .single()
    result = data
  }

  if (!result) return NextResponse.json({ error: 'Failed to save announcement' }, { status: 500 })

  return NextResponse.json(result)
}
