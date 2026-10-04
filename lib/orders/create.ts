import * as React from 'react'
import { createServiceClient } from '@/lib/supabase/service'
import { sendEmail } from '@/lib/resend/send'
import Cust01 from '@/lib/resend/templates/cust-01'
import Admin01 from '@/lib/resend/templates/admin-01'
import { formatPickupTime, isPickupTime } from '@/lib/delivery/pickup'

export interface CartItem {
  product_id: string
  quantity: number
}

export interface CreateOrderInput {
  delivery_date_id: string
  pickup_time: string     // "HH:MM", one of PICKUP_TIMES
  cart: CartItem[]
  customer: {
    name: string
    phone: string
    email: string
    special_request: string
    payment_method: 'gcash' | 'bank_transfer'
  }
}

export interface CreateOrderResult {
  order_id: string
  order_number: string
}

export type CreateOrderError =
  | { code: 'VALIDATION'; message: string }
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

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function createOrder(
  input: CreateOrderInput
): Promise<{ data: CreateOrderResult } | { error: CreateOrderError }> {
  const { delivery_date_id, pickup_time, cart, customer } = input

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
  if (!customer.special_request?.trim()) {
    return { error: { code: 'VALIDATION', message: 'Special request is required.' } }
  }
  if (!isPickupTime(pickup_time)) {
    return { error: { code: 'VALIDATION', message: 'Please choose a pickup time between 9:00 AM and 6:00 PM.' } }
  }

  const supabase = createServiceClient()

  // -------------------------------------------------------------------------
  // Look up the pickup date; it must be open and the time not yet passed
  // -------------------------------------------------------------------------
  const { data: dateRow, error: dateError } = await supabase
    .from('delivery_dates')
    .select('id, date, is_open')
    .eq('id', delivery_date_id)
    .single()

  if (dateError || !dateRow) {
    return { error: { code: 'VALIDATION', message: 'Pickup date not found.' } }
  }

  const pickupAt = new Date(`${dateRow.date}T${pickup_time}:00+08:00`)
  if (!dateRow.is_open || pickupAt <= new Date()) {
    return {
      error: { code: 'VALIDATION', message: 'This pickup time is no longer available. Please choose another.' },
    }
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
  // Reject cart items excluded for this specific delivery date
  // -------------------------------------------------------------------------
  const { data: exclusions } = await supabase
    .from('date_product_exclusions')
    .select('product_id')
    .eq('delivery_date_id', delivery_date_id)

  const excludedIds = new Set((exclusions ?? []).map((e) => e.product_id))
  for (const item of cart) {
    if (excludedIds.has(item.product_id)) {
      const product = products.find((p) => p.id === item.product_id)
      return {
        error: {
          code: 'VALIDATION',
          message: `${product?.name ?? 'One of your items'} is not available for this pickup date.`,
        },
      }
    }
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
      },
      { onConflict: 'email' }
    )
    .select('id')
    .single()

  if (customerError || !customerRow) {
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
      delivery_date_id,
      pickup_time,
      special_request: customer.special_request.trim().slice(0, 500),
      status: 'PENDING_PAYMENT',
      subtotal,
      total_amount,
      payment_method: customer.payment_method,
    })
    .select('id')
    .single()

  if (orderError || !orderRow) {
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

  const pickupDate = dateRow.date
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
  // Send emails — await both so the serverless function doesn't exit first
  // -------------------------------------------------------------------------
  await Promise.allSettled([
    sendEmail({
      to: customer.email,
      subject: `We received your order! Lavaca MNL ${order_number}`,
      react: React.createElement(Cust01, {
        order_number,
        customer_name: customer.name,
        pickup_date: pickupDate,
        pickup_time: formatPickupTime(pickup_time),
        items: emailItems,
        total_amount,
        payment_url,
        payment_method: customer.payment_method,
      }),
      orderId: order_id,
      templateId: 'CUST-01',
    }),
    sendEmail({
      to: process.env.OWNER_EMAIL ?? '',
      subject: `New Order ${order_number} — ${customer.name}`,
      react: React.createElement(Admin01, {
        order_id,
        order_number,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        special_request: customer.special_request.trim(),
        pickup_date: pickupDate,
        pickup_time: formatPickupTime(pickup_time),
        items: emailItems,
        total_amount,
        payment_method: customer.payment_method,
        admin_url,
      }),
      orderId: order_id,
      templateId: 'ADMIN-01',
    }),
  ])

  return { data: { order_id, order_number } }
}
