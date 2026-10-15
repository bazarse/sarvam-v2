import type { NextRequest } from 'next/server'
import { createHash } from 'node:crypto'

import { prisma } from '@/lib/db'
import { claimSchema } from '@/lib/validators'
import { generateDeviceToken, hashToken } from '@/lib/device-auth'
import { Errors, apiOk } from '@/lib/errors'

// Trust-on-first-use claim: the device presents its IMEI + the per-shop
// enrollment key and receives a per-device secret token (returned once).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const parsed = claimSchema.safeParse(body)
    if (!parsed.success) return Errors.badRequest('Invalid claim data')

    const keyHash = createHash('sha256')
      .update(parsed.data.enrollmentKey)
      .digest('hex')
    const shop = await prisma.shop.findFirst({
      where: { enrollmentKeyHash: keyHash, isActive: true },
    })
    if (!shop) return Errors.forbidden()

    const device = await prisma.device.findUnique({
      where: { imei1: parsed.data.imei1 },
    })
    if (!device) return Errors.notFound('Device')
    if (device.deviceTokenHash) {
      return Errors.conflict('Device already claimed')
    }

    const raw = generateDeviceToken()
    await prisma.device.update({
      where: { id: device.id },
      data: { deviceTokenHash: hashToken(raw), tokenBoundAt: new Date() },
    })
    return apiOk({ token: raw })
  } catch {
    return Errors.server()
  }
}
