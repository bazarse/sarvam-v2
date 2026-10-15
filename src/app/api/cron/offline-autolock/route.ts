import type { NextRequest } from 'next/server'

import { prisma } from '@/lib/db'
import { requireCronSecret } from '@/lib/api-guard'
import { Errors, apiOk } from '@/lib/errors'

export const dynamic = 'force-dynamic'

// Lock devices that have not checked in within their offline threshold.
// Uses a raw interval comparison so each device honors its own threshold.
export async function GET(req: NextRequest) {
  if (!requireCronSecret(req.headers)) return Errors.unauthorized()

  const stale = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Device"
    WHERE "isLocked" = false
      AND "status" = 'ACTIVE'
      AND "lastOnlineAt" IS NOT NULL
      AND "lastOnlineAt" < NOW() - ("offlineThresholdHours" * INTERVAL '1 hour')
    LIMIT 1000
  `

  const ids = stale.map((r) => r.id)
  if (ids.length > 0) {
    await prisma.device.updateMany({
      where: { id: { in: ids } },
      data: {
        isLocked: true,
        status: 'LOCKED',
        lockMessage: 'Device offline too long. Connect to the internet or contact your shop.',
        pendingCommand: 'LOCK',
      },
    })
  }

  return apiOk({ locked: ids.length })
}
