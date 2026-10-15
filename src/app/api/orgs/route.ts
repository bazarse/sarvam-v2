import type { NextRequest } from 'next/server'

import { prisma } from '@/lib/db'
import { requireSession } from '@/lib/api-guard'
import { createOrgSchema } from '@/lib/validators'
import { Errors, apiOk } from '@/lib/errors'

// Platform-level organizations. SUPER_ADMIN only.
export async function GET() {
  const guard = await requireSession('SUPER_ADMIN')
  if (!guard.ok) return guard.response

  const items = await prisma.organization.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { shops: true, users: true } } },
  })
  return apiOk({ items })
}

export async function POST(req: NextRequest) {
  const guard = await requireSession('SUPER_ADMIN')
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => null)
  const parsed = createOrgSchema.safeParse(body)
  if (!parsed.success) return Errors.badRequest('Invalid organization data')

  const existing = await prisma.organization.findUnique({
    where: { slug: parsed.data.slug },
  })
  if (existing) return Errors.conflict('Slug already in use')

  const org = await prisma.organization.create({ data: parsed.data })
  return apiOk(org, 201)
}
