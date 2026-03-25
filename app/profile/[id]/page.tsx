'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Sidebar } from '../../../components/sidebar'
import { supabase } from '../../../lib/supabase'
import { Loader2, MapPin, GraduationCap, ArrowLeft, Heart, MessageCircle } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const profileId = params.id as string

  const [profile, setProfile] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profileId) return

    async function fetchProfileData() {
      try {
        // 1. Fetch the user's details
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profileId)
          .single()

        if (profileError) throw profileError
        setProfile(profileData)

        // 2. Fetch only THIS user's posts
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', profileId)
          .order('created_at', { ascending: false })

        if (postsError) throw postsError

        // 3. Get quick counts for likes and comments to make the feed look complete
        const postIds = postsData?.map(p => p.id) || []
        let enrichedPosts = postsData || []

        if (postIds.length > 0) {
          const [likesRes, commentsRes] = await Promise.all([
            supabase.from('likes').select('post_id').in('post_id', postIds),
            supabase.from('comments').select('post_id').in('post_id', postIds)
          ])

          enrichedPosts = postsData?.map(post => {
            const likesCount = likesRes.data?.filter(l => l.post_id === post.id).length || 0
            const commentsCount = commentsRes.data?.filter(c => c.post_id === post.id).length || 0
            return { ...post, likesCount, commentsCount }
          }) || []
        }

        setPosts(enrichedPosts)
      } catch (error: any) {
        console.error('Error fetching profile:', error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProfileData()
  }, [profileId])

  if (loading) return <div className="flex h-screen items-center justify-center bg-zinc-50"><Loader2 className="animate-spin text-blue-600" /></div>

  if (!profile) return (
    <div className="flex h-screen items-center justify-center bg-zinc-50 flex-col gap-4">
      <h2 className="text-2xl font-bold text-zinc-900">Profile Not Found</h2>
      <button onClick={() => router.back()} className="text-blue-600 hover:underline">Go Back</button>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-zinc-50 py-8 px-4 sm:px-8">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* Back Button */}
          <button onClick={() => router.back()} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors font-medium">
            <ArrowLeft size={20} /> Back
          </button>

          {/* 🌟 Profile Header Card 🌟 */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-400"></div>
            <div className="px-8 pb-8">
              <div className="relative flex justify-between items-end -mt-12 mb-4">
                <div className="h-24 w-24 rounded-full border-4 border-white bg-blue-50 flex items-center justify-center font-bold text-3xl text-blue-600 overflow-hidden shadow-sm">
                  {profile.avatar_url ? <img src={profile.avatar_url} className="h-full w-full object-cover" alt="" /> : profile.full_name?.charAt(0)}
                </div>
              </div>
              
              <div>
                <h1 className="text-3xl font-black text-zinc-900 tracking-tight">{profile.full_name}</h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-zinc-500 font-medium">
                  {profile.jnv_branch && <span className="flex items-center gap-1.5"><MapPin size={16} className="text-emerald-500"/> {profile.jnv_branch}</span>}
                  {profile.house && <span className="flex items-center gap-1.5"><GraduationCap size={16} className="text-blue-500"/> {profile.house} House</span>}
                </div>
              </div>

              {profile.bio && (
                <div className="mt-6 pt-6 border-t border-zinc-100">
                  <h3 className="text-sm font-bold text-zinc-900 mb-2 uppercase tracking-wider">About</h3>
                  <p className="text-zinc-700 whitespace-pre-wrap leading-relaxed">{profile.bio}</p>
                </div>
              )}
            </div>
          </div>

          {/* 📝 User's Post History */}
          <div>
            <h3 className="text-lg font-bold text-zinc-900 mb-4 px-1">Recent Activity</h3>
            <div className="space-y-6">
              {posts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-zinc-200">
                  <p className="text-zinc-500 font-medium">No posts yet.</p>
                </div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden p-6">
                    <p className="text-xs text-zinc-400 mb-3">{new Date(post.created_at).toLocaleDateString()}</p>
                    {post.content && <p className="text-zinc-800 whitespace-pre-wrap mb-4">{post.content}</p>}
                    
                    {post.media_url && (
                      <div className="w-full bg-zinc-100 rounded-xl max-h-[400px] overflow-hidden flex items-center justify-center mb-4 border border-zinc-100">
                        {post.media_type === 'video' ? (
                          <video src={post.media_url} controls className="w-full h-full object-contain" />
                        ) : (
                          <img src={post.media_url} className="w-full h-full object-cover" alt="" />
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-6 pt-4 border-t border-zinc-100 text-zinc-400 text-sm">
                      <span className="flex items-center gap-1.5"><Heart size={18} /> {post.likesCount}</span>
                      <span className="flex items-center gap-1.5"><MessageCircle size={18} /> {post.commentsCount}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}