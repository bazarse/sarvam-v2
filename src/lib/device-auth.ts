import { createHash, randomBytes } from 'node:crypto'

import { prisma } from './db'
import { DEVICE_TOKEN_HEADER } from './constants'
import { timingSafeEqual } from './auth'
import type { Device } from '@prisma/client'

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

export function generateDeviceToken(): string {
  return randomBytes(32).toString('base64url')
}

export type DeviceAuthResult =
  | { ok: true; device: Device }
  | { ok: false; status: 401 | 403 | 404; reason: string }

// Authenticate a phone request: match the X-Device-Token header against the
// stored hash for the device identified by imei.
export async function authenticateDevice(
  headers: Headers,
  imei: string
): Promise<DeviceAuthResult> {
  const token = headers.get(DEVICE_TOKEN_HEADER)
  if (!token) return { ok: false, status: 401, reason: 'Missing device token' }

  const device = await prisma.device.findUnique({ where: { imei1: imei } })
  if (!device) return { ok: false, status: 404, reason: 'Device not found' }
  if (!device.deviceTokenHash) {
    return { ok: false, status: 403, reason: 'Device not claimed' }
  }

  const presented = Buffer.from(hashToken(token))
  const stored = Buffer.from(device.deviceTokenHash)
  if (!timingSafeEqual(new Uint8Array(presented), new Uint8Array(stored))) {
    return { ok: false, status: 403, reason: 'Invalid device token' }
  }
  return { ok: true, device }
}
