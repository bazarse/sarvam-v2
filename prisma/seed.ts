import { PrismaClient } from '@prisma/client'

import { hashPassword } from '../src/lib/auth'
import { buildSchedule } from '../src/lib/emi'

const prisma = new PrismaClient()

async function main() {
  const org = await prisma.organization.create({
    data: { name: 'Devi Mobile Network', slug: 'devi-mobile', plan: 'PRO' },
  })

  const shops = await Promise.all([
    prisma.shop.create({
      data: { orgId: org.id, name: 'Devi Mobile Main Branch', city: 'Indore', state: 'MP', phone: '9876543210' },
    }),
    prisma.shop.create({
      data: { orgId: org.id, name: 'Devi Mobile City Center', city: 'Indore', state: 'MP', phone: '9876500000' },
    }),
  ])

  const password = await hashPassword('admin123')
  for (let i = 0; i < shops.length; i++) {
    await prisma.user.create({
      data: {
        orgId: org.id,
        shopId: shops[i].id,
        username: `owner${i + 1}`,
        email: `owner${i + 1}@devimobile.test`,
        passwordHash: password,
        role: 'OWNER',
      },
    })
  }

  for (const shop of shops) {
    for (let d = 1; d <= 5; d++) {
      const device = await prisma.device.create({
        data: {
          shopId: shop.id,
          imei1: `${shop.id.slice(0, 4)}${Date.now()}${d}`.slice(0, 20),
          brand: 'Oppo',
          model: 'F33 5G',
          androidVersion: '16',
          appVersion: '1.0.0',
          customerName: `Customer ${d}`,
          customerPhone: `98765${String(10000 + d).slice(0, 5)}`,
          lastOnlineAt: new Date(),
          batteryLevel: 60 + d * 5,
        },
      })
      if (d <= 3) await seedPlan(device.id)
    }
  }

  console.log('Seed complete. Login: owner1 / admin123')
}

async function seedPlan(deviceId: string) {
  const plan = await prisma.emiPlan.create({
    data: {
      deviceId,
      totalAmount: 18000,
      downPayment: 3000,
      emiAmount: 1500,
      totalInstallments: 10,
      frequency: 'MONTHLY',
      startDate: new Date(),
    },
  })
  const schedule = buildSchedule({
    emiAmount: 1500,
    totalInstallments: 10,
    frequency: 'MONTHLY',
    startDate: new Date(),
  })
  await prisma.emiPayment.createMany({
    data: schedule.map((s) => ({
      planId: plan.id,
      deviceId,
      installmentNo: s.installmentNo,
      amount: s.amount,
      dueDate: s.dueDate,
    })),
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
