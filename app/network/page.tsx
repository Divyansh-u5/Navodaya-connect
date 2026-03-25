'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Sidebar } from '../../components/sidebar'
import { supabase } from '../../lib/supabase'
import { Search, MapPin, GraduationCap, Shield, UserPlus, Clock, Check } from 'lucide-react'

export default function NetworkPage() {
  const [users, setUsers] = useState<any[]>([])
  const [connections, setConnections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) setCurrentUserId(user.id)

        // 1. Fetch Profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', user?.id) // Don't show yourself
          .order('full_name', { ascending: true })

        // 2. Fetch existing connections
        const { data: conns } = await supabase
          .from('connections')
          .select('*')
          .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)

        setUsers(profiles || [])
        setConnections(conns || [])
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleConnect = async (targetUserId: string, targetName: string) => {
    if (!currentUserId) return

    try {
      // 1. Attempt to insert the connection
      const { error: connError } = await supabase.from('connections').insert({
        sender_id: currentUserId,
        receiver_id: targetUserId,
        status: 'pending'
      })
      // 🔴 THE FIX: Handle the "Duplicate" error silently
      if (connError) {
        if (connError.code === '23505') {
          console.log("Connection already exists")
        } else {
          throw connError
        }
      }

      // 2. Only send the "Hi" message if it's the first time
      if (!connError) {
        await supabase.from('messages').insert({
          sender_id: currentUserId,
          receiver_id: targetUserId,
          content: `👋 Hi ${targetName.split(' ')[0]}! I'd like to connect with you.`
        })

        // 🔴 ADD THIS NEW BLOCK: Send the Notification 🔴
        await supabase.from('notifications').insert({
          user_id: targetUserId,
          actor_id: currentUserId,
          action_type: 'connection',
          message: 'sent you a connection request'
        })
      }

      // 3. Refresh local state so the button updates immediately
      const { data: updatedConns } = await supabase
        .from('connections')
        .select('*')
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)

      setConnections(updatedConns || [])
    } catch (error: any) {
      console.error("Connection error:", error.message)
    }
  }

  const getButtonState = (userId: string) => {
    const conn = connections.find(c => c.sender_id === userId || c.receiver_id === userId)
    if (!conn) return 'connect'
    if (conn.status === 'accepted') return 'connected'
    return 'pending'
  }

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase()
    return (
      (user.full_name?.toLowerCase() || '').includes(query) ||
      (user.jnv_branch?.toLowerCase() || '').includes(query) ||
      (user.house?.toLowerCase() || '').includes(query)
    )
  })

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-zinc-50">
        <header className="border-b border-zinc-200 bg-white sticky top-0 z-10 px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900">Alumni Directory</h2>
              <p className="text-sm text-zinc-500 mt-1">Connect to message other alumni</p>
            </div>
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search alumni..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-100 rounded-xl focus:bg-white border-transparent focus:border-blue-500 transition-all outline-none text-sm"
              />
            </div>
          </div>
        </header>

        <div className="px-8 py-8">
          {loading ? (
            <div className="flex justify-center py-20"><span className="animate-pulse text-zinc-500">Loading directory...</span></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredUsers.map((user) => {
                const state = getButtonState(user.id)
                return (
                  <div key={user.id} className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm hover:shadow-md transition-all flex flex-col h-full">
                    {/* 🔗 CLICKABLE AVATAR & NAME 🔗 */}
                    <div className="flex items-start justify-between mb-4">
                      <Link href={`/profile/${user.id}`} className="h-12 w-12 rounded-full overflow-hidden border-2 border-zinc-100 bg-blue-50 flex items-center justify-center hover:border-blue-500 transition-all cursor-pointer">
                        {user.avatar_url ? <img src={user.avatar_url} className="h-full w-full object-cover" /> : <span className="font-bold text-blue-600">{user.full_name?.charAt(0)}</span>}
                      </Link>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">{user.role || 'Alumni'}</span>
                    </div>

                    <div className="flex-1">
                      <Link href={`/profile/${user.id}`} className="font-bold text-zinc-900 truncate hover:text-blue-600 hover:underline transition-colors cursor-pointer block">
                        {user.full_name}
                      </Link>
                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center text-xs text-zinc-500 gap-2"><MapPin size={14} className="text-emerald-500" /> {user.jnv_branch}</div>
                        <div className="flex items-center text-xs text-zinc-500 gap-2"><GraduationCap size={14} className="text-blue-500" /> {user.house} House</div>
                      </div>
                    </div>

                    {/* 🔴 DYNAMIC CONNECT BUTTON 🔴 */}
                    {state === 'connect' && (
                      <button 
                        onClick={() => handleConnect(user.id, user.full_name)}
                        className="mt-6 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-2"
                      >
                        <UserPlus size={14} /> Connect
                      </button>
                    )}
                    {state === 'pending' && (
                      <button className="mt-6 w-full py-2.5 bg-zinc-100 text-zinc-500 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-default" disabled>
                        <Clock size={14} /> Request Sent
                      </button>
                    )}
                    {state === 'connected' && (
                      <button className="mt-6 w-full py-2.5 bg-emerald-50 text-emerald-600 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-default" disabled>
                        <Check size={14} /> Connected
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}