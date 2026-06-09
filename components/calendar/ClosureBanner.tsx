'use client'

import { format } from 'date-fns'

type Props = {
  message: string | null
  closed_until: string | null  // "YYYY-MM-DD" or null
}

export function ClosureBanner({ message, closed_until }: Props) {
  const resumeText = closed_until
    ? `Lavaca MNL will resume accepting deliveries on ${format(new Date(closed_until + 'T00:00:00'), 'MMMM d, yyyy')}.`
    : 'We will announce our return on our Facebook page.'

  return (
    <div className="w-full rounded-lg bg-amber-50 border border-amber-300 px-6 py-5 text-center shadow-sm">
      {message && (
        <p className="text-amber-900 font-semibold text-lg mb-2">{message}</p>
      )}
      <p className="text-amber-800 text-base mb-1">{resumeText}</p>
      <p className="text-amber-700 text-sm">
        For inquiries, message us on Messenger.
      </p>
    </div>
  )
}
