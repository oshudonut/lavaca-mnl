import { DeliveryCalendarGrid } from '@/components/admin/DeliveryCalendarGrid'
import { PageHeader } from '@/components/admin/ui'

export const dynamic = 'force-dynamic'

export default function AdminCalendarPage() {
  return (
    <>
      <PageHeader title="Pickup calendar" eyebrow="Which days customers can choose" />
      <DeliveryCalendarGrid />
    </>
  )
}
