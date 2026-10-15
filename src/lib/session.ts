import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'

import { SESSION_COOKIE, SESSION_TTL_SECONDS } from './constants'
import type { Role } from '@prisma/client'

export interface Session {
  userId: string
  orgId: string
  shopId: string
  role: Role
  username: string
}

function secret(): Uint8Array {
  const value = process.env.JWT_SECRET
  if (!value) throw new Error('JWT_SECRET is not set')
  return new TextEncoder().encode(value)
}

export async function createSessionToken(session: Session): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secret())
}

export async function readSessionToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secret())
    return {
      userId: String(payload.userId),
      orgId: String(payload.orgId),
      shopId: String(payload.shopId),
      role: payload.role as Role,
      username: String(payload.username),
    }
  } catch {
    return null
  }
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  return readSessionToken(token)
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}
