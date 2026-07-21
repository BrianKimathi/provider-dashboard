import { create } from 'zustand';

export type BusinessType = 'TRANSPORT' | 'HANDYMAN' | 'HEALTHCARE' | 'BEAUTY' | 'AUTOMOTIVE' | 'RETAIL' | 'FOOD' | 'OTHER';
export type CommerceModel = 'SERVICE' | 'PRODUCT' | 'HYBRID';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  roles: string[];
  businessType: BusinessType | null;
  commerceModel: CommerceModel | null;
  businessName: string | null;
  setSession: (
    accessToken: string,
    refreshToken: string,
    userId: string,
    roles: string[],
    businessType: BusinessType | null,
    commerceModel?: CommerceModel | null,
    businessName?: string | null,
  ) => void;
  setCommerceModel: (model: CommerceModel) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: typeof window !== 'undefined' ? localStorage.getItem('access_token') : null,
  refreshToken: typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null,
  userId: typeof window !== 'undefined' ? localStorage.getItem('user_id') : null,
  roles: typeof window !== 'undefined' ? (() => { try { return JSON.parse(localStorage.getItem('roles') || '[]'); } catch { return []; } })() : [],
  businessType: typeof window !== 'undefined' ? (localStorage.getItem('business_type') as BusinessType | null) : null,
  commerceModel: typeof window !== 'undefined' ? (localStorage.getItem('commerce_model') as CommerceModel | null) : null,
  businessName: typeof window !== 'undefined' ? localStorage.getItem('business_name') : null,
  setSession: (accessToken, refreshToken, userId, roles, businessType, commerceModel = null, businessName = null) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('user_id', userId);
    localStorage.setItem('roles', JSON.stringify(roles));
    if (businessType) {
      localStorage.setItem('business_type', businessType);
    } else {
      localStorage.removeItem('business_type');
    }
    if (commerceModel) {
      localStorage.setItem('commerce_model', commerceModel);
    }
    if (businessName) {
      localStorage.setItem('business_name', businessName);
    }
    set({ accessToken, refreshToken, userId, roles, businessType, commerceModel, businessName });
  },
  setCommerceModel: (model) => {
    localStorage.setItem('commerce_model', model);
    set({ commerceModel: model });
  },
  clearSession: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('roles');
    localStorage.removeItem('business_type');
    localStorage.removeItem('commerce_model');
    localStorage.removeItem('business_name');
    set({ accessToken: null, refreshToken: null, userId: null, roles: [], businessType: null, commerceModel: null, businessName: null });
  },
}));
