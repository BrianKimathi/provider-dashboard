"use client";

import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapClickHandler({ onMapClick }: { onMapClick: (latlng: L.LatLng) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

export default function RouteDefinitionMap() {
  const [routePoints, setRoutePoints] = useState<[number, number][]>([]);

  const handleMapClick = (latlng: L.LatLng) => {
    setRoutePoints((prev) => [...prev, [latlng.lat, latlng.lng]]);
  };

  const clearRoute = () => setRoutePoints([]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Define Route</h2>
        <button 
          onClick={clearRoute}
          className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
        >
          Clear Route
        </button>
      </div>
      <p className="text-sm text-gray-500">Click on the map to add waypoints for your route.</p>
      
      <div className="h-[500px] w-full rounded-xl overflow-hidden border shadow-sm z-0 relative">
        <MapContainer
          center={[-1.2921, 36.8219]} // Nairobi
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapClickHandler onMapClick={handleMapClick} />
          
          {routePoints.map((point, idx) => (
            <Marker key={idx} position={point} />
          ))}
          
          {routePoints.length > 1 && (
            <Polyline positions={routePoints} color="#3b82f6" weight={4} />
          )}
        </MapContainer>
      </div>

      <div className="bg-white p-4 rounded-xl border">
        <h3 className="font-semibold mb-2">Waypoints</h3>
        <ul className="space-y-1 text-sm text-gray-600">
          {routePoints.map((p, i) => (
            <li key={i}>Point {i + 1}: {p[0].toFixed(4)}, {p[1].toFixed(4)}</li>
          ))}
          {routePoints.length === 0 && <li>No waypoints added yet.</li>}
        </ul>
      </div>
    </div>
  );
}
