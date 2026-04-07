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

const MOCK_STATS: AffiliateStats = {
  totalClicks: 1248,
  totalOrders: 89,
  totalEarnings: 2670,
  pendingPayouts: 430,
  conversionRate: 7.1,
  earnings: [
    { period: 'Jul', amount: 310 },
    { period: 'Aug', amount: 520 },
    { period: 'Sep', amount: 480 },
    { period: 'Oct', amount: 390 },
    { period: 'Nov', amount: 540 },
    { period: 'Dec', amount: 430 },
  ],
  recentReferrals: [
    { id: 'ref-1', date: '2024-11-25T10:00:00Z', orderId: 'VG-20241125-001', amount: 49, status: 'approved' },
    { id: 'ref-2', date: '2024-11-20T09:00:00Z', orderId: 'VG-20241120-002', amount: 87, status: 'pending' },
    { id: 'ref-3', date: '2024-11-15T14:00:00Z', orderId: 'VG-20241115-003', amount: 124, status: 'approved' },
    { id: 'ref-4', date: '2024-11-10T08:00:00Z', orderId: 'VG-20241110-004', amount: 33, status: 'paid' },
    { id: 'ref-5', date: '2024-11-05T11:00:00Z', orderId: 'VG-20241105-005', amount: 62, status: 'approved' },
  ],
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  approved: 'bg-green-100 text-green-700 border-green-200',
  paid: 'bg-blue-100 text-blue-700 border-blue-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
}

export default function AffiliateDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<AffiliateStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const affiliateCode = user?.affiliateCode ?? 'YOUR_CODE'
  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : 'https://valgadget.com'}/?ref=${affiliateCode}`

  useEffect(() => {
    affiliateService.getStats()
      .then(setStats)
      .catch(() => setStats(MOCK_STATS))
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
    { label: 'Total Orders', value: stats?.totalOrders.toLocaleString() ?? '—', icon: Users, color: 'text-violet-600' },
    { label: 'Total Earnings', value: stats ? `₦${stats.totalEarnings.toLocaleString()}` : '—', icon: DollarSign, color: 'text-green-600' },
    { label: 'Pending Payout', value: stats ? `₦${stats.pendingPayouts.toLocaleString()}` : '—', icon: TrendingUp, color: 'text-primary' },
  ]

  const maxEarning = Math.max(...(stats?.earnings.map(e => e.amount) ?? [1]))

  return (
    <ProtectedRoute allowedRoles={['affiliate', 'admin']}>
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
            <span className="text-xs text-muted-foreground ml-2">Commission rate: <strong className="text-foreground">10%</strong></span>
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
          {/* Earnings chart */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-bold text-sm mb-5">Monthly Earnings</h2>
            {stats && (
              <div className="flex items-end gap-2 h-32">
                {stats.earnings.map(({ period, amount }) => (
                  <div key={period} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-sm bg-primary/80 hover:bg-primary transition-colors cursor-default"
                      style={{ height: `${(amount / maxEarning) * 100}%` }}
                      title={`₦${amount}`}
                    />
                    <span className="text-[10px] text-muted-foreground font-mono">{period}</span>
                  </div>
                ))}
              </div>
            )}
            {stats && (
              <p className="text-xs text-muted-foreground mt-3">
                Conversion rate: <strong className="text-foreground">{stats.conversionRate}%</strong>
              </p>
            )}
          </div>

          {/* Recent referrals */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-bold text-sm mb-4">Recent Referrals</h2>
            {stats?.recentReferrals.length ? (
              <div className="flex flex-col gap-1">
                {stats.recentReferrals.map((ref, i) => (
                  <div key={ref.id}>
                    {i > 0 && <Separator className="my-1" />}
                    <div className="flex items-center justify-between py-1.5">
                      <div>
                        <p className="text-xs font-mono text-foreground">{ref.orderId}</p>
                        <p className="text-[11px] text-muted-foreground">{new Date(ref.date).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">₦{ref.amount}</span>
                        <Badge className={`text-[10px] border capitalize ${STATUS_STYLES[ref.status] ?? ''}`}>{ref.status}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No referrals yet. Share your link to get started!</p>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
