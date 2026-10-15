import { prisma } from './db'
import { writeAudit } from './audit'
import { DEVICE_COMMANDS, type DeviceCommand } from './constants'
import type { Session } from './session'
import type { DeviceStatus } from '@prisma/client'

interface CommandResult {
  isLocked?: boolean
  lockMessage?: string | null
  isSirenActive?: boolean
  status?: DeviceStatus
  pendingCommand: DeviceCommand
  pendingCommandPayload?: string | null
}

// Apply a control command to a device and record it in the audit log.
// The phone picks up `pendingCommand` on its next heartbeat.
export async function applyDeviceCommand(
  session: Session,
  deviceId: string,
  command: DeviceCommand,
  opts: { message?: string; action: string; ipAddress?: string | null }
): Promise<void> {
  const data: CommandResult = { pendingCommand: command }

  if (command === DEVICE_COMMANDS.LOCK) {
    data.isLocked = true
    data.lockMessage = opts.message ?? 'Payment overdue. Contact your shop.'
    data.status = 'LOCKED'
  } else if (command === DEVICE_COMMANDS.UNLOCK) {
    data.isLocked = false
    data.lockMessage = null
    data.isSirenActive = false
    data.status = 'ACTIVE'
  } else if (command === DEVICE_COMMANDS.SIREN_ON) {
    data.isSirenActive = true
  } else if (command === DEVICE_COMMANDS.SIREN_OFF) {
    data.isSirenActive = false
  } else if (command === DEVICE_COMMANDS.WIPE) {
    data.status = 'WIPED'
    data.pendingCommandPayload = null
  }

  await prisma.$transaction(async (tx) => {
    await tx.device.update({ where: { id: deviceId }, data })
    await writeAudit(tx, session, {
      action: opts.action,
      targetType: 'DEVICE',
      targetId: deviceId,
      reason: opts.message ?? null,
      ipAddress: opts.ipAddress,
    })
  })
}
