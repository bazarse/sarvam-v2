import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { authenticateDevice } from '@/lib/device-auth'

// Compatibility status for the Android app: returns the envelope + fields the
// existing app's DeviceStatusData expects. Token-authenticated.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ imei1: string }> }
) {
  const { imei1 } = await params
  const auth = await authenticateDevice(req.headers, imei1)
  if (!auth.ok) {
    return NextResponse.json(
      { success: false, message: auth.reason, data: null },
      { status: auth.status }
    )
  }

  const device = await prisma.device.findUnique({
    where: { id: auth.device.id },
    include: {
      shop: { select: { name: true, phone: true, address: true } },
      emiPlan: true,
      payments: { where: { status: { in: ['PENDING', 'OVERDUE'] } } },
    },
  })
  if (!device) {
    return NextResponse.json({ success: false, message: 'Not found', data: null }, { status: 404 })
  }

  // Record the authenticated check-in (drives online status).
  await prisma.device.update({
    where: { id: device.id },
    data: { lastOnlineAt: new Date() },
  })

  return NextResponse.json({
    success: true,
    message: 'OK',
    data: {
      customerId: device.id,
      customerName: device.customerName ?? '',
      mobileNumber: device.customerPhone ?? '',
      isLocked: device.isLocked,
      lockMessage: device.lockMessage,
      isSirenActive: device.isSirenActive,
      offlineTimerHours: device.offlineThresholdHours,
      hasPendingEmis: device.payments.length > 0,
      pendingEmiCount: device.payments.length,
      emiAmount: device.emiPlan?.emiAmount ?? null,
      paidEmis: 0,
      totalEmis: device.emiPlan?.totalInstallments ?? 0,
      shopName: device.shop.name,
      shopPhone: device.shop.phone ?? '',
      registeredAt: device.createdAt.toISOString(),
      lastUpdated: device.updatedAt.toISOString(),
    },
  })
}
