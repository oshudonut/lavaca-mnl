import { AnnouncementEditor } from '@/components/admin/AnnouncementEditor'
import { PaymentSettingsEditor } from '@/components/admin/PaymentSettingsEditor'
import { Card, PageHeader } from '@/components/admin/ui'

export const dynamic = 'force-dynamic'

export default function AdminSettingsPage() {
  return (
    <div style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader title="Settings" />

      <Card title="Payment details">
        <p className="adm-hint" style={{ fontSize: 15 }}>
          Customers see these on the payment page. Changes apply as soon as you save.
        </p>
        <PaymentSettingsEditor />
      </Card>

      <Card title="Closed for a while?">
        <p className="adm-hint" style={{ fontSize: 15 }}>
          Turn on the closed banner to stop all orders, for example during holidays. To close just one day, use the Calendar instead.
        </p>
        <AnnouncementEditor />
      </Card>
    </div>
  )
}
