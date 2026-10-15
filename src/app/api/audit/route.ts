import type { NextRequest } from 'next/server'
import type { Prisma } from '@prisma/client'

import { prisma } from '@/lib/db'
import { requireSession } from '@/lib/api-guard'
import { apiOk } from '@/lib/errors'
import { parsePagination } from '@/lib/utils'

// Read-only audit log viewer. OWNER sees the whole org, others their shop.
export async function GET(req: NextRequest) {
  const guard = await requireSession('MANAGER')
  if (!guard.ok) return guard.response

  const { skip, take, page, pageSize } = parsePagination(req.nextUrl.searchParams)

  const where: Prisma.AuditLogWhereInput =
    guard.session.role === 'OWNER'
      ? { orgId: guard.session.orgId }
      : { shopId: guard.session.shopId }

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.auditLog.count({ where }),
  ])

  return apiOk({ items, total, page, pageSize })
}
