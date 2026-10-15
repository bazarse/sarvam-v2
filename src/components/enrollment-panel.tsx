'use client'

import { useState } from 'react'

import { apiPost } from '@/lib/api-client'

const APK_URL = 'https://sarvam-tau.vercel.app/sarvam.apk'

// Generate/rotate the shop enrollment key and show one-time install guidance.
export function EnrollmentPanel({ shopId }: { shopId: string }) {
  const [key, setKey] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function generate() {
    if (key && !confirm('Rotating invalidates the old key. Continue?')) return
    setBusy(true)
    try {
      const res = await apiPost<{ enrollmentKey: string }>(
        `/api/shops/${shopId}/enrollment-key`
      )
      setKey(res.enrollmentKey)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Device Enrollment</h2>
        <button
          disabled={busy}
          onClick={generate}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {key ? 'Rotate Key' : 'Generate Enrollment Key'}
        </button>
      </div>

      {key && (
        <div className="mt-4 space-y-3 text-sm">
          <div className="rounded-lg bg-amber-50 p-3 text-amber-900">
            Copy this key now — it is shown only once.
            <code className="mt-1 block break-all rounded bg-white px-2 py-1 font-mono text-slate-900">
              {key}
            </code>
          </div>
          <ol className="list-decimal space-y-1 pl-5 text-slate-700">
            <li>On the phone, open Chrome and install the app from <code>{APK_URL}</code></li>
            <li>Open the app and enter this enrollment key</li>
            <li>The device auto-registers under this shop and appears in Devices</li>
          </ol>
        </div>
      )}
      {!key && (
        <p className="mt-2 text-xs text-slate-500">
          Generate a key to enroll new phones into this shop.
        </p>
      )}
    </div>
  )
}
