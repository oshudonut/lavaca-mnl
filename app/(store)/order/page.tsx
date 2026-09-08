import { createClient } from '@/lib/supabase/server'
import { getAvailableSlots } from '@/lib/delivery/slots'
import { OrderPage } from '@/components/order/OrderPage'
import { ClosureBanner } from '@/components/calendar/ClosureBanner'
import type { Product } from '@/components/order/ProductSelector'

export default async function Page() {
  const supabase = createClient()

  const { data: products } = await supabase
    .from('products')
    .select('id, sku, name, description, price, weight_label, image_url')
    .eq('is_available', true)
    .order('sort_order', { ascending: true })

  // If a sitewide closure/maintenance announcement is active, the ordering
  // flow is fully unavailable — render only the maintenance notice, never
  // the product picker or customer form.
  const today = new Date().toISOString().split('T')[0]
  const plus60 = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const slots = await getAvailableSlots(today, plus60, true)

  if (slots.closure_active) {
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
            message={slots.closure_message ?? null}
            closed_until={slots.closed_until ?? null}
          />
        </div>
      </main>
    )
  }

  return <OrderPage products={(products ?? []) as Product[]} />
}
