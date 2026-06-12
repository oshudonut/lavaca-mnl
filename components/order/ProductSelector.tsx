'use client'

import { Button } from '@/components/ui/button'

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

export function ProductSelector({ products, cart, onChange }: Props) {
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
    <div className="space-y-4">
      {products.map((product) => {
        const qty = getQuantity(product.id)
        return (
          <div
            key={product.id}
            className="rounded-xl glass p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-card-foreground">
                  {product.name}
                  <span className="font-normal text-muted-foreground"> · {product.weight_label}</span>
                </p>
                <p className="mt-0.5 text-sm font-semibold text-primary tracking-wide">
                  {formatCurrency(product.price)}
                </p>
                {product.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{product.description}</p>
                )}
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-base"
                    onClick={() => handleChange(product, -1)}
                    disabled={qty === 0}
                    aria-label={`Decrease quantity of ${product.name}`}
                  >
                    −
                  </Button>
                  <span className="w-6 text-center text-sm font-medium tabular-nums">{qty}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-base"
                    onClick={() => handleChange(product, 1)}
                    aria-label={`Increase quantity of ${product.name}`}
                  >
                    +
                  </Button>
                </div>
                {qty > 0 && (
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {formatCurrency(product.price)} × {qty} = {formatCurrency(product.price * qty)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {hasItems && (
        <div className="flex justify-end border-t border-border pt-4">
          <p className="text-sm font-semibold text-card-foreground">
            Subtotal:{' '}
            <span className="text-primary tabular-nums">{formatCurrency(subtotal)}</span>
          </p>
        </div>
      )}
    </div>
  )
}
