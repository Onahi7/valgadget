'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, UserPlus, Eye, Shield } from 'lucide-react'
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

export default function AdminCustomersPage() {
  const [search, setSearch]   = useState('')
  const [roleFilter, setRole] = useState('all')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/users?page=1&limit=100', {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(res => { if (res.data?.data) setCustomers(res.data.data) })
      .finally(() => setLoading(false))
  }, [])

  const filtered = customers.filter(c => {
    const q = search.toLowerCase()
    const matchesSearch = !search || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    const matchesRole = roleFilter === 'all' || c.role === roleFilter
    return matchesSearch && matchesRole
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Customers</h1>
          <p className="text-sm text-muted-foreground">{customers.length} registered users</p>
        </div>
        <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90" size="sm" onClick={async () => {
          const email = prompt('Enter email address to invite:')
          if (!email) return
          try {
            const res = await fetch('/api/admin/users/invite', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
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
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Customers', value: customers.filter(c => c.role === 'customer').length },
          { label: 'Affiliates', value: customers.filter(c => c.role === 'affiliate').length },
          { label: 'Admins', value: customers.filter(c => c.role === 'admin').length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card border border-border rounded-lg px-4 py-3 text-center">
            <p className="text-xl font-bold font-mono">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex gap-3">
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
                <tr><td colSpan={7} className="py-12 text-center text-muted-foreground text-sm">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-muted-foreground text-sm">No customers found</td></tr>
              ) : filtered.map(customer => (
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
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">No customers match your search.</div>
        )}
      </div>
    </div>
  )
}
