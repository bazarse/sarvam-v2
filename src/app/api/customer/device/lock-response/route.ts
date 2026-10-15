import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { authenticateDevice } from '@/lib/device-auth'

// Compatibility: the app reports the result of applying a lock/unlock, plus
// security events (SIM swap, tamper). Recorded to the activity log.
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

  await prisma.deviceActivityLog.create({
    data: {
      deviceId: auth.device.id,
      event: String(body.action ?? 'LOCK_RESPONSE'),
      message: body.errorMessage ? String(body.errorMessage) : null,
      metadata: JSON.stringify({ lockSuccess: body.lockSuccess ?? null }),
    },
  })

  return NextResponse.json({
    success: true,
    message: 'Recorded',
    data: { customerId: auth.device.id, currentLockStatus: auth.device.isLocked, responseProcessed: true },
  })
}
