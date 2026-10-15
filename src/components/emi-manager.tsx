'use client'

import { useState } from 'react'

import { apiPost } from '@/lib/api-client'
import type { Payment } from './emi-timeline'

// Create an EMI plan (when none exists) or record a payment against an
// existing installment. Compact form used on the device detail page.
export function EmiManager({
  deviceId,
  hasPlan,
  payments,
  onChange,
}: {
  deviceId: string
  hasPlan: boolean
  payments: Payment[]
  onChange: () => void
}) {
  const [busy, setBusy] = useState(false)
  const nextDue = payments.find((p) => p.status !== 'PAID')

  async function createPlan(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setBusy(true)
    try {
      await apiPost(`/api/devices/${deviceId}/emi-plan`, {
        totalAmount: Number(f.get('totalAmount')),
        downPayment: Number(f.get('downPayment') || 0),
        emiAmount: Number(f.get('emiAmount')),
        totalInstallments: Number(f.get('totalInstallments')),
        frequency: 'MONTHLY',
        startDate: new Date().toISOString(),
        gracePeriodDays: Number(f.get('gracePeriodDays') || 7),
      })
      onChange()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  async function recordPayment() {
    if (!nextDue) return
    setBusy(true)
    try {
      await apiPost(`/api/devices/${deviceId}/payments`, {
        installmentNo: nextDue.installmentNo,
        amount: nextDue.amount,
        paymentMode: 'CASH',
      })
      onChange()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  if (!hasPlan) {
    return (
      <form
        onSubmit={createPlan}
        className="space-y-3 rounded-xl border border-slate-200 bg-white p-5"
      >
        <h2 className="text-sm font-semibold text-slate-900">Create EMI Plan</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field name="totalAmount" label="Total Amount" />
          <Field name="downPayment" label="Down Payment" required={false} />
          <Field name="emiAmount" label="EMI Amount" />
          <Field name="totalInstallments" label="Installments" />
          <Field name="gracePeriodDays" label="Grace Days" required={false} />
        </div>
        <button
          disabled={busy}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          Create Plan
        </button>
      </form>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-2 text-sm font-semibold text-slate-900">Record Payment</h2>
      {nextDue ? (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">
            Next due: installment #{nextDue.installmentNo} ({nextDue.amount})
          </span>
          <button
            disabled={busy}
            onClick={recordPayment}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Mark Paid (Cash)
          </button>
        </div>
      ) : (
        <p className="text-sm text-emerald-600">All installments paid.</p>
      )}
    </div>
  )
}

function Field({ name, label, required = true }: { name: string; label: string; required?: boolean }) {
  return (
    <label className="block text-xs text-slate-500">
      {label}
      <input
        name={name}
        type="number"
        required={required}
        step="any"
        className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
      />
    </label>
  )
}
