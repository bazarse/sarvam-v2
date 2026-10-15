import { getSession, type Session } from './session'
import { Errors } from './errors'
import { hasRole } from './authz'
import type { Role } from '@prisma/client'

type Guarded =
  | { ok: true; session: Session }
  | { ok: false; response: ReturnType<typeof Errors.unauthorized> }

// Resolve the session for a dashboard API route, optionally enforcing a
// minimum role. Returns a ready-made error response when access is denied.
export async function requireSession(minimum?: Role): Promise<Guarded> {
  const session = await getSession()
  if (!session) return { ok: false, response: Errors.unauthorized() }
  if (minimum && !hasRole(session, minimum)) {
    return { ok: false, response: Errors.forbidden() }
  }
  return { ok: true, session }
}

// Validate a bearer secret for cron endpoints (no session).
export function requireCronSecret(headers: Headers): boolean {
  const auth = headers.get('authorization')
  const expected = process.env.CRON_SECRET
  if (!auth || !expected) return false
  return auth === `Bearer ${expected}`
}
