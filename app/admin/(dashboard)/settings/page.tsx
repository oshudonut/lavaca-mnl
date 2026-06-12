import { AnnouncementEditor } from '@/components/admin/AnnouncementEditor'

export const dynamic = 'force-dynamic'

function EnvRow({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground tabular-nums">
        {value ? value : <span className="text-muted-foreground/50 italic">not set</span>}
      </span>
    </div>
  )
}

export default function AdminSettingsPage() {
  return (
    <div className="max-w-2xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Payment details and site announcements.</p>
      </div>

      {/* Payment details */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div>
          <h2 className="font-semibold text-foreground">Payment details</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Read-only. Update via Vercel environment variables and redeploy.
          </p>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">GCash</h3>
          <div className="rounded-lg border border-border bg-background px-4">
            <EnvRow label="Number" value={process.env.GCASH_NUMBER} />
            <EnvRow label="Account name" value={process.env.GCASH_ACCOUNT_NAME} />
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">BPI</h3>
          <div className="rounded-lg border border-border bg-background px-4">
            <EnvRow label="Account number" value={process.env.BANK_BPI_ACCOUNT} />
            <EnvRow label="Account name" value={process.env.BANK_BPI_NAME} />
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">BDO</h3>
          <div className="rounded-lg border border-border bg-background px-4">
            <EnvRow label="Account number" value={process.env.BANK_BDO_ACCOUNT} />
            <EnvRow label="Account name" value={process.env.BANK_BDO_NAME} />
          </div>
        </div>
      </section>

      {/* Closure announcement */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div>
          <h2 className="font-semibold text-foreground">Closure announcement</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            When active, the order page shows a banner and hides the booking calendar.
          </p>
        </div>
        <AnnouncementEditor />
      </section>
    </div>
  )
}
