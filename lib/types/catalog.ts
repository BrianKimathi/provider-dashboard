export type CommerceModel = 'SERVICE' | 'PRODUCT' | 'HYBRID';

export type PriceType = 'FIXED' | 'STARTING' | 'NEGOTIABLE';

export type ServiceAreaType = 'STORE_ONLY' | 'MOBILE' | 'HYBRID';

export type ItemType = 'SERVICE' | 'PRODUCT';

export type ProductUnit = 'PIECE' | 'KG' | 'LITRE' | 'PACK' | 'BOX' | 'BOTTLE' | 'SET';

// Unified catalog item (for future unified API)
export interface CatalogItem {
  id: string;
  type: ItemType;
  name: string;
  description: string;
  category: string;
  priceType: PriceType;
  price: number | null;
  isActive: boolean;
  estimatedDurationMinutes?: number | null;
  serviceAreaType?: ServiceAreaType;
  sku?: string;
  unit?: string;
  stockQuantity?: number;
  lowStockThreshold?: number;
  createdAt: string;
  updatedAt: string;
}

// Service-specific
export interface ServiceOffering {
  id: string;
  name: string;
  description: string;
  priceType: PriceType;
  price: number | null;
  estimatedDurationMinutes: number | null;
  serviceAreaType: ServiceAreaType;
  isActive: boolean;
  category: string;
  createdAt: string;
}

// Product-specific
export interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  category: string;
  price: number;
  costPrice: number | null;
  unit: ProductUnit;
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  imageUrl: string | null;
  createdAt: string;
}

export interface InventorySummary {
  totalProducts: number;
  totalStockValue: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export const PRICE_TYPE_LABELS: Record<PriceType, string> = {
  FIXED: 'Fixed',
  STARTING: 'Starting from',
  NEGOTIABLE: 'Negotiable',
};

export const SERVICE_AREA_LABELS: Record<ServiceAreaType, string> = {
  STORE_ONLY: 'In-store only',
  MOBILE: 'Mobile (comes to you)',
  HYBRID: 'In-store & Mobile',
};

export const COMMERCE_MODEL_LABELS: Record<CommerceModel, string> = {
  SERVICE: 'Services only',
  PRODUCT: 'Products only',
  HYBRID: 'Services & Products',
};
