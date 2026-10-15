import type { NextRequest } from 'next/server'

import { prisma } from '@/lib/db'
import { authenticateDevice } from '@/lib/device-auth'
import { Errors, apiOk } from '@/lib/errors'

type Params = { params: Promise<{ imei: string }> }

// Fetch and immediately clear the pending command. Used when the phone wants
// to act on a one-shot command (e.g. WIPE) without waiting for a heartbeat.
export async function GET(req: NextRequest, { params }: Params) {
  const { imei } = await params
  const auth = await authenticateDevice(req.headers, imei)
  if (!auth.ok) return Errors.badRequest(auth.reason)

  const command = auth.device.pendingCommand
  const payload = auth.device.pendingCommandPayload

  if (command) {
    await prisma.device.update({
      where: { id: auth.device.id },
      data: { pendingCommand: null, pendingCommandPayload: null },
    })
  }
  return apiOk({ command, payload })
}
