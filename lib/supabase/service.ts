import { createClient } from '@supabase/supabase-js'

// Next.js's Data Cache can cache a query's underlying fetch() response
// indefinitely even on a force-dynamic route (it isn't reliably scoped to
// third-party libraries' internal fetch calls). Every query through this
// client must always hit the database live, so caching is disabled explicitly.
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: {
        fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
      },
    }
  )
}
