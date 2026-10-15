import type { Role } from '@prisma/client'
import type { Session } from './session'

// Role ranking: SUPER_ADMIN (platform) > OWNER (org) > MANAGER > STAFF (shop).
const RANK: Record<Role, number> = {
  SUPER_ADMIN: 4,
  OWNER: 3,
  MANAGER: 2,
  STAFF: 1,
}

export function hasRole(session: Session, minimum: Role): boolean {
  return RANK[session.role] >= RANK[minimum]
}

export function isSuperAdmin(session: Session): boolean {
  return session.role === 'SUPER_ADMIN'
}

// SUPER_ADMIN sees the whole platform; OWNER the whole org; others their shop.
export function canAccessShop(session: Session, shopId: string): boolean {
  if (session.role === 'SUPER_ADMIN') return true
  if (session.role === 'OWNER') return true
  return session.shopId === shopId
}

// Prisma `where` scoping for device queries by session reach.
export function deviceScopeWhere(session: Session) {
  if (session.role === 'SUPER_ADMIN') return {}
  if (session.role === 'OWNER') return { shop: { orgId: session.orgId } }
  return { shopId: session.shopId }
}

export function shopScopeWhere(session: Session) {
  if (session.role === 'SUPER_ADMIN') return {}
  if (session.role === 'OWNER') return { orgId: session.orgId }
  return { id: session.shopId }
}
