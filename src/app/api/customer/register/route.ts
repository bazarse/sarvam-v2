import type { NextRequest } from 'next/server'
import { createHash } from 'node:crypto'

import { prisma } from '@/lib/db'
import { deviceRegisterSchema } from '@/lib/validators'
import { Errors, apiOk } from '@/lib/errors'

// Phone self-registration during manual install. Gated by the per-shop
// enrollment key so arbitrary IMEIs cannot be pre-registered.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const parsed = deviceRegisterSchema.safeParse(body)
    if (!parsed.success) return Errors.badRequest('Invalid registration data')

    const keyHash = createHash('sha256')
      .update(parsed.data.enrollmentKey)
      .digest('hex')
    const shop = await prisma.shop.findFirst({
      where: { enrollmentKeyHash: keyHash, isActive: true },
    })
    if (!shop) return Errors.forbidden()

    const existing = await prisma.device.findUnique({
      where: { imei1: parsed.data.imei1 },
    })
    if (existing) {
      return apiOk({ deviceId: existing.id, alreadyRegistered: true })
    }

    const device = await prisma.device.create({
      data: {
        shopId: shop.id,
        imei1: parsed.data.imei1,
        imei2: parsed.data.imei2,
        brand: parsed.data.brand,
        model: parsed.data.model,
        androidVersion: parsed.data.androidVersion,
        appVersion: parsed.data.appVersion,
        lastOnlineAt: new Date(),
      },
    })
    return apiOk({ deviceId: device.id }, 201)
  } catch {
    return Errors.server()
  }
}
