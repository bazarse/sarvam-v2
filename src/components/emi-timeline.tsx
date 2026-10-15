import { formatCurrency } from '@/lib/utils'
import { StatusBadge } from './status-badge'

export interface Payment {
  id: string
  installmentNo: number
  amount: number
  dueDate: string
  paidAt: string | null
  status: string
}

const PAYMENT_STYLE: Record<string, string> = {
  PAID: 'ACTIVE',
  PENDING: 'DEACTIVATED',
  OVERDUE: 'LOCKED',
  REVERSED: 'WIPED',
}

export function EmiTimeline({ payments }: { payments: Payment[] }) {
  if (payments.length === 0) {
    return <p className="text-sm text-slate-500">No EMI plan on this device.</p>
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">Payment Schedule</h2>
      <div className="space-y-2">
        {payments.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm last:border-0"
          >
            <span className="text-slate-500">#{p.installmentNo}</span>
            <span className="font-medium">{formatCurrency(p.amount)}</span>
            <span className="text-slate-500">
              {new Date(p.dueDate).toLocaleDateString('en-IN')}
            </span>
            <StatusBadge status={PAYMENT_STYLE[p.status] ?? 'DEACTIVATED'} />
          </div>
        ))}
      </div>
    </div>
  )
}
