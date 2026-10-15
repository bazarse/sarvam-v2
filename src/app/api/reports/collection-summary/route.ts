import type { NextRequest } from 'next/server'

import { prisma } from '@/lib/db'
import { requireSession } from '@/lib/api-guard'
import { apiOk } from '@/lib/errors'

// Aggregate collection figures across the session's scope.
export async function GET(_req: NextRequest) {
  const guard = await requireSession()
  if (!guard.ok) return guard.response

  const scope =
    guard.session.role === 'OWNER'
      ? { device: { shop: { orgId: guard.session.orgId } } }
      : { device: { shopId: guard.session.shopId } }

  const [paid, pending, overdue] = await Promise.all([
    prisma.emiPayment.aggregate({
      where: { status: 'PAID', ...scope },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.emiPayment.aggregate({
      where: { status: 'PENDING', ...scope },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.emiPayment.aggregate({
      where: { status: 'OVERDUE', ...scope },
      _sum: { amount: true },
      _count: true,
    }),
  ])

  return apiOk({
    collected: { amount: paid._sum.amount ?? 0, count: paid._count },
    pending: { amount: pending._sum.amount ?? 0, count: pending._count },
    overdue: { amount: overdue._sum.amount ?? 0, count: overdue._count },
  })
}
