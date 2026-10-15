import { prisma } from '@/lib/db'
import { requireSession } from '@/lib/api-guard'
import { deviceScopeWhere } from '@/lib/authz'
import { apiOk } from '@/lib/errors'

// Lightweight endpoint for the map: only devices that have coordinates,
// returning the minimum fields. Capped to keep payload and DB load small.
export async function GET() {
  const guard = await requireSession()
  if (!guard.ok) return guard.response

  const items = await prisma.device.findMany({
    where: { ...deviceScopeWhere(guard.session), lastLatitude: { not: null } },
    take: 500,
    orderBy: { lastLocationAt: 'desc' },
    select: {
      id: true,
      imei1: true,
      customerName: true,
      status: true,
      isLocked: true,
      lastLatitude: true,
      lastLongitude: true,
      lastLocationAt: true,
    },
  })
  return apiOk({ items })
}
