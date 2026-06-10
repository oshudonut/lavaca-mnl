import { NextRequest, NextResponse } from 'next/server'
import { createOrder } from '@/lib/orders/create'
import type { CartItem, CreateOrderInput } from '@/lib/orders/create'

export async function POST(req: NextRequest) {
  let body: CreateOrderInput
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { delivery_date_id, slot_window, cart, customer } = body

  if (
    !delivery_date_id ||
    !slot_window ||
    !Array.isArray(cart) ||
    !customer
  ) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const result = await createOrder({ delivery_date_id, slot_window, cart, customer })

  if ('error' in result) {
    const status =
      result.error.code === 'VALIDATION' ? 422
      : result.error.code === 'SLOT_FULL' ? 409
      : 500
    return NextResponse.json({ error: result.error.message }, { status })
  }

  return NextResponse.json(result.data, { status: 201 })
}
