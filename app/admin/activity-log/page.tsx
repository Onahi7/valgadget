'use client'

import { useState, useEffect } from 'react'
import { Activity, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getToken } from '@/lib/api-client'
import { toast } from 'sonner'

interface ActivityEntry {
  id: string
  action: string
  entityType: string
  entityId: string
  userId: string
  userName: string
  details: string
  createdAt: string
}

export default function ActivityLogPage() {
  const [entries, setEntries] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/activity-log', {
        headers: { Authorization: `Bearer ${getToken()}` },
        credentials: 'include',
      })
      const data = await res.json()
      if (data.data) setEntries(data.data)
    } catch {
      toast.error('Failed to load activity log')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-6 animate-page-reveal">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-sm text-muted-foreground">Track admin actions and system events</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={load}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-card border border-border rounded-lg py-16 text-center">
          <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No activity recorded yet</p>
          <p className="text-xs text-muted-foreground mt-1">Admin actions will appear here as they occur.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          {entries.map(entry => (
            <div key={entry.id} className="px-5 py-4 flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                <Activity className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{entry.userName}</span>
                  {' '}
                  <span className="text-muted-foreground">{entry.action}</span>
                  {' '}
                  <span className="font-medium">{entry.entityType}</span>
                </p>
                {entry.details && (
                  <p className="text-xs text-muted-foreground mt-0.5">{entry.details}</p>
                )}
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {new Date(entry.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
