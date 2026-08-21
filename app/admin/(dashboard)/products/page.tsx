import { createServiceClient } from '@/lib/supabase/service'
import { ProductsTable } from '@/components/admin/ProductsTable'
import type { ProductRow } from '@/components/admin/ProductsTable'

export const dynamic = 'force-dynamic'

export default async function AdminProductsPage() {
  const supabase = createServiceClient()

  const { data: rows } = await supabase
    .from('products')
    .select('id, sku, name, description, price, weight_label, image_url, is_available, sort_order')
    .order('sort_order', { ascending: true })

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <p style={{
          fontFamily: "'Jost', sans-serif",
          fontSize: 10,
          fontWeight: 400,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: '#A16207',
          margin: '0 0 6px',
        }}>
          Admin
        </p>
        <h1 style={{
          fontFamily: "'Playfair Display SC', serif",
          fontSize: 28,
          fontWeight: 400,
          color: '#1C1917',
          margin: 0,
        }}>
          Products
        </h1>
      </div>
      <ProductsTable products={(rows ?? []) as ProductRow[]} />
    </div>
  )
}
