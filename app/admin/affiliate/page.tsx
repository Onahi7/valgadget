'use client'

import { useState, useEffect } from 'react'
import { Users, TrendingUp, DollarSign, Link2, Copy, CheckCircle, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { getToken } from '@/lib/api-client'
import { toast } from 'sonner'

type Affiliate = {
  id: string
  name: string
  email: string
  affiliateCode: string
  totalClicks: number
  totalEarnings: number
  pendingEarnings: number
  paidEarnings: number
  createdAt: string
}

const STAT_CARDS = (stats: { affiliates: number; totalClicks: number; totalEarnings: number; pending: number }) => [
  { label: 'Total Affiliates', value: stats.affiliates, Icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Total Clicks', value: stats.totalClicks.toLocaleString(), Icon: Link2, color: 'text-purple-600', bg: 'bg-purple-50' },
  { label: 'Total Earnings Paid', value: `₦${stats.totalEarnings.toLocaleString()}`, Icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
  { label: 'Pending Payouts', value: `₦${stats.pending.toLocaleString()}`, Icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
]

export default function AdminAffiliatePage() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const stats = affiliates.reduce(
    (acc, a) => ({
      affiliates: acc.affiliates + 1,
      totalClicks: acc.totalClicks + a.totalClicks,
      totalEarnings: acc.totalEarnings + a.paidEarnings,
      pending: acc.pending + a.pendingEarnings,
    }),
    { affiliates: 0, totalClicks: 0, totalEarnings: 0, pending: 0 }
  )

  const loadAffiliates = () => {
    setLoading(true)
    fetch('/api/admin/affiliates?limit=100', {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d.data?.data) setAffiliates(d.data.data)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadAffiliates() }, [])

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/shop?ref=${code}`)
    setCopied(code)
    toast.success('Referral link copied!')
    setTimeout(() => setCopied(null), 2000)
  }

  const markAsPaid = async (affiliateId: string) => {
    try {
      const res = await fetch(`/api/admin/affiliates/${affiliateId}/payout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      const d = await res.json()
      if (res.ok) {
        toast.success(`Paid ₦${d.data?.paid?.toLocaleString() ?? ''} to affiliate.`)
        loadAffiliates()
      } else {
        toast.error(d.error ?? 'Failed to process payout.')
      }
    } catch {
      toast.error('Failed to process payout.')
    }
  }

  const filtered = affiliates.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase()) ||
    a.affiliateCode.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Affiliate Programme</h1>
        <p className="text-muted-foreground text-sm mt-1">Track affiliate performance and manage payouts.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS(stats).map(({ label, value, Icon, color, bg }) => (
          <div key={label} className="bg-card border border-border rounded-lg p-4">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-4.5 h-4.5 ${color}`} />
            </div>
            <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
            <p className="text-xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search affiliates…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Affiliate</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Code</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Clicks</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Earned</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Pending</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-muted animate-pulse rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    No affiliates found.
                  </td>
                </tr>
              ) : (
                filtered.map(a => (
                  <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{a.name}</p>
                        <p className="text-xs text-muted-foreground">{a.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{a.affiliateCode}</code>
                        <button
                          onClick={() => copyCode(a.affiliateCode)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title="Copy referral link"
                        >
                          {copied === a.affiliateCode
                            ? <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                            : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">{a.totalClicks.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-medium">₦{a.paidEarnings.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      {a.pendingEarnings > 0 ? (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          ₦{a.pendingEarnings.toLocaleString()}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(a.createdAt).toLocaleDateString('en-NG')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {a.pendingEarnings > 0 && (
                        <Button size="sm" variant="outline" onClick={() => markAsPaid(a.id)}>
                          Mark Paid
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
