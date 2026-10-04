'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AvailabilityCalendar } from '@/components/calendar/AvailabilityCalendar'
import { PickupTimePicker } from '@/components/calendar/PickupTimePicker'
import { ClosureBanner } from '@/components/calendar/ClosureBanner'
import { ProductSelector } from '@/components/order/ProductSelector'
import { CustomerForm } from '@/components/order/CustomerForm'
import type { SlotsResponse } from '@/lib/delivery/slots'
import type { Product, CartItem } from '@/components/order/ProductSelector'
import type { CustomerDetails } from '@/components/order/CustomerForm'
import { isValidEmail, isValidZip, normalizePhone } from '@/lib/orders/validation'
import { PICKUP_LOCATION } from '@/lib/site'

interface Props {
  products: Product[]
}

const EMPTY_CUSTOMER: CustomerDetails = {
  name: '',
  phone: '',
  email: '',
  address_street: '',
  address_village: '',
  address_city: '',
  address_zip: '',
  instagram: '',
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

const fieldLabelStyle: React.CSSProperties = {
  fontFamily: "'Inter', sans-serif",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: '#1C1917',
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
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  const [cart, setCart] = useState<CartItem[]>([])
  const [customer, setCustomer] = useState<CustomerDetails>(EMPTY_CUSTOMER)
  const [specialRequest, setSpecialRequest] = useState('')
  const [specialRequestFocused, setSpecialRequestFocused] = useState(false)

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
    setSelectedTime(null)
  }

  const selectedDateData = slotsData?.dates.find((d) => d.date === selectedDate) ?? null

  const excludedCartProducts = selectedDateData
    ? cart
        .filter((item) => selectedDateData.unavailable_product_ids.includes(item.product_id))
        .map((item) => products.find((p) => p.id === item.product_id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
    : []

  const validate = (): Record<string, string> => {
    const errors: Record<string, string> = {}
    if (!cart.length) errors.cart = 'Please add at least one item.'
    else if (cart.some((item) => !item.serving_style)) errors.cart = 'Choose warm or frozen for each item.'
    if (!specialRequest.trim()) errors.special_request = 'Special request is required.'
    if (!selectedDate) errors.date = 'Please select a pickup date.'
    if (excludedCartProducts.length > 0) {
      errors.date = `${excludedCartProducts.map((p) => `${p.name} (${p.weight_label})`).join(', ')} ${excludedCartProducts.length > 1 ? 'are' : 'is'} not available on the selected date.`
    }
    if (!selectedTime) errors.time = 'Please select a pickup time.'
    if (!customer.name.trim()) errors.name = 'Full name is required.'
    if (!customer.phone.trim()) errors.phone = 'Phone number is required.'
    else if (!normalizePhone(customer.phone)) errors.phone = 'Enter a valid mobile number, e.g. 0917 123 4567.'
    if (!customer.email.trim()) errors.email = 'Email address is required.'
    else if (!isValidEmail(customer.email)) errors.email = 'Enter a valid email address, e.g. name@gmail.com.'
    if (!customer.address_street.trim()) errors.address_street = 'House/lot number and street is required.'
    if (!customer.address_village.trim()) errors.address_village = 'Village is required.'
    if (!customer.address_city.trim()) errors.address_city = 'City is required.'
    if (!customer.address_zip.trim()) errors.address_zip = 'ZIP code is required.'
    else if (!isValidZip(customer.address_zip)) errors.address_zip = 'ZIP code must be 4 digits.'
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
          pickup_time: selectedTime,
          cart: cart.map(({ product_id, quantity, serving_style }) => ({ product_id, quantity, serving_style })),
          customer: {
            name: customer.name.trim(),
            phone: customer.phone.trim(),
            email: customer.email.trim(),
            special_request: specialRequest.trim(),
            address_street: customer.address_street.trim(),
            address_village: customer.address_village.trim(),
            address_city: customer.address_city.trim(),
            address_zip: customer.address_zip.trim(),
            instagram: customer.instagram.trim(),
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

  // When a sitewide closure/maintenance announcement is active, the whole
  // ordering flow is unavailable — show only the maintenance notice.
  if (!loadingSlots && slotsData?.closure_active) {
    return (
      <main
        style={{
          background: '#FAFAF9',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 540 }}>
          <ClosureBanner
            message={slotsData.closure_message ?? null}
          />
        </div>
      </main>
    )
  }

  return (
    <main style={{ background: '#FAFAF9', minHeight: '100vh' }}>
      {/* Dark hero header — full width */}
      <div style={{ background: '#0C0A09', padding: '48px 24px 44px', textAlign: 'center' }}>
        <div
          style={{
            width: 36,
            height: 2,
            background: '#FFC35A',
            margin: '0 auto 16px',
          }}
        />
        <h1
          style={{
            fontFamily: "'Playfair Display SC', serif",
            fontSize: 'clamp(26px, 7vw, 36px)',
            fontWeight: 500,
            letterSpacing: '0.04em',
            color: '#FFFFFF',
            margin: '0 0 14px',
            lineHeight: 1.2,
          }}
        >
          Place Your Order
        </h1>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 300,
            fontSize: 13,
            color: 'rgba(250,250,249,0.7)',
            margin: 0,
          }}
        >
          Pickup at {PICKUP_LOCATION} · 9AM – 6PM
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
            <ProductSelector
              products={products}
              cart={cart}
              onChange={setCart}
              showStyleErrors={!!formErrors.cart}
            />
            {formErrors.cart && <p style={fieldErrorStyle}>{formErrors.cart}</p>}

            {/* Special request — below the subtotal */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 24 }}>
              <label htmlFor="order-special-request" style={fieldLabelStyle}>
                Special Request
              </label>
              <textarea
                id="order-special-request"
                required
                rows={3}
                maxLength={500}
                value={specialRequest}
                onChange={(e) => setSpecialRequest(e.target.value)}
                onFocus={() => setSpecialRequestFocused(true)}
                onBlur={() => setSpecialRequestFocused(false)}
                aria-invalid={!!formErrors.special_request}
                aria-describedby={formErrors.special_request ? 'order-special-request-error' : undefined}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 14,
                  color: '#1C1917',
                  background: '#FFFFFF',
                  border: `1px solid ${formErrors.special_request ? '#DC2626' : specialRequestFocused ? '#A16207' : '#D6D3D1'}`,
                  padding: '11px 14px',
                  width: '100%',
                  outline: 'none',
                  borderRadius: 0,
                  resize: 'vertical',
                  transition: 'border-color 0.2s',
                }}
              />
              {formErrors.special_request && (
                <p id="order-special-request-error" style={{ ...fieldErrorStyle, marginTop: 0 }}>
                  {formErrors.special_request}
                </p>
              )}
            </div>
          </section>

          {/* Calendar / Closure Banner */}
          <section style={cardStyle}>
            <h2 style={sectionHeadingStyle}>Select pickup date</h2>
            {loadingSlots ? (
              <div style={{ background: '#F5F4F2', height: 200, width: '100%' }} />
            ) : (
              <>
                {slotsData && (
                  <AvailabilityCalendar
                    slotsData={slotsData}
                    selectedDate={selectedDate}
                    onSelectDate={handleSelectDate}
                  />
                )}
                {excludedCartProducts.length > 0 && (
                  <p style={fieldErrorStyle}>
                    {excludedCartProducts.map((p) => `${p.name} (${p.weight_label})`).join(', ')}{' '}
                    {excludedCartProducts.length > 1 ? 'are' : 'is'} not available on this date. Remove{' '}
                    {excludedCartProducts.length > 1 ? 'them' : 'it'} or choose a different date.
                  </p>
                )}
                {formErrors.date && excludedCartProducts.length === 0 && (
                  <p style={fieldErrorStyle}>{formErrors.date}</p>
                )}
              </>
            )}
          </section>

          {/* Pickup time — only shown after a date is selected */}
          {selectedDateData && (
            <section style={cardStyle}>
              <h2 style={{ ...sectionHeadingStyle, marginBottom: 6 }}>Select pickup time</h2>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 12,
                  color: '#57534E',
                  margin: '0 0 16px',
                }}
              >
                Pickup location: <strong style={{ color: '#1C1917', fontWeight: 600 }}>{PICKUP_LOCATION}</strong>
              </p>
              <PickupTimePicker
                availableTimes={selectedDateData.pickup_times}
                selectedTime={selectedTime}
                onSelectTime={setSelectedTime}
                hasError={!!formErrors.time}
              />
              {formErrors.time && <p style={fieldErrorStyle}>{formErrors.time}</p>}
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
                address_street: formErrors.address_street,
                address_village: formErrors.address_village,
                address_city: formErrors.address_city,
                address_zip: formErrors.address_zip,
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
              disabled={isSubmitting}
              style={{
                width: '100%',
                fontFamily: "'Inter', sans-serif",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                background: isSubmitting ? '#D6D3D1' : '#A16207',
                color: isSubmitting ? '#8C7B6B' : '#FFFFFF',
                border: 'none',
                padding: '18px 0',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
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
