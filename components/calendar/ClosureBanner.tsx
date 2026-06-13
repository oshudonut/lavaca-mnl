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
    <div
      style={{
        width: '100%',
        background: '#1C1917',
        borderLeft: '3px solid #A16207',
        padding: '20px 24px',
      }}
    >
      {message && (
        <p
          style={{
            fontFamily: "'Playfair Display', serif",
            fontStyle: 'italic',
            fontSize: 16,
            color: '#FAFAF9',
            margin: '0 0 8px',
          }}
        >
          {message}
        </p>
      )}
      <p
        style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 300,
          fontSize: 13,
          color: 'rgba(250,250,249,0.65)',
          margin: '0 0 4px',
        }}
      >
        {resumeText}
      </p>
      <p
        style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 300,
          fontSize: 13,
          color: 'rgba(250,250,249,0.65)',
          margin: 0,
        }}
      >
        For inquiries, message us on Messenger.
      </p>
    </div>
  )
}
