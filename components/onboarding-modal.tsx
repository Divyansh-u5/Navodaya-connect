'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

type UserRole = 'student' | 'alumni' | 'teacher' | 'admin' | null;

interface OnboardingState {
  role: UserRole;
  jnvBranch: string;
  dateOfBirth: Date | undefined;
  jnvHouse: string;
  currentClass: string;
  admissionYear: string;
  profession: string;
  passoutBatch: string;
  designation: string;
  contactEmail: string;
}

export function OnboardingModal({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingState>({
    role: null,
    jnvBranch: '',
    dateOfBirth: undefined,
    jnvHouse: '',
    currentClass: '',
    admissionYear: '',
    profession: '',
    passoutBatch: '',
    designation: '',
    contactEmail: '',
  });

  const handleRoleSelect = (role: UserRole) => {
    setFormData({ ...formData, role });
    setStep(2);
  };

  const handleInputChange = (field: keyof OnboardingState, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleDateChange = (date: Date | undefined) => {
    setFormData({ ...formData, dateOfBirth: date });
  };

  const handleBack = () => {
    setStep(1);
    setFormData({ ...formData, role: null });
  };

  const handleComplete = () => {
    // Form data is ready to be sent to backend
    console.log('Profile Data:', formData);
    onComplete();
  };

  const isStep2Valid = () => {
    const { jnvBranch, dateOfBirth, role } = formData;
    if (!jnvBranch || !dateOfBirth) return false;

    if (role === 'student' || role === 'alumni') {
      if (!formData.jnvHouse) return false;
      if (role === 'student' && (!formData.currentClass || !formData.admissionYear)) return false;
      if (role === 'alumni' && (!formData.profession || !formData.passoutBatch)) return false;
    }

    if (role === 'teacher' || role === 'admin') {
      if (!formData.designation || !formData.contactEmail) return false;
    }

    return true;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl">
        {step === 1 ? (
          <>
            <CardHeader>
              <CardTitle className="text-2xl">Welcome to Navodaya Connect</CardTitle>
              <CardDescription>
                Complete your profile to get started. Select your role below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { role: 'student' as const, title: 'Student', subtitle: 'Currently at JNV' },
                  { role: 'alumni' as const, title: 'Alumni', subtitle: 'Completed schooling' },
                  { role: 'teacher' as const, title: 'Teacher', subtitle: 'Current/Former Faculty' },
                  { role: 'admin' as const, title: 'School Admin', subtitle: 'Official Account' },
                ].map(({ role, title, subtitle }) => (
                  <button
                    key={role}
                    onClick={() => handleRoleSelect(role)}
                    className="p-6 border-2 border-zinc-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <div className="text-left">
                      <div className="font-semibold text-lg text-zinc-900">{title}</div>
                      <div className="text-sm text-zinc-500 mt-1">{subtitle}</div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
              <CardDescription>
                Please provide the following information to set up your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Universal Fields */}
              <div className="space-y-2">
                <Label htmlFor="jnvBranch" className="text-zinc-700 font-medium">
                  JNV Branch Location
                </Label>
                <Input
                  id="jnvBranch"
                  placeholder="Enter your JNV branch"
                  value={formData.jnvBranch}
                  onChange={(e) => handleInputChange('jnvBranch', e.target.value)}
                  className="border-zinc-200"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-700 font-medium">Date of Birth</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal border-zinc-200"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.dateOfBirth
                        ? format(formData.dateOfBirth, 'PPP')
                        : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.dateOfBirth}
                      onSelect={handleDateChange}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Student/Alumni Fields */}
              {(formData.role === 'student' || formData.role === 'alumni') && (
                <div className="space-y-2">
                  <Label htmlFor="jnvHouse" className="text-zinc-700 font-medium">
                    JNV House
                  </Label>
                  <Select value={formData.jnvHouse} onValueChange={(value) => handleInputChange('jnvHouse', value)}>
                    <SelectTrigger id="jnvHouse" className="border-zinc-200">
                      <SelectValue placeholder="Select your house" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aravali">Aravali</SelectItem>
                      <SelectItem value="nilgiri">Nilgiri</SelectItem>
                      <SelectItem value="shivalik">Shivalik</SelectItem>
                      <SelectItem value="udaygiri">Udaygiri</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Student-specific Fields */}
              {formData.role === 'student' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="currentClass" className="text-zinc-700 font-medium">
                      Current Class
                    </Label>
                    <Select value={formData.currentClass} onValueChange={(value) => handleInputChange('currentClass', value)}>
                      <SelectTrigger id="currentClass" className="border-zinc-200">
                        <SelectValue placeholder="Select your class" />
                      </SelectTrigger>
                      <SelectContent>
                        {[6, 7, 8, 9, 10, 11, 12].map((cls) => (
                          <SelectItem key={cls} value={cls.toString()}>
                            Class {cls}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admissionYear" className="text-zinc-700 font-medium">
                      Admission Year
                    </Label>
                    <Input
                      id="admissionYear"
                      type="number"
                      placeholder="e.g., 2022"
                      value={formData.admissionYear}
                      onChange={(e) => handleInputChange('admissionYear', e.target.value)}
                      className="border-zinc-200"
                    />
                  </div>
                </>
              )}

              {/* Alumni-specific Fields */}
              {formData.role === 'alumni' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="profession" className="text-zinc-700 font-medium">
                      Current Profession/College
                    </Label>
                    <Input
                      id="profession"
                      placeholder="e.g., Software Engineer at Google"
                      value={formData.profession}
                      onChange={(e) => handleInputChange('profession', e.target.value)}
                      className="border-zinc-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="passoutBatch" className="text-zinc-700 font-medium">
                      Passout Batch (Year)
                    </Label>
                    <Input
                      id="passoutBatch"
                      type="number"
                      placeholder="e.g., 2020"
                      value={formData.passoutBatch}
                      onChange={(e) => handleInputChange('passoutBatch', e.target.value)}
                      className="border-zinc-200"
                    />
                  </div>
                </>
              )}

              {/* Teacher/Admin Fields */}
              {(formData.role === 'teacher' || formData.role === 'admin') && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="designation" className="text-zinc-700 font-medium">
                      {formData.role === 'teacher' ? 'Subject/Designation' : 'Designation'}
                    </Label>
                    <Input
                      id="designation"
                      placeholder={formData.role === 'teacher' ? 'e.g., Physics Teacher' : 'e.g., Principal'}
                      value={formData.designation}
                      onChange={(e) => handleInputChange('designation', e.target.value)}
                      className="border-zinc-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactEmail" className="text-zinc-700 font-medium">
                      Contact Email
                    </Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.contactEmail}
                      onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                      className="border-zinc-200"
                    />
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 border-zinc-200"
                >
                  Back
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={!isStep2Valid()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Complete Profile
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
