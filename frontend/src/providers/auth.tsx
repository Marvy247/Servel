'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'

interface AuthContextType {
  isAuthenticated: boolean
  githubToken: string | null
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [githubToken, setGithubToken] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check for existing token on initial load
    const token = Cookies.get('githubToken')
    
    // Handle OAuth callback from URL params
    const urlParams = new URLSearchParams(window.location.search)
    const oauthToken = urlParams.get('token')
    
    if (oauthToken) {
      login(oauthToken)
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (token) {
      setGithubToken(token)
    }
  }, [])

  const login = (token: string) => {
    setGithubToken(token)
    Cookies.set('githubToken', token, {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: 7 // days
    })
    // Redirect to dashboard after successful login
    router.push('/dashboard')
  }

  const logout = () => {
    setGithubToken(null)
    Cookies.remove('githubToken', { path: '/' })
    router.push('/')
  }

  const value = {
    isAuthenticated: !!githubToken,
    githubToken,
    login,
    logout
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
