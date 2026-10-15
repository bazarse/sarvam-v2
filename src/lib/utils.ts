import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from './constants'

// Tailwind class merge helper used by UI components.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Parse and clamp pagination params from a URL search string.
export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const rawSize = Number(searchParams.get('pageSize')) || DEFAULT_PAGE_SIZE
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, rawSize))
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize }
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

export function clientIp(headers: Headers): string | null {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return headers.get('x-real-ip')
}
