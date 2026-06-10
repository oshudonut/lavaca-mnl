import { NextRequest, NextResponse } from 'next/server'
import { getAvailableSlots } from '@/lib/delivery/slots'

export const revalidate = 60  // 60s cache (Next.js route segment config)

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  // Default: today through 60 days from now
  const today = new Date().toISOString().split('T')[0]
  const plus60 = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const from = searchParams.get('from') ?? today
  const to   = searchParams.get('to')   ?? plus60

  try {
    const data = await getAvailableSlots(from, to, true)
    return NextResponse.json(data)
  } catch (error) {
    console.error('[delivery-slots] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch delivery slots' }, { status: 500 })
  }
}
