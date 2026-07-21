"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wrench, Package, Plus, Search, Loader, Trash2, Edit2, X, AlertTriangle,
  DollarSign, Clock, MapPin, TrendingDown, Box, Power, PowerOff,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import apiClient from '@/lib/api/api-client';
import { useAuthStore } from '@/lib/store/auth-store';
import type { ServiceOffering, Product, PriceType, ServiceAreaType, ProductUnit, InventorySummary } from '@/lib/types/catalog';

const PRICE_TYPE_LABELS: Record<PriceType, string> = {
  FIXED: 'Fixed',
  STARTING: 'Starting from',
  NEGOTIABLE: 'Negotiable',
};

const SERVICE_AREA_LABELS: Record<ServiceAreaType, string> = {
  STORE_ONLY: 'In-store',
  MOBILE: 'Mobile',
  HYBRID: 'In-store + Mobile',
};

const UNIT_LABELS: Record<ProductUnit, string> = {
  PIECE: 'piece', KG: 'kg', LITRE: 'litre', PACK: 'pack', BOX: 'box', BOTTLE: 'bottle', SET: 'set',
};

export default function CatalogPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const commerceModel = useAuthStore((s) => s.commerceModel);

  const showServices = commerceModel === 'SERVICE' || commerceModel === 'HYBRID' || !commerceModel;
  const showProducts = commerceModel === 'PRODUCT' || commerceModel === 'HYBRID' || !commerceModel;

  const initialTab = searchParams.get('tab') === 'products' && showProducts ? 'products' : showServices ? 'services' : 'products';
  const [activeTab, setActiveTab] = useState<'services' | 'products'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceOffering | Product | null>(null);

  const { data: services = [], isLoading: servicesLoading } = useQuery<ServiceOffering[]>({
    queryKey: ['provider-services'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/provider/businesses/me/services');
        const list = Array.isArray(res.data) ? res.data : (res.data.data || []);
        return list;
      } catch { return []; }
    },
    enabled: showServices,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['provider-products'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/provider/businesses/me/products');
        const list = Array.isArray(res.data) ? res.data : (res.data.data || []);
        return list;
      } catch { return []; }
    },
    enabled: showProducts,
  });

  const deleteMutation = useMutation({
    mutationFn: async (payload: { type: 'service' | 'product'; id: string }) => {
      await apiClient.delete(`/provider/businesses/me/${payload.type}s/${payload.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-services'] });
      queryClient.invalidateQueries({ queryKey: ['provider-products'] });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (payload: { type: 'service' | 'product'; id: string; isActive: boolean }) => {
      await apiClient.patch(`/provider/businesses/me/${payload.type}s/${payload.id}/status`, null, {
        params: { isActive: !payload.isActive },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-services'] });
      queryClient.invalidateQueries({ queryKey: ['provider-products'] });
    },
  });

  const handleDelete = (type: 'service' | 'product', id: string, name: string) => {
    if (confirm(`Delete "${name}"? This cannot be undone.`)) {
      deleteMutation.mutate({ type, id });
    }
  };

  // Inventory summary
  const inventory: InventorySummary = {
    totalProducts: products.length,
    totalStockValue: products.reduce((s, p) => s + (p.costPrice || 0) * p.stockQuantity, 0),
    lowStockCount: products.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold).length,
    outOfStockCount: products.filter((p) => p.stockQuantity === 0).length,
  };

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Package className="w-8 h-8 text-emerald-500" />
          <div>
            <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Catalog</h1>
            <p className="text-slate-400 mt-1">
              {commerceModel === 'HYBRID' && 'Manage your services and products in one place.'}
              {commerceModel === 'SERVICE' && 'Manage the services you offer to customers.'}
              {commerceModel === 'PRODUCT' && 'Manage your product listings and inventory.'}
              {!commerceModel && 'Manage your offerings.'}
            </p>
          </div>
        </div>
        <button
          onClick={() => { setEditingItem(null); setShowAddModal(true); }}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-all shadow-md flex items-center gap-2"
        >
          <Plus size={16} />
          {activeTab === 'services' ? 'Add Service' : 'Add Product'}
        </button>
      </div>

      {/* Tabs */}
      {showServices && showProducts && (
        <div className="flex space-x-1 bg-slate-700 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('services')}
            className={`px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'services' ? 'bg-slate-900 shadow text-emerald-400' : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            <Wrench size={16} /> Services ({services.length})
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'products' ? 'bg-slate-900 shadow text-emerald-400' : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            <Package size={16} /> Products ({products.length})
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative w-full md:w-80">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={activeTab === 'services' ? 'Search services...' : 'Search products by name, SKU...'}
          className="w-full pl-9 pr-4 py-2 border border-slate-600 rounded-lg text-sm bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none"
        />
        <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
      </div>

      {/* Services Tab */}
      {activeTab === 'services' && showServices && (
        <div className="space-y-3">
          {servicesLoading ? (
            <div className="p-12 flex justify-center items-center space-x-2">
              <Loader className="animate-spin text-emerald-400" />
              <span className="text-sm text-slate-500">Loading services...</span>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center text-slate-400">
              No services found. Click &ldquo;Add Service&rdquo; to create your first offering.
            </div>
          ) : (
            filteredServices.map((svc) => (
              <div key={svc.id} className={`bg-slate-800 rounded-xl border border-slate-700 p-4 ${!svc.isActive ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="p-2 bg-emerald-900/40 rounded-lg shrink-0">
                      <Wrench size={18} className="text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-100 text-sm">{svc.name}</h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-900/40 text-blue-300 border border-blue-700">
                          {svc.category}
                        </span>
                        {!svc.isActive && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-400">INACTIVE</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{svc.description}</p>
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <DollarSign size={12} className="text-emerald-500" />
                          {svc.priceType === 'NEGOTIABLE' ? 'Negotiable' : `${PRICE_TYPE_LABELS[svc.priceType]} KES ${(svc.price || 0).toLocaleString()}`}
                        </span>
                        {svc.estimatedDurationMinutes && (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock size={12} className="text-indigo-500" />
                            {svc.estimatedDurationMinutes >= 60
                              ? `${Math.floor(svc.estimatedDurationMinutes / 60)}h ${svc.estimatedDurationMinutes % 60 > 0 ? `${svc.estimatedDurationMinutes % 60}m` : ''}`
                              : `${svc.estimatedDurationMinutes}m`}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <MapPin size={12} className="text-amber-500" />
                          {SERVICE_AREA_LABELS[svc.serviceAreaType]}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => toggleActiveMutation.mutate({ type: 'service', id: svc.id, isActive: svc.isActive })}
                      className={`p-1.5 border rounded-lg transition-all ${svc.isActive ? 'bg-amber-900/30 hover:bg-amber-600 text-amber-400 hover:text-white border-amber-700' : 'bg-green-900/30 hover:bg-green-600 text-green-400 hover:text-white border-green-700'}`}
                      title={svc.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {svc.isActive ? <PowerOff size={14} /> : <Power size={14} />}
                    </button>
                    <button
                      onClick={() => { setEditingItem(svc); setShowAddModal(true); }}
                      className="p-1.5 bg-blue-900/30 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-700 rounded-lg transition-all"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete('service', svc.id, svc.name)}
                      className="p-1.5 bg-red-900/30 hover:bg-red-600 text-red-400 hover:text-white border border-red-700 rounded-lg transition-all"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && showProducts && (
        <div className="space-y-4">
          {/* Inventory KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Total Products</span>
                <Box size={14} className="text-blue-500" />
              </div>
              <div className="text-xl font-bold text-slate-100 mt-1">{inventory.totalProducts}</div>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Stock Value</span>
                <DollarSign size={14} className="text-emerald-500" />
              </div>
              <div className="text-xl font-bold text-emerald-600 mt-1">KES {inventory.totalStockValue.toLocaleString()}</div>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Low Stock</span>
                <TrendingDown size={14} className="text-amber-500" />
              </div>
              <div className="text-xl font-bold text-amber-600 mt-1">{inventory.lowStockCount}</div>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Out of Stock</span>
                <AlertTriangle size={14} className="text-red-500" />
              </div>
              <div className="text-xl font-bold text-red-600 mt-1">{inventory.outOfStockCount}</div>
            </div>
          </div>

          {/* Product table */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            {productsLoading ? (
              <div className="p-12 flex justify-center items-center space-x-2">
                <Loader className="animate-spin text-emerald-400" />
                <span className="text-sm text-slate-500">Loading products...</span>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-slate-400 font-semibold text-xs uppercase tracking-wider border-b">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700 text-slate-200 text-sm">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                        No products found. Click &ldquo;Add Product&rdquo; to add inventory.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((prod) => {
                      const isOutOfStock = prod.stockQuantity === 0;
                      const isLowStock = prod.stockQuantity > 0 && prod.stockQuantity <= prod.lowStockThreshold;
                      return (
                         <tr key={prod.id} className={`hover:bg-slate-700/50 ${!prod.isActive ? 'opacity-50' : ''}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-slate-700 rounded shrink-0">
                                <Package size={14} className="text-slate-300" />
                              </div>
                              <div>
                                <p className="font-semibold text-xs text-slate-800">{prod.name}</p>
                                <p className="text-[10px] text-slate-400">per {UNIT_LABELS[prod.unit]}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-500">{prod.sku}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-700 text-slate-300">{prod.category}</span>
                          </td>
                          <td className="px-4 py-3 font-mono font-semibold text-slate-800">KES {prod.price.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            {isOutOfStock ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">Out of stock</span>
                            ) : isLowStock ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">{prod.stockQuantity} left</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">{prod.stockQuantity} in stock</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => toggleActiveMutation.mutate({ type: 'product', id: prod.id, isActive: prod.isActive })}
                                className={`p-1.5 border rounded-lg transition-all ${prod.isActive ? 'bg-amber-900/30 hover:bg-amber-600 text-amber-400 hover:text-white border-amber-700' : 'bg-green-900/30 hover:bg-green-600 text-green-400 hover:text-white border-green-700'}`}
                                title={prod.isActive ? 'Deactivate' : 'Activate'}
                              >
                                {prod.isActive ? <PowerOff size={14} /> : <Power size={14} />}
                              </button>
                              <button
                                onClick={() => { setEditingItem(prod); setShowAddModal(true); }}
                                className="p-1.5 bg-blue-900/30 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-700 rounded-lg transition-all"
                                title="Edit"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDelete('product', prod.id, prod.name)}
                                className="p-1.5 bg-red-900/30 hover:bg-red-600 text-red-400 hover:text-white border border-red-700 rounded-lg transition-all"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <CatalogModal
          type={activeTab}
          item={editingItem}
          onClose={() => { setShowAddModal(false); setEditingItem(null); }}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['provider-services'] });
            queryClient.invalidateQueries({ queryKey: ['provider-products'] });
            setShowAddModal(false);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}

// --- Add/Edit Modal ---
function CatalogModal({
  type, item, onClose, onSaved,
}: {
  type: 'services' | 'products';
  item: ServiceOffering | Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isService = type === 'services';
  const createMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      if (item) {
        await apiClient.put(`/provider/businesses/me/${isService ? 'services' : 'products'}/${item.id}`, payload);
      } else {
        await apiClient.post(`/provider/businesses/me/${isService ? 'services' : 'products'}`, payload);
      }
    },
    onSuccess: onSaved,
    onError: onSaved,
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = {};
    formData.forEach((val, key) => {
      if (key === 'price' || key === 'costPrice' || key === 'stockQuantity' || key === 'lowStockThreshold' || key === 'estimatedDurationMinutes') {
        payload[key] = val ? Number(val) : null;
      } else {
        payload[key] = val;
      }
    });
    payload.isActive = formData.get('isActive') === 'on';
    createMutation.mutate(payload);
  };

  const svc = isService ? (item as ServiceOffering | null) : null;
  const prd = !isService ? (item as Product | null) : null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b flex items-center justify-between sticky top-0 bg-slate-800 z-10">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            {isService ? <Wrench size={18} className="text-emerald-400" /> : <Package size={18} className="text-emerald-400" />}
            {item ? `Edit ${isService ? 'Service' : 'Product'}` : `Add ${isService ? 'Service' : 'Product'}`}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">{isService ? 'Service' : 'Product'} Name</label>
            <input name="name" defaultValue={svc?.name || prd?.name || ''} required className="w-full px-3 py-2 border border-slate-600 rounded-lg text-sm bg-slate-900 text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
            <textarea name="description" defaultValue={svc?.description || prd?.description || ''} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none text-slate-800 bg-white" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
              <input name="category" defaultValue={svc?.category || prd?.category || ''} required className="w-full px-3 py-2 border border-slate-600 rounded-lg text-sm bg-slate-900 text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            {isService ? (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Price Type</label>
                <select name="priceType" defaultValue={svc?.priceType || 'FIXED'} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-900 border-slate-600 text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none">
                  <option value="FIXED">Fixed</option>
                  <option value="STARTING">Starting from</option>
                  <option value="NEGOTIABLE">Negotiable</option>
                </select>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">SKU</label>
                <input name="sku" defaultValue={prd?.sku || ''} required className="w-full px-3 py-2 border border-slate-600 rounded-lg text-sm font-mono bg-slate-900 text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {isService ? (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Price (KES)</label>
                  <input name="price" type="number" defaultValue={svc?.price ?? ''} className="w-full px-3 py-2 border border-slate-600 rounded-lg text-sm bg-slate-900 text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Duration (min)</label>
                  <input name="estimatedDurationMinutes" type="number" defaultValue={svc?.estimatedDurationMinutes ?? ''} className="w-full px-3 py-2 border border-slate-600 rounded-lg text-sm bg-slate-900 text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Service Area</label>
                  <select name="serviceAreaType" defaultValue={svc?.serviceAreaType || 'STORE_ONLY'} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-900 border-slate-600 text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none">
                    <option value="STORE_ONLY">In-store only</option>
                    <option value="MOBILE">Mobile (we come to you)</option>
                    <option value="HYBRID">In-store + Mobile</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Price (KES)</label>
                  <input name="price" type="number" defaultValue={prd?.price ?? ''} required className="w-full px-3 py-2 border border-slate-600 rounded-lg text-sm bg-slate-900 text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Cost Price (KES)</label>
                  <input name="costPrice" type="number" defaultValue={prd?.costPrice ?? ''} className="w-full px-3 py-2 border border-slate-600 rounded-lg text-sm bg-slate-900 text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Unit</label>
                  <select name="unit" defaultValue={prd?.unit || 'PIECE'} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-900 border-slate-600 text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none">
                    <option value="PIECE">Piece</option>
                    <option value="KG">Kilogram</option>
                    <option value="LITRE">Litre</option>
                    <option value="PACK">Pack</option>
                    <option value="BOX">Box</option>
                    <option value="BOTTLE">Bottle</option>
                    <option value="SET">Set</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Stock Qty</label>
                  <input name="stockQuantity" type="number" defaultValue={prd?.stockQuantity ?? 0} required className="w-full px-3 py-2 border border-slate-600 rounded-lg text-sm bg-slate-900 text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Low Stock Alert At</label>
                  <input name="lowStockThreshold" type="number" defaultValue={prd?.lowStockThreshold ?? 5} className="w-full px-3 py-2 border border-slate-600 rounded-lg text-sm bg-slate-900 text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              </>
            )}
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="isActive" defaultChecked={item ? item.isActive : true} className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
            <span className="text-sm text-slate-700">Active (visible to customers)</span>
          </label>
          <div className="flex justify-end gap-3 pt-2 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg text-xs font-semibold hover:bg-slate-700/50 text-slate-600">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5">
              {createMutation.isPending && <Loader size={12} className="animate-spin" />}
              {item ? 'Save Changes' : `Add ${isService ? 'Service' : 'Product'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
