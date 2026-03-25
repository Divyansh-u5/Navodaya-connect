'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '../../components/sidebar'
import { supabase } from '../../lib/supabase'
import { Loader2, Calendar as CalendarIcon, MapPin, Users, Plus, X, Clock } from 'lucide-react'
import Link from 'next/link'

export default function EventsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form State
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [location, setLocation] = useState('')

  const fetchEvents = async (user: any) => {
    try {
      // 1. Fetch RAW events (only future events, ordered by soonest)
      const now = new Date().toISOString()
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', now)
        .order('event_date', { ascending: true })

      if (eventsError) throw eventsError

      let enrichedEvents = eventsData || []

      // 2. Fetch Creator Profiles and RSVPs securely
      if (enrichedEvents.length > 0) {
        const eventIds = enrichedEvents.map(e => e.id)
        const creatorIds = [...new Set(enrichedEvents.map(e => e.creator_id))]

        const [profilesRes, attendeesRes] = await Promise.all([
          supabase.from('profiles').select('id, full_name, avatar_url').in('id', creatorIds),
          supabase.from('event_attendees').select('*').in('event_id', eventIds)
        ])

        enrichedEvents = enrichedEvents.map(event => {
          const creator = profilesRes.data?.find(p => p.id === event.creator_id)
          const eventAttendees = attendeesRes.data?.filter(a => a.event_id === event.id) || []
          const isAttending = eventAttendees.some(a => a.user_id === user.id)

          return { 
            ...event, 
            creator, 
            attendeesCount: eventAttendees.length, 
            isAttending 
          }
        })
      }

      setEvents(enrichedEvents)
    } catch (error: any) {
      console.error("Events Fetch Error:", error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUser(user)
        fetchEvents(user)
      }
    }
    init()
  }, [])

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !eventDate || !location || !description) return
    setIsSubmitting(true)

    try {
      await supabase.from('events').insert({
        creator_id: currentUser.id,
        title,
        description,
        event_date: new Date(eventDate).toISOString(),
        location
      })

      // Reset form and close modal
      setTitle('')
      setDescription('')
      setEventDate('')
      setLocation('')
      setShowModal(false)
      
      // Refresh the list
      fetchEvents(currentUser)
    } catch (error: any) {
      alert("Error creating event: " + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleRSVP = async (eventId: string, isAttending: boolean) => {
    try {
      // Optimistic UI update (feels faster to the user)
      setEvents(events.map(ev => 
        ev.id === eventId 
          ? { ...ev, isAttending: !isAttending, attendeesCount: isAttending ? ev.attendeesCount - 1 : ev.attendeesCount + 1 } 
          : ev
      ))

      if (isAttending) {
        await supabase.from('event_attendees').delete().match({ event_id: eventId, user_id: currentUser.id })
      } else {
        await supabase.from('event_attendees').insert({ event_id: eventId, user_id: currentUser.id })
      }
      
      // Silently sync with server to ensure accuracy
      fetchEvents(currentUser)
    } catch (error) {
      console.error("RSVP Error:", error)
    }
  }

  if (loading) return <div className="flex h-screen items-center justify-center bg-zinc-50"><Loader2 className="animate-spin text-blue-600" /></div>

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-zinc-50 py-8 px-4 sm:px-8 relative">
        <div className="max-w-5xl mx-auto space-y-8">
          
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
            <div>
              <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Events Hub</h2>
              <p className="text-sm text-zinc-500 mt-1">Discover and organize alumni meetups, webinars, and more.</p>
            </div>
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-900/10 text-sm whitespace-nowrap"
            >
              <Plus size={18} />
              Host an Event
            </button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {events.length === 0 ? (
              <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-zinc-200">
                <CalendarIcon size={48} className="mx-auto text-zinc-300 mb-4" />
                <h3 className="text-lg font-bold text-zinc-900">No upcoming events</h3>
                <p className="text-zinc-500 mt-1 mb-6">Why not be the first to host one?</p>
                <button onClick={() => setShowModal(true)} className="text-blue-600 font-bold hover:underline">Create an Event</button>
              </div>
            ) : (
              events.map((event) => {
                const dateObj = new Date(event.event_date)
                const isPast = dateObj < new Date()
                
                return (
                  <div key={event.id} className={`bg-white rounded-2xl border ${isPast ? 'border-zinc-200 opacity-60' : 'border-zinc-200'} shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md`}>
                    
                    {/* Event Banner (Date Focus) */}
                    <div className="h-24 bg-gradient-to-br from-blue-600 to-indigo-700 p-4 flex items-start justify-between">
                      <div className="bg-white/20 backdrop-blur-md rounded-xl p-2 text-center text-white min-w-[60px] border border-white/10">
                        <span className="block text-xs font-bold uppercase tracking-wider opacity-90">{dateObj.toLocaleString('default', { month: 'short' })}</span>
                        <span className="block text-2xl font-black">{dateObj.getDate()}</span>
                      </div>
                      <span className="bg-black/20 backdrop-blur-md text-white text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border border-white/10">
                        {isPast ? 'Past' : 'Upcoming'}
                      </span>
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="text-xl font-bold text-zinc-900 mb-2 line-clamp-1" title={event.title}>{event.title}</h3>
                      <p className="text-sm text-zinc-600 line-clamp-2 mb-4 flex-1">{event.description}</p>
                      
                      <div className="space-y-2 mb-6 text-sm text-zinc-500 font-medium">
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-blue-500" />
                          <span>{dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-emerald-500" />
                          <span className="truncate">{event.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-amber-500" />
                          <span>{event.attendeesCount} attending</span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <span>Hosted by</span>
                          <Link href={`/profile/${event.creator?.id}`} className="font-bold text-zinc-900 hover:text-blue-600 hover:underline flex items-center gap-1.5">
                            <div className="h-5 w-5 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center text-[8px]">
                              {event.creator?.avatar_url ? <img src={event.creator.avatar_url} className="h-full w-full object-cover" alt="" /> : event.creator?.full_name?.charAt(0)}
                            </div>
                            {event.creator?.full_name?.split(' ')[0]}
                          </Link>
                        </div>
                        
                        {!isPast && (
                          <button 
                            onClick={() => toggleRSVP(event.id, event.isAttending)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                              event.isAttending 
                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200' 
                                : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
                            }`}
                          >
                            {event.isAttending ? 'Attending ✓' : 'RSVP'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </main>

      {/* 🟢 CREATE EVENT MODAL 🟢 */}
      {showModal && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-zinc-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <h3 className="text-lg font-bold text-zinc-900">Host a New Event</h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Event Title</label>
                <input 
                  required
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., Delhi NCR Alumni Meetup" 
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Date & Time</label>
                  <input 
                    required
                    type="datetime-local" 
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm text-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Location</label>
                  <input 
                    required
                    type="text" 
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="e.g., Connaught Place or Zoom Link" 
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Details</label>
                <textarea 
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What's the agenda? Who should come?" 
                  rows={4}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm resize-none"
                />
              </div>

              <div className="pt-4 mt-2">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-900/10 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CalendarIcon size={18} />}
                  Publish Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}