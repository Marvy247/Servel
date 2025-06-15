'use client'
import LoginButton from '@/components/auth/LoginButton'

export default function WelcomePage() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 space-y-6">
        <h1 className="text-3xl font-bold text-center text-gray-900">
          Welcome to Servel
        </h1>
        <p className="text-gray-600 text-center">
          Sign in with GitHub to access your dashboard
        </p>
        <div className="flex justify-center">
          <LoginButton className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors" />
        </div>
      </div>
    </div>
  )
}
