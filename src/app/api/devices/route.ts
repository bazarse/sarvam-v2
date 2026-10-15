import type { NextRequest } from 'next/server'
import type { Prisma } from '@prisma/client'

import { prisma } from '@/lib/db'
import { requireSession } from '@/lib/api-guard'
import { deviceScopeWhere } from '@/lib/authz'
import { apiOk } from '@/lib/errors'
import { parsePagination } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const guard = await requireSession()
  if (!guard.ok) return guard.response

  const sp = req.nextUrl.searchParams
  const { skip, take, page, pageSize } = parsePagination(sp)
  const search = sp.get('search')?.trim()
  const status = sp.get('status')
  const shopId = sp.get('shopId')

  const where: Prisma.DeviceWhereInput = { ...deviceScopeWhere(guard.session) }
  if (shopId && guard.session.role === 'OWNER') where.shopId = shopId
  if (status) where.status = status as Prisma.DeviceWhereInput['status']
  if (search) {
    where.OR = [
      { imei1: { contains: search } },
      { customerName: { contains: search, mode: 'insensitive' } },
      { customerPhone: { contains: search } },
    ]
  }

  const [items, total] = await Promise.all([
    prisma.device.findMany({
      where,
      skip,
      take,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        imei1: true,
        brand: true,
        model: true,
        customerName: true,
        customerPhone: true,
        isLocked: true,
        status: true,
        batteryLevel: true,
        isCharging: true,
        lastOnlineAt: true,
        shopId: true,
      },
    }),
    prisma.device.count({ where }),
  ])

  return apiOk({ items, total, page, pageSize })
}
