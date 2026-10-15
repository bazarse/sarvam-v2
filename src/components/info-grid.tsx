export interface InfoItem {
  label: string
  value: string | number | null | undefined
}

// Simple label/value grid used on detail pages.
export function InfoGrid({ title, items }: { title: string; items: InfoItem[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">{title}</h2>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-xs uppercase tracking-wide text-slate-400">
              {item.label}
            </dt>
            <dd className="text-slate-800">{item.value ?? '-'}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
