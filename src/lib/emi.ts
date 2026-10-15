import type { EmiFrequency } from '@prisma/client'

export interface ScheduledInstallment {
  installmentNo: number
  amount: number
  dueDate: Date
}

// Generate the installment schedule for an EMI plan.
export function buildSchedule(params: {
  emiAmount: number
  totalInstallments: number
  frequency: EmiFrequency
  startDate: Date
}): ScheduledInstallment[] {
  const { emiAmount, totalInstallments, frequency, startDate } = params
  const rows: ScheduledInstallment[] = []
  for (let i = 0; i < totalInstallments; i++) {
    const due = new Date(startDate)
    if (frequency === 'MONTHLY') {
      due.setMonth(due.getMonth() + i)
    } else {
      due.setDate(due.getDate() + i * 7)
    }
    rows.push({ installmentNo: i + 1, amount: emiAmount, dueDate: due })
  }
  return rows
}

// Determine whether a device should be locked based on its overdue payments
// and the plan's grace period.
export function isPastGrace(dueDate: Date, gracePeriodDays: number): boolean {
  const deadline = new Date(dueDate)
  deadline.setDate(deadline.getDate() + gracePeriodDays)
  return Date.now() > deadline.getTime()
}
