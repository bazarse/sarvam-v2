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

// Wipe is destructive and irreversible — OWNER only, confirmation required.
const schema = z.object({ confirm: z.literal(true), reason: z.string().min(3).max(300) })

export async function POST(req: NextRequest, { params }: Params) {
  const guard = await requireSession('OWNER')
  if (!guard.ok) return guard.response
  const { id } = await params

  const device = await prisma.device.findUnique({ where: { id } })
  if (!device) return Errors.notFound('Device')
  if (!canAccessShop(guard.session, device.shopId)) return Errors.forbidden()

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return Errors.badRequest('Wipe requires confirm:true and a reason')
  }

  await applyDeviceCommand(guard.session, id, DEVICE_COMMANDS.WIPE, {
    message: parsed.data.reason,
    action: 'DEVICE_WIPED',
    ipAddress: clientIp(req.headers),
  })
  return apiOk({ wipeScheduled: true })
}
