import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { authenticateDevice } from '@/lib/device-auth'

// Compatibility: the app registers/updates its FCM token (and optional
// location) after claim. FCM is optional in v2 (poll-based), so this simply
// records the values on the already-claimed device.
export async function PUT(req: NextRequest) {
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
  if (typeof body.latitude === 'number' && typeof body.longitude === 'number') {
    data.lastLatitude = body.latitude
    data.lastLongitude = body.longitude
    data.lastLocationAt = new Date()
  }
  const device = await prisma.device.update({ where: { id: auth.device.id }, data })

  return NextResponse.json({
    success: true,
    message: 'Registered',
    data: {
      customerId: device.id,
      customerName: device.customerName ?? '',
      isLocked: device.isLocked,
      updatedAt: device.updatedAt.toISOString(),
    },
  })
}
