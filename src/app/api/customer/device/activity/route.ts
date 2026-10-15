import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { authenticateDevice } from '@/lib/device-auth'

// Compatibility heartbeat/activity for the Android app. Carries battery and
// optional location; updates online status. {imei1, batteryLevel, isCharging,
// latitude, longitude, activityType} + X-Device-Token.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const imei1 = body?.imei1 as string | undefined
  if (!imei1) {
    return NextResponse.json({ success: false, message: 'Bad input', data: null }, { status: 400 })
  }

  const auth = await authenticateDevice(req.headers, imei1)
  if (!auth.ok) {
    return NextResponse.json({ success: false, message: auth.reason, data: null }, { status: auth.status })
  }

  const data: Record<string, unknown> = { lastOnlineAt: new Date() }
  if (typeof body.batteryLevel === 'number') data.batteryLevel = body.batteryLevel
  if (typeof body.isCharging === 'boolean') data.isCharging = body.isCharging
  if (typeof body.latitude === 'number' && typeof body.longitude === 'number') {
    data.lastLatitude = body.latitude
    data.lastLongitude = body.longitude
    data.lastLocationAt = new Date()
  }

  await prisma.device.update({ where: { id: auth.device.id }, data })
  return NextResponse.json({
    success: true,
    message: 'Activity recorded',
    data: { customerId: auth.device.id, isOnline: true },
  })
}
