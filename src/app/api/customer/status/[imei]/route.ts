import type { NextRequest } from 'next/server'

import { authenticateDevice } from '@/lib/device-auth'
import { Errors, apiOk } from '@/lib/errors'

type Params = { params: Promise<{ imei: string }> }

// Lightweight lock-state poll used by the phone's foreground service.
export async function GET(req: NextRequest, { params }: Params) {
  const { imei } = await params
  const auth = await authenticateDevice(req.headers, imei)
  if (!auth.ok) return Errors.badRequest(auth.reason)

  return apiOk({
    isLocked: auth.device.isLocked,
    lockMessage: auth.device.lockMessage,
    isSirenActive: auth.device.isSirenActive,
    offlineThresholdHours: auth.device.offlineThresholdHours,
    command: auth.device.pendingCommand,
    payload: auth.device.pendingCommandPayload,
    status: auth.device.status,
  })
}
