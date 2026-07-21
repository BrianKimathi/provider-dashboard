"use client";

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Rider {
  id: number;
  name: string;
  status: string;
  vehicle: string;
  lat: number;
  lng: number;
}

export default function FleetOverviewMap({ riders }: { riders: Rider[] }) {
  return (
    <div className="h-[500px] w-full rounded-xl overflow-hidden border shadow-sm z-0 relative">
      <MapContainer
        center={[-1.2921, 36.8219]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {riders.map((rider) => (
          <Marker key={rider.id} position={[rider.lat, rider.lng]}>
            <Popup>
              <div className="text-sm">
                <strong className="block text-base mb-1">{rider.name}</strong>
                <span className="block text-gray-600 mb-1">Status: <span className="font-medium text-gray-900">{rider.status}</span></span>
                <span className="block text-gray-600">Vehicle: {rider.vehicle}</span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
