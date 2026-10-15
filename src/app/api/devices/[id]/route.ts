import type { NextRequest } from 'next/server'

import { prisma } from '@/lib/db'
import { requireSession } from '@/lib/api-guard'
import { canAccessShop } from '@/lib/authz'
import { writeAudit } from '@/lib/audit'
import { Errors, apiOk } from '@/lib/errors'
import { clientIp } from '@/lib/utils'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requireSession()
  if (!guard.ok) return guard.response
  const { id } = await params

  const device = await prisma.device.findUnique({
    where: { id },
    include: {
      shop: { select: { name: true, phone: true, address: true } },
      emiPlan: true,
      payments: { orderBy: { installmentNo: 'asc' } },
    },
  })
  if (!device) return Errors.notFound('Device')
  if (!canAccessShop(guard.session, device.shopId)) return Errors.forbidden()

  const { deviceTokenHash: _hash, ...safe } = device
  return apiOk(safe)
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const guard = await requireSession('OWNER')
  if (!guard.ok) return guard.response
  const { id } = await params

  const device = await prisma.device.findUnique({ where: { id } })
  if (!device) return Errors.notFound('Device')
  if (!canAccessShop(guard.session, device.shopId)) return Errors.forbidden()

  await prisma.$transaction(async (tx) => {
    await tx.device.delete({ where: { id } })
    await writeAudit(tx, guard.session, {
      action: 'DEVICE_DELETED',
      targetType: 'DEVICE',
      targetId: id,
      metadata: { imei1: device.imei1 },
      ipAddress: clientIp(req.headers),
    })
  })
  return apiOk({ deleted: true })
}
