'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api-client'
import { Pencil, Check, X, MapPin, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { NIGERIA_STATES } from '@/lib/data/nigeria-locations'
import { AdminIconButton, AdminPageHeader, AdminSelect } from '@/components/admin/admin-controls'

interface ShippingRate {
  id: string
  state: string
  price: string
  estimatedDays: number
  isActive: boolean
}

export default function AdminShippingPage() {
  const [rates, setRates] = useState<ShippingRate[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState('')
  const [editDays, setEditDays] = useState('')
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [newState, setNewState] = useState('')
  const [newPrice, setNewPrice] = useState('2500')
  const [newDays, setNewDays] = useState('3')

  useEffect(() => { fetchRates() }, [])

  async function fetchRates() {
    try {
      const res = await apiFetch('/api/shipping-rates')
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? 'Failed to load rates')
      if (Array.isArray(json)) setRates(json)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load shipping rates')
    } finally {
      setLoading(false)
    }
  }

  async function addRate() {
    if (!newState) return toast.error('Select a state')
    setSaving(true)
    try {
      const res = await apiFetch('/api/shipping-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: newState, price: Number(newPrice), estimatedDays: Number(newDays) }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? 'Failed to add rate')
      setRates(prev => [...prev.filter(rate => rate.id !== json.id), json].sort((a, b) => a.state.localeCompare(b.state)))
      setNewState('')
      toast.success(`${json.state} delivery rate added`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add rate')
    } finally {
      setSaving(false)
    }
  }

  function startEdit(r: ShippingRate) {
    setEditId(r.id)
    setEditPrice(r.price)
    setEditDays(String(r.estimatedDays))
  }

  async function saveEdit(id: string) {
    setSaving(true)
    try {
      const res = await apiFetch(`/api/shipping-rates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: Number(editPrice), estimatedDays: Number(editDays) }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? 'Failed to update')
      setRates(prev => prev.map(r => r.id === id ? json : r))
      toast.success('Rate updated')
      setEditId(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(r: ShippingRate) {
    try {
      const res = await apiFetch(`/api/shipping-rates/${r.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !r.isActive }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? 'Failed to update state')
      setRates(prev => prev.map(x => x.id === r.id ? json : x))
      toast.success(r.isActive ? 'State disabled' : 'State enabled')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update state')
    }
  }

  const filtered = rates.filter(r => r.state.toLowerCase().includes(search.toLowerCase()))
  const totalActive = rates.filter(r => r.isActive).length
  const avgPrice = rates.length ? (rates.reduce((sum, r) => sum + Number(r.price), 0) / rates.length) : 0
  const configuredStates = new Set(rates.map(rate => rate.state))
  const missingStates = NIGERIA_STATES.filter(state => !configuredStates.has(state))

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-page-reveal">
      <AdminPageHeader title="Shipping Rates" description="Manage delivery prices per Nigerian state" />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total States', value: rates.length },
          { label: 'Active States', value: totalActive },
          { label: 'Avg. Price', value: `₦${avgPrice.toLocaleString('en-NG', { maximumFractionDigits: 0 })}` },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {missingStates.length > 0 ? (
          <div className="border-b border-border bg-muted/30 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Add a missing state</p>
              <span className="ml-auto text-xs text-muted-foreground">{missingStates.length} remaining</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-[1fr_120px_90px_auto]">
              <AdminSelect
                value={newState}
                onChange={event => setNewState(event.target.value)}
                aria-label="State to add"
              >
                <option value="">Select state</option>
                {missingStates.map(state => <option key={state} value={state}>{state}</option>)}
              </AdminSelect>
              <Input type="number" min="0" value={newPrice} onChange={event => setNewPrice(event.target.value)} aria-label="Delivery price in naira" placeholder="Price" />
              <Input type="number" min="1" max="60" value={newDays} onChange={event => setNewDays(event.target.value)} aria-label="Estimated delivery days" placeholder="Days" />
              <Button onClick={addRate} disabled={saving || !newState} className="gap-2"><Plus className="h-4 w-4" /> Add</Button>
            </div>
          </div>
        ) : null}
        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
          <MapPin className="w-4 h-4 text-primary shrink-0" />
          <Input
            placeholder="Search state…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-8 w-60 text-sm"
          />
          <span className="text-xs text-muted-foreground ml-auto">{filtered.length} states</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(r => (
              <div key={r.id} className={cn('flex items-center gap-4 px-5 py-3.5', !r.isActive && 'opacity-50')}>
                <div className="w-40 shrink-0">
                  <p className="font-medium text-sm">{r.state}</p>
                </div>

                {editId === r.id ? (
                  <>
                    <div className="flex items-center gap-2 flex-1">
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₦</span>
                        <Input
                          type="number"
                          value={editPrice}
                          onChange={e => setEditPrice(e.target.value)}
                          className="pl-7 h-8 w-28 text-sm"
                        />
                      </div>
                      <Input
                        type="number"
                        value={editDays}
                        onChange={e => setEditDays(e.target.value)}
                        className="h-8 w-20 text-sm"
                        title="Delivery days"
                      />
                      <span className="text-xs text-muted-foreground">days</span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <AdminIconButton size="sm" label={`Save ${r.state} shipping rate`} className="w-8 h-8 bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" onClick={() => saveEdit(r.id)} disabled={saving}>
                        <Check className="w-3.5 h-3.5" />
                      </AdminIconButton>
                      <AdminIconButton size="sm" label={`Cancel editing ${r.state}`} className="w-8 h-8" onClick={() => setEditId(null)}>
                        <X className="w-3.5 h-3.5" />
                      </AdminIconButton>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex-1 flex items-center gap-4">
                      <span className="font-bold text-sm">₦{Number(r.price).toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground">{r.estimatedDays} day{r.estimatedDays !== 1 ? 's' : ''} delivery</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={r.isActive ? 'default' : 'secondary'} className="text-[10px]">
                        {r.isActive ? 'Active' : 'Disabled'}
                      </Badge>
                      <AdminIconButton size="sm" label={`Edit ${r.state} shipping rate`} className="w-8 h-8" onClick={() => startEdit(r)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </AdminIconButton>
                      <button
                        onClick={() => toggleActive(r)}
                        className={cn('min-h-8 rounded-md px-2 text-xs font-semibold transition-colors focus-visible:ring-3 focus-visible:ring-ring/20', r.isActive ? 'text-destructive hover:bg-destructive/10' : 'text-primary hover:bg-primary/10')}
                      >
                        {r.isActive ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
