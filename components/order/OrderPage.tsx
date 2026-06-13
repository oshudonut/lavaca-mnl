'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AvailabilityCalendar } from '@/components/calendar/AvailabilityCalendar'
import { SlotWindowPicker } from '@/components/calendar/SlotWindowPicker'
import { ClosureBanner } from '@/components/calendar/ClosureBanner'
import { ProductSelector } from '@/components/order/ProductSelector'
import { CustomerForm } from '@/components/order/CustomerForm'
import type { SlotsResponse } from '@/lib/delivery/slots'
import type { Product, CartItem } from '@/components/order/ProductSelector'
import type { CustomerDetails } from '@/components/order/CustomerForm'

interface Props {
  products: Product[]
}

const EMPTY_CUSTOMER: CustomerDetails = {
  name: '',
  phone: '',
  email: '',
  delivery_address: '',
  payment_method: 'gcash',
}

const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #D6D3D1',
  padding: 28,
  borderRadius: 0,
}

const sectionHeadingStyle: React.CSSProperties = {
  fontFamily: "'Playfair Display', serif",
  fontSize: 20,
  fontWeight: 500,
  color: '#1C1917',
  marginBottom: 20,
}

const fieldErrorStyle: React.CSSProperties = {
  fontFamily: "'Inter', sans-serif",
  fontSize: 11,
  color: '#DC2626',
  marginTop: 10,
}

export function OrderPage({ products }: Props) {
  const router = useRouter()

  const [slotsData, setSlotsData] = useState<SlotsResponse | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(true)

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedWindow, setSelectedWindow] = useState<'AM' | 'PM' | null>(null)

  const [cart, setCart] = useState<CartItem[]>([])
  const [customer, setCustomer] = useState<CustomerDetails>(EMPTY_CUSTOMER)

  const [formErrors, setFormErrors] = useState<Partial<Record<string, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/delivery-slots')
      .then((res) => res.json())
      .then(setSlotsData)
      .catch(() => setSlotsData(null))
      .finally(() => setLoadingSlots(false))
  }, [])

  const handleSelectDate = (date: string) => {
    setSelectedDate(date)
    setSelectedWindow(null)
  }

  const selectedDateData = slotsData?.dates.find((d) => d.date === selectedDate) ?? null

  const validate = (): Record<string, string> => {
    const errors: Record<string, string> = {}
    if (!cart.length) errors.cart = 'Please add at least one item.'
    if (!selectedDate) errors.date = 'Please select a delivery date.'
    if (!selectedWindow) errors.window = 'Please select a delivery time.'
    if (!customer.name.trim()) errors.name = 'Full name is required.'
    if (!customer.phone.trim()) errors.phone = 'Phone number is required.'
    if (!customer.email.trim()) errors.email = 'Email address is required.'
    if (!customer.delivery_address.trim()) errors.delivery_address = 'Delivery address is required.'
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    const errors = validate()
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delivery_date_id: selectedDateData!.id,
          slot_window: selectedWindow,
          cart: cart.map(({ product_id, quantity }) => ({ product_id, quantity })),
          customer: {
            name: customer.name.trim(),
            phone: customer.phone.trim(),
            email: customer.email.trim(),
            delivery_address: customer.delivery_address.trim(),
            payment_method: customer.payment_method,
          },
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setSubmitError(data.error ?? 'Something went wrong. Please try again.')
        return
      }

      router.push(`/order/payment?order_id=${data.order_id}`)
    } catch {
      setSubmitError('Network error. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main style={{ background: '#FAFAF9', minHeight: '100vh' }}>
      {/* Dark hero header — full width */}
      <div style={{ background: '#0C0A09', padding: '48px 24px 44px', textAlign: 'center' }}>
        <div
          style={{
            width: 36,
            height: 2,
            background: '#A16207',
            margin: '0 auto 12px',
          }}
        />
        <p
          style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: 9,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: '#A16207',
            margin: '0 0 16px',
          }}
        >
          Place Your Order
        </p>
        <h1
          style={{
            fontFamily: "'Playfair Display SC', serif",
            fontSize: 36,
            fontWeight: 500,
            color: '#FAFAF9',
            whiteSpace: 'pre-line',
            margin: '0 0 14px',
            lineHeight: 1.2,
          }}
        >
          {'Fresh Angus\nDelivered.'}
        </h1>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 300,
            fontSize: 12,
            color: 'rgba(250,250,249,0.5)',
            margin: 0,
          }}
        >
          Metro Manila delivery · Tue–Sat
        </p>
      </div>

      {/* Content */}
      <div
        style={{
          maxWidth: 540,
          margin: '0 auto',
          padding: '40px 24px 80px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        <form
          onSubmit={handleSubmit}
          noValidate
          style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
        >
          {/* Products */}
          <section style={cardStyle}>
            <h2 style={sectionHeadingStyle}>Choose your items</h2>
            <ProductSelector products={products} cart={cart} onChange={setCart} />
            {formErrors.cart && <p style={fieldErrorStyle}>{formErrors.cart}</p>}
          </section>

          {/* Calendar / Closure Banner */}
          <section style={cardStyle}>
            <h2 style={sectionHeadingStyle}>Select delivery date</h2>
            {loadingSlots ? (
              <div style={{ background: '#F5F4F2', height: 200, width: '100%' }} />
            ) : slotsData?.closure_active ? (
              <ClosureBanner
                message={slotsData.closure_message ?? null}
                closed_until={slotsData.closed_until ?? null}
              />
            ) : (
              <>
                {slotsData && (
                  <AvailabilityCalendar
                    slotsData={slotsData}
                    selectedDate={selectedDate}
                    onSelectDate={handleSelectDate}
                  />
                )}
                {formErrors.date && <p style={fieldErrorStyle}>{formErrors.date}</p>}
              </>
            )}
          </section>

          {/* Slot window picker — only shown after a date is selected */}
          {selectedDateData && !slotsData?.closure_active && (
            <section style={cardStyle}>
              <h2 style={sectionHeadingStyle}>Select delivery time</h2>
              <SlotWindowPicker
                slots={selectedDateData.slots}
                selectedWindow={selectedWindow}
                onSelectWindow={setSelectedWindow}
              />
              {formErrors.window && <p style={fieldErrorStyle}>{formErrors.window}</p>}
            </section>
          )}

          {/* Customer details */}
          <section style={cardStyle}>
            <h2 style={sectionHeadingStyle}>Your details</h2>
            <CustomerForm
              value={customer}
              onChange={setCustomer}
              errors={{
                name: formErrors.name,
                phone: formErrors.phone,
                email: formErrors.email,
                delivery_address: formErrors.delivery_address,
              }}
            />
          </section>

          {/* Submit */}
          <div>
            {submitError && (
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 12,
                  color: '#DC2626',
                  textAlign: 'center',
                  marginBottom: 8,
                }}
              >
                {submitError}
              </p>
            )}
            <button
              type="submit"
              disabled={isSubmitting || !!slotsData?.closure_active}
              style={{
                width: '100%',
                fontFamily: "'Inter', sans-serif",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                background:
                  isSubmitting || slotsData?.closure_active ? '#D6D3D1' : '#A16207',
                color: isSubmitting || slotsData?.closure_active ? '#8C7B6B' : '#FFFFFF',
                border: 'none',
                padding: '18px 0',
                cursor:
                  isSubmitting || slotsData?.closure_active ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
                marginTop: 8,
              }}
            >
              {isSubmitting ? 'Placing order…' : 'Place Order'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
