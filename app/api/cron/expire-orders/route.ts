import { NextRequest, NextResponse } from 'next/server'
import { expireStaleOrders } from '@/lib/orders/expire'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { expired } = await expireStaleOrders()

  console.log(`[cron/expire-orders] expired ${expired} order(s)`)

  return NextResponse.json({ expired })
}
