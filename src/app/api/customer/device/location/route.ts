import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { authenticateDevice } from '@/lib/device-auth'

// Compatibility location update for the Android app:
// {imei1, latitude, longitude, isActive} + X-Device-Token.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const imei1 = body?.imei1 as string | undefined
  const lat = Number(body?.latitude)
  const lng = Number(body?.longitude)
  if (!imei1 || Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json({ success: false, message: 'Bad input', data: null }, { status: 400 })
  }

  const auth = await authenticateDevice(req.headers, imei1)
  if (!auth.ok) {
    return NextResponse.json({ success: false, message: auth.reason, data: null }, { status: auth.status })
  }

  await prisma.device.update({
    where: { id: auth.device.id },
    data: { lastLatitude: lat, lastLongitude: lng, lastLocationAt: new Date(), lastOnlineAt: new Date() },
  })
  return NextResponse.json({ success: true, message: 'Location updated', data: null })
}
