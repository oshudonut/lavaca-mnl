import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  createAvailabilityBlock,
  deleteAvailabilityBlock,
  patchAvailabilityBlock,
  createClosureBlock,
} from '@/lib/calendar/service'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 422 })

  const supabase = createServiceClient()

  const { data: existing } = await supabase
    .from('delivery_dates')
    .select('id, date, is_open, cal_availability_event_id')
    .eq('id', params.id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Date not found' }, { status: 404 })

  const {
    is_open = existing.is_open,
    max_orders_total,
    closure_reason,
    closure_type,
    am_enabled,
    am_max,
    pm_enabled,
    pm_max,
  } = body

  const updates: Record<string, unknown> = { is_open }
  if (max_orders_total !== undefined) updates.max_orders_total = max_orders_total
  if (!is_open) {
    updates.closure_reason = closure_reason ?? null
    updates.closure_type = closure_type ?? 'operational'
  } else {
    updates.closure_reason = null
    updates.closure_type = null
  }

  const { error: updateError } = await supabase.from('delivery_dates').update(updates).eq('id', params.id)
  if (updateError) return NextResponse.json({ error: 'Failed to update delivery date' }, { status: 500 })

  // Update AM slot if provided
  if (am_enabled !== undefined || am_max !== undefined) {
    const { data: amSlot } = await supabase
      .from('delivery_slots')
      .select('id')
      .eq('delivery_date_id', params.id)
      .eq('slot_window', 'AM')
      .maybeSingle()
    if (amSlot) {
      const slotUpd: Record<string, unknown> = {}
      if (am_enabled !== undefined) slotUpd.is_open = am_enabled
      if (am_max !== undefined) slotUpd.max_orders = am_max
      await supabase.from('delivery_slots').update(slotUpd).eq('id', amSlot.id)
    }
  }

  // Update PM slot if provided
  if (pm_enabled !== undefined || pm_max !== undefined) {
    const { data: pmSlot } = await supabase
      .from('delivery_slots')
      .select('id')
      .eq('delivery_date_id', params.id)
      .eq('slot_window', 'PM')
      .maybeSingle()
    if (pmSlot) {
      const slotUpd: Record<string, unknown> = {}
      if (pm_enabled !== undefined) slotUpd.is_open = pm_enabled
      if (pm_max !== undefined) slotUpd.max_orders = pm_max
      await supabase.from('delivery_slots').update(slotUpd).eq('id', pmSlot.id)
    }
  }

  const wasOpen = existing.is_open
  const nowOpen = is_open
  const existingEventId = existing.cal_availability_event_id

  // EVT-009 / reopen: non-blocking GCal sync
  const syncGcal = async () => {
    if (wasOpen && !nowOpen) {
      // Closing the date — remove availability block
      if (existingEventId) await deleteAvailabilityBlock(existingEventId)
      if (closure_type === 'holiday' || closure_type === 'vacation') {
        const newEventId = await createClosureBlock(existing.date, closure_type)
        await supabase
          .from('delivery_dates')
          .update({ cal_availability_event_id: newEventId ?? null })
          .eq('id', params.id)
      } else {
        await supabase
          .from('delivery_dates')
          .update({ cal_availability_event_id: null })
          .eq('id', params.id)
      }
    } else if (!wasOpen && nowOpen) {
      // Reopening — create or patch availability block
      let newEventId: string | null = null
      if (existingEventId) {
        await patchAvailabilityBlock(existingEventId, existing.date)
        newEventId = existingEventId
      } else {
        newEventId = await createAvailabilityBlock(existing.date)
      }
      if (newEventId && !existingEventId) {
        await supabase
          .from('delivery_dates')
          .update({ cal_availability_event_id: newEventId })
          .eq('id', params.id)
      }
    } else if (wasOpen && nowOpen && existingEventId) {
      // Capacity-only update — keep block in sync
      await patchAvailabilityBlock(existingEventId, existing.date)
    }
  }
  syncGcal().catch(err => console.error('[delivery-dates PATCH] GCal sync error:', err))

  const { data: updated } = await supabase
    .from('delivery_dates')
    .select(`
      id, date, is_open, max_orders_total, closure_reason, closure_type, cal_availability_event_id,
      delivery_slots ( id, slot_window, max_orders, booked_count, is_open, window_start, window_end )
    `)
    .eq('id', params.id)
    .single()

  return NextResponse.json(updated)
}
