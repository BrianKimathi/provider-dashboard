"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Plus, Edit2, Trash2, ShieldCheck, Car, User, Navigation, FileSpreadsheet, Loader } from 'lucide-react';

const FleetOverviewMap = dynamic(() => import('./FleetOverviewMap'), {
  ssr: false,
  loading: () => <div className="h-[500px] w-full bg-slate-100 animate-pulse rounded-xl flex items-center justify-center">Loading Map...</div>
});

const RouteDefinitionMap = dynamic(() => import('./RouteDefinitionMap'), {
  ssr: false,
  loading: () => <div className="h-[500px] w-full bg-slate-100 animate-pulse rounded-xl flex items-center justify-center">Loading Map...</div>
});

interface Rider {
  id: number;
  name: string;
  status: string;
  vehicle: string;
  lat: number;
  lng: number;
}

interface Vehicle {
  id: string;
  type: string;
  capacity: string;
  status: string;
}

export default function FleetDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'vehicles' | 'drivers' | 'routes'>('overview');
  const [filter, setFilter] = useState('All');
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);

  // Core stateful lists for fleet
  const [riders, setRiders] = useState<Rider[]>([
    { id: 1, name: 'David Kiprop', status: 'ON_TRIP', vehicle: 'KDM 450A (Boda)', lat: -1.2644, lng: 36.8020 },
    { id: 2, name: 'John Kamau', status: 'AVAILABLE', vehicle: 'KCB 123X (Gari)', lat: -1.2921, lng: 36.8219 },
    { id: 3, name: 'Mercy Wambui', status: 'OFFLINE', vehicle: 'KDC 789Y (Boda)', lat: -1.2885, lng: 36.7940 },
  ]);

  const [vehicles, setVehicles] = useState<Vehicle[]>([
    { id: 'KDM 450A', type: 'Motorbike', capacity: '1 Pkg', status: 'Active' },
    { id: 'KCB 123X', type: 'Van', capacity: '500 kg', status: 'Active' },
    { id: 'KDC 789Y', type: 'Motorbike', capacity: '2 Pkg', status: 'Offline' },
  ]);

  // Form states
  const [newVehicle, setNewVehicle] = useState({ id: '', type: 'Motorbike', capacity: '', status: 'Active' });
  const [newDriver, setNewDriver] = useState({ name: '', vehicle: '', status: 'AVAILABLE' });

  const filteredRiders = filter === 'All' ? riders : riders.filter(r => r.status === filter);

  // Add Vehicle
  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicle.id || !newVehicle.capacity) return;
    setVehicles([...vehicles, newVehicle]);
    setNewVehicle({ id: '', type: 'Motorbike', capacity: '', status: 'Active' });
    setShowVehicleModal(false);
  };

  // Add Driver
  const handleAddDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriver.name || !newDriver.vehicle) return;
    const addedRider: Rider = {
      id: Date.now(),
      name: newDriver.name,
      status: newDriver.status,
      vehicle: newDriver.vehicle,
      lat: -1.2921 + (Math.random() - 0.5) * 0.05,
      lng: 36.8219 + (Math.random() - 0.5) * 0.05,
    };
    setRiders([...riders, addedRider]);
    setNewDriver({ name: '', vehicle: '', status: 'AVAILABLE' });
    setShowDriverModal(false);
  };

  // Delete Actions
  const handleDeleteVehicle = (id: string) => {
    if (confirm(`Are you sure you want to delete vehicle ${id}?`)) {
      setVehicles(vehicles.filter(v => v.id !== id));
    }
  };

  const handleDeleteDriver = (id: number) => {
    if (confirm('Are you sure you want to delete this driver?')) {
      setRiders(riders.filter(r => r.id !== id));
    }
  };

  // Export Data
  const handleExport = (format: 'csv' | 'excel') => {
    alert(`Exporting fleet manifest as ${format.toUpperCase()}...`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Fleet Management</h1>
          <p className="text-gray-500 mt-1">Monitor real-time routes, dispatch drivers, and manage compliance.</p>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => handleExport('csv')}
            className="flex items-center space-x-1.5 px-3 py-2 border rounded-lg bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
          >
            <FileSpreadsheet size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b">
        {(['overview', 'vehicles', 'drivers', 'routes'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 px-4 font-semibold text-sm capitalize transition-all ${
              activeTab === tab ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'overview' ? 'Live Maps' : tab}
          </button>
        ))}
      </div>

      {/* Live Map Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <FleetOverviewMap riders={filteredRiders} />
          </div>
          
          <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col h-[500px]">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Driver Status Feed</h2>
            
            <select 
              className="w-full border rounded-lg px-3 py-2 mb-4 bg-slate-50 text-slate-700 text-xs font-semibold outline-none"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="All">All Drivers</option>
              <option value="AVAILABLE">Available</option>
              <option value="ON_TRIP">On Trip</option>
              <option value="OFFLINE">Offline</option>
            </select>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {filteredRiders.map(rider => (
                <div key={rider.id} className="p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-xs text-gray-900">{rider.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wider ${
                      rider.status === 'AVAILABLE' ? 'bg-green-100 text-green-700 border border-green-300' :
                      rider.status === 'ON_TRIP' ? 'bg-blue-100 text-blue-700 border border-blue-300' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {rider.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 font-mono">{rider.vehicle}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Vehicles Manager Tab */}
      {activeTab === 'vehicles' && (
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Fleet Vehicles</h2>
            <button 
              onClick={() => setShowVehicleModal(true)}
              className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-all shadow-md shadow-emerald-500/10"
            >
              <Plus size={14} />
              <span>Add Vehicle</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 text-gray-500 font-semibold text-xs uppercase tracking-wider border-b">
                <tr>
                  <th className="px-6 py-4 text-left">Registration</th>
                  <th className="px-6 py-4 text-left">Type</th>
                  <th className="px-6 py-4 text-left">Capacity</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100 text-sm text-gray-800">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold font-mono text-slate-700">{v.id}</td>
                    <td className="px-6 py-4">{v.type}</td>
                    <td className="px-6 py-4">{v.capacity}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        v.status === 'Active' ? 'bg-green-50 text-green-700 border-green-300' : 'bg-red-50 text-red-700 border-red-300'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDeleteVehicle(v.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Drivers Manager Tab */}
      {activeTab === 'drivers' && (
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Fleet Drivers</h2>
            <button 
              onClick={() => setShowDriverModal(true)}
              className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-all shadow-md shadow-emerald-500/10"
            >
              <Plus size={14} />
              <span>Add Driver</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 text-gray-500 font-semibold text-xs uppercase tracking-wider border-b">
                <tr>
                  <th className="px-6 py-4 text-left">Name</th>
                  <th className="px-6 py-4 text-left">Assigned Vehicle</th>
                  <th className="px-6 py-4 text-left">Current Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100 text-sm text-gray-800">
                {riders.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-800">{r.name}</td>
                    <td className="px-6 py-4 font-mono text-slate-500 text-xs">{r.vehicle}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        r.status === 'AVAILABLE' ? 'bg-green-50 text-green-700 border-green-300' : 'bg-blue-50 text-blue-700 border-blue-300'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDeleteDriver(r.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Routes Map Definition */}
      {activeTab === 'routes' && (
        <div className="bg-white rounded-xl border p-4 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1">
            <Navigation size={16} className="text-emerald-600" />
            <span>Transit Routes</span>
          </h2>
          <RouteDefinitionMap />
        </div>
      )}

      {/* Vehicle Form Modal */}
      {showVehicleModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full border shadow-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Car className="text-emerald-600" size={18} />
                <span>Add Fleet Vehicle</span>
              </h3>
              <button 
                onClick={() => setShowVehicleModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddVehicle} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Registration ID</label>
                <input 
                  type="text" 
                  value={newVehicle.id}
                  onChange={(e) => setNewVehicle({ ...newVehicle, id: e.target.value.toUpperCase() })}
                  placeholder="e.g. KDM 450A"
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Vehicle Type</label>
                <select 
                  value={newVehicle.type}
                  onChange={(e) => setNewVehicle({ ...newVehicle, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Motorbike">Motorbike</option>
                  <option value="Van">Van</option>
                  <option value="Sedan">Sedan</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Payload Capacity</label>
                <input 
                  type="text" 
                  value={newVehicle.capacity}
                  onChange={(e) => setNewVehicle({ ...newVehicle, capacity: e.target.value })}
                  placeholder="e.g. 500 kg or 2 Pkg"
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowVehicleModal(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-all shadow-md shadow-emerald-500/10"
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Driver Form Modal */}
      {showDriverModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full border shadow-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <User className="text-emerald-600" size={18} />
                <span>Register Fleet Driver</span>
              </h3>
              <button 
                onClick={() => setShowDriverModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddDriver} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Driver Name</label>
                <input 
                  type="text" 
                  value={newDriver.name}
                  onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })}
                  placeholder="e.g. Timothy Murithi"
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Assigned Vehicle</label>
                <select 
                  value={newDriver.vehicle}
                  onChange={(e) => setNewDriver({ ...newDriver, vehicle: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="">Select Vehicle</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={`${v.id} (${v.type})`}>{v.id} ({v.type})</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowDriverModal(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-all shadow-md shadow-emerald-500/10"
                >
                  Register Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
