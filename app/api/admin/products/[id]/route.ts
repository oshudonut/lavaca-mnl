import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { STOREFRONT_TAG } from '@/lib/supabase/storefront'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 422 })

  if (body.price !== undefined && (typeof body.price !== 'number' || body.price <= 0)) {
    return NextResponse.json({ error: 'price must be a number greater than 0' }, { status: 422 })
  }

  const supabase = createServiceClient()

  const { data: existing } = await supabase
    .from('products')
    .select('id')
    .eq('id', params.id)
    .maybeSingle()

  if (!existing) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  const updates: Record<string, unknown> = {}
  for (const field of ['sku', 'name', 'description', 'price', 'weight_label', 'image_url', 'is_available', 'sort_order']) {
    if (body[field] !== undefined) updates[field] = body[field]
  }

  const { data: updated, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', params.id)
    .select('id, sku, name, description, price, weight_label, image_url, is_available, sort_order')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: `SKU "${body.sku}" already exists` }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }

  revalidateTag(STOREFRONT_TAG)
  return NextResponse.json(updated)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()

  const { error } = await supabase.from('products').delete().eq('id', params.id)

  if (error) {
    if (error.code === '23503') {
      return NextResponse.json(
        { error: 'Cannot delete — this product has existing orders. Mark it unavailable instead.' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }

  revalidateTag(STOREFRONT_TAG)
  return NextResponse.json({ success: true })
}
