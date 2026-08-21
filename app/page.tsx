import { createClient } from '@/lib/supabase/server'
import { HomeContent } from '@/components/home/HomeContent'
import type { DisplayProduct } from '@/components/home/HomeContent'

export const dynamic = 'force-dynamic'

type DbProduct = {
  sku: string
  name: string
  price: number
  weight_label: string
}

// Marketing copy that isn't stored in the products table. Keyed by SKU so
// admin-managed name/price/weight_label stay live while this stays curated.
const PRESENTATION: Record<string, { descriptor: string; occasion: string; photo: string; photoPos: string }> = {
  'LV-100': {
    descriptor: 'Solo Serving',
    occasion: 'Perfect for date nights and personal indulgence. The ideal introduction to Lavaca MNL.',
    photo: '/photo-topdown.png',
    photoPos: 'center 40%',
  },
  'LV-1000': {
    descriptor: 'Serves 4–6',
    occasion: 'The family dinner cut. Enough for a full table, worthy of a celebration.',
    photo: '/photo-slices.png',
    photoPos: 'center 40%',
  },
  'LV-1500': {
    descriptor: 'Serves 6–9',
    occasion: 'Built for gatherings. The centrepiece your guests will remember long after the table is cleared.',
    photo: '/photo-slices.png',
    photoPos: 'center 60%',
  },
}

const FALLBACK_PRESENTATION = {
  descriptor: '',
  occasion: 'Premium Angus, slow-cooked to order.',
  photo: '/photo-hero.png',
  photoPos: 'center 40%',
}

const priceFmt = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

function toDisplayProduct(p: DbProduct): DisplayProduct {
  const meta = PRESENTATION[p.sku] ?? FALLBACK_PRESENTATION
  return {
    sku: p.sku,
    name: p.name,
    weight: meta.descriptor ? `${p.weight_label} · ${meta.descriptor}` : p.weight_label,
    price: priceFmt.format(p.price),
    occasion: meta.occasion,
    photo: meta.photo,
    photoPos: meta.photoPos,
  }
}

export default async function HomePage() {
  const supabase = createClient()

  const { data } = await supabase
    .from('products')
    .select('sku, name, price, weight_label')
    .eq('is_available', true)
    .order('sort_order', { ascending: true })

  const products = ((data ?? []) as DbProduct[]).map(toDisplayProduct)

  return <HomeContent products={products} />
}
