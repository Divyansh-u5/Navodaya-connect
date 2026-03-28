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
    window.location.href = '/login'
  }

  const navItems = [
    { icon: Home, label: 'Dashboard', href: '/' },
    { icon: Users, label: 'Network', href: '/network' },
    { icon: Calendar, label: 'Events', href: '/events' },
    { icon: MessageSquare, label: 'Messages', href: '/messages' },
    { icon: Bell, label: 'Notifications', href: '/notifications', badge: unreadCount },
  ]

  return (
    <div className="bg-[#0a0a0a] border-zinc-800 z-50 flex
                    fixed bottom-0 left-0 w-full border-t flex-row justify-around px-2 py-3
                    md:sticky md:top-0 md:w-64 md:flex-col md:h-screen md:border-r md:border-t-0 md:justify-start md:p-0">
      
      {/* 💻 Desktop Header (Hidden on Mobile) */}
      <div className="hidden md:block p-6">
        <div className="flex items-center gap-3 text-white mb-8">
          <img src="/jnv-logo.png.png" alt="Navodaya Logo" className="h-10 w-10 object-contain rounded-full bg-white/10 p-1" />
          <div>
            <h1 className="font-bold tracking-tight text-sm text-blue-500">Navodaya</h1>
            <p className="text-[10px] text-zinc-400 font-medium tracking-widest">CONNECT</p>
          </div>
        </div>
      </div>

      {/* 🚀 Main Navigation */}
      <nav className="flex flex-row justify-around w-full md:flex-col md:space-y-1 md:px-6 md:w-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center justify-center md:justify-between p-3 md:px-4 md:py-3 rounded-xl transition-all font-medium ${
                isActive 
                  ? 'text-blue-500 md:bg-blue-600 md:text-white md:shadow-lg md:shadow-blue-900/20' 
                  : 'text-zinc-500 hover:text-zinc-100 md:hover:bg-zinc-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={22} className={isActive ? 'text-blue-500 md:text-white' : 'text-zinc-500'} />
                <span className="hidden md:block text-sm">{item.label}</span>
              </div>
              
              {/* Notification Badge */}
              {(item.badge || 0) > 0 && (
                <span className="absolute top-1 right-1 md:static md:top-auto md:right-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}

        {/* 📱 Mobile-Only Settings Button (So they aren't trapped on phone!) */}
        <Link 
          href="/settings" 
          className={`md:hidden relative flex items-center justify-center p-3 rounded-xl transition-all ${
            pathname === '/settings' ? 'text-blue-500' : 'text-zinc-500 hover:text-zinc-100'
          }`}
        >
          <Settings size={22} />
        </Link>
      </nav>

      {/* 💻 Desktop Footer (Hidden on Mobile) */}
      <div className="hidden md:block mt-auto p-6 space-y-1 border-t border-zinc-800/50">
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