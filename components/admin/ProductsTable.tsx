'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n)

export type ProductRow = {
  id: string
  sku: string
  name: string
  description: string | null
  price: number
  weight_label: string
  image_url: string | null
  is_available: boolean
  sort_order: number
}

type FormState = {
  sku: string
  name: string
  description: string
  price: string
  weight_label: string
  is_available: boolean
}

const EMPTY_FORM: FormState = {
  sku: '',
  name: '',
  description: '',
  price: '',
  weight_label: '',
  is_available: true,
}

function toForm(p: ProductRow): FormState {
  return {
    sku: p.sku,
    name: p.name,
    description: p.description ?? '',
    price: String(p.price),
    weight_label: p.weight_label,
    is_available: p.is_available,
  }
}

const inputBase: React.CSSProperties = {
  fontFamily: "'Inter', sans-serif",
  fontSize: 13,
  color: '#1C1917',
  background: '#FFFFFF',
  border: '1px solid #D6D3D1',
  padding: '8px 10px',
  outline: 'none',
  borderRadius: 0,
  width: '100%',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: "'Jost', sans-serif",
  fontSize: 9,
  fontWeight: 500,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: '#8C7B6B',
  marginBottom: 6,
}

function ghostButton(disabled: boolean): React.CSSProperties {
  return {
    fontFamily: "'Jost', sans-serif",
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    background: 'transparent',
    color: '#78716C',
    border: '1px solid #D6D3D1',
    padding: '6px 14px',
    cursor: disabled ? 'not-allowed' : 'pointer',
  }
}

function primaryButton(disabled: boolean): React.CSSProperties {
  return {
    fontFamily: "'Jost', sans-serif",
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    background: disabled ? '#D6D3D1' : '#A16207',
    color: '#FFFFFF',
    border: 'none',
    padding: '6px 14px',
    cursor: disabled ? 'not-allowed' : 'pointer',
  }
}

interface Props {
  products: ProductRow[]
}

export function ProductsTable({ products }: Props) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM)
  const [addingNew, setAddingNew] = useState(false)
  const [newForm, setNewForm] = useState<FormState>(EMPTY_FORM)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function startEdit(p: ProductRow) {
    setError(null)
    setEditingId(p.id)
    setEditForm(toForm(p))
  }

  function cancelEdit() {
    setEditingId(null)
    setError(null)
  }

  async function saveEdit(id: string) {
    setError(null)
    const price = Number(editForm.price)
    if (!editForm.name || !editForm.weight_label || !Number.isFinite(price) || price <= 0) {
      setError('Name, weight, and a valid price are required.')
      return
    }
    setBusyId(id)
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sku: editForm.sku,
        name: editForm.name,
        description: editForm.description || null,
        price,
        weight_label: editForm.weight_label,
        is_available: editForm.is_available,
      }),
    })
    const json = await res.json().catch(() => ({}))
    setBusyId(null)
    if (!res.ok) {
      setError(json.error ?? 'Failed to save product')
      return
    }
    setEditingId(null)
    router.refresh()
  }

  async function toggleAvailable(p: ProductRow) {
    setBusyId(p.id)
    setError(null)
    const res = await fetch(`/api/admin/products/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_available: !p.is_available }),
    })
    setBusyId(null)
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setError(json.error ?? 'Failed to update availability')
      return
    }
    router.refresh()
  }

  async function handleDelete(id: string) {
    setBusyId(id)
    setError(null)
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    const json = await res.json().catch(() => ({}))
    setBusyId(null)
    setConfirmDeleteId(null)
    if (!res.ok) {
      setError(json.error ?? 'Failed to delete product')
      return
    }
    router.refresh()
  }

  async function handleAdd() {
    setError(null)
    const price = Number(newForm.price)
    if (!newForm.sku || !newForm.name || !newForm.weight_label || !Number.isFinite(price) || price <= 0) {
      setError('SKU, name, weight, and a valid price are required.')
      return
    }
    setBusyId('new')
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sku: newForm.sku,
        name: newForm.name,
        description: newForm.description || null,
        price,
        weight_label: newForm.weight_label,
        is_available: newForm.is_available,
      }),
    })
    const json = await res.json().catch(() => ({}))
    setBusyId(null)
    if (!res.ok) {
      setError(json.error ?? 'Failed to create product')
      return
    }
    setAddingNew(false)
    setNewForm(EMPTY_FORM)
    router.refresh()
  }

  function renderFormFields(form: FormState, setForm: (f: FormState) => void, includeSku: boolean) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: includeSku ? 'repeat(5, 1fr)' : 'repeat(4, 1fr)', gap: 12 }}>
        {includeSku && (
          <div>
            <label style={labelStyle}>SKU</label>
            <input style={inputBase} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          </div>
        )}
        <div>
          <label style={labelStyle}>Name</label>
          <input style={inputBase} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label style={labelStyle}>Weight</label>
          <input style={inputBase} value={form.weight_label} onChange={(e) => setForm({ ...form, weight_label: e.target.value })} placeholder="e.g. 1kg" />
        </div>
        <div>
          <label style={labelStyle}>Price (₱)</label>
          <input style={inputBase} type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        </div>
        <div>
          <label style={labelStyle}>Description</label>
          <input style={inputBase} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{
          fontFamily: "'Jost', sans-serif",
          fontSize: 10,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: '#8C7B6B',
        }}>
          {products.length} product{products.length !== 1 ? 's' : ''}
        </span>
        {!addingNew && (
          <button style={primaryButton(false)} onClick={() => { setAddingNew(true); setError(null) }}>
            Add Product
          </button>
        )}
      </div>

      {error && (
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#B91C1C', marginBottom: 12 }}>
          {error}
        </p>
      )}

      {addingNew && (
        <div style={{ background: '#FFFFFF', border: '1px solid #D6D3D1', padding: 20, marginBottom: 20 }}>
          {renderFormFields(newForm, setNewForm, true)}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button style={primaryButton(busyId === 'new')} disabled={busyId === 'new'} onClick={handleAdd}>
              {busyId === 'new' ? 'Adding…' : 'Add'}
            </button>
            <button style={ghostButton(false)} onClick={() => { setAddingNew(false); setNewForm(EMPTY_FORM); setError(null) }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ background: '#FFFFFF', border: '1px solid #D6D3D1', overflow: 'hidden' }}>
        {products.length === 0 ? (
          <p style={{ padding: '40px 24px', fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#8C7B6B', textAlign: 'center', margin: 0 }}>
            No products yet.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #D6D3D1', background: '#F5F4F2' }}>
                  {['SKU', 'Name', 'Weight', 'Price', 'Available', ''].map((col, i) => (
                    <th key={col || i} style={{
                      padding: '12px 16px',
                      fontFamily: "'Jost', sans-serif",
                      fontSize: 9,
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      color: '#8C7B6B',
                      textAlign: i === 3 ? 'right' : 'left',
                      whiteSpace: 'nowrap',
                    }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => {
                  const isEditing = editingId === p.id
                  const isBusy = busyId === p.id

                  if (isEditing) {
                    return (
                      <tr key={p.id} style={{ borderTop: i === 0 ? 'none' : '1px solid #F5F4F2' }}>
                        <td colSpan={6} style={{ padding: '16px' }}>
                          {renderFormFields(editForm, setEditForm, true)}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#1C1917', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={editForm.is_available}
                                onChange={(e) => setEditForm({ ...editForm, is_available: e.target.checked })}
                                style={{ accentColor: '#A16207' }}
                              />
                              Available
                            </label>
                            <button style={primaryButton(isBusy)} disabled={isBusy} onClick={() => saveEdit(p.id)}>
                              {isBusy ? 'Saving…' : 'Save'}
                            </button>
                            <button style={ghostButton(isBusy)} onClick={cancelEdit}>Cancel</button>
                          </div>
                        </td>
                      </tr>
                    )
                  }

                  return (
                    <tr key={p.id} style={{ borderTop: i === 0 ? 'none' : '1px solid #F5F4F2' }}>
                      <td style={{ padding: '14px 16px', fontFamily: "'Inter', sans-serif", color: '#57534E', whiteSpace: 'nowrap' }}>{p.sku}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, color: '#1C1917' }}>{p.name}</div>
                        {p.description && (
                          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#8C7B6B' }}>{p.description}</div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', fontFamily: "'Inter', sans-serif", color: '#57534E', whiteSpace: 'nowrap' }}>{p.weight_label}</td>
                      <td style={{ padding: '14px 16px', fontFamily: "'Inter', sans-serif", fontWeight: 600, color: '#1C1917', textAlign: 'right', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                        {fmt(p.price)}
                      </td>
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', cursor: isBusy ? 'not-allowed' : 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={p.is_available}
                            disabled={isBusy}
                            onChange={() => toggleAvailable(p)}
                            style={{ accentColor: '#A16207', cursor: isBusy ? 'not-allowed' : 'pointer' }}
                          />
                        </label>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {confirmDeleteId === p.id ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#B91C1C' }}>Delete?</span>
                            <button style={primaryButton(isBusy)} disabled={isBusy} onClick={() => handleDelete(p.id)}>
                              {isBusy ? '…' : 'Yes'}
                            </button>
                            <button style={ghostButton(false)} onClick={() => setConfirmDeleteId(null)}>No</button>
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', gap: 8 }}>
                            <button style={ghostButton(false)} onClick={() => startEdit(p)}>Edit</button>
                            <button
                              style={{ ...ghostButton(false), color: '#B91C1C', borderColor: '#FECACA' }}
                              onClick={() => setConfirmDeleteId(p.id)}
                            >
                              Delete
                            </button>
                          </span>
                        )}
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
