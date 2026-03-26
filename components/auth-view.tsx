'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import Image from 'next/image'

export function AuthView() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const router = useRouter()

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMsg(null)

    try {
      if (isSignUp) {
        // Sign Up Logic
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error

        // 🚀 FORCE REDIRECT: Since email confirm is off, take them straight to the app!
        window.location.href = '/'
      } else {
        // Sign In Logic
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        
        // 🚀 FORCE REDIRECT: Take them to the dashboard
        window.location.href = '/'
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Google OAuth Handler
  const handleGoogleAuth = async () => {
    setLoading(true)
    setError(null)
    setSuccessMsg(null)
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' })
      if (error) throw error
      window.location.href = '/'
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-zinc-200 relative overflow-hidden">
        
        {/* Subtle Background Accent */}
        <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>

        {/* Logo and Branding */}
        <div className="mb-6 flex flex-col items-center">
          <Image
            src="/jnv-logo.png"
            alt="Jawahar Navodaya Vidyalaya"
            width={80}
            height={80}
            className="mb-4 h-20 w-20"
          />
          <h1 className="text-2xl font-bold text-zinc-900">Navodaya Connect</h1>
          <p className="mt-1 text-sm font-medium text-blue-600 uppercase tracking-widest">Alumni Network</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100 text-center">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-600 border border-emerald-100 text-center">
            {successMsg}
          </div>
        )}

        {/* Google Auth Button */}
        <button 
          onClick={handleGoogleAuth}
          className="w-full flex items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white py-3 font-medium text-zinc-700 transition-all hover:bg-zinc-50 active:scale-[0.98] shadow-sm mb-6"
          disabled={loading}
        >
          <svg className="w-5 h-5" viewBox="0 0 48 48">
            <g>
              <path fill="#4285F4" d="M24 9.5c3.51 0 6.24 1.52 7.68 2.8l5.7-5.5C33.65 3.96 29.33 2 24 2 14.82 2 6.99 7.98 3.69 16.01l6.99 5.47C12.72 15.21 17.86 9.5 24 9.5z"/>
              <path fill="#34A853" d="M46.28 24.56c0-1.77-.16-3.14-.5-4.51H24v9.24h12.39c-.25 1.54-1.62 3.86-4.66 5.41l7.22 5.57c4.2-3.89 6.33-9.61 6.33-15.71z"/>
              <path fill="#FBBC05" d="M10.68 28.36a14.5 14.5 0 0 1 0-8.72l-6.99-5.48C2.45 18.04 2 20.15 2 22.5s.45 4.46 1.69 6.34l6.99-5.48z"/>
              <path fill="#EA4335" d="M24 44c5.33 0 9.81-1.76 13.08-4.81l-7.22-5.57c-2.02 1.34-4.77 2.26-8.02 2.26-6.14 0-11.27-5.71-13.3-13.12l-6.99 5.48C6.99 40.02 14.82 46 24 46z"/>
              <path fill="none" d="M0 0h48v48H0z" />
            </g>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex-1 border-t border-zinc-200" />
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">or email</span>
          <div className="flex-1 border-t border-zinc-200" />
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Email Address</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
              className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-3 mt-2 font-semibold text-white transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 flex justify-center shadow-md shadow-blue-600/20"
          >
            {loading ? (
              <span className="animate-pulse">Processing...</span>
            ) : isSignUp ? (
              "Create Account"
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Form Mode Toggle */}
        <div className="mt-6 text-center text-sm text-zinc-600">
          {isSignUp ? 'Already part of the network?' : "New to Navodaya Connect?"}{' '}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError(null)
              setSuccessMsg(null)
            }}
            className="text-blue-600 font-semibold hover:underline"
            disabled={loading}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>

      </div>
    </div>
  )
}