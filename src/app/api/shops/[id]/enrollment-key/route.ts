import type { NextRequest } from 'next/server'
import { createHash, randomBytes } from 'node:crypto'

import { prisma } from '@/lib/db'
import { requireSession } from '@/lib/api-guard'
import { canAccessShop } from '@/lib/authz'
import { writeAudit } from '@/lib/audit'
import { Errors, apiOk } from '@/lib/errors'
import { clientIp } from '@/lib/utils'

type Params = { params: Promise<{ id: string }> }

// Generate (or rotate) a shop enrollment key. The raw key is returned once and
// only its SHA-256 hash is stored. Phones present this key to claim a device
// into the shop. OWNER (own shop) or SUPER_ADMIN only.
export async function POST(req: NextRequest, { params }: Params) {
  const guard = await requireSession('OWNER')
  if (!guard.ok) return guard.response
  const { id } = await params

  const shop = await prisma.shop.findUnique({ where: { id } })
  if (!shop) return Errors.notFound('Shop')
  if (!canAccessShop(guard.session, shop.id)) return Errors.forbidden()

  const rawKey = randomBytes(24).toString('base64url')
  const keyHash = createHash('sha256').update(rawKey).digest('hex')

  await prisma.$transaction(async (tx) => {
    await tx.shop.update({ where: { id }, data: { enrollmentKeyHash: keyHash } })
    await writeAudit(tx, guard.session, {
      action: 'ENROLLMENT_KEY_ROTATED',
      targetType: 'SHOP',
      targetId: id,
      ipAddress: clientIp(req.headers),
    })
  })

  return apiOk({ enrollmentKey: rawKey })
}
