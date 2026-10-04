import { createServiceClient } from '@/lib/supabase/service'
import { ProductsTable } from '@/components/admin/ProductsTable'
import type { ProductRow } from '@/components/admin/ProductsTable'
import { PageHeader } from '@/components/admin/ui'

export const dynamic = 'force-dynamic'

export default async function AdminProductsPage() {
  const supabase = createServiceClient()

  const { data: rows } = await supabase
    .from('products')
    .select('id, sku, name, description, price, weight_label, image_url, is_available, sort_order')
    .order('sort_order', { ascending: true })

  return (
    <>
      <PageHeader title="Products" eyebrow="What customers can order" />
      <ProductsTable products={(rows ?? []) as ProductRow[]} />
    </>
  )
}
