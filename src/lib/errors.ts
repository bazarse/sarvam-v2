import { NextResponse } from 'next/server'

// Standard JSON error envelope used by every API route.
export function apiError(status: number, message: string, code?: string) {
  return NextResponse.json(
    { success: false, error: { message, code: code ?? null } },
    { status }
  )
}

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export const Errors = {
  unauthorized: () => apiError(401, 'Authentication required', 'UNAUTHORIZED'),
  forbidden: () => apiError(403, 'Not permitted for your role', 'FORBIDDEN'),
  notFound: (what = 'Resource') => apiError(404, `${what} not found`, 'NOT_FOUND'),
  badRequest: (message: string) => apiError(400, message, 'BAD_REQUEST'),
  conflict: (message: string) => apiError(409, message, 'CONFLICT'),
  server: () => apiError(500, 'Internal server error', 'SERVER_ERROR'),
}
