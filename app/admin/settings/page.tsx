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
import Link from 'next/link'

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
    fetch('/api/admin/settings', { headers: { Authorization: `Bearer ${getToken()}` }, credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d && typeof d === 'object' && !d.message) setS(d) })
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
        credentials: 'include',
        body: JSON.stringify({ settings: s }),
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok) {
        if (json.settings) setS(json.settings)
        toast.success('Settings saved successfully.')
      } else toast.error(json.message ?? 'Failed to save settings.')
    } catch {
      toast.error('Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center text-muted-foreground text-sm">Loading settings...</div>

  return (
    <div className="space-y-6 max-w-6xl animate-page-reveal">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your store configuration and preferences.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar tabs */}
        <nav className="lg:w-44 shrink-0 flex lg:block gap-2 overflow-x-auto lg:space-y-1" aria-label="Settings sections">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`shrink-0 lg:w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left ${
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
        <div className="flex-1 bg-card border border-border rounded-lg p-4 sm:p-6 space-y-6">
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
                <Link href="/admin/shipping" className="text-primary hover:underline">Shipping Rates</Link> page.
              </p>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-md">
                  <div>
                    <p className="font-medium text-sm">Enable Shipping</p>
                    <p className="text-xs text-muted-foreground">Charge delivery fees and require an active state rate at checkout.</p>
                  </div>
                  <Switch checked={getBool('shippingEnabled', true)} onCheckedChange={v => set('shippingEnabled', v)} />
                </div>
                <div className="flex items-center justify-between p-4 border border-border rounded-md">
                  <div>
                    <p className="font-medium text-sm">Free Shipping</p>
                    <p className="text-xs text-muted-foreground">Automatically waive delivery above the configured threshold.</p>
                  </div>
                  <Switch checked={getBool('freeShippingEnabled', true)} onCheckedChange={v => set('freeShippingEnabled', v)} />
                </div>
                <div className="flex items-center justify-between p-4 border border-border rounded-md">
                  <div>
                    <p className="font-medium text-sm">Free Shipping Threshold</p>
                    <p className="text-xs text-muted-foreground">Orders above this amount get free shipping.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">₦</span>
                    <Input type="number" min="0" className="w-32 text-right" value={get('freeShippingThreshold', '500000')} onChange={e => set('freeShippingThreshold', e.target.value)} disabled={!getBool('freeShippingEnabled', true)} />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border border-border rounded-md">
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
                  <div key={m.key} className="flex items-center justify-between p-4 border border-border rounded-md">
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
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-base font-semibold">Email Notifications (Customer)</h2><Button asChild variant="outline" size="sm"><Link href="/admin/email-templates">Preview Templates</Link></Button></div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border border-border rounded-md">
                  <div>
                    <p className="text-sm font-medium">Order Confirmation</p>
                    <p className="text-xs text-muted-foreground">Send email when order is placed.</p>
                  </div>
                  <Switch checked={getBool('emailOrderConfirm', true)} onCheckedChange={v => set('emailOrderConfirm', v)} />
                </div>
                <div className="flex items-center justify-between p-4 border border-border rounded-md">
                  <div>
                    <p className="text-sm font-medium">Order Status & Tracking Updates</p>
                    <p className="text-xs text-muted-foreground">Notify customers when an admin confirms, processes, ships, or delivers an order.</p>
                  </div>
                  <Switch checked={getBool('emailShippingUpdate', true)} onCheckedChange={v => set('emailShippingUpdate', v)} />
                </div>
                <div className="flex items-center justify-between p-4 border border-border rounded-md">
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
                <div className="flex items-center justify-between p-4 border border-border rounded-md">
                  <div>
                    <p className="text-sm font-medium">New Order Alert</p>
                    <p className="text-xs text-muted-foreground">Get notified when a new order is placed.</p>
                  </div>
                  <Switch checked={getBool('alertNewOrder', true)} onCheckedChange={v => set('alertNewOrder', v)} />
                </div>
                <Separator />
                <div>
                  <h3 className="mb-3 text-sm font-semibold">Tax</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 border border-border rounded-md">
                      <div>
                        <p className="font-medium text-sm">Collect Tax</p>
                        <p className="text-xs text-muted-foreground">Calculate tax during checkout using the rate below.</p>
                      </div>
                      <Switch checked={getBool('taxEnabled', false)} onCheckedChange={v => set('taxEnabled', v)} />
                    </div>
                    <div className="flex items-center justify-between p-4 border border-border rounded-md">
                      <div>
                        <p className="font-medium text-sm">Tax Rate</p>
                        <p className="text-xs text-muted-foreground">Percentage applied after discounts.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input type="number" min="0" max="100" step="0.01" className="w-24 text-right" value={get('taxRate', '0')} onChange={e => set('taxRate', e.target.value)} disabled={!getBool('taxEnabled', false)} />
                        <span className="text-sm">%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 border border-border rounded-md">
                      <div>
                        <p className="font-medium text-sm">Prices Include Tax</p>
                        <p className="text-xs text-muted-foreground">Keep this on when catalogue prices already include tax.</p>
                      </div>
                      <Switch checked={getBool('pricesIncludeTax', true)} onCheckedChange={v => set('pricesIncludeTax', v)} disabled={!getBool('taxEnabled', false)} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
