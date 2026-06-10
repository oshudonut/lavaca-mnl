import { DeliveryCalendarGrid } from '@/components/admin/DeliveryCalendarGrid'

export const dynamic = 'force-dynamic'

export default function AdminCalendarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Delivery Calendar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage open dates, slot capacity, and closures.
        </p>
      </div>
      <DeliveryCalendarGrid />
    </div>
  )
}
