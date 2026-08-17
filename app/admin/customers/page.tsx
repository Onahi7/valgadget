'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, UserPlus, Eye, Shield, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getToken } from '@/lib/api-client'
import { toast } from 'sonner'

type Customer = {
  id: string; name: string; email: string; role: string;
  isVerified: boolean; orders: number; spent: number; createdAt: string;
}

const ROLE_COLORS: Record<string, string> = {
  customer:  'bg-blue-100 text-blue-700 border-blue-200',
  affiliate: 'bg-primary/10 text-primary border-primary/20',
  admin:     'bg-purple-100 text-purple-700 border-purple-200',
}

type CustomersResponse = {
  data: Customer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminCustomersPage() {
  const [search, setSearch]   = useState('')
  const [roleFilter, setRole] = useState('all')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage]         = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal]         = useState(0)
  const [counts, setCounts]       = useState({ customer: 0, affiliate: 0, admin: 0 })

  const PAGE_SIZE = 20

  const fetchCustomers = (p: number) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE) })
    if (roleFilter !== 'all') params.set('role', roleFilter)
    if (search) params.set('search', search)
    fetch(`/api/admin/users?${params}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
      credentials: 'include',
    })
      .then(r => r.json())
      .then((res: CustomersResponse) => {
        if (res.data) setCustomers(res.data)
        if (res.totalPages) setTotalPages(res.totalPages)
        if (res.total) setTotal(res.total)
        setPage(p)
      })
      .finally(() => setLoading(false))
  }

  const fetchCounts = () => {
    const headers = { Authorization: `Bearer ${getToken()}` }
    Promise.all([
      fetch('/api/admin/users?limit=1&role=customer', { headers, credentials: 'include' }).then(r => r.json()),
      fetch('/api/admin/users?limit=1&role=affiliate', { headers, credentials: 'include' }).then(r => r.json()),
      fetch('/api/admin/users?limit=1&role=admin', { headers, credentials: 'include' }).then(r => r.json()),
    ]).then(([c, a, ad]) => {
      setCounts({ customer: c.total ?? 0, affiliate: a.total ?? 0, admin: ad.total ?? 0 })
    }).catch(() => {})
  }

  useEffect(() => {
    fetchCustomers(1)
    fetchCounts()
  }, [search, roleFilter])

  return (
    <div className="space-y-6 animate-page-reveal">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">{total} registered users</p>
        </div>
        <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto" size="sm" onClick={async () => {
          const email = prompt('Enter email address to invite:')
          if (!email) return
          try {
            const res = await fetch('/api/admin/users/invite', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
              credentials: 'include',
              body: JSON.stringify({ email }),
            })
            const d = await res.json()
            if (res.ok) toast.success(`Invitation sent to ${email}`)
            else toast.error(d.error ?? 'Failed to invite user')
          } catch {
            toast.error('Failed to send invitation')
          }
        }}>
          <UserPlus className="w-4 h-4" /> Invite User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Customers', value: counts.customer },
          { label: 'Affiliates', value: counts.affiliate },
          { label: 'Admins', value: counts.admin },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card border border-border rounded-lg px-4 py-3 text-center">
            <p className="text-xl font-bold font-mono">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRole(e.target.value)}
          className="appearance-none bg-card border border-border rounded-md px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">All Roles</option>
          <option value="customer">Customer</option>
          <option value="affiliate">Affiliate</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 font-medium">Customer</th>
                <th className="text-left px-4 py-3 font-medium">Role</th>
                <th className="text-left px-4 py-3 font-medium">Orders</th>
                <th className="text-left px-4 py-3 font-medium">Spent</th>
                <th className="text-left px-4 py-3 font-medium">Verified</th>
                <th className="text-left px-4 py-3 font-medium">Joined</th>
                <th className="text-right px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">Loading...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">No customers found</td></tr>
              ) : customers.map(customer => (
                <tr key={customer.id} className="border-b border-border/50 hover:bg-accent/20 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                          {customer.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">{customer.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`text-[11px] border capitalize ${ROLE_COLORS[customer.role] ?? ''}`}>{customer.role}</Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">{customer.orders}</td>
                  <td className="px-4 py-3 font-bold">₦{Number(customer.spent ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {customer.isVerified
                      ? <Shield className="w-4 h-4 text-green-600" aria-label="Verified" />
                      : <span className="text-xs text-muted-foreground">Unverified</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                      <Link href={`/admin/customers/${customer.id}`} aria-label="View customer"><Eye className="w-3.5 h-3.5" /></Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && customers.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">No customers match your search.</div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Page {page} of {totalPages} ({total} total)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchCustomers(page - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchCustomers(page + 1)}
                disabled={page >= totalPages}
              >
                Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
