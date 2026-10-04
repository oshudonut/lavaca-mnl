import '../admin.css'
import { AdminNav } from '@/components/admin/AdminNav'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Count shown on the Orders tab: payments waiting for the owner to check.
  const { count } = await createServiceClient()
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'PAYMENT_REVIEW')

  return (
    <div className="adm">
      <AdminNav reviewCount={count ?? 0} />
      <main className="adm-main">{children}</main>
    </div>
  )
}
