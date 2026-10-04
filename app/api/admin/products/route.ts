import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { STOREFRONT_TAG } from '@/lib/supabase/storefront'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET() {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('products')
    .select('id, sku, name, description, price, weight_label, image_url, is_available, sort_order')
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })

  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body?.sku || !body?.name || !body?.weight_label || body?.price === undefined) {
    return NextResponse.json(
      { error: 'sku, name, weight_label, and price are required' },
      { status: 422 }
    )
  }
  if (typeof body.price !== 'number' || body.price <= 0) {
    return NextResponse.json({ error: 'price must be a number greater than 0' }, { status: 422 })
  }

  const supabase = createServiceClient()

  const { data: maxSort } = await supabase
    .from('products')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: inserted, error } = await supabase
    .from('products')
    .insert({
      sku: body.sku,
      name: body.name,
      description: body.description ?? null,
      price: body.price,
      weight_label: body.weight_label,
      image_url: body.image_url ?? null,
      is_available: body.is_available ?? true,
      sort_order: body.sort_order ?? (maxSort?.sort_order ?? 0) + 1,
    })
    .select('id, sku, name, description, price, weight_label, image_url, is_available, sort_order')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: `SKU "${body.sku}" already exists` }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }

  revalidateTag(STOREFRONT_TAG)
  return NextResponse.json(inserted, { status: 201 })
}
