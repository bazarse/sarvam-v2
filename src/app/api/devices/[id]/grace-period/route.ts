import type { NextRequest } from 'next/server'

import { prisma } from '@/lib/db'
import { requireSession } from '@/lib/api-guard'
import { canAccessShop } from '@/lib/authz'
import { writeAudit } from '@/lib/audit'
import { graceSchema } from '@/lib/validators'
import { Errors, apiOk } from '@/lib/errors'
import { clientIp } from '@/lib/utils'

type Params = { params: Promise<{ id: string }> }

// Extend the grace period on the device's EMI plan.
export async function POST(req: NextRequest, { params }: Params) {
  const guard = await requireSession('STAFF')
  if (!guard.ok) return guard.response
  const { id } = await params

  const device = await prisma.device.findUnique({
    where: { id },
    include: { emiPlan: true },
  })
  if (!device) return Errors.notFound('Device')
  if (!canAccessShop(guard.session, device.shopId)) return Errors.forbidden()
  if (!device.emiPlan) return Errors.badRequest('Device has no EMI plan')

  const body = await req.json().catch(() => null)
  const parsed = graceSchema.safeParse(body)
  if (!parsed.success) return Errors.badRequest('Grace days must be 1-30')

  // STAFF capped at a small grace; MANAGER/OWNER up to the schema max.
  if (guard.session.role === 'STAFF' && parsed.data.days > 3) {
    return Errors.forbidden()
  }

  await prisma.$transaction(async (tx) => {
    await tx.emiPlan.update({
      where: { id: device.emiPlan!.id },
      data: { gracePeriodDays: parsed.data.days },
    })
    await writeAudit(tx, guard.session, {
      action: 'GRACE_GRANTED',
      targetType: 'DEVICE',
      targetId: id,
      metadata: { days: parsed.data.days },
      ipAddress: clientIp(req.headers),
    })
  })
  return apiOk({ gracePeriodDays: parsed.data.days })
}
