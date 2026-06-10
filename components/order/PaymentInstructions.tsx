'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  defaultMethod: 'gcash' | 'bank_transfer'
  gcashNumber: string
  gcashAccountName: string
  bpiAccount: string
  bpiName: string
  bdoAccount: string
  bdoName: string
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/40 px-3 py-2">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground leading-none mb-0.5">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">{value}</p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Copy ${label}`}
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
    </div>
  )
}

export function PaymentInstructions({
  defaultMethod,
  gcashNumber,
  gcashAccountName,
  bpiAccount,
  bpiName,
  bdoAccount,
  bdoName,
}: Props) {
  const [method, setMethod] = useState<'gcash' | 'bank_transfer'>(defaultMethod)

  return (
    <div className="space-y-4">
      {/* Method toggle */}
      <div className="flex gap-6">
        {(['gcash', 'bank_transfer'] as const).map((opt) => (
          <label key={opt} className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="payment_method_display"
              value={opt}
              checked={method === opt}
              onChange={() => setMethod(opt)}
              className="accent-primary h-4 w-4"
            />
            {opt === 'gcash' ? 'GCash' : 'Bank Transfer'}
          </label>
        ))}
      </div>

      {/* GCash details */}
      {method === 'gcash' && (
        <div className="space-y-2">
          <CopyField label="GCash number" value={gcashNumber} />
          <CopyField label="Account name" value={gcashAccountName} />
        </div>
      )}

      {/* Bank transfer details */}
      {method === 'bank_transfer' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">BPI</p>
            <CopyField label="Account number" value={bpiAccount} />
            <CopyField label="Account name" value={bpiName} />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">BDO</p>
            <CopyField label="Account number" value={bdoAccount} />
            <CopyField label="Account name" value={bdoName} />
          </div>
        </div>
      )}
    </div>
  )
}
