'use client'

import { useEffect, useState, useRef } from 'react'
import { Sidebar } from '../../components/sidebar'
import { supabase } from '../../lib/supabase'
import { Send, User as UserIcon, Loader2, Check } from 'lucide-react'

export default function MessagesPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function initChat() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setCurrentUser(user)

        // 1. Fetch Accepted Connections
        const { data: connectedData, error: connError } = await supabase
          .from('connections')
          .select('sender_id, receiver_id')
          .eq('status', 'accepted')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)

        if (connError) throw connError

        const friendIds = connectedData?.map(conn => 
          conn.sender_id === user.id ? conn.receiver_id : conn.sender_id
        ) || []

        if (friendIds.length > 0) {
          const { data: friends, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, jnv_branch')
            .in('id', friendIds)
          if (profileError) throw profileError
          setUsers(friends || [])
        }

        // 2. Fetch Pending Requests
        const { data: pendingConns } = await supabase
          .from('connections')
          .select('id, sender_id')
          .eq('receiver_id', user.id)
          .eq('status', 'pending')

        let formattedPending: any[] = []

        if (pendingConns && pendingConns.length > 0) {
          const senderIds = pendingConns.map(c => c.sender_id)

          const { data: senderProfiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, jnv_branch')
            .in('id', senderIds)

          formattedPending = pendingConns.map(conn => ({
            id: conn.id,
            sender: senderProfiles?.find((p: any) => p.id === conn.sender_id)
          }))
        }

        setPendingRequests(formattedPending)
        setLoading(false)
      } catch (err: any) {
        console.error("Chat Init Error:", err.message)
        setLoading(false)
      }
    }
    initChat()
  }, [])

  // 🔴 THIS WAS THE MISSING PART 🔴
  const acceptConnection = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('connections')
        .update({ status: 'accepted' })
        .eq('id', requestId)
      
      if (error) throw error
      window.location.reload()
    } catch (err: any) {
      console.error("Accept Error:", err.message)
    }
  }

  useEffect(() => {
    if (!selectedUser || !currentUser) return

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true })
      setMessages(data || [])
    }
    fetchMessages()

    const channel = supabase
      .channel(`chat-${selectedUser.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new
        if ((msg.sender_id === currentUser.id && msg.receiver_id === selectedUser.id) ||
            (msg.sender_id === selectedUser.id && msg.receiver_id === currentUser.id)) {
          setMessages((prev) => [...prev, msg])
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selectedUser, currentUser])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedUser) return
    const content = newMessage
    setNewMessage('')
    await supabase.from('messages').insert({
      sender_id: currentUser.id,
      receiver_id: selectedUser.id,
      content
    })
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-zinc-50">
      <Loader2 className="animate-spin text-blue-600" />
    </div>
  )

  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <main className="flex flex-1 overflow-hidden">
        {/* Contacts Sidebar */}
        <div className="w-80 border-r border-zinc-200 flex flex-col bg-zinc-50">
          <div className="p-6 border-b border-zinc-200 bg-white">
            <h2 className="text-xl font-bold text-zinc-900">Messages</h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {pendingRequests.length > 0 && (
              <div className="p-4 bg-blue-50/50 border-b border-blue-100">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-3">Pending Requests</p>
                {pendingRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-blue-100 mb-2">
                    <span className="text-sm font-semibold text-zinc-900 truncate mr-2">{req.sender?.full_name}</span>
                    <button onClick={() => acceptConnection(req.id)} className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <Check size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {users.length === 0 && pendingRequests.length === 0 ? (
              <p className="p-6 text-xs text-zinc-500 text-center">No active chats. Start connecting!</p>
            ) : (
              users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-white transition-all border-b border-zinc-100 ${selectedUser?.id === user.id ? 'bg-white border-r-4 border-r-blue-600 shadow-sm' : ''}`}
                >
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold overflow-hidden">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} className="h-full w-full object-cover" alt="" />
                    ) : (
                      user.full_name?.charAt(0)
                    )}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm text-zinc-900">{user.full_name}</p>
                    <p className="text-xs text-zinc-500 truncate w-40">{user.jnv_branch}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedUser ? (
            <>
              <div className="p-4 border-b border-zinc-200 flex items-center gap-3 bg-white">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold overflow-hidden">
                  {selectedUser.avatar_url ? (
                    <img src={selectedUser.avatar_url} className="h-full w-full object-cover" alt="" />
                  ) : (
                    selectedUser.full_name?.charAt(0)
                  )}
                </div>
                <p className="font-bold text-zinc-900">{selectedUser.full_name}</p>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-50/30">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${msg.sender_id === currentUser.id ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-zinc-200 text-zinc-800 rounded-bl-none shadow-sm'}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={scrollRef} />
              </div>

              <form onSubmit={sendMessage} className="p-4 border-t border-zinc-200 bg-white flex gap-3">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 px-4 py-2 bg-zinc-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 border border-transparent focus:bg-white transition-all"
                />
                <button type="submit" className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all">
                  <Send size={20} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
              <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                <UserIcon size={32} />
              </div>
              <p className="text-sm font-medium">Select a connection to message</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}