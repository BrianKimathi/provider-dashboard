"use client";

import React, { useState } from 'react';

const MOCK_QUEUE = [
  { id: 'V-1001', provider: 'Speedy MedTrans', vehicle: 'Toyota Hiace (KDG 123A)', type: 'Ambulance', status: 'Pending', submittedAt: '2026-06-28 08:30 AM' },
  { id: 'V-1002', provider: 'City Health Deliveries', vehicle: 'Honda Bike (KMC 456B)', type: 'Motorbike', status: 'Under Review', submittedAt: '2026-06-28 09:15 AM' },
  { id: 'V-1003', provider: 'Care Vans', vehicle: 'Nissan NV200 (KCE 789C)', type: 'Van', status: 'Pending', submittedAt: '2026-06-28 10:05 AM' },
  { id: 'V-1004', provider: 'Quick Aid Bikes', vehicle: 'TVS Bike (KMB 321D)', type: 'Motorbike', status: 'Approved', submittedAt: '2026-06-27 14:20 PM' },
  { id: 'V-1005', provider: 'Lifeline Ambulances', vehicle: 'Ford Transit (KDF 654E)', type: 'Ambulance', status: 'Rejected', submittedAt: '2026-06-27 11:10 AM' },
];

export default function VehicleVerificationQueue() {
  const [filter, setFilter] = useState('All');

  const filteredQueue = filter === 'All' ? MOCK_QUEUE : MOCK_QUEUE.filter(item => item.status === filter);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vehicle Verification Queue</h1>
          <p className="text-gray-500 mt-2">Manage and review vehicle verification requests.</p>
        </div>
        <div className="flex gap-3">
          <select 
            className="border rounded-md px-4 py-2 bg-white text-gray-700 shadow-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider / Owner</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredQueue.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.provider}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{item.vehicle}</div>
                  <div className="text-xs text-gray-500">{item.type}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.submittedAt}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    item.status === 'Approved' ? 'bg-green-100 text-green-800' :
                    item.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                    item.status === 'Under Review' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 mr-4">Review</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredQueue.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No verification requests found matching the selected filter.
          </div>
        )}
      </div>
    </div>
  );
}
