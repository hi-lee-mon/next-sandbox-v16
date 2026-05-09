import 'server-only'
import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { cache } from 'react'

export const verifySession = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  return session
})
