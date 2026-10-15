import { prisma } from '@/lib/db'
import { requireSession } from '@/lib/api-guard'
import { deviceScopeWhere } from '@/lib/authz'
import { apiOk } from '@/lib/errors'

// Headline counts for the dashboard home page.
export async function GET() {
  const guard = await requireSession()
  if (!guard.ok) return guard.response

  const scope = deviceScopeWhere(guard.session)
  const offlineCutoff = new Date(Date.now() - 48 * 60 * 60 * 1000)

  const [total, locked, active, offline] = await Promise.all([
    prisma.device.count({ where: scope }),
    prisma.device.count({ where: { ...scope, status: 'LOCKED' } }),
    prisma.device.count({ where: { ...scope, status: 'ACTIVE' } }),
    prisma.device.count({
      where: { ...scope, lastOnlineAt: { lt: offlineCutoff } },
    }),
  ])

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const collectionScope =
    guard.session.role === 'OWNER'
      ? { device: { shop: { orgId: guard.session.orgId } } }
      : { device: { shopId: guard.session.shopId } }
  const todayCash = await prisma.emiPayment.aggregate({
    where: { status: 'PAID', paidAt: { gte: todayStart }, ...collectionScope },
    _sum: { amount: true },
  })

  return apiOk({
    total,
    locked,
    active,
    offline,
    collectionToday: todayCash._sum.amount ?? 0,
  })
}
