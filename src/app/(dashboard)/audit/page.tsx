'use client'

import { useEffect, useState } from 'react'

import { apiFetch } from '@/lib/api-client'

interface AuditRow {
  id: string
  actorName: string
  actorRole: string
  action: string
  targetType: string
  targetId: string
  reason: string | null
  createdAt: string
}

export default function AuditPage() {
  const [rows, setRows] = useState<AuditRow[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<{ items: AuditRow[] }>('/api/audit')
      .then((d) => setRows(d.items))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))
  }, [])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">Reason</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-slate-100">
                <td className="px-4 py-3 text-slate-500">
                  {new Date(r.createdAt).toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-3">
                  {r.actorName}
                  <span className="ml-1 text-xs text-slate-400">{r.actorRole}</span>
                </td>
                <td className="px-4 py-3 font-medium">{r.action}</td>
                <td className="px-4 py-3 text-slate-500">
                  {r.targetType}:{r.targetId.slice(0, 8)}
                </td>
                <td className="px-4 py-3 text-slate-500">{r.reason ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
