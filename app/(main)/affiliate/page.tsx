'use client'

import { useEffect, useState } from 'react'
import { Copy, Check, TrendingUp, DollarSign, Users, MousePointer, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useAuth } from '@/contexts/auth-context'
import { affiliateService, type AffiliateStats } from '@/lib/services/affiliate.service'
import { toast } from 'sonner'


export default function AffiliateDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<AffiliateStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const affiliateCode = user?.affiliateCode ?? 'YOUR_CODE'
  const origin = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL ?? '')
  const referralLink = `${origin}/?ref=${affiliateCode}`

  useEffect(() => {
    affiliateService.getStats()
      .then(setStats)
      .catch(() => {
        setStats(null)
        toast.error('Failed to load affiliate stats')
      })
      .finally(() => setLoading(false))
  }, [])

  const handleCopy = () => {
    navigator.clipboard?.writeText(referralLink)
    setCopied(true)
    toast.success('Referral link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const statCards = [
    { label: 'Total Clicks', value: stats?.totalClicks.toLocaleString() ?? '—', icon: MousePointer, color: 'text-blue-600' },
    { label: 'Conversions', value: stats?.totalConversions.toLocaleString() ?? '—', icon: Users, color: 'text-violet-600' },
    { label: 'Total Earnings', value: stats ? `₦${stats.totalEarnings.toLocaleString()}` : '—', icon: DollarSign, color: 'text-green-600' },
    { label: 'Pending Earnings', value: stats ? `₦${stats.pendingEarnings.toLocaleString()}` : '—', icon: TrendingUp, color: 'text-primary' },
  ]

  return (
    <ProtectedRoute requiredRole={['affiliate', 'admin']}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-page-reveal">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Affiliate Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Earn commissions by sharing your unique referral link</p>
        </div>

        {/* Referral link */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="font-bold text-sm mb-1">Your Referral Link</h2>
          <p className="text-xs text-muted-foreground mb-3">Share this link to earn commission on every purchase</p>
          <div className="flex gap-2 flex-wrap">
            <Input value={referralLink} readOnly className="flex-1 font-mono text-xs" />
            <Button variant="outline" onClick={handleCopy} className="shrink-0 gap-2">
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button variant="ghost" size="icon" asChild className="shrink-0" aria-label="Open referral link">
              <a href={referralLink} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" /></a>
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-muted-foreground">Code:</span>
            <Badge className="font-mono text-xs">{affiliateCode}</Badge>
            <span className="text-xs text-muted-foreground ml-2">Commission rate: <strong className="text-foreground">{stats ? `${(stats.commissionRate * 100).toFixed(0)}%` : '—'}</strong></span>
          </div>
        </div>

        {/* Stat cards */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />)}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statCards.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-5">
                <div className={`w-9 h-9 rounded-lg bg-muted flex items-center justify-center mb-3 ${color}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <p className="text-2xl font-bold font-mono">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* This month stats */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-bold text-sm mb-5">This Month</h2>
            {stats && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Clicks</span>
                  <span className="font-bold font-mono">{stats.thisMonthClicks}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Conversions</span>
                  <span className="font-bold font-mono">{stats.thisMonthConversions}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Earnings</span>
                  <span className="font-bold font-mono">₦{stats.thisMonthEarnings.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Conversion Rate</span>
                  <span className="font-bold font-mono">{(stats.conversionRate * 100).toFixed(1)}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Earnings breakdown */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-bold text-sm mb-5">Earnings Breakdown</h2>
            {stats && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Earned</span>
                  <span className="font-bold font-mono">₦{stats.totalEarnings.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Paid Out</span>
                  <span className="font-bold font-mono text-green-600">₦{stats.paidEarnings.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <span className="font-bold font-mono text-amber-600">₦{stats.pendingEarnings.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Commission Rate</span>
                  <span className="font-bold font-mono">{(stats.commissionRate * 100).toFixed(0)}%</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Lifetime Orders</span>
                  <span className="font-bold font-mono">{stats.lifetimeOrders}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
