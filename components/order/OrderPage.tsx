'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AvailabilityCalendar } from '@/components/calendar/AvailabilityCalendar'
import { SlotWindowPicker } from '@/components/calendar/SlotWindowPicker'
import { ClosureBanner } from '@/components/calendar/ClosureBanner'
import { ProductSelector } from '@/components/order/ProductSelector'
import { CustomerForm } from '@/components/order/CustomerForm'
import { Button } from '@/components/ui/button'
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
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Place Your Order</h1>
          <div className="mt-2 h-0.5 w-10 bg-primary rounded-full" />
          <p className="mt-2 text-sm text-muted-foreground">
            Fresh lavaca delivered to your door in Metro Manila.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-8">
          {/* Products */}
          <section className="space-y-3">
            <h2 className="font-semibold text-foreground">Choose your items</h2>
            <ProductSelector products={products} cart={cart} onChange={setCart} />
            {formErrors.cart && (
              <p className="text-xs text-destructive">{formErrors.cart}</p>
            )}
          </section>

          {/* Calendar / Closure Banner */}
          <section className="space-y-3">
            <h2 className="font-semibold text-foreground">Select delivery date</h2>
            {loadingSlots ? (
              <div className="h-64 rounded-lg border border-border bg-muted animate-pulse" />
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
                {formErrors.date && (
                  <p className="text-xs text-destructive">{formErrors.date}</p>
                )}
              </>
            )}
          </section>

          {/* Slot window picker — only shown after a date is selected */}
          {selectedDateData && !slotsData?.closure_active && (
            <section className="space-y-3">
              <h2 className="font-semibold text-foreground">Select delivery time</h2>
              <SlotWindowPicker
                slots={selectedDateData.slots}
                selectedWindow={selectedWindow}
                onSelectWindow={setSelectedWindow}
              />
              {formErrors.window && (
                <p className="text-xs text-destructive">{formErrors.window}</p>
              )}
            </section>
          )}

          {/* Customer details */}
          <section className="space-y-3">
            <h2 className="font-semibold text-foreground">Your details</h2>
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
          <div className="space-y-3 pb-4">
            {submitError && (
              <p className="text-sm text-destructive text-center">{submitError}</p>
            )}
            <Button
              type="submit"
              disabled={isSubmitting || !!slotsData?.closure_active}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? 'Placing order…' : 'Place Order'}
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}
