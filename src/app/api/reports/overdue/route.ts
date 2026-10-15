import type { NextRequest } from 'next/server'
import { Prisma, PaymentStatus } from '@prisma/client'

import { prisma } from '@/lib/db'
import { requireSession } from '@/lib/api-guard'
import { deviceScopeWhere } from '@/lib/authz'
import { apiOk } from '@/lib/errors'
import { parsePagination } from '@/lib/utils'

// Devices with at least one overdue (past-due, unpaid) installment.
export async function GET(req: NextRequest) {
  const guard = await requireSession()
  if (!guard.ok) return guard.response

  const { skip, take, page, pageSize } = parsePagination(req.nextUrl.searchParams)

  const where: Prisma.DeviceWhereInput = {
    ...deviceScopeWhere(guard.session),
    payments: {
      some: {
        status: { in: [PaymentStatus.PENDING, PaymentStatus.OVERDUE] },
        dueDate: { lt: new Date() },
      },
    },
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
        customerName: true,
        customerPhone: true,
        isLocked: true,
        status: true,
      },
    }),
    prisma.device.count({ where }),
  ])

  return apiOk({ items, total, page, pageSize })
}
