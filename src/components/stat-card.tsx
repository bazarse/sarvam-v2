import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  accent?: 'default' | 'danger' | 'success' | 'warning'
}

const ACCENT: Record<NonNullable<StatCardProps['accent']>, string> = {
  default: 'text-slate-900',
  danger: 'text-red-600',
  success: 'text-emerald-600',
  warning: 'text-amber-600',
}

export function StatCard({ label, value, accent = 'default' }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={cn('mt-2 text-3xl font-bold', ACCENT[accent])}>{value}</p>
    </div>
  )
}
