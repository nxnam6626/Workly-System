'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon path issues in Next.js
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

interface Branch {
  branchId: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  isVerified: boolean;
}

interface Props {
  branches: Branch[];
}

export default function JobMap({ branches }: Props) {
  useEffect(() => {
    // Re-trigger layout in case it's in a hidden container initially
    window.dispatchEvent(new Event('resize'));
  }, []);

  const verifiedBranches = branches.filter(b => b.isVerified && b.latitude && b.longitude);

  if (verifiedBranches.length === 0) {
    return (
      <div className="h-[300px] w-full rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200">
        <div className="text-center">
          <p className="text-slate-500 font-medium">Bản đồ không được hỗ trợ</p>
          <p className="text-sm text-slate-400 mt-1">Các chi nhánh của công ty chưa xác thực toạ độ trên bản đồ</p>
        </div>
      </div>
    );
  }

  // Calculate center based on the first verified branch
  const center: [number, number] = [verifiedBranches[0].latitude!, verifiedBranches[0].longitude!];

  return (
    <div className="h-[400px] w-full rounded-2xl overflow-hidden border border-slate-200 relative z-0">
      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={false} 
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {verifiedBranches.map((branch) => (
          <Marker 
            key={branch.branchId} 
            position={[branch.latitude!, branch.longitude!]} 
            icon={icon}
          >
            <Popup>
              <div className="font-sans">
                <h4 className="font-bold text-slate-900 mb-1">{branch.name}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{branch.address}</p>
                <div className="mt-2 text-[10px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-50 inline-block px-2 py-0.5 rounded">
                    Đã xác minh toạ độ
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
