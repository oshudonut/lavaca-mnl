'use client'

import { useState } from 'react'

export type CustomerDetails = {
  name: string
  phone: string
  email: string
  address_street: string
  address_village: string
  address_city: string
  address_zip: string
  instagram: string
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
          type="tel"
          inputMode="tel"
          autoComplete="tel"
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
          autoComplete="email"
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

      {/* Address */}
      <div style={fieldWrapperStyle}>
        <label htmlFor="cf-street" style={labelStyle}>
          House/lot number and street
        </label>
        <input
          id="cf-street"
          type="text"
          required
          autoComplete="address-line1"
          placeholder="e.g. 12 Acacia St."
          value={value.address_street}
          onChange={(e) => set('address_street', e.target.value)}
          onFocus={() => setFocusedField('address_street')}
          onBlur={() => setFocusedField(null)}
          style={inputStyle(focusedField === 'address_street', !!errors?.address_street)}
          aria-describedby={errors?.address_street ? 'cf-street-error' : undefined}
          aria-invalid={!!errors?.address_street}
        />
        {errors?.address_street && (
          <p id="cf-street-error" style={errorTextStyle}>
            {errors.address_street}
          </p>
        )}
      </div>

      <div style={fieldWrapperStyle}>
        <label htmlFor="cf-village" style={labelStyle}>
          Village
        </label>
        <input
          id="cf-village"
          type="text"
          required
          autoComplete="address-line2"
          placeholder="e.g. Ayala Alabang Village"
          value={value.address_village}
          onChange={(e) => set('address_village', e.target.value)}
          onFocus={() => setFocusedField('address_village')}
          onBlur={() => setFocusedField(null)}
          style={inputStyle(focusedField === 'address_village', !!errors?.address_village)}
          aria-describedby={errors?.address_village ? 'cf-village-error' : undefined}
          aria-invalid={!!errors?.address_village}
        />
        {errors?.address_village && (
          <p id="cf-village-error" style={errorTextStyle}>
            {errors.address_village}
          </p>
        )}
      </div>

      <div style={fieldWrapperStyle}>
        <label htmlFor="cf-city" style={labelStyle}>
          City
        </label>
        <input
          id="cf-city"
          type="text"
          required
          autoComplete="address-level2"
          placeholder="e.g. Muntinlupa"
          value={value.address_city}
          onChange={(e) => set('address_city', e.target.value)}
          onFocus={() => setFocusedField('address_city')}
          onBlur={() => setFocusedField(null)}
          style={inputStyle(focusedField === 'address_city', !!errors?.address_city)}
          aria-describedby={errors?.address_city ? 'cf-city-error' : undefined}
          aria-invalid={!!errors?.address_city}
        />
        {errors?.address_city && (
          <p id="cf-city-error" style={errorTextStyle}>
            {errors.address_city}
          </p>
        )}
      </div>

      <div style={fieldWrapperStyle}>
        <label htmlFor="cf-zip" style={labelStyle}>
          ZIP code
        </label>
        <input
          id="cf-zip"
          type="text"
          required
          autoComplete="postal-code"
          inputMode="numeric"
          maxLength={4}
          placeholder="e.g. 1780"
          value={value.address_zip}
          onChange={(e) => set('address_zip', e.target.value)}
          onFocus={() => setFocusedField('address_zip')}
          onBlur={() => setFocusedField(null)}
          style={inputStyle(focusedField === 'address_zip', !!errors?.address_zip)}
          aria-describedby={errors?.address_zip ? 'cf-zip-error' : undefined}
          aria-invalid={!!errors?.address_zip}
        />
        {errors?.address_zip && (
          <p id="cf-zip-error" style={errorTextStyle}>
            {errors.address_zip}
          </p>
        )}
      </div>

      {/* Instagram (optional) */}
      <div style={fieldWrapperStyle}>
        <label htmlFor="cf-instagram" style={labelStyle}>
          Instagram name{' '}
          <span style={{ color: '#8C7B6B', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
        </label>
        <input
          id="cf-instagram"
          type="text"
          autoCapitalize="none"
          placeholder="@yourname"
          value={value.instagram}
          onChange={(e) => set('instagram', e.target.value)}
          onFocus={() => setFocusedField('instagram')}
          onBlur={() => setFocusedField(null)}
          style={inputStyle(focusedField === 'instagram', false)}
        />
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
