import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { requireSession } from '@/lib/api-guard'
import { canAccessShop } from '@/lib/authz'
import { writeAudit } from '@/lib/audit'
import { Errors, apiOk } from '@/lib/errors'
import { clientIp } from '@/lib/utils'

type Params = { params: Promise<{ id: string; paymentId: string }> }

const schema = z.object({ reason: z.string().min(3).max(300) })

// Reverse a recorded payment (OWNER only, reason required).
export async function POST(req: NextRequest, { params }: Params) {
  const guard = await requireSession('OWNER')
  if (!guard.ok) return guard.response
  const { id, paymentId } = await params

  const device = await prisma.device.findUnique({ where: { id } })
  if (!device) return Errors.notFound('Device')
  if (!canAccessShop(guard.session, device.shopId)) return Errors.forbidden()

  const payment = await prisma.emiPayment.findUnique({ where: { id: paymentId } })
  if (!payment || payment.deviceId !== id) return Errors.notFound('Payment')
  if (payment.status !== 'PAID') return Errors.badRequest('Payment is not paid')

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return Errors.badRequest('Reversal reason required')

  await prisma.$transaction(async (tx) => {
    await tx.emiPayment.update({
      where: { id: paymentId },
      data: { status: 'REVERSED', paidAt: null, paymentMode: null, receiptNumber: null },
    })
    await writeAudit(tx, guard.session, {
      action: 'PAYMENT_REVERSED',
      targetType: 'PAYMENT',
      targetId: paymentId,
      reason: parsed.data.reason,
      ipAddress: clientIp(req.headers),
    })
  })
  return apiOk({ reversed: true })
}
