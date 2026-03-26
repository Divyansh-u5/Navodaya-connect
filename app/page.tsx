'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Sidebar } from '../components/sidebar'
import { supabase } from '../lib/supabase'
import { Heart, MessageCircle, Image as ImageIcon, Send, Loader2, X } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const router = useRouter(); // <-- initialize the router

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [content, setContent] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [isPosting, setIsPosting] = useState(false)

  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')

  const fetchFeed = async (user: any) => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
      if (postsError) throw postsError

      const postIds = postsData?.map((p: any) => p.id) || []
      const authorIds = [...new Set(postsData?.map((p: any) => p.user_id) || [])]

      const [profilesRes, likesRes, commentsRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, avatar_url, jnv_branch').in('id', authorIds),
        supabase.from('likes').select('*').in('post_id', postIds),
        supabase.from('comments').select('*').in('post_id', postIds).order('created_at', { ascending: true })
      ])

      const commenterIds = [...new Set(commentsRes.data?.map((c: any) => c.user_id) || [])]
      const { data: commenterProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', commenterIds)

      const enrichedPosts = postsData?.map((post: any) => {
        const author = profilesRes.data?.find((p: any) => p.id === post.user_id)
        const postLikes = likesRes.data?.filter((l: any) => l.post_id === post.id) || []
        const hasLiked = postLikes.some((l: any) => l.user_id === user.id)
        
        const postComments = commentsRes.data?.filter((c: any) => c.post_id === post.id).map((comment: any) => ({
          ...comment,
          author: commenterProfiles?.find((p: any) => p.id === comment.user_id)
        })) || []

        return { ...post, author, likes: postLikes, hasLiked, comments: postComments }
      })

      setPosts(enrichedPosts || [])
    } catch (error: any) {
      console.error("Feed Error:", error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {

    const checkUser = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      // THE BOUNCER
      if (!session) {
        console.log("No session found. Redirecting to login...");
        router.push('/login'); // ⚠️ IMPORTANT: If your login page is named '/signin', change this!
        return; 
      }

      // If they ARE logged in, let them stay and set the data
      setCurrentUser(session.user);
      fetchFeed(session.user);
      setLoading(false);
    };

    checkUser();

  }, [router]);

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setMediaFile(file)
      setMediaPreview(URL.createObjectURL(file))
    }
  }

  const handleCreatePost = async () => {
    if (!content.trim() && !mediaFile) return
    setIsPosting(true)

    try {
      let media_url = null
      let media_type = null

      if (mediaFile) {
        const fileExt = mediaFile.name.split('.').pop()
        const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('post-media')
          .upload(fileName, mediaFile)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage.from('post-media').getPublicUrl(fileName)
        media_url = publicUrl
        media_type = mediaFile.type.startsWith('image/') ? 'image' : 'video'
      }

      await supabase.from('posts').insert({
        user_id: currentUser.id,
        content: content,
        media_url,
        media_type
      })

      setContent('')
      setMediaFile(null)
      setMediaPreview(null)
      fetchFeed(currentUser)

    } catch (error: any) {
      alert("Error creating post: " + error.message)
    } finally {
      setIsPosting(false)
    }
  }

  const toggleLike = async (postId: string, hasLiked: boolean, postAuthorId: string) => {
    try {
      if (hasLiked) {
        await supabase.from('likes').delete().match({ post_id: postId, user_id: currentUser.id })
      } else {
        await supabase.from('likes').insert({ post_id: postId, user_id: currentUser.id })
        
        // Send Notification
        if (currentUser.id !== postAuthorId) {
          await supabase.from('notifications').insert({
            user_id: postAuthorId,
            actor_id: currentUser.id,
            action_type: 'like',
            message: 'liked your post'
          })
        }
      }
      fetchFeed(currentUser)
    } catch (error) {
      console.error("Like error:", error)
    }
  }

  const submitComment = async (postId: string, postAuthorId: string) => {
    if (!commentText.trim()) return
    try {
      await supabase.from('comments').insert({
        post_id: postId,
        user_id: currentUser.id,
        content: commentText
      })
      
      // Send Notification
      if (currentUser.id !== postAuthorId) {
        await supabase.from('notifications').insert({
          user_id: postAuthorId,
          actor_id: currentUser.id,
          action_type: 'comment',
          message: 'commented on your post'
        })
      }

      setCommentText('')
      fetchFeed(currentUser)
    } catch (error) {
      console.error("Comment error:", error)
    }
  }

  if (loading) {
    return <div>Loading... (If you see this, Supabase is the bottleneck)</div>
  }


  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-zinc-50 py-8 px-4 sm:px-8">
        <div className="max-w-3xl mx-auto space-y-8">
          
          <header>
            <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Community Feed</h2>
            <p className="text-zinc-500 mt-1">See what your Navodaya network is up to.</p>
          </header>

          {/* Create Post */}
          <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm">
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center font-bold text-blue-600 overflow-hidden">
                {currentUser?.user_metadata?.avatar_url ? (
                  <img src={currentUser.user_metadata.avatar_url} className="h-full w-full object-cover" alt="" />
                ) : 'Me'}
              </div>
              <div className="flex-1 space-y-4">
                <textarea 
                  placeholder="Share an update, ask a question, or post a memory..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-transparent outline-none resize-none text-zinc-800 placeholder:text-zinc-400 min-h-[60px]"
                />
                
                {mediaPreview && (
                  <div className="relative rounded-xl overflow-hidden border border-zinc-200">
                    <img src={mediaPreview} className="w-full max-h-96 object-cover" alt="Preview" />
                    <button 
                      onClick={() => { setMediaFile(null); setMediaPreview(null) }}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                  <label className="flex items-center gap-2 px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded-xl cursor-pointer transition-colors text-sm font-medium">
                    <ImageIcon size={18} className="text-blue-500" />
                    Photo / Video
                    <input type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaSelect} />
                  </label>
                  <button 
                    onClick={handleCreatePost}
                    disabled={isPosting || (!content.trim() && !mediaFile)}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-md shadow-blue-900/10 flex items-center gap-2 text-sm"
                  >
                    {isPosting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Feed */}
          <div className="space-y-6">
            {posts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-zinc-200">
                <p className="text-zinc-500 font-medium">It's quiet here. Be the first to post something!</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                  
                  {/* Clickable Author Header */}
                  <div className="p-6 flex items-center gap-3">
                    <Link href={`/profile/${post.user_id}`} className="h-12 w-12 rounded-full bg-blue-50 border border-zinc-100 flex items-center justify-center font-bold text-blue-600 overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer">
                      {post.author?.avatar_url ? <img src={post.author.avatar_url} className="h-full w-full object-cover" alt="" /> : post.author?.full_name?.charAt(0)}
                    </Link>
                    <div>
                      <Link href={`/profile/${post.user_id}`} className="font-bold text-zinc-900 hover:text-blue-600 hover:underline transition-colors cursor-pointer">
                        {post.author?.full_name || 'Alumni'}
                      </Link>
                      <p className="text-xs text-zinc-500 flex items-center gap-1">
                        {post.author?.jnv_branch || 'Navodaya'} • {new Date(post.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {post.content && <p className="px-6 pb-4 text-zinc-800 whitespace-pre-wrap">{post.content}</p>}
                  
                  {post.media_url && (
                    <div className="w-full bg-zinc-100 border-y border-zinc-100 max-h-[500px] overflow-hidden flex items-center justify-center">
                      {post.media_type === 'video' ? (
                        <video src={post.media_url} controls className="w-full h-full object-contain" />
                      ) : (
                        <img src={post.media_url} className="w-full h-full object-cover" alt="Post media" />
                      )}
                    </div>
                  )}

                  <div className="px-6 py-3 border-t border-zinc-100 flex items-center gap-6">
                    <button 
                      onClick={() => toggleLike(post.id, post.hasLiked, post.user_id)}
                      className={`flex items-center gap-2 text-sm font-medium transition-colors ${post.hasLiked ? 'text-red-500' : 'text-zinc-500 hover:text-zinc-800'}`}
                    >
                      <Heart size={20} className={post.hasLiked ? 'fill-red-500' : ''} />
                      {post.likes.length}
                    </button>
                    <button 
                      onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                      className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-800 transition-colors"
                    >
                      <MessageCircle size={20} />
                      {post.comments.length}
                    </button>
                  </div>

                  {activeCommentPostId === post.id && (
                    <div className="bg-zinc-50 p-6 border-t border-zinc-100 space-y-4">
                      {post.comments.map((comment: any) => (
                        <div key={comment.id} className="flex gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center text-xs font-bold text-blue-600 overflow-hidden">
                            {comment.author?.avatar_url ? <img src={comment.author.avatar_url} className="h-full w-full object-cover" alt="" /> : comment.author?.full_name?.charAt(0)}
                          </div>
                          <div className="bg-white px-4 py-2.5 rounded-2xl rounded-tl-none border border-zinc-200 text-sm">
                            <span className="font-bold text-zinc-900 block mb-0.5">{comment.author?.full_name}</span>
                            <span className="text-zinc-700">{comment.content}</span>
                          </div>
                        </div>
                      ))}
                      
                      <div className="flex gap-3 mt-4">
                        <input 
                          type="text"
                          placeholder="Write a comment..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && submitComment(post.id, post.user_id)}
                          className="flex-1 bg-white border border-zinc-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                        <button 
                          onClick={() => submitComment(post.id, post.user_id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}