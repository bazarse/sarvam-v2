import type { Prisma, PrismaClient } from '@prisma/client'
import type { Session } from './session'

type TxClient = Prisma.TransactionClient | PrismaClient

export interface AuditInput {
  action: string
  targetType: 'DEVICE' | 'USER' | 'SHOP' | 'PAYMENT'
  targetId: string
  reason?: string | null
  metadata?: Record<string, unknown> | null
  ipAddress?: string | null
}

// Append an immutable audit row. Call inside the same transaction as the
// action it records so the two commit atomically.
export async function writeAudit(
  tx: TxClient,
  session: Session,
  input: AuditInput
): Promise<void> {
  await tx.auditLog.create({
    data: {
      orgId: session.orgId,
      shopId: session.shopId,
      actorId: session.userId,
      actorName: session.username,
      actorRole: session.role,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason ?? null,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      ipAddress: input.ipAddress ?? null,
    },
  })
}
