'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ItemChip, StatusBadge } from '@/components/admin/ui'

export type OrderTableRow = {
  id: string
  order_number: string
  created_at: string
  status: string
  total_amount: number
  customer_name: string
  pickup_day: string      // "Today", "Tomorrow", "Tue, Oct 6"
  time_label: string
  items: { label: string; serving_style: string | null }[]
}

// Filter pills: each groups one or more statuses.
const FILTERS = [
  { key: 'all',       label: 'All',                 statuses: null },
  { key: 'review',    label: 'To review',           statuses: ['PAYMENT_REVIEW'] },
  { key: 'waiting',   label: 'Waiting for payment', statuses: ['PENDING_PAYMENT'] },
  { key: 'confirmed', label: 'Confirmed',           statuses: ['CONFIRMED', 'AWAITING_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED'] },
  { key: 'closed',    label: 'Cancelled / expired', statuses: ['CANCELLED', 'EXPIRED'] },
] as const

type FilterKey = (typeof FILTERS)[number]['key']

// Links from the dashboard pass a status (?status=PAYMENT_REVIEW) or a filter key.
function initialFilter(param?: string): FilterKey {
  if (!param) return 'all'
  const byKey = FILTERS.find((f) => f.key === param)
  if (byKey) return byKey.key
  const byStatus = FILTERS.find((f) => f.statuses?.includes(param as never))
  return byStatus?.key ?? 'all'
}

const peso = (n: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(n)

interface Props {
  orders: OrderTableRow[]
  initialStatus?: string
}

export function OrdersTable({ orders, initialStatus }: Props) {
  const router = useRouter()
  const [filter, setFilter] = useState<FilterKey>(() => initialFilter(initialStatus))
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const f of FILTERS) {
      c[f.key] = f.statuses ? orders.filter((o) => (f.statuses as readonly string[]).includes(o.status)).length : orders.length
    }
    return c
  }, [orders])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const statuses = FILTERS.find((f) => f.key === filter)?.statuses as readonly string[] | null
    return orders.filter((o) => {
      if (statuses && !statuses.includes(o.status)) return false
      if (q && !o.order_number.toLowerCase().includes(q) && !o.customer_name.toLowerCase().includes(q)) return false
      return true
    })
  }, [orders, filter, search])

  const allFilteredSelected = filtered.length > 0 && filtered.every((o) => selected.has(o.id))
  const selectedCount = selected.size

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev)
      filtered.forEach((o) => (allFilteredSelected ? next.delete(o.id) : next.add(o.id)))
      return next
    })
  }

  async function handleDeleteSelected() {
    setDeleting(true)
    setConfirmDelete(false)
    setDeleteError(null)
    const ids = Array.from(selected)
    const results = await Promise.all(
      ids.map((id) =>
        fetch(`/api/admin/orders/${id}/delete`, { method: 'DELETE' })
          .then((r) => r.json())
          .catch(() => ({ error: 'Network error' }))
      )
    )
    const failed = results.filter((r) => r.error)
    if (failed.length > 0) {
      setDeleteError(`${failed.length} order(s) could not be deleted: ${failed[0].error}`)
    }
    setSelected(new Set())
    setDeleting(false)
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Search + filters */}
      <div className="adm-toolbar">
        <div className="adm-field" style={{ flex: '1 1 280px', maxWidth: 420 }}>
          <label htmlFor="orders-search" className="adm-label">Search by name or order number</label>
          <input
            id="orders-search"
            type="search"
            className="adm-input"
            placeholder="e.g. Maria or LV-2026-10-04"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="adm-pills" role="group" aria-label="Filter orders by status">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={`adm-pill${filter === f.key ? ' is-active' : ''}${f.key === 'review' && counts.review > 0 ? ' is-review' : ''}`}
          >
            {f.label} · {counts[f.key]}
          </button>
        ))}
      </div>

      {/* Bulk delete */}
      {(selectedCount > 0 || deleteError) && (
        <div className="adm-bulkbar">
          {selectedCount > 0 && !confirmDelete && (
            <>
              <span>{selectedCount} selected</span>
              <button type="button" className="adm-btn adm-btn-danger" onClick={() => setConfirmDelete(true)} disabled={deleting}>
                {deleting ? 'Deleting…' : `Delete ${selectedCount} selected`}
              </button>
              <button type="button" className="adm-btn adm-btn-outline" onClick={() => setSelected(new Set())}>
                Clear selection
              </button>
            </>
          )}
          {confirmDelete && (
            <>
              <span style={{ color: '#9B1C1C', fontWeight: 500 }}>
                Delete {selectedCount} order{selectedCount !== 1 ? 's' : ''}? This can’t be undone. Use Cancel on an order to keep a record instead.
              </span>
              <button type="button" className="adm-btn adm-btn-danger" onClick={handleDeleteSelected}>
                Yes, delete
              </button>
              <button type="button" className="adm-btn adm-btn-outline" onClick={() => setConfirmDelete(false)}>
                Keep them
              </button>
            </>
          )}
          {deleteError && <span style={{ color: '#9B1C1C' }}>{deleteError}</span>}
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="adm-card">
          <p className="adm-empty">
            {orders.length === 0 ? 'No orders yet.' : 'No orders match this filter or search.'}
          </p>
        </div>
      ) : (
        <div className="adm-olist">
          <div className="adm-ohead">
            <input
              type="checkbox"
              className="adm-check"
              checked={allFilteredSelected}
              onChange={toggleAll}
              aria-label="Select all shown orders"
            />
            <div className="adm-ohead-cols">
              <span>Pickup</span>
              <span>Customer</span>
              <span>Items</span>
              <span>Order</span>
              <span>Status</span>
              <span style={{ textAlign: 'right' }}>Total</span>
            </div>
          </div>
          {filtered.map((o) => (
            <div key={o.id} className={`adm-orow${o.status === 'PAYMENT_REVIEW' ? ' is-review' : ''}`}>
              <input
                type="checkbox"
                className="adm-check"
                checked={selected.has(o.id)}
                onChange={() => toggleOne(o.id)}
                aria-label={`Select order ${o.order_number}`}
              />
              <Link href={`/admin/orders/${o.id}`} className="adm-orow-link">
                <span className="o-pickup">
                  <strong>{o.pickup_day}</strong>
                  <span>{o.time_label}</span>
                </span>
                <span className="o-name">{o.customer_name}</span>
                <span className="o-items">
                  {o.items.map((item, i) => (
                    <ItemChip key={i} label={item.label} style={item.serving_style} />
                  ))}
                </span>
                <span className="o-num">{o.order_number}</span>
                <span className="o-status"><StatusBadge status={o.status} /></span>
                <span className="o-total">{peso(o.total_amount)}</span>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
