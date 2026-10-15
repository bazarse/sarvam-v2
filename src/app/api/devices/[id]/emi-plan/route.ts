import type { NextRequest } from 'next/server'

import { prisma } from '@/lib/db'
import { requireSession } from '@/lib/api-guard'
import { canAccessShop } from '@/lib/authz'
import { writeAudit } from '@/lib/audit'
import { emiPlanSchema } from '@/lib/validators'
import { buildSchedule } from '@/lib/emi'
import { Errors, apiOk } from '@/lib/errors'
import { clientIp } from '@/lib/utils'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requireSession()
  if (!guard.ok) return guard.response
  const { id } = await params

  const device = await prisma.device.findUnique({
    where: { id },
    include: { emiPlan: { include: { payments: true } } },
  })
  if (!device) return Errors.notFound('Device')
  if (!canAccessShop(guard.session, device.shopId)) return Errors.forbidden()
  return apiOk(device.emiPlan)
}

export async function POST(req: NextRequest, { params }: Params) {
  const guard = await requireSession('MANAGER')
  if (!guard.ok) return guard.response
  const { id } = await params

  const device = await prisma.device.findUnique({
    where: { id },
    include: { emiPlan: true },
  })
  if (!device) return Errors.notFound('Device')
  if (!canAccessShop(guard.session, device.shopId)) return Errors.forbidden()
  if (device.emiPlan) return Errors.conflict('Device already has an EMI plan')

  const body = await req.json().catch(() => null)
  const parsed = emiPlanSchema.safeParse(body)
  if (!parsed.success) return Errors.badRequest('Invalid EMI plan data')

  const schedule = buildSchedule({
    emiAmount: parsed.data.emiAmount,
    totalInstallments: parsed.data.totalInstallments,
    frequency: parsed.data.frequency,
    startDate: new Date(parsed.data.startDate),
  })

  const plan = await prisma.$transaction(async (tx) => {
    const created = await tx.emiPlan.create({
      data: {
        deviceId: id,
        totalAmount: parsed.data.totalAmount,
        downPayment: parsed.data.downPayment,
        emiAmount: parsed.data.emiAmount,
        totalInstallments: parsed.data.totalInstallments,
        frequency: parsed.data.frequency,
        startDate: new Date(parsed.data.startDate),
        gracePeriodDays: parsed.data.gracePeriodDays,
      },
    })
    await tx.emiPayment.createMany({
      data: schedule.map((s) => ({
        planId: created.id,
        deviceId: id,
        installmentNo: s.installmentNo,
        amount: s.amount,
        dueDate: s.dueDate,
      })),
    })
    await writeAudit(tx, guard.session, {
      action: 'EMI_PLAN_CREATED',
      targetType: 'DEVICE',
      targetId: id,
      metadata: { totalAmount: parsed.data.totalAmount },
      ipAddress: clientIp(req.headers),
    })
    return created
  })
  return apiOk(plan, 201)
}
