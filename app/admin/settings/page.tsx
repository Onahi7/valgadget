'use client'

import { useState, useEffect } from 'react'
import { Save, Store, Truck, CreditCard, Mail, Globe, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { getToken } from '@/lib/api-client'
import { toast } from 'sonner'

const TABS = [
  { id: 'store', label: 'Store', Icon: Store },
  { id: 'shipping', label: 'Shipping', Icon: Truck },
  { id: 'payments', label: 'Payments', Icon: CreditCard },
  { id: 'email', label: 'Email', Icon: Mail },
  { id: 'seo', label: 'SEO', Icon: Globe },
  { id: 'notifications', label: 'Notifications', Icon: Bell },
]

type S = Record<string, string>

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('store')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [s, setS] = useState<S>({})

  // Load settings from backend
  useEffect(() => {
    fetch('/api/admin/settings', { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(d => { if (d.data) setS(d.data) })
      .finally(() => setLoading(false))
  }, [])

  const set = (key: string, value: string | boolean) =>
    setS(prev => ({ ...prev, [key]: String(value) }))

  const get = (key: string, fallback: string = '') => s[key] ?? fallback
  const getBool = (key: string, fallback: boolean = true) => s[key] === 'true' || (s[key] === undefined && fallback)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ settings: s }),
      })
      if (res.ok) toast.success('Settings saved successfully.')
      else toast.error('Failed to save settings.')
    } catch {
      toast.error('Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6 text-center text-muted-foreground text-sm">Loading settings…</div>

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your store configuration and preferences.</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <nav className="w-44 shrink-0 space-y-1">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                activeTab === id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 bg-card border border-border rounded-xl p-6 space-y-6">
          {activeTab === 'store' && (
            <>
              <div>
                <h2 className="text-base font-semibold mb-4">Store Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Store Name</Label>
                    <Input value={get('storeName', 'Val Gadgets')} onChange={e => set('storeName', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Support Email</Label>
                    <Input type="email" value={get('storeEmail', 'support@valgadgets.com')} onChange={e => set('storeEmail', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone Number</Label>
                    <Input value={get('storePhone', '+234 703 857 2046')} onChange={e => set('storePhone', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Store Address</Label>
                    <Input value={get('storeAddress')} onChange={e => set('storeAddress', e.target.value)} placeholder="Lagos, Nigeria" />
                  </div>
                </div>
                <div className="space-y-1.5 mt-4">
                  <Label>Store Description</Label>
                  <Textarea rows={3} value={get('storeDescription', 'Your number 1 gadget plug. Solution to every gadget need — with nationwide delivery across Nigeria.')} onChange={e => set('storeDescription', e.target.value)} />
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Maintenance Mode</p>
                  <p className="text-xs text-muted-foreground">Show a maintenance page to all visitors.</p>
                </div>
                <Switch checked={getBool('maintenanceMode', false)} onCheckedChange={v => set('maintenanceMode', v)} />
              </div>
            </>
          )}

          {activeTab === 'shipping' && (
            <div>
              <h2 className="text-base font-semibold mb-4">Shipping</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Per-state shipping rates are managed on the{' '}
                <a href="/admin/shipping" className="text-primary hover:underline">Shipping Rates</a> page.
              </p>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Free Shipping Threshold</p>
                    <p className="text-xs text-muted-foreground">Orders above this amount get free shipping.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">₦</span>
                    <Input className="w-28 text-right" value={get('freeShippingThreshold', '50000')} onChange={e => set('freeShippingThreshold', e.target.value)} />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Cash on Delivery</p>
                    <p className="text-xs text-muted-foreground">Allow customers to pay on delivery.</p>
                  </div>
                  <Switch checked={getBool('codEnabled', true)} onCheckedChange={v => set('codEnabled', v)} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div>
              <h2 className="text-base font-semibold mb-4">Payment Methods</h2>
              <div className="space-y-3">
                {[
                  { key: 'paystackEnabled', label: 'Paystack (Cards, Bank Transfer, USSD)' },
                  { key: 'btcEnabled', label: 'Bitcoin (BTC)' },
                  { key: 'ethEnabled', label: 'Ethereum (ETH)' },
                  { key: 'usdtTrc20Enabled', label: 'USDT TRC-20' },
                  { key: 'usdtErc20Enabled', label: 'USDT ERC-20' },
                  { key: 'codEnabled', label: 'Cash on Delivery' },
                ].map(m => (
                  <div key={m.key} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <p className="text-sm font-medium">{m.label}</p>
                    <Switch checked={getBool(m.key, true)} onCheckedChange={v => set(m.key, v)} />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Wallet addresses and API keys are configured via environment variables.
              </p>
            </div>
          )}

          {activeTab === 'email' && (
            <div>
              <h2 className="text-base font-semibold mb-4">Email Notifications (Customer)</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Order Confirmation</p>
                    <p className="text-xs text-muted-foreground">Send email when order is placed.</p>
                  </div>
                  <Switch checked={getBool('emailOrderConfirm', true)} onCheckedChange={v => set('emailOrderConfirm', v)} />
                </div>
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Shipping Updates</p>
                    <p className="text-xs text-muted-foreground">Notify customer when order ships.</p>
                  </div>
                  <Switch checked={getBool('emailShippingUpdate', true)} onCheckedChange={v => set('emailShippingUpdate', v)} />
                </div>
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Promotional Emails</p>
                    <p className="text-xs text-muted-foreground">Send marketing and promotional emails.</p>
                  </div>
                  <Switch checked={getBool('emailPromo', false)} onCheckedChange={v => set('emailPromo', v)} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'seo' && (
            <div>
              <h2 className="text-base font-semibold mb-4">SEO Settings</h2>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Meta Title</Label>
                  <Input value={get('seoTitle', 'Val Gadgets — Your #1 Gadget Plug in Nigeria')} onChange={e => set('seoTitle', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Meta Description</Label>
                  <Textarea rows={2} value={get('seoDescription', 'Your number 1 gadget plug. Shop phones, laptops, power banks, solar inverters & accessories. Nationwide delivery.')} onChange={e => set('seoDescription', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Keywords (comma-separated)</Label>
                  <Textarea rows={2} value={get('seoKeywords', 'gadgets Nigeria, buy phones Nigeria, laptops Nigeria, power bank Nigeria, solar inverter Nigeria')} onChange={e => set('seoKeywords', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h2 className="text-base font-semibold mb-4">Admin Notifications</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">New Order Alert</p>
                    <p className="text-xs text-muted-foreground">Get notified when a new order is placed.</p>
                  </div>
                  <Switch checked={getBool('alertNewOrder', true)} onCheckedChange={v => set('alertNewOrder', v)} />
                </div>
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Low Stock Alert</p>
                    <p className="text-xs text-muted-foreground">Alert when product stock falls below threshold.</p>
                  </div>
                  <Switch checked={getBool('alertLowStock', true)} onCheckedChange={v => set('alertLowStock', v)} />
                </div>
                {getBool('alertLowStock', true) && (
                  <div className="flex items-center gap-3 p-4 border border-border rounded-lg">
                    <p className="text-sm font-medium flex-1">Low Stock Threshold</p>
                    <Input
                      className="w-24 text-right"
                      type="number"
                      min={1}
                      value={get('lowStockThreshold', '5')}
                      onChange={e => set('lowStockThreshold', e.target.value)}
                    />
                    <span className="text-sm text-muted-foreground">units</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
