import { cn } from '@/lib/utils'

const STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  LOCKED: 'bg-red-50 text-red-700 border-red-200',
  WIPED: 'bg-slate-100 text-slate-600 border-slate-300',
  DEACTIVATED: 'bg-slate-100 text-slate-500 border-slate-300',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold',
        STYLES[status] ?? STYLES.DEACTIVATED
      )}
    >
      {status}
    </span>
  )
}
