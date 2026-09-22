import { AnnouncementEditor } from '@/components/admin/AnnouncementEditor'
import { PaymentSettingsEditor } from '@/components/admin/PaymentSettingsEditor'

export const dynamic = 'force-dynamic'

export default function AdminSettingsPage() {
  const card = {
    background: '#FFFFFF',
    border: '1px solid #D6D3D1',
    padding: '22px 24px',
    marginBottom: 16,
  }

  const sectionHeading = {
    fontFamily: "'Playfair Display SC', serif",
    fontSize: 15,
    fontWeight: 400,
    color: '#1C1917',
    margin: '0 0 4px',
    letterSpacing: '0.01em',
  }

  const sectionSubtext = {
    fontFamily: "'Jost', sans-serif",
    fontSize: 12,
    color: '#78716C',
    margin: '0 0 20px',
    lineHeight: 1.5,
  }

  return (
    <div style={{ maxWidth: 680 }}>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: "'Playfair Display SC', serif",
          fontSize: 22,
          fontWeight: 400,
          color: '#1C1917',
          margin: '0 0 4px',
          letterSpacing: '0.01em',
        }}>
          Settings
        </h1>
        <p style={{
          fontFamily: "'Jost', sans-serif",
          fontSize: 9,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: '#A16207',
          margin: 0,
        }}>
          Payment &amp; Announcements
        </p>
      </div>

      {/* Payment details */}
      <div style={card}>
        <h2 style={sectionHeading}>Payment details</h2>
        <p style={sectionSubtext}>
          Shown to customers on the payment page. Edit and save to update them immediately.
        </p>
        <PaymentSettingsEditor />
      </div>

      {/* Closure announcement */}
      <div style={card}>
        <h2 style={sectionHeading}>Closure announcement</h2>
        <p style={sectionSubtext}>
          When active, the order page shows a banner and hides the booking calendar.
        </p>
        <AnnouncementEditor />
      </div>
    </div>
  )
}
