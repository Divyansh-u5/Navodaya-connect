'use client'
import  AuthUI  from '@/components/AuthUI' // (Change AuthUI to auth-view if that is your main login component!)

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-sm border border-zinc-200">
        <h1 className="text-2xl font-black text-center mb-6 text-zinc-900">Welcome to Navodaya Connect</h1>
        <AuthUI /> 
      </div>
    </div>
  )
}