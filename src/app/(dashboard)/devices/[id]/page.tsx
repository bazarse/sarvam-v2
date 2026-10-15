'use client'

import { use, useCallback, useEffect, useState } from 'react'

import { apiFetch } from '@/lib/api-client'
import { InfoGrid } from '@/components/info-grid'
import { DeviceActions } from '@/components/device-actions'
import { EmiTimeline, type Payment } from '@/components/emi-timeline'
import { EmiManager } from '@/components/emi-manager'
import { CustomerForm } from '@/components/customer-form'
import { StatusBadge } from '@/components/status-badge'

interface DeviceDetail {
  id: string
  imei1: string
  imei2: string | null
  brand: string | null
  model: string | null
  androidVersion: string | null
  appVersion: string | null
  customerName: string | null
  customerPhone: string | null
  customerAddress: string | null
  isLocked: boolean
  status: string
  batteryLevel: number | null
  batteryHealth: string | null
  isCharging: boolean
  lastLatitude: number | null
  lastLongitude: number | null
  lastOnlineAt: string | null
  shop: { name: string; phone: string | null }
  payments: Payment[]
}

export default function DeviceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [device, setDevice] = useState<DeviceDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    apiFetch<DeviceDetail>(`/api/devices/${id}`)
      .then(setDevice)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (!device) return <p className="text-sm text-slate-500">Loading...</p>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {device.brand} {device.model}
          </h1>
          <p className="text-sm text-slate-500">{device.imei1}</p>
        </div>
        <StatusBadge status={device.status} />
      </div>

      <DeviceActions deviceId={device.id} isLocked={device.isLocked} onChange={load} />

      <div className="grid gap-4 lg:grid-cols-2">
        <InfoGrid
          title="Device"
          items={[
            { label: 'IMEI 1', value: device.imei1 },
            { label: 'IMEI 2', value: device.imei2 },
            { label: 'Android', value: device.androidVersion },
            { label: 'App Version', value: device.appVersion },
            { label: 'Shop', value: device.shop.name },
            {
              label: 'Last Online',
              value: device.lastOnlineAt
                ? new Date(device.lastOnlineAt).toLocaleString('en-IN')
                : 'Never',
            },
          ]}
        />
        <InfoGrid
          title="Customer"
          items={[
            { label: 'Name', value: device.customerName },
            { label: 'Phone', value: device.customerPhone },
            { label: 'Address', value: device.customerAddress },
          ]}
        />
        <InfoGrid
          title="Battery"
          items={[
            { label: 'Level', value: device.batteryLevel != null ? `${device.batteryLevel}%` : null },
            { label: 'Health', value: device.batteryHealth },
            { label: 'Charging', value: device.isCharging ? 'Yes' : 'No' },
          ]}
        />
        <InfoGrid
          title="Location"
          items={[
            { label: 'Latitude', value: device.lastLatitude },
            { label: 'Longitude', value: device.lastLongitude },
          ]}
        />
      </div>

      <CustomerForm
        deviceId={device.id}
        initial={{
          customerName: device.customerName,
          customerPhone: device.customerPhone,
          customerAddress: device.customerAddress,
        }}
        onChange={load}
      />
      <EmiManager
        deviceId={device.id}
        hasPlan={device.payments.length > 0}
        payments={device.payments}
        onChange={load}
      />
      <EmiTimeline payments={device.payments} />
    </div>
  )
}
