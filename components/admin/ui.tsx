// Small shared building blocks for admin screens. Styling lives in
// app/admin/admin.css (adm- classes).
import { orderStatus } from '@/lib/orders/status'

export function PageHeader({
  eyebrow,
  title,
  actions,
}: {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <div className="adm-page-head">
      <div>
        {eyebrow && <p className="adm-eyebrow">{eyebrow}</p>}
        <h1 className="adm-h1">{title}</h1>
      </div>
      {actions}
    </div>
  )
}

export function Card({
  title,
  note,
  children,
  className,
}: {
  title?: React.ReactNode
  note?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`adm-card${className ? ` ${className}` : ''}`}>
      {(title || note) && (
        <div className="adm-card-head">
          {title && <h2 className="adm-h2">{title}</h2>}
          {note && <span className="adm-card-note">{note}</span>}
        </div>
      )}
      {children}
    </section>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const { label, tone } = orderStatus(status)
  return <span className={`adm-badge tone-${tone}`}>{label}</span>
}

// One tag per ordered item: "1 kg × 2 · Ready to Serve", coloured by the
// serving choice (older orders without one show the item only).
export function ItemChip({ label, style }: { label: string; style: string | null | undefined }) {
  if (style === 'warm') return <span className="adm-chip is-warm">{label} · Ready to Serve</span>
  if (style === 'frozen') return <span className="adm-chip is-frozen">{label} · Frozen for Later</span>
  return <span className="adm-chip">{label}</span>
}

export function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="adm-stat">
      <span className="adm-stat-label">{label}</span>
      <span className="adm-stat-value">{value}</span>
    </div>
  )
}
