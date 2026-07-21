"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  ShoppingBag, Key, Mail, Loader, ShieldCheck, Phone, 
  Globe, Plus, AlertCircle, Sparkles, Building2, User, ArrowRight, ArrowLeft 
} from 'lucide-react';
import apiClient from '@/lib/api/api-client';

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function Login() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  // Flow control states: 'LOGIN' | 'REGISTER_STEP1' | 'REGISTER_STEP2' | 'OTP' | 'BECOME_PROVIDER'
  const [flow, setFlow] = useState<'LOGIN' | 'REGISTER_STEP1' | 'REGISTER_STEP2' | 'OTP' | 'BECOME_PROVIDER'>('LOGIN');

  // Form login/register states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Business signup registration states
  const [bizName, setBizName] = useState('');
  const [bizLegalName, setBizLegalName] = useState('');
  const [bizRegNumber, setBizRegNumber] = useState('');
  const [bizKraPin, setBizKraPin] = useState('');
  
  const [bizCategoryId, setBizCategoryId] = useState<number | 'CUSTOM'>(1);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [registeredCategoryId, setRegisteredCategoryId] = useState<number | null>(null);
  
  const [bizDescription, setBizDescription] = useState('');
  const [bizWebsite, setBizWebsite] = useState('');
  const [bizPhone, setBizPhone] = useState('');
  const [otp, setOtp] = useState('');

  // Loading & error status
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Categories from backend
  const { data: backendCategories = [], isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ['provider-categories'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/provider/categories');
        return Array.isArray(res.data) ? res.data : (res.data.data || []);
      } catch (e) {
        return [
          { id: 1, name: 'Transit & Transport (Boda Boda, Van)', slug: 'transport' },
          { id: 2, name: 'Handyman Repair (Phone Repair, Plumbing)', slug: 'handyman' },
          { id: 3, name: 'Healthcare Services (Home Nursing)', slug: 'healthcare' }
        ];
      }
    }
  });

  // Create Category Mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (catName: string) => {
      const res = await apiClient.post('/provider/categories', { name: catName });
      return res.data.data;
    }
  });

  // Helper to check if logged in user has a business profile
  const checkUserBusiness = async (token: string, uId: string, userRoles: string[]) => {
    try {
      const bizRes = await apiClient.get('/provider/businesses/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (bizRes.data && bizRes.data.success && bizRes.data.data) {
        const biz = bizRes.data.data;
        setSession(token, localStorage.getItem('refresh_token') || '', uId, userRoles, biz.category?.name || 'OTHER', null, biz.name);
        router.push('/');
      } else {
        setFlow('BECOME_PROVIDER');
      }
    } catch (err) {
      // If 403 or 404, it means they don't have a business profile yet
      setFlow('BECOME_PROVIDER');
    }
  };

  // Submit Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { accessToken, refreshToken, userId, roles } = response.data.data;
      
      // Save temporarily
      setSession(accessToken, refreshToken, userId, roles ?? [], null, null, null);
      
      // Verify if they have a business profile
      await checkUserBusiness(accessToken, userId, roles ?? []);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Login failed. Please check your credentials.';
      setError(msg);
      setIsLoading(false);
    }
  };

  // Validate Step 1 of Register
  const handleNextToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!phone) {
      setError("Please fill in owner phone number.");
      return;
    }

    setFlow('REGISTER_STEP2');
  };

  // Submit User Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let finalCategoryId = bizCategoryId;

      // Handle custom typed category creation
      if (bizCategoryId === 'CUSTOM') {
        if (!customCategoryName.trim()) {
          setError('Please provide a custom category name.');
          setIsLoading(false);
          return;
        }
        const newCat = await createCategoryMutation.mutateAsync(customCategoryName);
        finalCategoryId = newCat.id;
      }
      setRegisteredCategoryId(finalCategoryId === 'CUSTOM' ? null : finalCategoryId);

      // Clean phone number spacing
      const cleanedPhone = phone.replace(/\s+/g, '');
      const cleanedBizPhone = bizPhone.replace(/\s+/g, '');

      // Create owner user payload
      const userPayload = {
        firstName,
        lastName,
        email,
        phone: cleanedPhone,
        password,
        confirmPassword,
        country: 'Kenya',
        preferredLanguage: 'en',
        acceptTerms: true,
        marketingConsent: false
      };

      // Call auth service registration endpoint
      await apiClient.post('/auth/register', userPayload);
      setIsLoading(false);
      setFlow('OTP');
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Registration failed. Please check details and try again.';
      setError(msg);
      setIsLoading(false);
    }
  };

  // Verify OTP, Authenticate, and Register Business profile
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Step 2: Verify user email with OTP
      await apiClient.post(`/auth/verify-email?email=${encodeURIComponent(email)}`, { otp });

      // Step 3: Login to obtain JWT token
      const loginRes = await apiClient.post('/auth/login', { email, password });
      const { accessToken, refreshToken, userId, roles } = loginRes.data.data;
      
      // Inject token temporarily into memory session
      setSession(accessToken, refreshToken, userId, roles ?? [], null, null, null);

      // Step 4: Register Business Details (authenticated)
      await registerBusinessProfile(accessToken, userId, roles ?? []);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Verification or Business profile creation failed.';
      setError(msg);
      setIsLoading(false);
    }
  };

  // Submit Business Profile directly (Become Provider Flow)
  const handleBecomeProviderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const token = useAuthStore.getState().accessToken;
    const uId = useAuthStore.getState().userId;
    const userRoles = useAuthStore.getState().roles;

    if (!token || !uId) {
      setError("Session expired. Please log in again.");
      setFlow('LOGIN');
      setIsLoading(false);
      return;
    }

    try {
      let finalCategoryId = bizCategoryId;
      if (bizCategoryId === 'CUSTOM') {
        if (!customCategoryName.trim()) {
          setError('Please provide a custom category name.');
          setIsLoading(false);
          return;
        }
        const newCat = await createCategoryMutation.mutateAsync(customCategoryName);
        finalCategoryId = newCat.id;
      }
      setRegisteredCategoryId(finalCategoryId === 'CUSTOM' ? null : finalCategoryId);

      await registerBusinessProfile(token, uId, userRoles);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to submit business registration.';
      setError(msg);
      setIsLoading(false);
    }
  };

  const registerBusinessProfile = async (token: string, uId: string, userRoles: string[]) => {
    const cleanedBizPhone = bizPhone.replace(/\s+/g, '') || phone.replace(/\s+/g, '');
    const payload = {
      name: bizName,
      legalName: bizLegalName,
      businessRegistrationNumber: bizRegNumber,
      kraPin: bizKraPin,
      categoryId: registeredCategoryId || (typeof bizCategoryId === 'number' ? bizCategoryId : 1),
      description: bizDescription,
      website: bizWebsite,
      primaryEmail: email,
      primaryPhone: cleanedBizPhone
    };

    const res = await apiClient.post('/provider/businesses/register', payload, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.data && res.data.success === false) {
      throw new Error(res.data.error || 'Failed to register business');
    }

    setIsLoading(false);
    // Refresh page / router to direct to dashboard
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      
      {/* Decorative Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-xl w-full bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-3xl p-8 space-y-6 shadow-2xl shadow-indigo-500/5 z-10 animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-lg shadow-blue-500/20 mb-1">
            <ShoppingBag size={28} className="animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Service Provider Console
          </h2>
          <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
            Manage your service category catalog, receive real-time bookings, and settle earnings.
          </p>
        </div>

        {/* Step Progress Indicators during Registration */}
        {(flow === 'REGISTER_STEP1' || flow === 'REGISTER_STEP2') && (
          <div className="flex items-center justify-center gap-4 py-2 border-b border-slate-800/50">
            <div className="flex items-center gap-1.5">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                flow === 'REGISTER_STEP1' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                1
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Owner Account</span>
            </div>
            <div className="w-8 h-0.5 bg-slate-800" />
            <div className="flex items-center gap-1.5">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                flow === 'REGISTER_STEP2' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-800 text-slate-500'
              }`}>
                2
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Business Setup</span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-red-950/40 border border-red-500/30 text-red-300 rounded-2xl flex items-start gap-2 text-xs leading-relaxed animate-in shake">
            <AlertCircle className="shrink-0 mt-0.5" size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Login flow */}
        {flow === 'LOGIN' && (
          <form onSubmit={handleLogin} className="space-y-4 max-w-md mx-auto">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@business.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-800/80 rounded-xl text-sm text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-800/80 rounded-xl text-sm text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs py-3.5 rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center space-x-1.5"
            >
              {isLoading ? <Loader className="animate-spin" size={16} /> : <span>Sign In</span>}
            </button>
            <div className="text-center pt-2">
              <button 
                type="button" 
                onClick={() => setFlow('REGISTER_STEP1')}
                className="text-xs text-blue-400 hover:underline font-semibold"
              >
                Register a New Business Profile
              </button>
            </div>
          </form>
        )}

        {/* 2. Register Step 1 (Owner Details) */}
        {flow === 'REGISTER_STEP1' && (
          <form onSubmit={handleNextToStep2} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Owner First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Jane"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Owner Last Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Doe"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@business.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Owner Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 254712345678"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Owner Password</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confirm Password</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5"
            >
              <span>Continue to Business Setup</span>
              <ArrowRight size={14} />
            </button>
            <div className="text-center pt-2">
              <button 
                type="button" 
                onClick={() => setFlow('LOGIN')}
                className="text-xs text-slate-400 hover:underline font-semibold"
              >
                Already have a profile? Sign In
              </button>
            </div>
          </form>
        )}

        {/* 3. Register Step 2 (Business Details) */}
        {flow === 'REGISTER_STEP2' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Business Name</label>
                <input
                  type="text"
                  required
                  value={bizName}
                  onChange={(e) => setBizName(e.target.value)}
                  placeholder="e.g. Quick Fix Repairs"
                  className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Legal Entity Name</label>
                <input
                  type="text"
                  required
                  value={bizLegalName}
                  onChange={(e) => setBizLegalName(e.target.value)}
                  placeholder="e.g. Quick Fix Ltd"
                  className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registration Number</label>
                <input
                  type="text"
                  required
                  value={bizRegNumber}
                  onChange={(e) => setBizRegNumber(e.target.value)}
                  placeholder="e.g. PVT-L8D9J2"
                  className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">KRA PIN</label>
                <input
                  type="text"
                  required
                  value={bizKraPin}
                  onChange={(e) => setBizKraPin(e.target.value)}
                  placeholder="e.g. A001234567Z"
                  className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Service Category</label>
                {isLoadingCategories ? (
                  <div className="w-full py-2.5 flex items-center gap-1 text-slate-400 text-xs">
                    <Loader className="animate-spin" size={12} />
                    <span>Loading categories...</span>
                  </div>
                ) : (
                  <select
                    value={bizCategoryId}
                    onChange={(e) => setBizCategoryId(e.target.value === 'CUSTOM' ? 'CUSTOM' : Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  >
                    {backendCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                    <option value="CUSTOM">+ Type Custom Service...</option>
                  </select>
                )}
              </div>
              <div className="space-y-1">
                {bizCategoryId === 'CUSTOM' ? (
                  <>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Custom Category Name</label>
                    <input
                      type="text"
                      required
                      value={customCategoryName}
                      onChange={(e) => setCustomCategoryName(e.target.value)}
                      placeholder="e.g. Mobile Repairer"
                      className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs text-emerald-400 placeholder-slate-600 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    />
                  </>
                ) : (
                  <>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Website URL</label>
                    <input
                      type="text"
                      value={bizWebsite}
                      onChange={(e) => setBizWebsite(e.target.value)}
                      placeholder="e.g. https://quickfix.co.ke"
                      className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    />
                  </>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Business Phone</label>
                <input
                  type="text"
                  required
                  value={bizPhone}
                  onChange={(e) => setBizPhone(e.target.value)}
                  placeholder="e.g. 254712345678"
                  className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Business Description</label>
              <textarea
                required
                value={bizDescription}
                onChange={(e) => setBizDescription(e.target.value)}
                placeholder="Brief summary of services offered..."
                rows={2}
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFlow('REGISTER_STEP1')}
                className="flex-1 border border-slate-850 hover:bg-slate-800 text-slate-300 font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={isLoading || createCategoryMutation.isPending}
                className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center space-x-1.5"
              >
                {isLoading || createCategoryMutation.isPending ? <Loader className="animate-spin" size={16} /> : <span>Proceed to Verification</span>}
              </button>
            </div>
          </form>
        )}

        {/* 4. OTP verification flow */}
        {flow === 'OTP' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 max-w-md mx-auto">
            <div className="text-center space-y-1">
              <ShieldCheck className="mx-auto text-emerald-500 mb-2 animate-bounce" size={48} />
              <h3 className="text-sm font-semibold text-white">Enter OTP Verification Code</h3>
              <p className="text-xs text-slate-400">Please enter the 6-digit code sent to your email.</p>
            </div>
            <div>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="e.g. 123456"
                className="w-full text-center px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-lg font-bold tracking-widest text-emerald-400 outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs py-3.5 rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center space-x-1.5"
            >
              {isLoading ? <Loader className="animate-spin" size={16} /> : <span>Verify & Start Console</span>}
            </button>
          </form>
        )}

        {/* 5. Request to Become a Service Provider flow */}
        {flow === 'BECOME_PROVIDER' && (
          <form onSubmit={handleBecomeProviderSubmit} className="space-y-4 animate-in slide-in-from-bottom duration-300">
            <div className="p-4 bg-blue-950/40 border border-blue-500/20 rounded-2xl space-y-1.5 text-center">
              <Sparkles className="mx-auto text-blue-400 mb-1" size={24} />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Become a Service Provider</h3>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                You are logged in, but do not have an active Business profile. Register your business below to activate your Provider dashboard.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Business Name</label>
                <input
                  type="text"
                  required
                  value={bizName}
                  onChange={(e) => setBizName(e.target.value)}
                  placeholder="e.g. Quick Fix Repairs"
                  className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Legal Entity Name</label>
                <input
                  type="text"
                  required
                  value={bizLegalName}
                  onChange={(e) => setBizLegalName(e.target.value)}
                  placeholder="e.g. Quick Fix Ltd"
                  className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registration Number</label>
                <input
                  type="text"
                  required
                  value={bizRegNumber}
                  onChange={(e) => setBizRegNumber(e.target.value)}
                  placeholder="e.g. PVT-L8D9J2"
                  className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">KRA PIN</label>
                <input
                  type="text"
                  required
                  value={bizKraPin}
                  onChange={(e) => setBizKraPin(e.target.value)}
                  placeholder="e.g. A001234567Z"
                  className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Service Category</label>
                {isLoadingCategories ? (
                  <div className="w-full py-2.5 flex items-center gap-1 text-slate-400 text-xs">
                    <Loader className="animate-spin" size={12} />
                    <span>Loading categories...</span>
                  </div>
                ) : (
                  <select
                    value={bizCategoryId}
                    onChange={(e) => setBizCategoryId(e.target.value === 'CUSTOM' ? 'CUSTOM' : Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  >
                    {backendCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                    <option value="CUSTOM">+ Type Custom Service...</option>
                  </select>
                )}
              </div>
              <div className="space-y-1">
                {bizCategoryId === 'CUSTOM' ? (
                  <>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Custom Category Name</label>
                    <input
                      type="text"
                      required
                      value={customCategoryName}
                      onChange={(e) => setCustomCategoryName(e.target.value)}
                      placeholder="e.g. Hair Stylist"
                      className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs text-emerald-400 placeholder-slate-600 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    />
                  </>
                ) : (
                  <>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Website URL</label>
                    <input
                      type="text"
                      value={bizWebsite}
                      onChange={(e) => setBizWebsite(e.target.value)}
                      placeholder="e.g. https://quickfix.co.ke"
                      className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    />
                  </>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Business Contact Phone</label>
                <input
                  type="text"
                  required
                  value={bizPhone}
                  onChange={(e) => setBizPhone(e.target.value)}
                  placeholder="e.g. 254712345678"
                  className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Business Description</label>
              <textarea
                required
                value={bizDescription}
                onChange={(e) => setBizDescription(e.target.value)}
                placeholder="Brief description of your business profile..."
                rows={2}
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || createCategoryMutation.isPending}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs py-3.5 rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center space-x-1.5"
            >
              {isLoading || createCategoryMutation.isPending ? <Loader className="animate-spin" size={16} /> : <span>Activate Business Profile</span>}
            </button>
            <div className="text-center pt-2">
              <button 
                type="button" 
                onClick={() => {
                  useAuthStore.getState().clearSession();
                  setFlow('LOGIN');
                }}
                className="text-xs text-slate-400 hover:underline font-semibold"
              >
                Sign Out / Use Another Account
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
