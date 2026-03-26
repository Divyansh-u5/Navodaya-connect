'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'; 

// Add this interface
interface OnboardingWizardProps {
  onComplete: () => void;
}

type Role = 'student' | 'alumni' | 'teacher' | 'admin'

// Accept onComplete via props!
export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  
  // 🔴 ADDED: fullName to the state
  const [formData, setFormData] = useState({
    fullName: '',
    branch: '',
    dob: '',
    house: '',
    passoutYear: '',
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (selectedRole) setStep(2)
  }

  // Call onComplete on successful finish!
  const handleSubmit = async () => {
    // 🔴 ADDED: Require fullName before submitting
    if (formData.fullName && formData.branch && formData.dob && formData.house) {
      setIsSubmitting(true);
      setErrorMsg('');
      
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw new Error("Authentication error. Please log in again.");

        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            role: selectedRole,
            full_name: formData.fullName, // 🔴 ADDED: Saving the name to Supabase
            jnv_branch: formData.branch,
            dob: formData.dob,
            house: formData.house,
            batch_year: formData.passoutYear || null,
            onboarding_completed: true
          });

        if (upsertError) throw upsertError;
        onComplete(); // 🚀 Trigger the onComplete function prop here!

      } catch (err: any) {
        console.error("Database Error:", err);
        setErrorMsg(err.message || "Failed to save profile.");
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted px-4 py-12">
      <div className="w-full max-w-2xl rounded-2xl bg-card p-8 shadow-xl border border-border bg-white relative">
        
        <button 
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.reload();
          }}
          className="absolute top-4 right-4 text-sm font-medium text-zinc-400 hover:text-red-500 transition-colors"
        >
          Sign Out
        </button>

        <div className="mb-8 mt-4">
          <h1 className="text-3xl font-bold text-zinc-900">Complete Your Profile</h1>
          <p className="mt-2 text-zinc-500">
            Step {step} of 2 - Let's get to know you better
          </p>
          <div className="mt-4 h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: step === 1 ? '50%' : '100%' }}
            />
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <p className="text-lg font-medium text-zinc-900">Select Your Role</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(['student', 'alumni', 'teacher', 'admin'] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`rounded-xl border-2 p-6 text-center transition-all ${
                    selectedRole === role
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-zinc-200 hover:border-blue-200 hover:bg-zinc-50'
                  }`}
                >
                  <div className="text-3xl mb-3">
                    {role === 'student' && '👨‍🎓'}
                    {role === 'alumni' && '🎓'}
                    {role === 'teacher' && '👨‍🏫'}
                    {role === 'admin' && '⚙️'}
                  </div>
                  <p className="font-semibold text-zinc-900 capitalize">{role}</p>
                </button>
              ))}
            </div>

            <button
              onClick={handleNext}
              disabled={!selectedRole}
              className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-all mt-6"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <p className="text-lg font-medium text-zinc-900">
              {selectedRole === 'alumni' ? 'Alumni Profile Details' : 'Profile Details'}
            </p>

            {/* 🔴 NEW FIELD: Full Name */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                placeholder="e.g., Jane Doe"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                JNV Branch
              </label>
              <input
                type="text"
                placeholder="e.g., JNV Pilibhit"
                value={formData.branch}
                onChange={(e) => handleInputChange('branch', e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => handleInputChange('dob', e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                JNV House
              </label>
              <select
                value={formData.house}
                onChange={(e) => handleInputChange('house', e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">Select a house...</option>
                <option value="Aravali">Aravali</option>
                <option value="Nilgiri">Nilgiri</option>
                <option value="Shivalik">Shivalik</option>
                <option value="Udaygiri">Udaygiri</option>
              </select>
            </div>

            {selectedRole === 'alumni' && (
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Passout Year
                </label>
                <input
                  type="number"
                  placeholder="e.g., 2020"
                  value={formData.passoutYear}
                  onChange={(e) => handleInputChange('passoutYear', e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                {errorMsg}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 rounded-lg border border-zinc-300 bg-white py-3 font-medium text-zinc-700 hover:bg-zinc-50 transition-all"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.fullName || !formData.branch || !formData.dob || !formData.house || isSubmitting}
                className="flex-[2] rounded-lg bg-blue-600 py-3 font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-all flex justify-center items-center"
              >
                {isSubmitting ? <span className="animate-pulse">Saving Profile...</span> : 'Complete Profile'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}