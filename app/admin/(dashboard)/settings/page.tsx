import { AnnouncementEditor } from '@/components/admin/AnnouncementEditor'

export const dynamic = 'force-dynamic'

function EnvRow({ label, value, isLast }: { label: string; value: string | undefined; isLast?: boolean }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: isLast ? 'none' : '1px solid #E7E5E4',
    }}>
      <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 13, color: '#78716C' }}>
        {label}
      </span>
      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500, color: '#1C1917', fontVariantNumeric: 'tabular-nums' }}>
        {value ? value : (
          <span style={{ color: '#A8A29E', fontStyle: 'italic' }}>not set</span>
        )}
      </span>
    </div>
  )
}

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

  const groupLabel = {
    fontFamily: "'Jost', sans-serif",
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: '0.18em',
    textTransform: 'uppercase' as const,
    color: '#A8A29E',
    margin: '0 0 6px',
  }

  const rowGroup = {
    border: '1px solid #E7E5E4',
    background: '#FAFAF8',
    padding: '0 16px',
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
          Read-only. Update via Vercel environment variables and redeploy.
        </p>

        <div style={{ marginBottom: 20 }}>
          <p style={groupLabel}>GCash</p>
          <div style={rowGroup}>
            <EnvRow label="Number" value={process.env.GCASH_NUMBER} />
            <EnvRow label="Account name" value={process.env.GCASH_ACCOUNT_NAME} isLast />
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <p style={groupLabel}>BPI</p>
          <div style={rowGroup}>
            <EnvRow label="Account number" value={process.env.BANK_BPI_ACCOUNT} />
            <EnvRow label="Account name" value={process.env.BANK_BPI_NAME} isLast />
          </div>
        </div>

        <div>
          <p style={groupLabel}>BDO</p>
          <div style={rowGroup}>
            <EnvRow label="Account number" value={process.env.BANK_BDO_ACCOUNT} />
            <EnvRow label="Account name" value={process.env.BANK_BDO_NAME} isLast />
          </div>
        </div>
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
