'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

type StatusStyle = { bg: string; color: string }

const STATUS_STYLES: Record<string, StatusStyle> = {
  PENDING_PAYMENT:  { bg: '#FEF3C7', color: '#92400E' },
  PAYMENT_REVIEW:   { bg: '#DBEAFE', color: '#1E40AF' },
  CONFIRMED:        { bg: '#D1FAE5', color: '#065F46' },
  AWAITING_PICKUP:  { bg: '#EDE9FE', color: '#5B21B6' },
  OUT_FOR_DELIVERY: { bg: '#E0E7FF', color: '#3730A3' },
  DELIVERED:        { bg: '#F3F4F6', color: '#4B5563' },
  CANCELLED:        { bg: '#FEE2E2', color: '#B91C1C' },
  EXPIRED:          { bg: '#F3F4F6', color: '#6B7280' },
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
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return orders.filter((o) => {
      if (statusFilter !== 'ALL' && o.status !== statusFilter) return false
      if (q && !o.order_number.toLowerCase().includes(q) && !o.customer_name.toLowerCase().includes(q)) return false
      return true
    })
  }, [orders, statusFilter, search])

  const inputBase: React.CSSProperties = {
    fontFamily: "'Inter', sans-serif",
    fontSize: 13,
    color: '#1C1917',
    background: '#FFFFFF',
    border: '1px solid #D6D3D1',
    padding: '9px 12px',
    outline: 'none',
    borderRadius: 0,
    transition: 'border-color 0.2s',
  }

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search order # or customer…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setFocusedField('search')}
          onBlur={() => setFocusedField(null)}
          style={{
            ...inputBase,
            borderColor: focusedField === 'search' ? '#A16207' : '#D6D3D1',
            width: 220,
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          onFocus={() => setFocusedField('status')}
          onBlur={() => setFocusedField(null)}
          style={{
            ...inputBase,
            borderColor: focusedField === 'status' ? '#A16207' : '#D6D3D1',
            cursor: 'pointer',
          }}
        >
          <option value="ALL">All statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <span style={{
          fontFamily: "'Jost', sans-serif",
          fontSize: 10,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: '#8C7B6B',
        }}>
          {filtered.length} order{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #D6D3D1',
        overflow: 'hidden',
      }}>
        {filtered.length === 0 ? (
          <p style={{
            padding: '40px 24px',
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            color: '#8C7B6B',
            textAlign: 'center',
            margin: 0,
          }}>
            No orders found.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #D6D3D1', background: '#F5F4F2' }}>
                  {['Order #', 'Customer', 'Items', 'Delivery', 'Status', 'Total', 'Placed'].map((col, i) => (
                    <th
                      key={col}
                      style={{
                        padding: '12px 16px',
                        fontFamily: "'Jost', sans-serif",
                        fontSize: 9,
                        fontWeight: 400,
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        color: '#8C7B6B',
                        textAlign: i === 5 ? 'right' : 'left',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((order, i) => {
                  const statusStyle = STATUS_STYLES[order.status] ?? { bg: '#F3F4F6', color: '#6B7280' }
                  return (
                    <tr
                      key={order.id}
                      style={{
                        borderTop: i === 0 ? 'none' : '1px solid #F5F4F2',
                      }}
                    >
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#A16207',
                            textDecoration: 'none',
                          }}
                        >
                          {order.order_number}
                        </Link>
                      </td>
                      <td style={{
                        padding: '14px 16px',
                        fontFamily: "'Inter', sans-serif",
                        color: '#1C1917',
                        whiteSpace: 'nowrap',
                      }}>
                        {order.customer_name}
                      </td>
                      <td style={{
                        padding: '14px 16px',
                        fontFamily: "'Inter', sans-serif",
                        color: '#57534E',
                        maxWidth: 180,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {order.items_summary}
                      </td>
                      <td style={{
                        padding: '14px 16px',
                        fontFamily: "'Inter', sans-serif",
                        color: '#57534E',
                        whiteSpace: 'nowrap',
                      }}>
                        {order.delivery_date} · {order.slot_window}
                      </td>
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          fontFamily: "'Jost', sans-serif",
                          fontSize: 9,
                          fontWeight: 500,
                          letterSpacing: '0.16em',
                          textTransform: 'uppercase',
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          padding: '3px 8px',
                        }}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{
                        padding: '14px 16px',
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 600,
                        color: '#1C1917',
                        textAlign: 'right',
                        whiteSpace: 'nowrap',
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {fmt(order.total_amount)}
                      </td>
                      <td style={{
                        padding: '14px 16px',
                        fontFamily: "'Inter', sans-serif",
                        color: '#57534E',
                        whiteSpace: 'nowrap',
                      }}>
                        {new Date(order.created_at).toLocaleDateString('en-PH', {
                          month: 'short',
                          day: 'numeric',
                          timeZone: 'Asia/Manila',
                        })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
