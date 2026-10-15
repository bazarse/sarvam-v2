import type { NextRequest } from 'next/server'

import { prisma } from '@/lib/db'
import { requireSession } from '@/lib/api-guard'
import { canAccessShop } from '@/lib/authz'
import { applyDeviceCommand } from '@/lib/device-commands'
import { DEVICE_COMMANDS } from '@/lib/constants'
import { Errors, apiOk } from '@/lib/errors'
import { clientIp } from '@/lib/utils'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const guard = await requireSession('STAFF')
  if (!guard.ok) return guard.response
  const { id } = await params

  const device = await prisma.device.findUnique({ where: { id } })
  if (!device) return Errors.notFound('Device')
  if (!canAccessShop(guard.session, device.shopId)) return Errors.forbidden()

  await applyDeviceCommand(guard.session, id, DEVICE_COMMANDS.UNLOCK, {
    action: 'DEVICE_UNLOCKED',
    ipAddress: clientIp(req.headers),
  })
  return apiOk({ locked: false })
}
