'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '../../components/sidebar'
import { supabase } from '../../lib/supabase'
import { Loader2, Bell, Heart, MessageCircle, UserPlus, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // 1. Fetch RAW notifications (No complex joins)
        const { data: notifsData, error: notifsError } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (notifsError) throw notifsError

        let enrichedNotifs = notifsData || []

        // 2. Fetch the Profiles manually to avoid the Schema Error
        if (enrichedNotifs.length > 0) {
          const actorIds = [...new Set(enrichedNotifs.map(n => n.actor_id))]
          
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', actorIds)

          if (!profilesError && profilesData) {
            // Combine them together
            enrichedNotifs = enrichedNotifs.map(notif => ({
              ...notif,
              actor: profilesData.find(p => p.id === notif.actor_id)
            }))
          }

          // Mark all as read
          const unreadIds = enrichedNotifs.filter(n => !n.is_read).map(n => n.id)
          if (unreadIds.length > 0) {
            await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds)
          }
        }

        setNotifications(enrichedNotifs)
      } catch (error: any) {
        console.error("Notifications Error:", error.message)
      } finally {
        setLoading(false)
      }
    }
    fetchNotifications()
  }, [])

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="w-5 h-5 text-red-500 fill-red-500" />
      case 'comment': return <MessageCircle className="w-5 h-5 text-blue-500 fill-blue-500" />
      case 'connection': return <UserPlus className="w-5 h-5 text-emerald-500" />
      default: return <Bell className="w-5 h-5 text-zinc-500" />
    }
  }

  if (loading) return <div className="flex h-screen items-center justify-center bg-zinc-50"><Loader2 className="animate-spin text-blue-600" /></div>

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-zinc-50 py-8 px-4 sm:px-8">
        <div className="max-w-2xl mx-auto space-y-6">
          
          <header className="flex items-center gap-3 border-b border-zinc-200 pb-6">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <Bell size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Notifications</h2>
              <p className="text-sm text-zinc-500">Stay updated with your network.</p>
            </div>
          </header>

          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-zinc-200">
                <CheckCircle2 size={48} className="mx-auto text-emerald-400 mb-4" />
                <h3 className="text-lg font-bold text-zinc-900">You're all caught up!</h3>
                <p className="text-zinc-500 mt-1">No new notifications right now.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div key={notif.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${notif.is_read ? 'bg-white border-zinc-200' : 'bg-blue-50/50 border-blue-200 shadow-sm'}`}>
                  
                  <Link href={`/profile/${notif.actor_id}`} className="h-12 w-12 rounded-full border-2 border-white shadow-sm flex-shrink-0 bg-blue-100 flex items-center justify-center font-bold text-blue-600 overflow-hidden hover:ring-2 hover:ring-blue-500">
                    {notif.actor?.avatar_url ? <img src={notif.actor.avatar_url} className="h-full w-full object-cover" alt="" /> : notif.actor?.full_name?.charAt(0)}
                  </Link>

                  <div className="flex-1">
                    <p className="text-zinc-800 text-sm">
                      <Link href={`/profile/${notif.actor_id}`} className="font-bold hover:text-blue-600 transition-colors">
                        {notif.actor?.full_name}
                      </Link>{' '}
                      {notif.message}
                    </p>
                    <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
                      {getIcon(notif.action_type)}
                      {new Date(notif.created_at).toLocaleDateString()} at {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {!notif.is_read && <div className="h-3 w-3 rounded-full bg-blue-600"></div>}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}