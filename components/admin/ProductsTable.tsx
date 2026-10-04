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

  function renderFormFields(form: FormState, setForm: (f: FormState) => void, idPrefix: string) {
    const field = (key: keyof FormState, label: string, opts: { placeholder?: string; type?: string; hint?: string } = {}) => (
      <div className="adm-field">
        <label htmlFor={`${idPrefix}-${key}`} className="adm-label">{label}</label>
        <input
          id={`${idPrefix}-${key}`}
          className="adm-input"
          type={opts.type ?? 'text'}
          {...(opts.type === 'number' ? { min: '0', step: '0.01', inputMode: 'decimal' as const } : {})}
          placeholder={opts.placeholder}
          value={form[key] as string}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        />
        {opts.hint && <p className="adm-hint">{opts.hint}</p>}
      </div>
    )
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="adm-form-grid">
          {field('name', 'Product name', { placeholder: 'e.g. Angus Roast Beef' })}
          {field('weight_label', 'Size / weight', { placeholder: 'e.g. 1 kg' })}
          {field('price', 'Price (₱)', { type: 'number', placeholder: 'e.g. 3200' })}
          {field('sku', 'Product code (SKU)', { placeholder: 'e.g. LVC004', hint: 'A short unique code. Customers don’t see it.' })}
        </div>
        {field('description', 'Description', { placeholder: 'e.g. Pre-sliced and ready to serve' })}
        <label className="adm-checkline">
          <input
            type="checkbox"
            className="adm-check"
            checked={form.is_available}
            onChange={(e) => setForm({ ...form, is_available: e.target.checked })}
          />
          Available to customers
        </label>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span className="adm-card-note">
          {products.length} product{products.length !== 1 ? 's' : ''} · {products.filter((p) => p.is_available).length} available to customers
        </span>
        {!addingNew && (
          <button type="button" className="adm-btn adm-btn-primary" onClick={() => { setAddingNew(true); setError(null) }}>
            + Add product
          </button>
        )}
      </div>

      {error && <p className="adm-error" role="alert">{error}</p>}

      {addingNew && (
        <section className="adm-card">
          <h2 className="adm-h2">New product</h2>
          {renderFormFields(newForm, setNewForm, 'new')}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className="adm-btn adm-btn-primary" disabled={busyId === 'new'} onClick={handleAdd}>
              {busyId === 'new' ? 'Adding…' : 'Add product'}
            </button>
            <button type="button" className="adm-btn adm-btn-outline" onClick={() => { setAddingNew(false); setNewForm(EMPTY_FORM); setError(null) }}>
              Cancel
            </button>
          </div>
        </section>
      )}

      {products.length === 0 ? (
        <div className="adm-card"><p className="adm-empty">No products yet. Add your first one above.</p></div>
      ) : (
        products.map((p) => {
          const isBusy = busyId === p.id

          if (editingId === p.id) {
            return (
              <section key={p.id} className="adm-card" style={{ borderColor: '#A16207' }}>
                <h2 className="adm-h2">Edit {p.name} · {p.weight_label}</h2>
                {renderFormFields(editForm, setEditForm, `edit-${p.id}`)}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button type="button" className="adm-btn adm-btn-primary" disabled={isBusy} onClick={() => saveEdit(p.id)}>
                    {isBusy ? 'Saving…' : 'Save changes'}
                  </button>
                  <button type="button" className="adm-btn adm-btn-outline" disabled={isBusy} onClick={cancelEdit}>
                    Cancel
                  </button>
                </div>
              </section>
            )
          }

          return (
            <section key={p.id} className={`adm-card adm-product${p.is_available ? '' : ' is-hidden'}`}>
              <div className="adm-product-main">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                  <span style={{ fontSize: 19, fontWeight: 600 }}>
                    {p.name} <span style={{ fontWeight: 400, color: '#6B5D52' }}>· {p.weight_label}</span>
                  </span>
                  {p.description && <span style={{ fontSize: 16, color: '#44372E' }}>{p.description}</span>}
                  <span className="adm-hint">Code: {p.sku}</span>
                </div>
                <span style={{ fontSize: 22, fontWeight: 600, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                  {fmt(p.price)}
                </span>
              </div>

              <div className="adm-product-actions">
                <label className="adm-checkline" style={{ cursor: isBusy ? 'not-allowed' : 'pointer' }}>
                  <input
                    type="checkbox"
                    className="adm-check"
                    checked={p.is_available}
                    disabled={isBusy}
                    onChange={() => toggleAvailable(p)}
                  />
                  {p.is_available ? 'Available to customers' : 'Hidden from customers'}
                </label>

                {confirmDeleteId === p.id ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ color: '#9B1C1C', fontWeight: 500 }}>Delete this product?</span>
                    <button type="button" className="adm-btn adm-btn-danger" disabled={isBusy} onClick={() => handleDelete(p.id)}>
                      {isBusy ? 'Deleting…' : 'Yes, delete'}
                    </button>
                    <button type="button" className="adm-btn adm-btn-outline" onClick={() => setConfirmDeleteId(null)}>
                      Keep it
                    </button>
                  </span>
                ) : (
                  <span style={{ display: 'flex', gap: 10 }}>
                    <button type="button" className="adm-btn adm-btn-outline" onClick={() => startEdit(p)}>Edit</button>
                    <button type="button" className="adm-btn adm-btn-danger" onClick={() => setConfirmDeleteId(p.id)}>Delete</button>
                  </span>
                )}
              </div>
            </section>
          )
        })
      )}
    </div>
  )
}
