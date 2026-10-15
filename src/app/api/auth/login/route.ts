import type { NextRequest } from 'next/server'

import { prisma } from '@/lib/db'
import { verifyPassword } from '@/lib/auth'
import { createSessionToken, setSessionCookie } from '@/lib/session'
import { loginSchema } from '@/lib/validators'
import { Errors, apiOk } from '@/lib/errors'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) return Errors.badRequest('Invalid credentials format')

    const { username, password } = parsed.data
    const user = await prisma.user.findUnique({ where: { username } })

    // Always run a hash comparison to reduce username enumeration timing leaks.
    const stored = user?.passwordHash ?? 'pbkdf2$sha256$1$x$x'
    const valid = await verifyPassword(password, stored)

    if (!user || !user.isActive || !valid) {
      return Errors.badRequest('Invalid username or password')
    }

    const token = await createSessionToken({
      userId: user.id,
      orgId: user.orgId,
      shopId: user.shopId,
      role: user.role,
      username: user.username,
    })
    await setSessionCookie(token)
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    return apiOk({
      id: user.id,
      username: user.username,
      role: user.role,
      shopId: user.shopId,
    })
  } catch {
    return Errors.server()
  }
}
