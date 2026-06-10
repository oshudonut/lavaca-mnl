import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createAvailabilityBlock, patchAvailabilityBlock } from '@/lib/calendar/service'

export async function GET(request: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const month = request.nextUrl.searchParams.get('month')
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: 'month param required (YYYY-MM)' }, { status: 400 })
  }

  const [year, mon] = month.split('-').map(Number)
  const from = `${month}-01`
  const lastDay = new Date(year, mon, 0).getDate()
  const to = `${month}-${String(lastDay).padStart(2, '0')}`

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('delivery_dates')
    .select(`
      id, date, is_open, max_orders_total, closure_reason, closure_type, cal_availability_event_id,
      delivery_slots ( id, slot_window, max_orders, booked_count, is_open, window_start, window_end )
    `)
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: true })

  if (error) return NextResponse.json({ error: 'Failed to fetch delivery dates' }, { status: 500 })

  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body?.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    return NextResponse.json({ error: 'date is required (YYYY-MM-DD)' }, { status: 422 })
  }

  const {
    date,
    max_orders_total = 10,
    am_enabled = true,
    am_max = 5,
    pm_enabled = true,
    pm_max = 5,
  } = body

  const supabase = createServiceClient()

  const { data: existing } = await supabase
    .from('delivery_dates')
    .select('id, cal_availability_event_id')
    .eq('date', date)
    .maybeSingle()

  let dateId: string
  let existingEventId: string | null = null
  const isNew = !existing

  if (existing) {
    dateId = existing.id
    existingEventId = existing.cal_availability_event_id
    const { error } = await supabase
      .from('delivery_dates')
      .update({ is_open: true, max_orders_total, closure_reason: null, closure_type: null })
      .eq('id', dateId)
    if (error) return NextResponse.json({ error: 'Failed to update delivery date' }, { status: 500 })
  } else {
    const { data: inserted, error } = await supabase
      .from('delivery_dates')
      .insert({ date, is_open: true, max_orders_total })
      .select('id')
      .single()
    if (error || !inserted) return NextResponse.json({ error: 'Failed to create delivery date' }, { status: 500 })
    dateId = inserted.id
  }

  // Upsert AM slot
  const { data: amSlot } = await supabase
    .from('delivery_slots')
    .select('id')
    .eq('delivery_date_id', dateId)
    .eq('slot_window', 'AM')
    .maybeSingle()

  if (amSlot) {
    await supabase.from('delivery_slots').update({ max_orders: am_max, is_open: am_enabled }).eq('id', amSlot.id)
  } else {
    await supabase.from('delivery_slots').insert({
      delivery_date_id: dateId,
      slot_window: 'AM',
      max_orders: am_max,
      is_open: am_enabled,
      window_start: '09:00',
      window_end: '12:00',
      booked_count: 0,
    })
  }

  // Upsert PM slot
  const { data: pmSlot } = await supabase
    .from('delivery_slots')
    .select('id')
    .eq('delivery_date_id', dateId)
    .eq('slot_window', 'PM')
    .maybeSingle()

  if (pmSlot) {
    await supabase.from('delivery_slots').update({ max_orders: pm_max, is_open: pm_enabled }).eq('id', pmSlot.id)
  } else {
    await supabase.from('delivery_slots').insert({
      delivery_date_id: dateId,
      slot_window: 'PM',
      max_orders: pm_max,
      is_open: pm_enabled,
      window_start: '13:00',
      window_end: '17:00',
      booked_count: 0,
    })
  }

  // EVT-008: non-blocking GCal sync
  const syncGcal = async () => {
    let eventId: string | null = null
    if (existingEventId) {
      await patchAvailabilityBlock(existingEventId, date)
      eventId = existingEventId
    } else {
      eventId = await createAvailabilityBlock(date)
    }
    if (eventId && !existingEventId) {
      await supabase
        .from('delivery_dates')
        .update({ cal_availability_event_id: eventId })
        .eq('id', dateId)
    }
  }
  syncGcal().catch(err => console.error('[delivery-dates POST] GCal sync error:', err))

  const { data: updated } = await supabase
    .from('delivery_dates')
    .select(`
      id, date, is_open, max_orders_total, closure_reason, closure_type, cal_availability_event_id,
      delivery_slots ( id, slot_window, max_orders, booked_count, is_open, window_start, window_end )
    `)
    .eq('id', dateId)
    .single()

  return NextResponse.json(updated, { status: isNew ? 201 : 200 })
}
