import { clearSessionCookie } from '@/lib/session'
import { apiOk } from '@/lib/errors'

export async function POST() {
  await clearSessionCookie()
  return apiOk({ loggedOut: true })
}
