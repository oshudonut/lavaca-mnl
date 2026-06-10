import * as React from 'react'
import { createServiceClient } from '@/lib/supabase/service'
import { sendEmail } from '@/lib/resend/send'
import Cust01 from '@/lib/resend/templates/cust-01'
import Admin01 from '@/lib/resend/templates/admin-01'

export interface CartItem {
  product_id: string
  quantity: number
}

export interface CreateOrderInput {
  delivery_date_id: string
  slot_window: 'AM' | 'PM'
  cart: CartItem[]
  customer: {
    name: string
    phone: string
    email: string
    delivery_address: string
    payment_method: 'gcash' | 'bank_transfer'
  }
}

export interface CreateOrderResult {
  order_id: string
  order_number: string
}

export type CreateOrderError =
  | { code: 'VALIDATION'; message: string }
  | { code: 'SLOT_FULL'; message: string }
  | { code: 'INTERNAL'; message: string }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function manilaDateStr(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }).replace(/-/g, '')
}

function padSeq(n: number): string {
  return String(n).padStart(3, '0')
}

const WINDOW_LABELS: Record<'AM' | 'PM', string> = {
  AM: '9:00 AM – 12:00 PM',
  PM: '1:00 PM – 5:00 PM',
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function createOrder(
  input: CreateOrderInput
): Promise<{ data: CreateOrderResult } | { error: CreateOrderError }> {
  const { delivery_date_id, slot_window, cart, customer } = input

  // -------------------------------------------------------------------------
  // Validate inputs
  // -------------------------------------------------------------------------
  if (!cart.length) {
    return { error: { code: 'VALIDATION', message: 'Your cart is empty.' } }
  }
  if (!customer.name.trim()) {
    return { error: { code: 'VALIDATION', message: 'Full name is required.' } }
  }
  if (!customer.phone.trim()) {
    return { error: { code: 'VALIDATION', message: 'Phone number is required.' } }
  }
  if (!customer.email.trim()) {
    return { error: { code: 'VALIDATION', message: 'Email address is required.' } }
  }
  if (!customer.delivery_address.trim()) {
    return { error: { code: 'VALIDATION', message: 'Delivery address is required.' } }
  }

  const supabase = createServiceClient()

  // -------------------------------------------------------------------------
  // Look up the slot record
  // -------------------------------------------------------------------------
  const { data: slotRow, error: slotError } = await supabase
    .from('delivery_slots')
    .select('id, max_orders, booked_count, is_open, window_start, window_end')
    .eq('delivery_date_id', delivery_date_id)
    .eq('slot_window', slot_window)
    .single()

  if (slotError || !slotRow) {
    return { error: { code: 'INTERNAL', message: 'Delivery slot not found.' } }
  }

  // -------------------------------------------------------------------------
  // Fetch products to snapshot prices (never trust client-side prices)
  // -------------------------------------------------------------------------
  const productIds = cart.map((c) => c.product_id)
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, sku, price, weight_label, is_available')
    .in('id', productIds)

  if (productsError || !products) {
    return { error: { code: 'INTERNAL', message: 'Could not fetch product data.' } }
  }

  for (const item of cart) {
    const product = products.find((p) => p.id === item.product_id)
    if (!product) {
      return { error: { code: 'VALIDATION', message: 'One or more products not found.' } }
    }
    if (!product.is_available) {
      return {
        error: { code: 'VALIDATION', message: `${product.name} is no longer available.` },
      }
    }
  }

  // -------------------------------------------------------------------------
  // Atomically increment booked_count (catches slot_full)
  // -------------------------------------------------------------------------
  const { error: rpcError } = await supabase.rpc('increment_slot_booking', {
    p_slot_id: slotRow.id,
  })

  if (rpcError) {
    if (rpcError.message?.includes('slot_full')) {
      return {
        error: { code: 'SLOT_FULL', message: 'This slot is no longer available. Please choose another.' },
      }
    }
    return { error: { code: 'INTERNAL', message: 'Failed to reserve delivery slot.' } }
  }

  // -------------------------------------------------------------------------
  // Upsert customer (by email — idempotent across repeat orders)
  // -------------------------------------------------------------------------
  const { data: customerRow, error: customerError } = await supabase
    .from('customers')
    .upsert(
      {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        email: customer.email.trim().toLowerCase(),
        default_address: customer.delivery_address.trim(),
      },
      { onConflict: 'email' }
    )
    .select('id')
    .single()

  if (customerError || !customerRow) {
    await supabase
      .from('delivery_slots')
      .update({ booked_count: Math.max(0, slotRow.booked_count) })
      .eq('id', slotRow.id)
    return { error: { code: 'INTERNAL', message: 'Failed to create customer record.' } }
  }

  // -------------------------------------------------------------------------
  // Generate order number: LV-YYYYMMDD-NNN
  // -------------------------------------------------------------------------
  const dateStr = manilaDateStr()
  const prefix = `LV-${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
  const likePattern = `LV-${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}-%`

  const { count } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .like('order_number', likePattern)

  const sequence = (count ?? 0) + 1
  const order_number = `${prefix}-${padSeq(sequence)}`

  // -------------------------------------------------------------------------
  // Build order_items with snapshotted prices
  // -------------------------------------------------------------------------
  const subtotal = cart.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.product_id)!
    return sum + product.price * item.quantity
  }, 0)

  const total_amount = subtotal

  // -------------------------------------------------------------------------
  // Insert order
  // -------------------------------------------------------------------------
  const { data: orderRow, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number,
      customer_id: customerRow.id,
      delivery_slot_id: slotRow.id,
      status: 'PENDING_PAYMENT',
      subtotal,
      total_amount,
      delivery_address: customer.delivery_address,
      payment_method: customer.payment_method,
    })
    .select('id')
    .single()

  if (orderError || !orderRow) {
    // Rollback slot increment since order failed
    await supabase
      .from('delivery_slots')
      .update({ booked_count: Math.max(0, slotRow.booked_count) })
      .eq('id', slotRow.id)
    return { error: { code: 'INTERNAL', message: 'Failed to create order.' } }
  }

  const order_id = orderRow.id

  // -------------------------------------------------------------------------
  // Insert order_items
  // -------------------------------------------------------------------------
  const orderItems = cart.map((item) => {
    const product = products.find((p) => p.id === item.product_id)!
    return {
      order_id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: product.price,
      subtotal: product.price * item.quantity,
    }
  })

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)

  if (itemsError) {
    console.error('[createOrder] Failed to insert order_items:', itemsError)
  }

  // -------------------------------------------------------------------------
  // Fetch delivery date for email context
  // -------------------------------------------------------------------------
  const { data: dateRow } = await supabase
    .from('delivery_dates')
    .select('date')
    .eq('id', delivery_date_id)
    .single()

  const deliveryDate = dateRow?.date
    ? new Date(`${dateRow.date}T00:00:00+08:00`).toLocaleDateString('en-PH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Manila',
      })
    : ''

  const emailItems = cart.map((item) => {
    const product = products.find((p) => p.id === item.product_id)!
    return {
      name: product.name,
      weight_label: product.weight_label,
      quantity: item.quantity,
      subtotal: product.price * item.quantity,
    }
  })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const payment_url = `${baseUrl}/order/payment?order_id=${order_id}`
  const admin_url = `${baseUrl}/admin/orders/${order_id}`

  // -------------------------------------------------------------------------
  // Fire emails non-blocking (failures must not block order creation)
  // -------------------------------------------------------------------------
  sendEmail({
    to: customer.email,
    subject: `We received your order! Lavaca MNL ${order_number}`,
    react: React.createElement(Cust01, {
      order_number,
      customer_name: customer.name,
      delivery_date: deliveryDate,
      delivery_window: WINDOW_LABELS[slot_window],
      items: emailItems,
      total_amount,
      payment_url,
      payment_method: customer.payment_method,
    }),
    orderId: order_id,
    templateId: 'CUST-01',
  }).catch((err) => console.error('[createOrder] CUST-01 send error:', err))

  sendEmail({
    to: process.env.OWNER_EMAIL ?? '',
    subject: `New Order ${order_number} — ${customer.name}`,
    react: React.createElement(Admin01, {
      order_id,
      order_number,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      delivery_address: customer.delivery_address,
      delivery_date: deliveryDate,
      delivery_window: WINDOW_LABELS[slot_window],
      items: emailItems,
      total_amount,
      payment_method: customer.payment_method,
      admin_url,
    }),
    orderId: order_id,
    templateId: 'ADMIN-01',
  }).catch((err) => console.error('[createOrder] ADMIN-01 send error:', err))

  return { data: { order_id, order_number } }
}
