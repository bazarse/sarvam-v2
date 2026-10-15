'use client'

import { useState } from 'react'

import { apiPost } from '@/lib/api-client'

export function DeviceActions({
  deviceId,
  isLocked,
  onChange,
}: {
  deviceId: string
  isLocked: boolean
  onChange: () => void
}) {
  const [busy, setBusy] = useState(false)

  async function run(fn: () => Promise<unknown>) {
    setBusy(true)
    try {
      await fn()
      onChange()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Action failed')
    } finally {
      setBusy(false)
    }
  }

  const base =
    'rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50'

  return (
    <div className="flex flex-wrap gap-2">
      {isLocked ? (
        <button
          disabled={busy}
          onClick={() => run(() => apiPost(`/api/devices/${deviceId}/unlock`))}
          className={`${base} bg-emerald-600 hover:bg-emerald-700`}
        >
          Unlock
        </button>
      ) : (
        <button
          disabled={busy}
          onClick={() => run(() => apiPost(`/api/devices/${deviceId}/lock`, {}))}
          className={`${base} bg-red-600 hover:bg-red-700`}
        >
          Lock
        </button>
      )}
      <button
        disabled={busy}
        onClick={() => run(() => apiPost(`/api/devices/${deviceId}/siren`, { active: true }))}
        className={`${base} bg-amber-600 hover:bg-amber-700`}
      >
        Siren On
      </button>
      <button
        disabled={busy}
        onClick={() => run(() => apiPost(`/api/devices/${deviceId}/siren`, { active: false }))}
        className={`${base} bg-slate-600 hover:bg-slate-700`}
      >
        Siren Off
      </button>
      <button
        disabled={busy}
        onClick={() => {
          const reason = prompt('Reason for wipe (irreversible):')
          if (reason)
            run(() =>
              apiPost(`/api/devices/${deviceId}/wipe`, { confirm: true, reason })
            )
        }}
        className={`${base} bg-red-800 hover:bg-red-900`}
      >
        Wipe
      </button>
    </div>
  )
}
