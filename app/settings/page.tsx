'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '../../components/sidebar'
import { supabase } from '../../lib/supabase'
import { User, Shield, CheckCircle2, AlertCircle, Loader2, Camera } from 'lucide-react'
import Image from 'next/image'

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [activeTab, setActiveTab] = useState<'profile' | 'account'>('profile')

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      setProfile({ ...data, email: user.email })
      setLoading(false)
    }
    fetchProfile()
  }, [])

  // 🔴 NEW: IMAGE UPLOAD LOGIC 🔴
  const uploadAvatar = async (event: any) => {
    try {
      setUploading(true)
      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`
      const filePath = `${profile.id}/${fileName}`

      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // 3. Update Profile in Database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id)

      if (updateError) throw updateError

      setProfile({ ...profile, avatar_url: publicUrl })
      setMessage({ type: 'success', text: 'Photo updated!' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          bio: profile.bio,
          jnv_branch: profile.jnv_branch,
          house: profile.house,
          is_private: profile.is_private,
          is_mentor: profile.is_mentor,
        })
        .eq('id', profile.id)

      if (error) throw error
      setMessage({ type: 'success', text: 'Settings updated!' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex h-screen items-center justify-center bg-zinc-50"><Loader2 className="animate-spin text-blue-600" size={32} /></div>

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 bg-zinc-50 overflow-auto pb-20">
        <header className="border-b border-zinc-200 bg-white px-8 py-6 sticky top-0 z-10">
          <h2 className="text-2xl font-bold text-zinc-900">Account Settings</h2>
        </header>

        <div className="max-w-4xl px-8 py-8">
          {message.text && (
            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          )}

          <div className="flex gap-8">
            <div className="w-64 space-y-1">
              <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-600 hover:bg-zinc-200'}`}><User size={18} /> Profile Info</button>
              <button onClick={() => setActiveTab('account')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'account' ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-600 hover:bg-zinc-200'}`}><Shield size={18} /> Privacy & Mentorship</button>
            </div>

            <div className="flex-1 bg-white rounded-2xl border border-zinc-200 p-8 shadow-sm">
              {activeTab === 'profile' && (
                <div className="space-y-8">
                  {/* 📸 PHOTO UPLOAD SECTION 📸 */}
                  <div className="flex items-center gap-6 pb-6 border-b border-zinc-100">
                    <div className="relative h-24 w-24 rounded-2xl overflow-hidden bg-zinc-100 border-2 border-zinc-200 group">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-zinc-400 text-3xl font-bold">
                          {profile?.full_name?.charAt(0)}
                        </div>
                      )}
                      {uploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="animate-spin text-white" size={20} /></div>}
                    </div>
                    <div>
                      <p className="font-bold text-zinc-900">Profile Photo</p>
                      <label className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-sm font-semibold rounded-lg cursor-pointer transition-all">
                        <Camera size={16} />
                        {uploading ? 'Uploading...' : 'Change Photo'}
                        <input type="file" className="hidden" accept="image/*" onChange={uploadAvatar} disabled={uploading} />
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700">Full Name</label>
                      <input type="text" value={profile?.full_name || ''} onChange={(e) => setProfile({...profile, full_name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700">JNV Branch</label>
                      <input type="text" value={profile?.jnv_branch || ''} onChange={(e) => setProfile({...profile, jnv_branch: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">Bio</label>
                    <textarea rows={3} value={profile?.bio || ''} onChange={(e) => setProfile({...profile, bio: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                  </div>
                </div>
              )}

              {activeTab === 'account' && (
                 <div className="space-y-6">
                    <h3 className="text-lg font-bold text-zinc-900">Privacy & Networking</h3>
                    <label className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 hover:bg-zinc-50 transition-all cursor-pointer">
                      <div>
                        <p className="font-semibold text-zinc-900">Private Profile</p>
                        <p className="text-xs text-zinc-500">Only verified alumni can see your full details</p>
                      </div>
                      <input type="checkbox" checked={profile?.is_private || false} onChange={(e) => setProfile({...profile, is_private: e.target.checked})} className="w-5 h-5 accent-blue-600 cursor-pointer" />
                    </label>
                    <label className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 hover:bg-zinc-50 transition-all cursor-pointer">
                      <div>
                        <p className="font-semibold text-zinc-900">Open to Mentorship</p>
                        <p className="text-xs text-zinc-500">Allow juniors to reach out to you for guidance</p>
                      </div>
                      <input type="checkbox" checked={profile?.is_mentor || false} onChange={(e) => setProfile({...profile, is_mentor: e.target.checked})} className="w-5 h-5 accent-blue-600 cursor-pointer" />
                    </label>
                 </div>
              )}

              <button onClick={handleSave} disabled={saving} className="mt-10 w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-900/10 transition-all flex items-center justify-center gap-2">
                {saving ? <Loader2 className="animate-spin" size={20} /> : 'Save All Changes'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}