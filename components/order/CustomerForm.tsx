'use client'

import { useState } from 'react'

export type CustomerDetails = {
  name: string
  phone: string
  email: string
  special_request: string
  payment_method: 'gcash' | 'bank_transfer'
}

type Props = {
  value: CustomerDetails
  onChange: (details: CustomerDetails) => void
  errors?: Partial<Record<keyof CustomerDetails, string>>
}

const fieldWrapperStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  marginBottom: 20,
}

const labelStyle: React.CSSProperties = {
  fontFamily: "'Inter', sans-serif",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: '#1C1917',
}

const inputStyle = (focused: boolean, hasError: boolean): React.CSSProperties => ({
  fontFamily: "'Inter', sans-serif",
  fontSize: 14,
  color: '#1C1917',
  background: '#FFFFFF',
  border: `1px solid ${hasError ? '#DC2626' : focused ? '#A16207' : '#D6D3D1'}`,
  padding: '11px 14px',
  width: '100%',
  outline: 'none',
  borderRadius: 0,
  transition: 'border-color 0.2s',
})

const errorTextStyle: React.CSSProperties = {
  fontFamily: "'Inter', sans-serif",
  fontSize: 11,
  color: '#DC2626',
  margin: 0,
}

export function CustomerForm({ value, onChange, errors }: Props) {
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const set = <K extends keyof CustomerDetails>(field: K, fieldValue: CustomerDetails[K]) =>
    onChange({ ...value, [field]: fieldValue })

  return (
    <div>
      {/* Full name */}
      <div style={fieldWrapperStyle}>
        <label htmlFor="cf-name" style={labelStyle}>
          Full name
        </label>
        <input
          id="cf-name"
          type="text"
          required
          value={value.name}
          onChange={(e) => set('name', e.target.value)}
          onFocus={() => setFocusedField('name')}
          onBlur={() => setFocusedField(null)}
          style={inputStyle(focusedField === 'name', !!errors?.name)}
          aria-describedby={errors?.name ? 'cf-name-error' : undefined}
          aria-invalid={!!errors?.name}
        />
        {errors?.name && (
          <p id="cf-name-error" style={errorTextStyle}>
            {errors.name}
          </p>
        )}
      </div>

      {/* Phone number */}
      <div style={fieldWrapperStyle}>
        <label htmlFor="cf-phone" style={labelStyle}>
          Phone number
        </label>
        <input
          id="cf-phone"
          type="text"
          required
          placeholder="+63 9XX XXX XXXX"
          value={value.phone}
          onChange={(e) => set('phone', e.target.value)}
          onFocus={() => setFocusedField('phone')}
          onBlur={() => setFocusedField(null)}
          style={inputStyle(focusedField === 'phone', !!errors?.phone)}
          aria-describedby={errors?.phone ? 'cf-phone-error' : undefined}
          aria-invalid={!!errors?.phone}
        />
        {errors?.phone && (
          <p id="cf-phone-error" style={errorTextStyle}>
            {errors.phone}
          </p>
        )}
      </div>

      {/* Email address */}
      <div style={fieldWrapperStyle}>
        <label htmlFor="cf-email" style={labelStyle}>
          Email address
        </label>
        <input
          id="cf-email"
          type="email"
          required
          value={value.email}
          onChange={(e) => set('email', e.target.value)}
          onFocus={() => setFocusedField('email')}
          onBlur={() => setFocusedField(null)}
          style={inputStyle(focusedField === 'email', !!errors?.email)}
          aria-describedby={errors?.email ? 'cf-email-error' : undefined}
          aria-invalid={!!errors?.email}
        />
        {errors?.email && (
          <p id="cf-email-error" style={errorTextStyle}>
            {errors.email}
          </p>
        )}
      </div>

      {/* Special request */}
      <div style={fieldWrapperStyle}>
        <label htmlFor="cf-special-request" style={labelStyle}>
          Special Request
        </label>
        <textarea
          id="cf-special-request"
          required
          rows={3}
          maxLength={500}
          value={value.special_request}
          onChange={(e) => set('special_request', e.target.value)}
          onFocus={() => setFocusedField('special_request')}
          onBlur={() => setFocusedField(null)}
          style={{
            ...inputStyle(focusedField === 'special_request', !!errors?.special_request),
            resize: 'vertical',
          }}
          aria-describedby={errors?.special_request ? 'cf-special-request-error' : undefined}
          aria-invalid={!!errors?.special_request}
        />
        {errors?.special_request && (
          <p id="cf-special-request-error" style={errorTextStyle}>
            {errors.special_request}
          </p>
        )}
      </div>

      {/* Payment method */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={labelStyle}>Payment Method</span>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {(
            [
              { value: 'gcash', label: 'GCash' },
              { value: 'bank_transfer', label: 'Bank Transfer' },
            ] as const
          ).map((option) => {
            const isSelected = value.payment_method === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => set('payment_method', option.value)}
                aria-pressed={isSelected}
                aria-label={`Pay with ${option.label}`}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 12,
                  fontWeight: 500,
                  padding: '8px 20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  borderRadius: 0,
                  background: isSelected ? '#A16207' : 'transparent',
                  color: isSelected ? '#FFFFFF' : '#57534E',
                  border: isSelected ? '1px solid #A16207' : '1px solid #D6D3D1',
                }}
              >
                {option.label}
              </button>
            )
          })}
        </div>
        {errors?.payment_method && (
          <p style={errorTextStyle}>{errors.payment_method}</p>
        )}
      </div>
    </div>
  )
}
