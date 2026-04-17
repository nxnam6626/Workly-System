'use client';

import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, Loader2 } from 'lucide-react';

// Fix standard Leaflet Marker icon issues in Next.js
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function LocationMarker({ position, setPosition }: any) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={icon} />
  );
}

function MapUpdater({ position }: { position: L.LatLngExpression | null }) {
  const map = useMap();
  if (position) {
    map.flyTo(position, map.getZoom());
  }
  return null;
}

interface MapPickerProps {
  onSelect: (lat: number, lng: number) => void;
  onClose: () => void;
}

export default function MapPicker({ onSelect, onClose }: MapPickerProps) {
  // Default to a central location in Vietnam (e.g., Ho Chi Minh City)
  const [position, setPosition] = useState<L.LatLngExpression | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Initialize with a default center
  const center: L.LatLngExpression = [10.762622, 106.660172];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`, {
        headers: { 'User-Agent': 'Workly-System-Client' }
      });
      const data = await res.json();
      if (data && data.length > 0) {
        const newPos: L.LatLngExpression = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        setPosition(newPos);
      } else {
        alert('Không tìm thấy địa điểm này. Vui lòng thử từ khóa khác.');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Đã xảy ra lỗi khi tìm kiếm.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
             <h3 className="text-lg font-bold text-slate-800">Chọn vị trí trên bản đồ</h3>
             <p className="text-xs text-slate-500 mt-1">Tìm kiếm và nhấp để thả ghim tương ứng với địa chỉ thực tế của chi nhánh.</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="p-3 bg-white border-b border-slate-100 relative z-20">
          <form onSubmit={handleSearch} className="flex gap-2 relative">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nhập tên đường, phường, quận, thành phố..."
              className="flex-1 h-10 px-4 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <button 
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="px-4 h-10 bg-indigo-50 text-indigo-700 font-semibold rounded-xl text-sm hover:bg-indigo-100 disabled:opacity-50 transition-colors flex items-center gap-2 border border-indigo-100"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tìm kiếm'}
            </button>
          </form>
        </div>

        <div className="h-[400px] w-full relative bg-slate-100 z-10">
          <MapContainer center={center} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%', zIndex: 10 }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={position} setPosition={setPosition} />
            <MapUpdater position={position} />
          </MapContainer>
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white relative z-20">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition-colors"
          >
            Hủy
          </button>
          <button 
            type="button"
            onClick={() => {
              if (position) {
                const pos = position as any;
                // handle when position is array or LatLng object
                const lat = typeof pos.lat === 'number' ? pos.lat : pos[0];
                const lng = typeof pos.lng === 'number' ? pos.lng : pos[1];
                onSelect(lat, lng);
              } else {
                 alert('Vui lòng click chọn 1 điểm trên bản đồ!');
              }
            }}
            disabled={!position}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl text-sm transition-colors shadow-sm"
          >
            Xác Nhận Toạ Độ
          </button>
        </div>
      </div>
    </div>
  );
}
