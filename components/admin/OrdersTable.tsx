'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<string, string> = {
  PENDING_PAYMENT: 'bg-yellow-100 text-yellow-800',
  PAYMENT_REVIEW:  'bg-blue-100 text-blue-800',
  CONFIRMED:       'bg-green-100 text-green-800',
  AWAITING_PICKUP: 'bg-purple-100 text-purple-800',
  OUT_FOR_DELIVERY:'bg-indigo-100 text-indigo-800',
  DELIVERED:       'bg-gray-100 text-gray-600',
  CANCELLED:       'bg-red-100 text-red-700',
  EXPIRED:         'bg-gray-100 text-gray-500',
}

const ALL_STATUSES = Object.keys(STATUS_STYLES)

const fmt = (n: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n)

export type OrderTableRow = {
  id: string
  order_number: string
  created_at: string
  status: string
  total_amount: number
  customer_name: string
  delivery_date: string
  slot_window: string
  items_summary: string
}

interface Props {
  orders: OrderTableRow[]
}

export function OrdersTable({ orders }: Props) {
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return orders.filter((o) => {
      if (statusFilter !== 'ALL' && o.status !== statusFilter) return false
      if (q && !o.order_number.toLowerCase().includes(q) && !o.customer_name.toLowerCase().includes(q)) return false
      return true
    })
  }, [orders, statusFilter, search])

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search order # or customer…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-56"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="ALL">All statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <span className="text-sm text-muted-foreground">{filtered.length} order{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground text-center">No orders found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Order #</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Customer</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Items</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Delivery</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Placed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${order.id}`} className="font-medium text-primary hover:underline">
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-foreground">{order.customer_name}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[180px] truncate">{order.items_summary}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {order.delivery_date} · {order.slot_window}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-600')}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">{fmt(order.total_amount)}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', timeZone: 'Asia/Manila' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
