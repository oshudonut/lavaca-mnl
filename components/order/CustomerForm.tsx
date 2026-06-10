'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export type CustomerDetails = {
  name: string
  phone: string
  email: string
  delivery_address: string
  payment_method: 'gcash' | 'bank_transfer'
}

type Props = {
  value: CustomerDetails
  onChange: (details: CustomerDetails) => void
  errors?: Partial<Record<keyof CustomerDetails, string>>
}

export function CustomerForm({ value, onChange, errors }: Props) {
  const set = <K extends keyof CustomerDetails>(field: K, fieldValue: CustomerDetails[K]) =>
    onChange({ ...value, [field]: fieldValue })

  return (
    <div className="space-y-5">
      {/* Full name */}
      <div className="space-y-1.5">
        <Label htmlFor="cf-name">Full name</Label>
        <Input
          id="cf-name"
          type="text"
          required
          value={value.name}
          onChange={(e) => set('name', e.target.value)}
          aria-describedby={errors?.name ? 'cf-name-error' : undefined}
          aria-invalid={!!errors?.name}
        />
        {errors?.name && (
          <p id="cf-name-error" className="text-xs text-destructive">
            {errors.name}
          </p>
        )}
      </div>

      {/* Phone number */}
      <div className="space-y-1.5">
        <Label htmlFor="cf-phone">Phone number</Label>
        <Input
          id="cf-phone"
          type="text"
          required
          placeholder="+63 9XX XXX XXXX"
          value={value.phone}
          onChange={(e) => set('phone', e.target.value)}
          aria-describedby={errors?.phone ? 'cf-phone-error' : undefined}
          aria-invalid={!!errors?.phone}
        />
        {errors?.phone && (
          <p id="cf-phone-error" className="text-xs text-destructive">
            {errors.phone}
          </p>
        )}
      </div>

      {/* Email address */}
      <div className="space-y-1.5">
        <Label htmlFor="cf-email">Email address</Label>
        <Input
          id="cf-email"
          type="email"
          required
          value={value.email}
          onChange={(e) => set('email', e.target.value)}
          aria-describedby={errors?.email ? 'cf-email-error' : undefined}
          aria-invalid={!!errors?.email}
        />
        {errors?.email && (
          <p id="cf-email-error" className="text-xs text-destructive">
            {errors.email}
          </p>
        )}
      </div>

      {/* Delivery address */}
      <div className="space-y-1.5">
        <Label htmlFor="cf-address">Delivery address</Label>
        <Textarea
          id="cf-address"
          required
          rows={3}
          value={value.delivery_address}
          onChange={(e) => set('delivery_address', e.target.value)}
          aria-describedby={
            errors?.delivery_address
              ? 'cf-address-error'
              : 'cf-address-hint'
          }
          aria-invalid={!!errors?.delivery_address}
        />
        {!errors?.delivery_address && (
          <p id="cf-address-hint" className="text-xs text-muted-foreground">
            Metro Manila addresses only.
          </p>
        )}
        {errors?.delivery_address && (
          <p id="cf-address-error" className="text-xs text-destructive">
            {errors.delivery_address}
          </p>
        )}
      </div>

      {/* Payment method */}
      <div className="space-y-2">
        <Label>Payment method</Label>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
          {(
            [
              { value: 'gcash', label: 'GCash' },
              { value: 'bank_transfer', label: 'Bank Transfer' },
            ] as const
          ).map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <input
                type="radio"
                name="payment_method"
                value={option.value}
                checked={value.payment_method === option.value}
                onChange={() => set('payment_method', option.value)}
                className="accent-primary h-4 w-4"
              />
              {option.label}
            </label>
          ))}
        </div>
        {errors?.payment_method && (
          <p className="text-xs text-destructive">{errors.payment_method}</p>
        )}
      </div>
    </div>
  )
}
