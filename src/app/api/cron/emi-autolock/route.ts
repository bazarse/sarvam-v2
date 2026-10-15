import type { NextRequest } from 'next/server'
import { PaymentStatus } from '@prisma/client'

import { prisma } from '@/lib/db'
import { requireCronSecret } from '@/lib/api-guard'
import { Errors, apiOk } from '@/lib/errors'

export const dynamic = 'force-dynamic'

// Lock devices whose oldest unpaid installment is past due + grace period.
// Processed in batches so it scales to large device counts.
export async function GET(req: NextRequest) {
  if (!requireCronSecret(req.headers)) return Errors.unauthorized()

  const now = new Date()
  const overduePayments = await prisma.emiPayment.findMany({
    where: {
      status: { in: [PaymentStatus.PENDING, PaymentStatus.OVERDUE] },
      dueDate: { lt: now },
      device: { isLocked: false, status: 'ACTIVE' },
    },
    select: {
      deviceId: true,
      dueDate: true,
      plan: { select: { gracePeriodDays: true } },
    },
    take: 1000,
  })

  const toLock = new Set<string>()
  for (const p of overduePayments) {
    const deadline = new Date(p.dueDate)
    deadline.setDate(deadline.getDate() + p.plan.gracePeriodDays)
    if (now.getTime() > deadline.getTime()) toLock.add(p.deviceId)
  }

  if (toLock.size > 0) {
    await prisma.device.updateMany({
      where: { id: { in: [...toLock] } },
      data: {
        isLocked: true,
        status: 'LOCKED',
        lockMessage: 'EMI payment overdue. Please contact your shop to unlock.',
        pendingCommand: 'LOCK',
      },
    })
  }

  return apiOk({ scanned: overduePayments.length, locked: toLock.size })
}
