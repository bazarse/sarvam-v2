import type { Role } from '@prisma/client'
import type { Session } from './session'

// Role ranking: OWNER can do everything a MANAGER can, etc.
const RANK: Record<Role, number> = {
  OWNER: 3,
  MANAGER: 2,
  STAFF: 1,
}

export function hasRole(session: Session, minimum: Role): boolean {
  return RANK[session.role] >= RANK[minimum]
}

// OWNER sees the whole org; MANAGER/STAFF are scoped to their own shop.
export function canAccessShop(session: Session, shopId: string): boolean {
  if (session.role === 'OWNER') return true
  return session.shopId === shopId
}

// Build a Prisma `where` fragment that scopes a device query to what the
// session is allowed to see. OWNER is scoped by org (via the shop relation),
// others by their single shop.
export function deviceScopeWhere(session: Session) {
  if (session.role === 'OWNER') {
    return { shop: { orgId: session.orgId } }
  }
  return { shopId: session.shopId }
}

export function shopScopeWhere(session: Session) {
  if (session.role === 'OWNER') return { orgId: session.orgId }
  return { id: session.shopId }
}
