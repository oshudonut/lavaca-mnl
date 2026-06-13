'use client'

import { useState } from 'react'

interface Props {
  defaultMethod: 'gcash' | 'bank_transfer'
  gcashNumber: string
  gcashAccountName: string
  bpiAccount: string
  bpiName: string
  bdoAccount: string
  bdoName: string
}

const bankLabelStyle: React.CSSProperties = {
  fontFamily: "'Jost', sans-serif",
  fontSize: 10,
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  color: '#A16207',
  margin: '0 0 8px',
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  const [hovered, setHovered] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        background: '#F5F4F2',
        border: '1px solid #D6D3D1',
        padding: '10px 14px',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <p
          style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: 9,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: '#8C7B6B',
            margin: '0 0 2px',
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
            fontWeight: 500,
            color: '#1C1917',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={`Copy ${label}`}
        style={{
          flexShrink: 0,
          background: 'none',
          border: 'none',
          padding: 4,
          cursor: 'pointer',
          color: hovered ? '#A16207' : '#8C7B6B',
          transition: 'color 0.2s',
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        {copied ? (
          <svg viewBox="0 0 24 24" width="16" height="16">
            <polyline
              points="4 12 9 17 20 6"
              stroke="#A16207"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="9" width="11" height="11" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
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
    <div>
      {/* Method toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['gcash', 'bank_transfer'] as const).map((opt) => {
          const selected = method === opt
          return (
            <button
              key={opt}
              type="button"
              onClick={() => setMethod(opt)}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 12,
                fontWeight: 500,
                padding: '8px 20px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: selected ? '#A16207' : 'transparent',
                color: selected ? '#FFFFFF' : '#57534E',
                border: selected ? '1px solid #A16207' : '1px solid #D6D3D1',
              }}
            >
              {opt === 'gcash' ? 'GCash' : 'Bank Transfer'}
            </button>
          )
        })}
      </div>

      {/* GCash details */}
      {method === 'gcash' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <CopyField label="GCash number" value={gcashNumber} />
          <CopyField label="Account name" value={gcashAccountName} />
        </div>
      )}

      {/* Bank transfer details */}
      {method === 'bank_transfer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <p style={bankLabelStyle}>BPI</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <CopyField label="Account number" value={bpiAccount} />
              <CopyField label="Account name" value={bpiName} />
            </div>
          </div>
          <div>
            <p style={bankLabelStyle}>BDO</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <CopyField label="Account number" value={bdoAccount} />
              <CopyField label="Account name" value={bdoName} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
