import type { NextRequest } from 'next/server'
import { PaymentStatus } from '@prisma/client'

import { prisma } from '@/lib/db'
import { requireSession } from '@/lib/api-guard'
import { canAccessShop } from '@/lib/authz'
import { writeAudit } from '@/lib/audit'
import { recordPaymentSchema } from '@/lib/validators'
import { Errors, apiOk } from '@/lib/errors'
import { clientIp } from '@/lib/utils'

type Params = { params: Promise<{ id: string }> }

// Record an installment payment. Auto-unlocks the device if it was locked
// for non-payment and no overdue installment remains.
export async function POST(req: NextRequest, { params }: Params) {
  const guard = await requireSession('STAFF')
  if (!guard.ok) return guard.response
  const { id } = await params

  const device = await prisma.device.findUnique({ where: { id } })
  if (!device) return Errors.notFound('Device')
  if (!canAccessShop(guard.session, device.shopId)) return Errors.forbidden()

  const body = await req.json().catch(() => null)
  const parsed = recordPaymentSchema.safeParse(body)
  if (!parsed.success) return Errors.badRequest('Invalid payment data')

  const payment = await prisma.emiPayment.findFirst({
    where: { deviceId: id, installmentNo: parsed.data.installmentNo },
  })
  if (!payment) return Errors.notFound('Installment')
  if (payment.status === 'PAID') return Errors.conflict('Already paid')

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.emiPayment.update({
      where: { id: payment.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        paymentMode: parsed.data.paymentMode,
        receiptNumber: parsed.data.receiptNumber,
        collectedBy: guard.session.userId,
      },
    })
    const overdue = await tx.emiPayment.count({
      where: {
        deviceId: id,
        status: { in: [PaymentStatus.PENDING, PaymentStatus.OVERDUE] },
        dueDate: { lt: new Date() },
      },
    })
    if (device.isLocked && overdue === 0) {
      await tx.device.update({
        where: { id },
        data: { isLocked: false, lockMessage: null, status: 'ACTIVE', pendingCommand: 'UNLOCK' },
      })
    }
    await writeAudit(tx, guard.session, {
      action: 'PAYMENT_RECORDED',
      targetType: 'PAYMENT',
      targetId: updated.id,
      metadata: { installmentNo: updated.installmentNo, amount: updated.amount },
      ipAddress: clientIp(req.headers),
    })
    return { payment: updated, autoUnlocked: device.isLocked && overdue === 0 }
  })
  return apiOk(result)
}
