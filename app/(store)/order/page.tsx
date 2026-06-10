import { createClient } from '@/lib/supabase/server'
import { OrderPage } from '@/components/order/OrderPage'
import type { Product } from '@/components/order/ProductSelector'

export default async function Page() {
  const supabase = createClient()

  const { data: products } = await supabase
    .from('products')
    .select('id, sku, name, description, price, weight_label, image_url')
    .eq('is_available', true)
    .order('sort_order', { ascending: true })

  return <OrderPage products={(products ?? []) as Product[]} />
}
