export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'Sarvam Device Manager'

export const SESSION_COOKIE = 'sdm_session'
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

export const DEVICE_TOKEN_HEADER = 'x-device-token'

// Pagination
export const DEFAULT_PAGE_SIZE = 50
export const MAX_PAGE_SIZE = 100

// Device commands delivered to the phone via the heartbeat response.
export const DEVICE_COMMANDS = {
  LOCK: 'LOCK',
  UNLOCK: 'UNLOCK',
  WIPE: 'WIPE',
  SIREN_ON: 'SIREN_ON',
  SIREN_OFF: 'SIREN_OFF',
} as const

export type DeviceCommand = (typeof DEVICE_COMMANDS)[keyof typeof DEVICE_COMMANDS]

// PBKDF2 parameters for password hashing.
export const PBKDF2_ITERATIONS = 210_000
export const PBKDF2_KEY_LENGTH = 32
export const PBKDF2_SALT_LENGTH = 16
