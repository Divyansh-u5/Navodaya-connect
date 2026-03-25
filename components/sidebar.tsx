'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Calendar, MessageSquare, Bell, Settings, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'

export function Sidebar() {
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUnread() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
      
      setUnreadCount(count || 0)
    }
    fetchUnread()
  }, [])

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('sidebar-notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${userId}` 
      }, () => {
        setUnreadCount(prev => prev + 1)
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, () => {
        setUnreadCount(0) 
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth'
  }

  const navItems = [
    { icon: Home, label: 'Dashboard', href: '/' },
    { icon: Users, label: 'Network', href: '/network' },
    { icon: Calendar, label: 'Events', href: '/events' },
    { icon: MessageSquare, label: 'Messages', href: '/messages' },
    { icon: Bell, label: 'Notifications', href: '/notifications', badge: unreadCount },
  ]

  return (
    <div className="w-64 bg-[#0a0a0a] border-r border-zinc-800 flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <div className="flex items-center gap-3 text-white mb-8">
          {/* 🔴 YOUR RESTORED LOGO 🔴 */}
          <img src="/jnv-logo.png.png" alt="Navodaya Logo" className="h-10 w-10 object-contain rounded-full bg-white/10 p-1" />
          <div>
            <h1 className="font-bold tracking-tight text-sm text-blue-500">Navodaya</h1>
            <p className="text-[10px] text-zinc-400 font-medium tracking-widest">CONNECT</p>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                  isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} className={isActive ? 'text-white' : 'text-zinc-500'} />
                  {item.label}
                </div>
                {(item.badge || 0) > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 space-y-1 border-t border-zinc-800/50">
        <Link href="/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100">
          <Settings size={18} className="text-zinc-500" />
          Settings
        </Link>
        <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium text-zinc-400 hover:bg-zinc-800/50 hover:text-red-400">
          <LogOut size={18} className="text-zinc-500" />
          Sign Out
        </button>
      </div>
    </div>
  )
}