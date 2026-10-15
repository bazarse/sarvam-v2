import type { NextRequest } from 'next/server'
import { createHash } from 'node:crypto'

import { prisma } from '@/lib/db'
import { generateDeviceToken, hashToken } from '@/lib/device-auth'
import { claimSchema } from '@/lib/validators'
import { Errors } from '@/lib/errors'
import { NextResponse } from 'next/server'

// Compatibility claim for the Android app dialect: {imei1, enrollmentKey} ->
// {success, message, data:{deviceId, deviceToken}}. Registers the device under
// the shop (resolved from the enrollment key) if it does not exist, then issues
// a fresh per-device token. Possessing the shop key is sufficient authorization.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const parsed = claimSchema.safeParse(body)
    if (!parsed.success) return Errors.badRequest('Invalid claim data')

    const keyHash = createHash('sha256').update(parsed.data.enrollmentKey).digest('hex')
    const shop = await prisma.shop.findFirst({
      where: { enrollmentKeyHash: keyHash, isActive: true },
    })
    if (!shop) return Errors.forbidden()

    const raw = generateDeviceToken()
    const tokenHash = hashToken(raw)

    const device = await prisma.device.upsert({
      where: { imei1: parsed.data.imei1 },
      update: { deviceTokenHash: tokenHash, tokenBoundAt: new Date(), lastOnlineAt: new Date() },
      create: {
        shopId: shop.id,
        imei1: parsed.data.imei1,
        deviceTokenHash: tokenHash,
        tokenBoundAt: new Date(),
        lastOnlineAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Device claimed',
      data: { deviceId: device.id, deviceToken: raw },
    })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Server error', data: null },
      { status: 500 }
    )
  }
}
