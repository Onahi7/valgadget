'use client'

import { useState, useEffect } from 'react'
import { MapPin, Plus, Pencil, Trash2, Star, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { addressService, type UserAddress, type CreateAddressPayload } from '@/lib/services/address.service'
import { NIGERIA_STATES_LGAS, getLGAsForState } from '@/lib/data/nigeria-locations'
import { toast } from 'sonner'
import type { ApiError } from '@/lib/api-client'

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<UserAddress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null)

  const loadAddresses = async () => {
    try {
      const res = await addressService.getAll()
      setAddresses(res.data)
    } catch (err) {
      toast.error('Failed to load addresses')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAddresses()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this address?')) return
    try {
      await addressService.delete(id)
      toast.success('Address deleted')
      loadAddresses()
    } catch (err) {
      const e = err as ApiError
      toast.error(e.message ?? 'Failed to delete address')
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await addressService.setDefault(id)
      toast.success('Default address updated')
      loadAddresses()
    } catch (err) {
      const e = err as ApiError
      toast.error(e.message ?? 'Failed to update default address')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Saved Addresses</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your delivery addresses</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingAddress(null)}>
              <Plus className="w-4 h-4 mr-2" /> Add Address
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
            </DialogHeader>
            <AddressForm
              address={editingAddress}
              onSuccess={() => {
                setIsDialogOpen(false)
                setEditingAddress(null)
                loadAddresses()
              }}
              onCancel={() => {
                setIsDialogOpen(false)
                setEditingAddress(null)
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {addresses.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No saved addresses</h3>
          <p className="text-muted-foreground text-sm mb-6">Add your first delivery address to speed up checkout</p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Address
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {addresses.map(addr => (
            <div
              key={addr.id}
              className="bg-card border border-border rounded-xl p-5 relative group hover:shadow-sm transition-shadow"
            >
              {addr.isDefault && (
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2 py-1 rounded-full">
                    <Star className="w-3 h-3 fill-current" /> Default
                  </span>
                </div>
              )}
              
              <div className="mb-4">
                <h3 className="font-semibold text-base mb-1">{addr.label}</h3>
                <p className="text-sm text-foreground">{addr.fullName}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {addr.line1}
                  {addr.line2 && <>, {addr.line2}</>}
                  <br />
                  {addr.city}, {addr.state}
                  {addr.postalCode && <> {addr.postalCode}</>}
                  <br />
                  {addr.phone}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-border">
                {!addr.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-xs"
                  >
                    <Star className="w-3 h-3 mr-1" /> Set as Default
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingAddress(addr)
                    setIsDialogOpen(true)
                  }}
                  className="text-xs"
                >
                  <Pencil className="w-3 h-3 mr-1" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(addr.id)}
                  className="text-xs text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3 mr-1" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AddressForm({
  address,
  onSuccess,
  onCancel,
}: {
  address: UserAddress | null
  onSuccess: () => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState<CreateAddressPayload>({
    label: address?.label || '',
    fullName: address?.fullName || '',
    line1: address?.line1 || '',
    line2: address?.line2 || '',
    city: address?.city || '',
    state: address?.state || '',
    postalCode: address?.postalCode || '',
    country: address?.country || 'NG',
    phone: address?.phone || '',
    isDefault: address?.isDefault || false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const availableLGAs = formData.state ? getLGAsForState(formData.state) : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (address) {
        await addressService.update(address.id, formData)
        toast.success('Address updated')
      } else {
        await addressService.create(formData)
        toast.success('Address added')
      }
      onSuccess()
    } catch (err) {
      const e = err as ApiError
      toast.error(e.message ?? 'Failed to save address')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="label">Address Label *</Label>
        <Input
          id="label"
          value={formData.label}
          onChange={e => setFormData({ ...formData, label: e.target.value })}
          placeholder="Home, Office, etc."
          required
        />
      </div>

      <div>
        <Label htmlFor="fullName">Full Name *</Label>
        <Input
          id="fullName"
          value={formData.fullName}
          onChange={e => setFormData({ ...formData, fullName: e.target.value })}
          placeholder="John Doe"
          required
        />
      </div>

      <div>
        <Label htmlFor="line1">Address Line 1 *</Label>
        <Input
          id="line1"
          value={formData.line1}
          onChange={e => setFormData({ ...formData, line1: e.target.value })}
          placeholder="123 Main Street"
          required
        />
      </div>

      <div>
        <Label htmlFor="line2">Address Line 2 (optional)</Label>
        <Input
          id="line2"
          value={formData.line2}
          onChange={e => setFormData({ ...formData, line2: e.target.value })}
          placeholder="Apt 4B, Floor 2"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="state">State *</Label>
          <select
            id="state"
            value={formData.state}
            onChange={e => setFormData({ ...formData, state: e.target.value, city: '' })}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
            required
          >
            <option value="">Select state…</option>
            {NIGERIA_STATES_LGAS.map(loc => (
              <option key={loc.state} value={loc.state}>{loc.state}</option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="city">LGA *</Label>
          <select
            id="city"
            value={formData.city}
            onChange={e => setFormData({ ...formData, city: e.target.value })}
            disabled={!formData.state}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
            required
          >
            <option value="">Select LGA…</option>
            {availableLGAs.map(lga => (
              <option key={lga} value={lga}>{lga}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={e => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+234 800 000 0000"
            required
          />
        </div>

        <div>
          <Label htmlFor="postalCode">Postal Code (optional)</Label>
          <Input
            id="postalCode"
            value={formData.postalCode}
            onChange={e => setFormData({ ...formData, postalCode: e.target.value })}
            placeholder="100001"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isDefault"
          checked={formData.isDefault}
          onChange={e => setFormData({ ...formData, isDefault: e.target.checked })}
          className="rounded"
        />
        <Label htmlFor="isDefault" className="cursor-pointer">Set as default address</Label>
      </div>

      <div className="flex items-center gap-3 pt-4">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
            </>
          ) : (
            address ? 'Update Address' : 'Add Address'
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
