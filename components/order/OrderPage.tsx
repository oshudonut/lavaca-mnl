'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AvailabilityCalendar } from '@/components/calendar/AvailabilityCalendar'
import { PickupTimePicker } from '@/components/calendar/PickupTimePicker'
import { ClosureBanner } from '@/components/calendar/ClosureBanner'
import { ProductSelector } from '@/components/order/ProductSelector'
import { CustomerForm } from '@/components/order/CustomerForm'
import type { SlotsResponse } from '@/lib/delivery/slots'
import type { Product, CartItem } from '@/components/order/ProductSelector'
import type { CustomerDetails } from '@/components/order/CustomerForm'
import { isValidEmail, isValidZip, normalizePhone, servingStyleLabel } from '@/lib/orders/validation'
import { PICKUP_LOCATION } from '@/lib/site'
import { formatPickupTime } from '@/lib/delivery/pickup'

interface Props {
  products: Product[]
  initialSlots: SlotsResponse
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

const STEPS = ['Items', 'Pickup', 'Your details', 'Confirm'] as const
const CONFIRM_STEP = STEPS.length - 1
const STEP_EXIT_MS = 220

const fmtPeso = (n: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n)

const summaryLabelStyle: React.CSSProperties = {
  fontFamily: "'Jost', sans-serif",
  fontSize: 9,
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  color: '#A16207',
  margin: '0 0 6px',
}

const summaryTextStyle: React.CSSProperties = {
  fontFamily: "'Inter', sans-serif",
  fontSize: 13,
  color: '#1C1917',
  margin: 0,
  lineHeight: 1.6,
}

export function OrderPage({ products, initialSlots }: Props) {
  const router = useRouter()

  // Dates arrive with the (cached) page. Pickup times that have passed since
  // the page was built are filtered out in the browser once it has mounted.
  const [now, setNow] = useState<number | null>(null)

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  const [cart, setCart] = useState<CartItem[]>([])
  const [customer, setCustomer] = useState<CustomerDetails>(EMPTY_CUSTOMER)
  const [specialRequest, setSpecialRequest] = useState('')
  const [specialRequestFocused, setSpecialRequestFocused] = useState(false)

  const [formErrors, setFormErrors] = useState<Partial<Record<string, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState<'next' | 'back'>('next')
  const [leaving, setLeaving] = useState(false)
  const stepsTopRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const slotsData: SlotsResponse = useMemo(() => {
    if (now === null) return initialSlots
    return {
      ...initialSlots,
      dates: initialSlots.dates.map((d) => ({
        ...d,
        pickup_times: d.pickup_times.filter((t) => new Date(`${d.date}T${t}:00+08:00`).getTime() > now),
      })),
    }
  }, [initialSlots, now])

  // Clear an error as soon as the customer changes the field it's about.
  const clearErrors = (...keys: string[]) =>
    setFormErrors((prev) => {
      if (!keys.some((k) => prev[k])) return prev
      const next = { ...prev }
      for (const k of keys) delete next[k]
      return next
    })
  useEffect(() => clearErrors('cart'), [cart])
  useEffect(() => clearErrors('special_request'), [specialRequest])
  useEffect(() => clearErrors('date'), [selectedDate])
  useEffect(() => clearErrors('time'), [selectedTime])
  const prevCustomer = useRef(customer)
  useEffect(() => {
    const prev = prevCustomer.current
    prevCustomer.current = customer
    const changed = (Object.keys(customer) as (keyof CustomerDetails)[]).filter((k) => customer[k] !== prev[k])
    if (changed.length) clearErrors(...changed)
  }, [customer])

  const handleSelectDate = (date: string) => {
    setSelectedDate(date)
    setSelectedTime(null)
  }

  const selectedDateData = slotsData.dates.find((d) => d.date === selectedDate) ?? null

  const excludedCartProducts = selectedDateData
    ? cart
        .filter((item) => selectedDateData.unavailable_product_ids.includes(item.product_id))
        .map((item) => products.find((p) => p.id === item.product_id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
    : []

  // One validator per step; each returns only that step's errors.
  const validateStep = (index: number): Record<string, string> => {
    const errors: Record<string, string> = {}
    if (index === 0) {
      if (!cart.length) errors.cart = 'Please add at least one item.'
      else if (cart.some((item) => !item.serving_style)) errors.cart = 'Choose Ready to Serve or Frozen for Later for each item.'
      if (!specialRequest.trim()) errors.special_request = 'Special request is required.'
    }
    if (index === 1) {
      if (!selectedDate) errors.date = 'Please select a pickup date.'
      else if (excludedCartProducts.length > 0) {
        errors.date = `${excludedCartProducts.map((p) => `${p.name} (${p.weight_label})`).join(', ')} ${excludedCartProducts.length > 1 ? 'are' : 'is'} not available on the selected date.`
      }
      if (selectedDate && !selectedTime) errors.time = 'Please select a pickup time.'
    }
    if (index === 2) {
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
    }
    return errors
  }

  // Animate the current step out, then swap in the target step.
  const goTo = (target: number) => {
    if (target === step || leaving) return
    setDirection(target > step ? 'next' : 'back')
    setSubmitError(null)
    const reduceMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setLeaving(true)
    window.setTimeout(() => {
      setStep(target)
      setLeaving(false)
      const top = stepsTopRef.current?.getBoundingClientRect().top ?? 0
      if (top < 0) stepsTopRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
    }, reduceMotion ? 0 : STEP_EXIT_MS)
  }

  const handleNext = () => {
    const errors = validateStep(step)
    setFormErrors(errors)
    if (Object.keys(errors).length === 0) goTo(step + 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step < CONFIRM_STEP) {
      handleNext()
      return
    }
    setSubmitError(null)

    for (let i = 0; i < CONFIRM_STEP; i++) {
      const errors = validateStep(i)
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors)
        goTo(i)
        return
      }
    }

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
  if (slotsData.closure_active) {
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
        {/* Step progress */}
        <div ref={stepsTopRef} style={{ display: 'flex', flexDirection: 'column', gap: 10, scrollMarginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
            <span
              style={{
                fontFamily: "'Jost', sans-serif",
                fontSize: 10,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: '#A16207',
              }}
            >
              Step {step + 1} of {STEPS.length}
            </span>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#57534E' }}>{STEPS[step]}</span>
          </div>
          <div
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={STEPS.length}
            aria-valuenow={step + 1}
            aria-label="Order progress"
            style={{ display: 'grid', gridTemplateColumns: `repeat(${STEPS.length}, 1fr)`, gap: 4 }}
          >
            {STEPS.map((label, i) => (
              <div key={label} className="lv-step-track">
                <div className={`lv-step-fill${i <= step ? ' is-done' : ''}`} />
              </div>
            ))}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
        >
          <div
            key={step}
            className={`lv-step${leaving ? ' is-leaving' : ''}`}
            data-dir={direction}
          >
            {step === 0 && (
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
            )}
            {step === 1 && (
                <section style={cardStyle}>
                  <h2 style={{ ...sectionHeadingStyle, marginBottom: 6 }}>Choose your pickup</h2>
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 12,
                      color: '#57534E',
                      margin: '0 0 18px',
                    }}
                  >
                    Pickup location: <strong style={{ color: '#1C1917', fontWeight: 600 }}>{PICKUP_LOCATION}</strong>
                  </p>
                  <AvailabilityCalendar
                    slotsData={slotsData}
                    selectedDate={selectedDate}
                    onSelectDate={handleSelectDate}
                  />
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

                  {/* Time appears once a date is picked */}
                  {selectedDateData && (
                    <div
                      key={selectedDateData.date}
                      className="lv-reveal"
                      style={{
                        marginTop: 22,
                        paddingTop: 20,
                        borderTop: '1px solid #E7E5E4',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      <span style={fieldLabelStyle}>
                        Pickup time ·{' '}
                        {new Date(`${selectedDateData.date}T00:00:00+08:00`).toLocaleDateString('en-PH', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          timeZone: 'Asia/Manila',
                        })}
                      </span>
                      <PickupTimePicker
                        availableTimes={selectedDateData.pickup_times}
                        selectedTime={selectedTime}
                        onSelectTime={setSelectedTime}
                        hasError={!!formErrors.time}
                      />
                      {formErrors.time && <p style={{ ...fieldErrorStyle, marginTop: 0 }}>{formErrors.time}</p>}
                    </div>
                  )}
                </section>
            )}
            {step === 2 && (
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
            )}
            {step === CONFIRM_STEP && (
              <section style={cardStyle}>
                <h2 style={sectionHeadingStyle}>Confirm your order</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <SummaryBlock label="Items" onEdit={() => goTo(0)}>
                    {cart.map((item) => {
                      const product = products.find((p) => p.id === item.product_id)
                      if (!product) return null
                      return (
                        <div key={item.product_id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                          <span style={summaryTextStyle}>
                            {product.name} · {product.weight_label}
                            {item.serving_style ? ` · ${servingStyleLabel(item.serving_style)}` : ''} × {item.quantity}
                          </span>
                          <span style={{ ...summaryTextStyle, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                            {fmtPeso(item.unit_price * item.quantity)}
                          </span>
                        </div>
                      )
                    })}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                      <span style={{ ...summaryTextStyle, fontWeight: 600 }}>Subtotal</span>
                      <span style={{ ...summaryTextStyle, fontWeight: 600, color: '#A16207', fontVariantNumeric: 'tabular-nums' }}>
                        {fmtPeso(cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0))}
                      </span>
                    </div>
                  </SummaryBlock>
                  <SummaryBlock label="Special request" onEdit={() => goTo(0)}>
                    <p style={{ ...summaryTextStyle, whiteSpace: 'pre-line' }}>{specialRequest.trim()}</p>
                  </SummaryBlock>
                  <SummaryBlock label="Pickup" onEdit={() => goTo(1)}>
                    <p style={summaryTextStyle}>
                      {selectedDate
                        ? new Date(`${selectedDate}T00:00:00+08:00`).toLocaleDateString('en-PH', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                            timeZone: 'Asia/Manila',
                          })
                        : '—'}
                      {selectedTime ? ` at ${formatPickupTime(selectedTime)}` : ''}
                    </p>
                    <p style={{ ...summaryTextStyle, color: '#57534E' }}>{PICKUP_LOCATION}</p>
                  </SummaryBlock>
                  <SummaryBlock label="Your details" onEdit={() => goTo(2)} last>
                    <p style={summaryTextStyle}>{customer.name.trim()}</p>
                    <p style={summaryTextStyle}>{customer.phone.trim()} · {customer.email.trim()}</p>
                    <p style={summaryTextStyle}>
                      {customer.address_street.trim()}, {customer.address_village.trim()}, {customer.address_city.trim()}{' '}
                      {customer.address_zip.trim()}
                    </p>
                    {customer.instagram.trim() && <p style={summaryTextStyle}>Instagram: {customer.instagram.trim()}</p>}
                    <p style={summaryTextStyle}>
                      Payment: {customer.payment_method === 'gcash' ? 'GCash' : 'Bank Transfer'}
                    </p>
                  </SummaryBlock>
                </div>
              </section>
            )}
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {submitError && step === CONFIRM_STEP && (
              <p
                role="alert"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 12,
                  color: '#DC2626',
                  textAlign: 'center',
                  margin: 0,
                }}
              >
                {submitError}
              </p>
            )}
            <div style={{ display: 'flex', gap: 12 }}>
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => goTo(step - 1)}
                  disabled={leaving || isSubmitting}
                  className="lv-step-btn lv-step-btn-back"
                >
                  Back
                </button>
              )}
              {step < CONFIRM_STEP ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={leaving}
                  className="lv-step-btn lv-step-btn-next"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || leaving}
                  className="lv-step-btn lv-step-btn-next"
                >
                  {isSubmitting ? 'Placing order…' : 'Place Order'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </main>
  )
}

function SummaryBlock({
  label,
  onEdit,
  last,
  children,
}: {
  label: string
  onEdit: () => void
  last?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        padding: '14px 0',
        borderBottom: last ? 'none' : '1px solid rgba(161,98,7,0.12)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <p style={summaryLabelStyle}>{label}</p>
        <button
          type="button"
          onClick={onEdit}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            fontFamily: "'Inter', sans-serif",
            fontSize: 12,
            color: '#A16207',
            textDecoration: 'underline',
            cursor: 'pointer',
          }}
        >
          Edit
        </button>
      </div>
      {children}
    </div>
  )
}
