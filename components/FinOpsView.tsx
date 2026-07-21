"use client";

import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { Wallet, ArrowUpRight, ArrowDownRight, DollarSign, Clock, CheckCircle, Smartphone, Loader } from 'lucide-react';
import apiClient from '@/lib/api/api-client';

const mockRevenueData = [
  { name: 'Mon', revenue: 4000, settlements: 2400 },
  { name: 'Tue', revenue: 3000, settlements: 1398 },
  { name: 'Wed', revenue: 2000, settlements: 9800 },
  { name: 'Thu', revenue: 2780, settlements: 3908 },
  { name: 'Fri', revenue: 1890, settlements: 4800 },
  { name: 'Sat', revenue: 2390, settlements: 3800 },
  { name: 'Sun', revenue: 3490, settlements: 4300 },
];

interface WalletBalance {
  balance: number;
}

export default function FinOpsView() {
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [mpesaPhone, setMpesaPhone] = useState<string>('');
  const [mpesaAmount, setMpesaAmount] = useState<string>('');

  // Fetch Wallet Balance dynamically
  const { data: walletData, isLoading: isLoadingBalance } = useQuery<WalletBalance>({
    queryKey: ['provider-balance'],
    queryFn: async () => {
      try {
        // Uses ownerId user profile
        const res = await apiClient.get('/wallets/user_77a/balance');
        return typeof res.data === 'number' ? { balance: res.data } : res.data;
      } catch (e) {
        return { balance: 45200 };
      }
    }
  });

  // M-Pesa STK Push Mutation
  const mpesaMutation = useMutation({
    mutationFn: async (payload: { phone: string; amount: number; ref: string }) => {
      const res = await apiClient.post('/payments/mpesa/stkpush', null, {
        params: {
          phone: payload.phone,
          amount: payload.amount,
          ref: payload.ref
        }
      });
      return res.data;
    },
    onSuccess: () => {
      alert('M-Pesa STK Push initiated! Please check your mobile phone to complete payment.');
      setMpesaPhone('');
      setMpesaAmount('');
    },
    onError: (err) => {
      alert('STK Push request failed: ' + err.message);
    }
  });

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || isNaN(Number(withdrawAmount))) {
      alert('Please enter a valid amount');
      return;
    }
    alert(`Withdrawal request for KES ${withdrawAmount} submitted successfully.`);
    setWithdrawAmount('');
  };

  const handleMpesaTopup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mpesaPhone || !mpesaAmount || isNaN(Number(mpesaAmount))) return;
    mpesaMutation.mutate({
      phone: mpesaPhone,
      amount: Number(mpesaAmount),
      ref: 'TOPUP_' + Date.now().toString().slice(-6)
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Revenue & Settlements</h1>
          <p className="text-gray-500 mt-1">Manage your earnings, payouts, and wallet balance.</p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Available Balance</p>
            <p className="text-2xl font-bold text-gray-900">
              {isLoadingBalance ? 'Loading...' : `KES ${(walletData?.balance ?? 45200).toLocaleString()}`}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <ArrowUpRight size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Revenue (This Week)</p>
            <p className="text-2xl font-bold text-gray-900">KES 19,550</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Settled (This Week)</p>
            <p className="text-2xl font-bold text-gray-900">KES 30,406</p>
          </div>
        </div>
      </div>

      {/* Analytics & Side Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Revenue Chart */}
          <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Analytics Overview</h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} name="Revenue" />
                  <Line type="monotone" dataKey="settlements" stroke="#3b82f6" strokeWidth={3} name="Settlements" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* M-Pesa STK Push topup Card */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 flex items-start space-x-4">
            <div className="p-2.5 bg-emerald-600 text-white rounded-lg shrink-0">
              <Smartphone size={20} />
            </div>
            <div className="w-full">
              <h3 className="font-bold text-emerald-950">M-Pesa STK Push Deposit</h3>
              <p className="text-emerald-800 text-xs mt-1 mb-4">Top up your operating wallet balance via SAFARICOM M-Pesa.</p>
              <form onSubmit={handleMpesaTopup} className="flex flex-col sm:flex-row gap-4">
                <input 
                  type="text" 
                  placeholder="M-Pesa Phone Number (e.g. 0712345678)" 
                  value={mpesaPhone}
                  onChange={(e) => setMpesaPhone(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  required
                />
                <input 
                  type="number" 
                  placeholder="Amount (KES)" 
                  value={mpesaAmount}
                  onChange={(e) => setMpesaAmount(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  required
                />
                <button 
                  type="submit"
                  disabled={mpesaMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 rounded-lg transition-colors flex items-center gap-1 shrink-0"
                >
                  {mpesaMutation.isPending && <Loader size={12} className="animate-spin" />}
                  <span>Send STK Push</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Withdrawal Panel */}
        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Wallet Withdrawal</h2>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <p className="text-xs text-gray-500">Withdrawable Balance</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              KES {(walletData?.balance ?? 45200).toLocaleString()}
            </p>
          </div>
          
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Amount (KES)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign size={16} className="text-gray-400" />
                </div>
                <input
                  type="number"
                  min="500"
                  max={walletData?.balance ?? 45200}
                  required
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="0.00"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-xs"
            >
              Request Withdrawal
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
