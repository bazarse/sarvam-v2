import type { NextRequest } from 'next/server'

import { prisma } from '@/lib/db'
import { authenticateDevice } from '@/lib/device-auth'
import { heartbeatSchema } from '@/lib/validators'
import { Errors, apiOk } from '@/lib/errors'

// Phone check-in. Updates battery + online status, returns authoritative lock
// state and any pending command. The phone clears the command by acting on it.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = heartbeatSchema.safeParse(body)
  if (!parsed.success) return Errors.badRequest('Invalid heartbeat')

  const auth = await authenticateDevice(req.headers, parsed.data.imei1)
  if (!auth.ok) return Errors.badRequest(auth.reason)

  const command = auth.device.pendingCommand
  const payload = auth.device.pendingCommandPayload

  const device = await prisma.device.update({
    where: { id: auth.device.id },
    data: {
      batteryLevel: parsed.data.batteryLevel ?? auth.device.batteryLevel,
      batteryHealth: parsed.data.batteryHealth ?? auth.device.batteryHealth,
      isCharging: parsed.data.isCharging ?? auth.device.isCharging,
      appVersion: parsed.data.appVersion ?? auth.device.appVersion,
      lastOnlineAt: new Date(),
      // Clear the pending command now that it has been delivered.
      pendingCommand: null,
      pendingCommandPayload: null,
    },
    select: {
      isLocked: true,
      lockMessage: true,
      isSirenActive: true,
      offlineThresholdHours: true,
    },
  })

  return apiOk({ ...device, command, payload })
}
