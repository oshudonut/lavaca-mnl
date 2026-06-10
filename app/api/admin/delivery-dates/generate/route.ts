import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

function formatUTCDate(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export async function POST(request: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const { from_date, to_date, max_orders_total = 10, am_max = 5, pm_max = 5 } = body ?? {}

  const dateRe = /^\d{4}-\d{2}-\d{2}$/
  if (!from_date || !to_date || !dateRe.test(from_date) || !dateRe.test(to_date)) {
    return NextResponse.json({ error: 'from_date and to_date are required (YYYY-MM-DD)' }, { status: 422 })
  }
  if (from_date > to_date) {
    return NextResponse.json({ error: 'from_date must be <= to_date' }, { status: 422 })
  }

  const supabase = createServiceClient()

  const { data: existing } = await supabase
    .from('delivery_dates')
    .select('date')
    .gte('date', from_date)
    .lte('date', to_date)

  const existingSet = new Set((existing ?? []).map((r: any) => r.date as string))

  const toCreate: string[] = []
  let skipped = 0

  const cursor = new Date(from_date + 'T00:00:00Z')
  const end = new Date(to_date + 'T00:00:00Z')

  while (cursor <= end) {
    const dow = cursor.getUTCDay() // 0=Sun, 1=Mon
    if (dow !== 1) {              // skip Monday
      const d = formatUTCDate(cursor)
      if (existingSet.has(d)) {
        skipped++
      } else {
        toCreate.push(d)
      }
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  let created = 0
  for (const date of toCreate) {
    const { data: inserted, error } = await supabase
      .from('delivery_dates')
      .insert({ date, is_open: true, max_orders_total })
      .select('id')
      .single()

    if (error || !inserted) {
      console.error('[generate] failed to insert date:', date, error)
      continue
    }

    const { error: slotErr } = await supabase.from('delivery_slots').insert([
      {
        delivery_date_id: inserted.id,
        slot_window: 'AM',
        max_orders: am_max,
        is_open: true,
        window_start: '09:00',
        window_end: '12:00',
        booked_count: 0,
      },
      {
        delivery_date_id: inserted.id,
        slot_window: 'PM',
        max_orders: pm_max,
        is_open: true,
        window_start: '13:00',
        window_end: '17:00',
        booked_count: 0,
      },
    ])

    if (slotErr) console.error('[generate] failed to insert slots for date:', date, slotErr)
    else created++
  }

  return NextResponse.json({ created, skipped })
}
