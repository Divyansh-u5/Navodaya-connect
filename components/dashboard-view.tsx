'use client'

import { Sidebar } from './sidebar'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function DashboardView() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // 🔴 NEW: State to hold our live database counts
  const [stats, setStats] = useState({
    totalAlumni: 0,
    branchAlumni: 0
  })

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // 1. Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // 2. Fetch their profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) throw profileError
        setProfile({ ...profileData, email: user.email })

        // 3. 🔴 NEW: Count EVERYONE in the database
        const { count: totalCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })

        // 4. 🔴 NEW: Count people ONLY from their specific JNV Branch
        const { count: branchCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('jnv_branch', profileData.jnv_branch)

        // Update our stats state
        setStats({
          totalAlumni: totalCount || 0,
          branchAlumni: branchCount || 0
        })

      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-auto bg-zinc-50">
        <header className="border-b border-zinc-200 bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between px-8 py-6">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900">
                {loading ? 'Loading...' : `Welcome back, ${profile?.full_name?.split(' ')[0] || 'Alumni'} 👋`}
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-sm text-zinc-500">Your Navodaya Network</p>
                {!loading && profile?.jnv_branch && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
                    🏫 {profile.jnv_branch}
                    {profile.house && <span className="text-blue-400">• {profile.house} House</span>}
                  </span>
                )}
              </div>
            </div>
            
            <button className="relative rounded-full bg-zinc-100 p-2 hover:bg-zinc-200 transition-colors">
              <span className="text-xl">🔔</span>
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </header>

        <div className="px-8 py-8 space-y-8">
          {/* 🔴 NEW: Live Stats UI 🔴 */}
          <section>
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">Network Pulse</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { 
                  label: 'Total Registered Alumni', 
                  value: loading ? '...' : stats.totalAlumni, 
                  icon: '🌍',
                  color: 'text-blue-600',
                  bg: 'bg-blue-50'
                },
                { 
                  label: `From ${profile?.jnv_branch || 'Your Branch'}`, 
                  value: loading ? '...' : stats.branchAlumni, 
                  icon: '🏫',
                  color: 'text-emerald-600',
                  bg: 'bg-emerald-50'
                },
                { label: 'Upcoming Events', value: '0', icon: '📅', color: 'text-orange-600', bg: 'bg-orange-50' },
                { label: 'Mentorship Requests', value: '0', icon: '🤝', color: 'text-purple-600', bg: 'bg-purple-50' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl bg-white p-6 border border-zinc-200 shadow-sm hover:shadow-md transition-all duration-200 group"
                >
                  <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                    {stat.icon}
                  </div>
                  <p className="text-3xl font-bold text-zinc-900 tracking-tight">{stat.value}</p>
                  <p className="text-sm font-medium text-zinc-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">Alumni Success Stories</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {[
                {
                  name: 'Rajesh Kumar',
                  title: 'Founder, TechStart India',
                  image: '🎓',
                  story: 'From JNV to building a successful tech startup.',
                },
                {
                  name: 'Priya Sharma',
                  title: 'IIM-A Graduate',
                  image: '🌟',
                  story: 'Leadership journey from school to top business school.',
                },
              ].map((story) => (
                <div
                  key={story.name}
                  className="rounded-xl bg-white border border-zinc-200 overflow-hidden shadow-sm hover:shadow-lg transition-all"
                >
                  <div className="h-40 bg-gradient-to-br from-blue-50 via-zinc-50 to-emerald-50 flex items-center justify-center text-5xl">
                    {story.image}
                  </div>
                  <div className="p-6">
                    <h4 className="font-bold text-zinc-900 text-lg">{story.name}</h4>
                    <p className="text-sm text-blue-600 font-medium">{story.title}</p>
                    <p className="mt-3 text-zinc-600 text-sm">{story.story}</p>
                    <button className="mt-4 text-blue-600 font-medium text-sm hover:underline">
                      Read Full Story →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}