'use client'

type Props = {
  message: string | null
}

export function ClosureBanner({ message }: Props) {
  return (
    <div
      style={{
        width: '100%',
        background: '#1C1917',
        borderLeft: '3px solid #A16207',
        padding: '20px 24px',
      }}
    >
      <p
        style={{
          fontFamily: "'Playfair Display', serif",
          fontStyle: 'italic',
          fontSize: 16,
          color: '#FAFAF9',
          margin: 0,
        }}
      >
        {message}
      </p>
    </div>
  )
}
