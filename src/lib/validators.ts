import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().min(3).max(64),
  password: z.string().min(6).max(128),
})

export const createShopSchema = z.object({
  name: z.string().min(2).max(120),
  address: z.string().max(240).optional(),
  city: z.string().max(80).optional(),
  state: z.string().max(80).optional(),
  phone: z.string().max(20).optional(),
})

export const createUserSchema = z.object({
  shopId: z.string().cuid(),
  username: z.string().min(3).max(64),
  email: z.string().email().optional(),
  password: z.string().min(6).max(128),
  role: z.enum(['OWNER', 'MANAGER', 'STAFF']),
})

export const lockSchema = z.object({
  message: z.string().max(300).optional(),
})

export const graceSchema = z.object({
  days: z.number().int().min(1).max(30),
})

export const emiPlanSchema = z.object({
  totalAmount: z.number().positive(),
  downPayment: z.number().min(0).default(0),
  emiAmount: z.number().positive(),
  totalInstallments: z.number().int().min(1).max(120),
  frequency: z.enum(['MONTHLY', 'WEEKLY']).default('MONTHLY'),
  startDate: z.string().datetime(),
  gracePeriodDays: z.number().int().min(0).max(30).default(7),
})

export const recordPaymentSchema = z.object({
  installmentNo: z.number().int().min(1),
  amount: z.number().positive(),
  paymentMode: z.enum(['CASH', 'UPI', 'BANK']).default('CASH'),
  receiptNumber: z.string().max(60).optional(),
})

export const deviceRegisterSchema = z.object({
  imei1: z.string().min(8).max(32),
  imei2: z.string().min(8).max(32).optional(),
  brand: z.string().max(60).optional(),
  model: z.string().max(80).optional(),
  androidVersion: z.string().max(20).optional(),
  appVersion: z.string().max(20).optional(),
  enrollmentKey: z.string().min(16).max(128),
})

export const claimSchema = z.object({
  imei1: z.string().min(8).max(32),
  enrollmentKey: z.string().min(16).max(128),
})

export const heartbeatSchema = z.object({
  imei1: z.string().min(8).max(32),
  batteryLevel: z.number().int().min(0).max(100).optional(),
  batteryHealth: z.string().max(20).optional(),
  isCharging: z.boolean().optional(),
  appVersion: z.string().max(20).optional(),
})

export const locationSchema = z.object({
  imei1: z.string().min(8).max(32),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
})
