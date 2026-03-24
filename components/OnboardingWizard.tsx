'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';

type Role = 'Student' | 'Alumni' | 'Teacher' | 'School Admin' | '';

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role>('');
  
  // Form State
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [specificDetail, setSpecificDetail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // 1. Get the currently logged-in user securely
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Could not find logged in user.");

      // 2. Send the data to the Supabase 'profiles' table using UPSERT
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id, // Includes their ID to create the row
          role: role,
          jnv_branch: branch,
          batch_year: year,
          specific_details: specificDetail,
          onboarding_completed: true
        });

      if (updateError) throw updateError;

      // 3. Success! Force the page to refresh so they enter the main app
      window.location.reload();
      
    } catch (error: any) {
      console.error("Error saving profile:", error.message);
      alert("Failed to save profile. Please check the console.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4 relative">
      
      {/* Temporary Logout Button for Testing */}
      <button 
        onClick={async () => {
          await supabase.auth.signOut();
          window.location.reload();
        }}
        className="absolute top-4 right-4 text-sm font-medium text-zinc-500 hover:text-red-500 transition-colors"
      >
        Sign Out
      </button>

      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 border border-zinc-100">
        
        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8 space-x-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 1 ? 'bg-blue-600 text-white' : 'bg-green-500 text-white'}`}>1</div>
          <div className="w-16 h-1 bg-zinc-200 rounded"><div className={`h-full ${step === 2 ? 'bg-green-500' : 'bg-transparent'} transition-all`} /></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 2 ? 'bg-blue-600 text-white' : 'bg-zinc-200 text-zinc-500'}`}>2</div>
        </div>

        {/* STEP 1: ROLE SELECTION */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-zinc-900">Welcome to Navodaya Connect</h2>
              <p className="text-zinc-500 mt-2">Let's set up your profile. How are you connected to JNV?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              {[
                { id: 'Student', desc: 'Currently studying at JNV' },
                { id: 'Alumni', desc: 'Completed schooling from JNV' },
                { id: 'Teacher', desc: 'Current or Former Faculty' },
                { id: 'School Admin', desc: 'Official JNV Account' }
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id as Role)}
                  className={`p-6 text-left rounded-xl border-2 transition-all ${role === r.id ? 'border-blue-600 bg-blue-50' : 'border-zinc-200 hover:border-blue-300 hover:bg-zinc-50'}`}
                >
                  <h3 className="text-lg font-semibold text-zinc-900">{r.id}</h3>
                  <p className="text-sm text-zinc-500 mt-1">{r.desc}</p>
                </button>
              ))}
            </div>

            <button
              disabled={!role}
              onClick={() => setStep(2)}
              className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* STEP 2: DETAILS FORM */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-zinc-900">{role} Details</h2>
              <p className="text-zinc-500 mt-2">Just a few more specifics so we can connect you properly.</p>
            </div>

            <form onSubmit={handleCompleteProfile} className="space-y-4 mt-6">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">JNV Branch Location</label>
                <input required value={branch} onChange={(e) => setBranch(e.target.value)} type="text" placeholder="e.g., JNV Pilibhit" className="w-full p-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {role === 'Student' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Current Class</label>
                      <input required value={specificDetail} onChange={(e) => setSpecificDetail(e.target.value)} type="text" placeholder="e.g., 11th Science" className="w-full p-3 border border-zinc-300 rounded-lg focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Admission Year</label>
                      <input required value={year} onChange={(e) => setYear(e.target.value)} type="text" placeholder="e.g., 2020" className="w-full p-3 border border-zinc-300 rounded-lg focus:outline-none" />
                    </div>
                  </>
                )}
                {role === 'Alumni' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Current Profession / College</label>
                      <input required value={specificDetail} onChange={(e) => setSpecificDetail(e.target.value)} type="text" placeholder="e.g., Software Engineer" className="w-full p-3 border border-zinc-300 rounded-lg focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Passout Batch (Year)</label>
                      <input required value={year} onChange={(e) => setYear(e.target.value)} type="text" placeholder="e.g., 2018" className="w-full p-3 border border-zinc-300 rounded-lg focus:outline-none" />
                    </div>
                  </>
                )}
                {(role === 'Teacher' || role === 'School Admin') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">{role === 'Teacher' ? 'Subject Taught' : 'Official Designation'}</label>
                      <input required value={specificDetail} onChange={(e) => setSpecificDetail(e.target.value)} type="text" className="w-full p-3 border border-zinc-300 rounded-lg focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">{role === 'Teacher' ? 'Years of Service' : 'Contact Email'}</label>
                      <input required value={year} onChange={(e) => setYear(e.target.value)} type="text" className="w-full p-3 border border-zinc-300 rounded-lg focus:outline-none" />
                    </div>
                  </>
                )}
              </div>

              <div className="flex space-x-4 mt-8">
                <button type="button" onClick={() => setStep(1)} className="w-1/3 py-3 px-4 border border-zinc-300 text-zinc-700 rounded-lg font-semibold hover:bg-zinc-50 transition-colors">
                  Back
                </button>
                <button type="submit" disabled={isSubmitting} className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50">
                  {isSubmitting ? 'Saving...' : 'Complete Profile'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}