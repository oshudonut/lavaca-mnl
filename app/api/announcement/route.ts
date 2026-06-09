import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 60  // 60s cache

export async function GET() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('business_announcements')
      .select('is_active, message, closed_from, closed_until')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    if (error) throw error

    if (!data) {
      return NextResponse.json({ active: false })
    }

    return NextResponse.json({
      active: true,
      message: data.message,
      closed_from: data.closed_from,
      closed_until: data.closed_until,
    })
  } catch (error) {
    console.error('[announcement] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch announcement' }, { status: 500 })
  }
}
