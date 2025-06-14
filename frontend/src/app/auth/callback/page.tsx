'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/providers/auth'

export default function AuthCallbackPage() {
  const router = useRouter()
  const { login } = useAuth()

  useEffect(() => {
    // This page should only be hit after successful GitHub auth
    // The actual token handling is done in the AuthProvider
    // We just need to show loading state and redirect
    router.push('/dashboard')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Authenticating...</h1>
        <p>Please wait while we verify your GitHub credentials.</p>
      </div>
    </div>
  )
}
