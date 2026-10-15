import type { NextRequest } from 'next/server'

import { prisma } from '@/lib/db'
import { authenticateDevice } from '@/lib/device-auth'
import { locationSchema } from '@/lib/validators'
import { Errors, apiOk } from '@/lib/errors'
import { clientIp } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = locationSchema.safeParse(body)
  if (!parsed.success) return Errors.badRequest('Invalid location')

  const auth = await authenticateDevice(req.headers, parsed.data.imei1)
  if (!auth.ok) return Errors.badRequest(auth.reason)

  await prisma.$transaction([
    prisma.device.update({
      where: { id: auth.device.id },
      data: {
        lastLatitude: parsed.data.latitude,
        lastLongitude: parsed.data.longitude,
        lastLocationAt: new Date(),
        lastOnlineAt: new Date(),
      },
    }),
    prisma.deviceActivityLog.create({
      data: {
        deviceId: auth.device.id,
        event: 'LOCATION',
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
        ipAddress: clientIp(req.headers),
      },
    }),
  ])
  return apiOk({ recorded: true })
}
