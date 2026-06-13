'use client'

import { useState } from 'react'

export type Product = {
  id: string
  sku: string
  name: string
  description: string | null
  price: number
  weight_label: string
  image_url: string | null
}

export type CartItem = {
  product_id: string
  quantity: number
  unit_price: number
}

type Props = {
  products: Product[]
  cart: CartItem[]
  onChange: (cart: CartItem[]) => void
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount)

const qtyButtonStyle = (disabled: boolean): React.CSSProperties => ({
  width: 32,
  height: 32,
  border: '1px solid #D6D3D1',
  background: '#FFFFFF',
  color: disabled ? '#D6D3D1' : '#1C1917',
  fontSize: 18,
  cursor: disabled ? 'not-allowed' : 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'border-color 0.2s',
  borderRadius: 0,
  padding: 0,
})

export function ProductSelector({ products, cart, onChange }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const getQuantity = (productId: string) =>
    cart.find((item) => item.product_id === productId)?.quantity ?? 0

  const handleChange = (product: Product, delta: number) => {
    const current = getQuantity(product.id)
    const next = Math.max(0, current + delta)

    const filtered = cart.filter((item) => item.product_id !== product.id)
    if (next === 0) {
      onChange(filtered)
    } else {
      onChange([...filtered, { product_id: product.id, quantity: next, unit_price: product.price }])
    }
  }

  const subtotal = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
  const hasItems = cart.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {products.map((product) => {
        const qty = getQuantity(product.id)
        const isHovered = hoveredId === product.id
        return (
          <div
            key={product.id}
            onMouseEnter={() => setHoveredId(product.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              background: '#FFFFFF',
              border: `1px solid ${isHovered ? '#A16207' : '#D6D3D1'}`,
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 16,
              transition: 'border-color 0.2s',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 17,
                  color: '#1C1917',
                  margin: 0,
                }}
              >
                {product.name}
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 12,
                    color: '#8C7B6B',
                  }}
                >
                  {' '}
                  · {product.weight_label}
                </span>
              </p>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 13,
                  color: '#A16207',
                  fontWeight: 600,
                  margin: '4px 0 0',
                }}
              >
                {formatCurrency(product.price)}
              </p>
              {product.description && (
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 12,
                    color: '#57534E',
                    margin: '6px 0 0',
                  }}
                >
                  {product.description}
                </p>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: 4,
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => handleChange(product, -1)}
                  disabled={qty === 0}
                  aria-label={`Decrease quantity of ${product.name}`}
                  style={qtyButtonStyle(qty === 0)}
                >
                  −
                </button>
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 14,
                    color: '#1C1917',
                    fontWeight: 500,
                    width: 28,
                    textAlign: 'center',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => handleChange(product, 1)}
                  aria-label={`Increase quantity of ${product.name}`}
                  style={qtyButtonStyle(false)}
                >
                  +
                </button>
              </div>
              {qty > 0 && (
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 11,
                    color: '#8C7B6B',
                    fontVariantNumeric: 'tabular-nums',
                    margin: 0,
                  }}
                >
                  {formatCurrency(product.price)} × {qty} = {formatCurrency(product.price * qty)}
                </p>
              )}
            </div>
          </div>
        )
      })}

      {hasItems && (
        <div
          style={{
            borderTop: '1px solid #D6D3D1',
            paddingTop: 16,
            marginTop: 4,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: 9,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: '#A16207',
            }}
          >
            Subtotal
          </span>
          <span
            style={{
              fontFamily: "'Playfair Display SC', serif",
              fontSize: 22,
              color: '#A16207',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatCurrency(subtotal)}
          </span>
        </div>
      )}
    </div>
  )
}
