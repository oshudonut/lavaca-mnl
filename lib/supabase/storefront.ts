import { createClient } from '@supabase/supabase-js'

// Cache tag for everything the public order page reads (products, open
// dates, product exclusions, closure banner). Admin routes that change any
// of these call revalidateTag(STOREFRONT_TAG) so customers see edits at once.
export const STOREFRONT_TAG = 'storefront'

/**
 * Read-only client for the public storefront. Unlike createServiceClient()
 * (always live, for admin and orders), its responses go into Next's Data
 * Cache for up to 60s and are tagged so admin edits can invalidate them.
 * Server-only: uses the service role key.
 */
export function createStorefrontClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false },
      global: {
        fetch: (input, init) =>
          fetch(input, { ...init, next: { revalidate: 60, tags: [STOREFRONT_TAG] } }),
      },
    }
  )
}
