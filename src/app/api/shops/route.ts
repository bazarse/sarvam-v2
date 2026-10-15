import type { NextRequest } from 'next/server'

import { prisma } from '@/lib/db'
import { requireSession } from '@/lib/api-guard'
import { shopScopeWhere } from '@/lib/authz'
import { writeAudit } from '@/lib/audit'
import { createShopSchema } from '@/lib/validators'
import { Errors, apiOk } from '@/lib/errors'
import { parsePagination, clientIp } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const guard = await requireSession()
  if (!guard.ok) return guard.response

  const { skip, take, page, pageSize } = parsePagination(
    req.nextUrl.searchParams
  )
  const where = shopScopeWhere(guard.session)

  const [items, total] = await Promise.all([
    prisma.shop.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { devices: true, users: true } } },
    }),
    prisma.shop.count({ where }),
  ])

  return apiOk({ items, total, page, pageSize })
}

export async function POST(req: NextRequest) {
  const guard = await requireSession('OWNER')
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => null)
  const parsed = createShopSchema.safeParse(body)
  if (!parsed.success) return Errors.badRequest('Invalid shop data')

  const shop = await prisma.$transaction(async (tx) => {
    const created = await tx.shop.create({
      data: { orgId: guard.session.orgId, ...parsed.data },
    })
    await writeAudit(tx, guard.session, {
      action: 'SHOP_CREATED',
      targetType: 'SHOP',
      targetId: created.id,
      ipAddress: clientIp(req.headers),
    })
    return created
  })

  return apiOk(shop, 201)
}
