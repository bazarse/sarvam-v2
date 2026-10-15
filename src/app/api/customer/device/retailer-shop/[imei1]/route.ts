import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { authenticateDevice } from '@/lib/device-auth'

// Compatibility: shop details shown on the device lock screen.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ imei1: string }> }
) {
  const { imei1 } = await params
  const auth = await authenticateDevice(req.headers, imei1)
  if (!auth.ok) {
    return NextResponse.json({ success: false, message: auth.reason, data: null }, { status: auth.status })
  }

  const shop = await prisma.shop.findUnique({
    where: { id: auth.device.shopId },
    select: { name: true, phone: true, address: true },
  })
  return NextResponse.json({
    success: true,
    message: 'OK',
    data: {
      shopName: shop?.name ?? 'Your Shop',
      shopPhone: shop?.phone ?? '',
      shopAddress: shop?.address ?? '',
    },
  })
}
