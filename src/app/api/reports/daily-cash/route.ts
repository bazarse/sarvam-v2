import type { NextRequest } from 'next/server'

import { prisma } from '@/lib/db'
import { requireSession } from '@/lib/api-guard'
import { apiOk } from '@/lib/errors'

// Cash collected per staff member for a given day (defaults to today).
export async function GET(req: NextRequest) {
  const guard = await requireSession()
  if (!guard.ok) return guard.response

  const dateParam = req.nextUrl.searchParams.get('date')
  const day = dateParam ? new Date(dateParam) : new Date()
  const start = new Date(day)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  const shopFilter =
    guard.session.role === 'OWNER'
      ? { device: { shop: { orgId: guard.session.orgId } } }
      : { device: { shopId: guard.session.shopId } }

  const payments = await prisma.emiPayment.findMany({
    where: {
      status: 'PAID',
      paymentMode: 'CASH',
      paidAt: { gte: start, lt: end },
      ...shopFilter,
    },
    select: { amount: true, collectedBy: true },
  })

  const byStaff = new Map<string, { count: number; total: number }>()
  let shopTotal = 0
  for (const p of payments) {
    const key = p.collectedBy ?? 'unknown'
    const entry = byStaff.get(key) ?? { count: 0, total: 0 }
    entry.count += 1
    entry.total += p.amount
    byStaff.set(key, entry)
    shopTotal += p.amount
  }

  return apiOk({
    date: start.toISOString().slice(0, 10),
    perStaff: [...byStaff.entries()].map(([actorId, v]) => ({ actorId, ...v })),
    shopTotal,
  })
}
