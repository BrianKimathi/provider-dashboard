"use client";

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Building2, Loader, Save, MapPin, Phone, Mail, Globe, Calendar, Shield, CheckCircle,
} from 'lucide-react';
import apiClient from '@/lib/api/api-client';
import { useAuthStore } from '@/lib/store/auth-store';

interface BusinessProfile {
  name: string;
  legalName: string;
  description: string;
  primaryEmail: string;
  primaryPhone: string;
  website: string;
  logoUrl: string | null;
  coverUrl: string | null;
  kraPin: string;
  businessRegistrationNumber: string;
  openingDate: string;
  status: string;
  category: string;
  county: string;
  town: string;
  physicalAddress: string;
  latitude: number | null;
  longitude: number | null;
  coverageRadiusKm: number;
}

const INITIAL_PROFILE: BusinessProfile = {
  name: '',
  legalName: '',
  description: '',
  primaryEmail: '',
  primaryPhone: '',
  website: '',
  logoUrl: null,
  coverUrl: null,
  kraPin: '',
  businessRegistrationNumber: '',
  openingDate: '',
  status: 'PENDING_REVIEW',
  category: '',
  county: '',
  town: '',
  physicalAddress: '',
  latitude: null,
  longitude: null,
  coverageRadiusKm: 10,
};

export default function ProfilePage() {
  const commerceModel = useAuthStore((s) => s.commerceModel);
  const setCommerceModel = useAuthStore((s) => s.setCommerceModel);
  const [profile, setProfile] = useState<BusinessProfile>(INITIAL_PROFILE);
  const [selectedCommerceModel, setSelectedCommerceModel] = useState(commerceModel || 'HYBRID');
  const [activeTab, setActiveTab] = useState<'business' | 'location' | 'commerce'>('business');

  // Load business profile from backend
  const { data: businessData, isLoading, refetch } = useQuery({
    queryKey: ['provider-business-profile-detail'],
    queryFn: async () => {
      const res = await apiClient.get('/provider/businesses/me');
      return res.data?.data || res.data;
    }
  });

  useEffect(() => {
    if (businessData) {
      setProfile({
        name: businessData.name || '',
        legalName: businessData.legalName || '',
        description: businessData.description || '',
        primaryEmail: businessData.primaryEmail || '',
        primaryPhone: businessData.primaryPhone || '',
        website: businessData.website || '',
        logoUrl: businessData.logoUrl || null,
        coverUrl: businessData.coverUrl || null,
        kraPin: businessData.kraPin || '',
        businessRegistrationNumber: businessData.businessRegistrationNumber || '',
        openingDate: businessData.openingDate || '',
        status: businessData.status || 'PENDING_REVIEW',
        category: businessData.category || '',
        county: businessData.county || 'Nairobi',
        town: businessData.town || 'Nairobi',
        physicalAddress: businessData.physicalAddress || '',
        latitude: businessData.latitude || null,
        longitude: businessData.longitude || null,
        coverageRadiusKm: businessData.coverageRadiusKm || 10,
      });
      if (businessData.commerceModel) {
        setSelectedCommerceModel(businessData.commerceModel);
      }
    }
  }, [businessData]);

  const saveMutation = useMutation({
    mutationFn: async (payload: Partial<BusinessProfile>) => {
      // 1. Update basic registration profile info
      const profilePayload = {
        name: payload.name || '',
        legalName: payload.legalName || '',
        businessRegistrationNumber: payload.businessRegistrationNumber || '',
        kraPin: payload.kraPin || '',
        categoryId: businessData?.categoryId || 1,
        description: payload.description || '',
        website: payload.website || '',
        primaryEmail: payload.primaryEmail || '',
        primaryPhone: payload.primaryPhone || '',
      };
      await apiClient.put('/provider/businesses/me', profilePayload);

      // 2. Update commerce model if selected model changed
      if (selectedCommerceModel !== commerceModel) {
        await apiClient.patch('/provider/businesses/me/commerce-model', null, {
          params: { commerceModel: selectedCommerceModel }
        });
      }
    },
    onSuccess: () => {
      if (selectedCommerceModel !== commerceModel) {
        setCommerceModel(selectedCommerceModel as any);
      }
      refetch();
      alert('Profile saved successfully!');
    },
    onError: (err: any) => {
      alert(`Failed to save profile: ${err.message || 'Unknown error'}`);
    },
  });

  const handleChange = (field: keyof BusinessProfile, value: string | number) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(profile);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center space-x-2">
        <Loader className="animate-spin text-emerald-500" />
        <span className="text-sm text-slate-400">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center space-x-3">
        <Building2 className="w-8 h-8 text-emerald-500" />
        <div>
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Business Profile</h1>
          <p className="text-slate-400 mt-1">Manage your business information, location, and commerce settings.</p>
        </div>
      </div>

      {/* Verification Status Banner */}
      <div className={`rounded-xl border p-4 flex items-center gap-3 ${
        profile.status === 'APPROVED' 
          ? 'bg-green-950/30 border-green-500/30' 
          : profile.status === 'PENDING_REVIEW' || profile.status === 'SUBMITTED' 
            ? 'bg-amber-950/30 border-amber-500/30' 
            : 'bg-slate-900/50 border-slate-700'
      }`}>
        {profile.status === 'APPROVED' ? <CheckCircle size={20} className="text-green-400" /> : <Shield size={20} className="text-amber-400" />}
        <div>
          <p className={`text-sm font-bold ${profile.status === 'APPROVED' ? 'text-green-400' : 'text-amber-400'}`}>
            Verification: {profile.status === 'APPROVED' ? 'Verified & Approved' : 'Under Review'}
          </p>
          <p className="text-xs text-slate-300">
            {profile.status === 'APPROVED' ? 'Your business is verified and visible to customers.' : 'Your business is under review.'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-900 border border-slate-800 p-1 rounded-lg w-fit">
        {([['business', 'Business Info'], ['commerce', 'Commerce Model'], ['location', 'Location']] as const).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
              activeTab === tab ? 'bg-slate-800 shadow text-emerald-400' : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-850 rounded-xl border border-slate-800 p-6 space-y-5">
        {activeTab === 'business' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Business Name" icon={Building2}>
                <input value={profile.name} onChange={(e) => handleChange('name', e.target.value)} required className="input text-slate-100 bg-slate-900 border-slate-700" />
              </Field>
              <Field label="Legal Name" icon={Building2}>
                <input value={profile.legalName} onChange={(e) => handleChange('legalName', e.target.value)} className="input text-slate-100 bg-slate-900 border-slate-700" />
              </Field>
            </div>

            <Field label="Description" full>
              <textarea value={profile.description} onChange={(e) => handleChange('description', e.target.value)} rows={3} className="input resize-none text-slate-100 bg-slate-900 border-slate-700" />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Primary Email" icon={Mail}>
                <input type="email" value={profile.primaryEmail} onChange={(e) => handleChange('primaryEmail', e.target.value)} required className="input text-slate-100 bg-slate-900 border-slate-700" />
              </Field>
              <Field label="Primary Phone" icon={Phone}>
                <input value={profile.primaryPhone} onChange={(e) => handleChange('primaryPhone', e.target.value)} required className="input text-slate-100 bg-slate-900 border-slate-700" />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Website" icon={Globe}>
                <input value={profile.website} onChange={(e) => handleChange('website', e.target.value)} className="input text-slate-100 bg-slate-900 border-slate-700" />
              </Field>
              <Field label="Category ID" icon={Building2}>
                <input type="number" value={businessData?.categoryId || ''} disabled className="input text-slate-400 bg-slate-800/50 border-slate-700/50 cursor-not-allowed" />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="KRA PIN" icon={Shield}>
                <input value={profile.kraPin} onChange={(e) => handleChange('kraPin', e.target.value)} className="input font-mono text-slate-100 bg-slate-900 border-slate-700" />
              </Field>
              <Field label="Reg. Number" icon={Shield}>
                <input value={profile.businessRegistrationNumber} onChange={(e) => handleChange('businessRegistrationNumber', e.target.value)} className="input font-mono text-slate-100 bg-slate-900 border-slate-700" />
              </Field>
              <Field label="Opening Date" icon={Calendar}>
                <input type="date" value={profile.openingDate} onChange={(e) => handleChange('openingDate', e.target.value)} className="input text-slate-100 bg-slate-900 border-slate-700" />
              </Field>
            </div>
          </>
        )}

        {activeTab === 'commerce' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-slate-200 text-sm mb-1">What does your business sell?</h3>
              <p className="text-xs text-slate-400 mb-4">This determines which catalog features are available to you. You can change this anytime.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {([
                { value: 'SERVICE', title: 'Services Only', desc: 'You provide labor-based services (repairs, transport, consultations, salon services, etc.)', icon: '🔧' },
                { value: 'PRODUCT', title: 'Products Only', desc: 'You sell physical goods (spare parts, electronics, hair products, supplies, etc.)', icon: '📦' },
                { value: 'HYBRID', title: 'Services & Products', desc: 'You offer both services and sell products (e.g. auto shop with repairs + parts, salon with services + products)', icon: '⚡' },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedCommerceModel(opt.value)}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${
                    selectedCommerceModel === opt.value
                      ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                      : 'border-slate-700 hover:border-slate-650 bg-slate-900'
                  }`}
                >
                  <div className="text-2xl mb-2">{opt.icon}</div>
                  <h4 className="font-bold text-slate-100 text-sm">{opt.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{opt.desc}</p>
                </button>
              ))}
            </div>
            <div className="bg-blue-950/30 border border-blue-900/50 rounded-lg p-3 mt-4">
              <p className="text-xs text-blue-300">
                <strong>Current selection:</strong> {selectedCommerceModel === 'HYBRID' ? 'You will see both Services and Products tabs in your Catalog.' : selectedCommerceModel === 'SERVICE' ? 'You will see only the Services tab in your Catalog.' : 'You will see only the Products & Inventory tab in your Catalog.'}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'location' && (
          <>
            <Field label="Physical Address" icon={MapPin} full>
              <input value={profile.physicalAddress} onChange={(e) => handleChange('physicalAddress', e.target.value)} className="input text-slate-100 bg-slate-900 border-slate-700" />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="County">
                <input value={profile.county} onChange={(e) => handleChange('county', e.target.value)} className="input text-slate-100 bg-slate-900 border-slate-700" />
              </Field>
              <Field label="Town">
                <input value={profile.town} onChange={(e) => handleChange('town', e.target.value)} className="input text-slate-100 bg-slate-900 border-slate-700" />
              </Field>
              <Field label="Coverage Radius (km)">
                <input type="number" value={profile.coverageRadiusKm} onChange={(e) => handleChange('coverageRadiusKm', Number(e.target.value))} className="input text-slate-100 bg-slate-900 border-slate-700" />
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Latitude">
                <input type="number" step="any" value={profile.latitude ?? ''} onChange={(e) => handleChange('latitude', Number(e.target.value))} className="input font-mono text-slate-100 bg-slate-900 border-slate-700" />
              </Field>
              <Field label="Longitude">
                <input type="number" step="any" value={profile.longitude ?? ''} onChange={(e) => handleChange('longitude', Number(e.target.value))} className="input font-mono text-slate-100 bg-slate-900 border-slate-700" />
              </Field>
            </div>
            <div className="bg-amber-950/30 border border-amber-900/50 rounded-lg p-3">
              <p className="text-xs text-amber-300 flex items-center gap-1.5">
                <MapPin size={12} /> Your coverage radius determines how far customers can find you in location-based search.
              </p>
            </div>
          </>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-slate-700">
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            {saveMutation.isPending ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
            Save Changes
          </button>
        </div>
      </form>

      <style jsx>{`
        .input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #334155;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          outline: none;
          transition: box-shadow 0.2s;
          background-color: #0f172a;
          color: #e2e8f0;
        }
        .input:focus {
          box-shadow: 0 0 0 2px #10b981;
          border-color: #10b981;
        }
        .input:disabled {
          background-color: #1e293b;
          color: #64748b;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

function Field({ label, icon: Icon, children, full }: { label: string; icon?: React.ElementType; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'space-y-1' : 'space-y-1'}>
      <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
        {Icon && <Icon size={12} />}
        {label}
      </label>
      {children}
    </div>
  );
}
