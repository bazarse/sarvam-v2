import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { requireSession } from '@/lib/api-guard'
import { canAccessShop } from '@/lib/authz'
import { applyDeviceCommand } from '@/lib/device-commands'
import { DEVICE_COMMANDS } from '@/lib/constants'
import { Errors, apiOk } from '@/lib/errors'
import { clientIp } from '@/lib/utils'

type Params = { params: Promise<{ id: string }> }

const schema = z.object({ active: z.boolean() })

export async function POST(req: NextRequest, { params }: Params) {
  const guard = await requireSession('STAFF')
  if (!guard.ok) return guard.response
  const { id } = await params

  const device = await prisma.device.findUnique({ where: { id } })
  if (!device) return Errors.notFound('Device')
  if (!canAccessShop(guard.session, device.shopId)) return Errors.forbidden()

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return Errors.badRequest('Specify active true/false')

  const command = parsed.data.active
    ? DEVICE_COMMANDS.SIREN_ON
    : DEVICE_COMMANDS.SIREN_OFF
  await applyDeviceCommand(guard.session, id, command, {
    action: parsed.data.active ? 'SIREN_ON' : 'SIREN_OFF',
    ipAddress: clientIp(req.headers),
  })
  return apiOk({ sirenActive: parsed.data.active })
}
