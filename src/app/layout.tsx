import type { Metadata } from 'next'

import { APP_NAME } from '@/lib/constants'
import './globals.css'

export const metadata: Metadata = {
  title: APP_NAME,
  description: 'Multi-shop EMI device management platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
