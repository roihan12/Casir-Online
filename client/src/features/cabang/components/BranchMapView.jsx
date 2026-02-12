import React, { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import useAuthStore from "../../../app/store/useAuthStore";
import { useBranchMapOverview } from "../hooks/useCabangQueries";
import PulseIndicator from "./PulseIndicator";
import BranchMarkerPopup from "./BranchMarkerPopup";
import LastSyncIndicator from "./LastSyncIndicator";
import { Loader2 } from "lucide-react";

// Fix default marker icon issue in webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom colored marker icons
const createColoredIcon = (color, name) => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div class="relative group">
        <div class="w-8 h-8 rounded-full ${color} flex items-center justify-center shadow-lg border-2 border-white relative z-10">
          <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent ${color.replace(
          "bg-",
          "border-t-"
        )}"></div>
        <div class="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-white/95 backdrop-blur-sm rounded shadow-md text-[10px] font-bold text-gray-700 whitespace-nowrap border border-gray-100 z-20">
          ${name}
        </div>
      </div>
    `,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
  });
};

// Get marker color based on branch status and activity
const getMarkerColor = (branch) => {
  if (branch.status !== "ACTIVE") {
    return "bg-gray-400"; // Nonaktif - Abu
  }
  
  if (!branch.has_active_shift) {
    return "bg-red-500"; // Aktif tapi Shift Tutup - Merah
  }

  // Shift Aktif
  if (branch.today_transaction_count > 0) {
    return "bg-green-500"; // Shift Aktif & Ada Transaksi - Hijau
  }
  
  return "bg-blue-500"; // Shift Aktif & Belum Ada Transaksi - Biru
};

// Component to fit bounds to all markers
const FitBounds = ({ branches }) => {
  const map = useMap();

  useEffect(() => {
    if (branches && branches.length > 0) {
      const validBranches = branches.filter((b) => b.lat && b.lng);
      if (validBranches.length > 0) {
        const bounds = L.latLngBounds(
          validBranches.map((b) => [b.lat, b.lng])
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [branches, map]);

  return null;
};

const BranchMapView = ({ 
  onBranchClick, 
  height = "400px",
  className = "" 
}) => {
  const { user, isSuperAdmin } = useAuthStore();
  const { data, isLoading, error, refetch, dataUpdatedAt } = useBranchMapOverview();
  
  const branches = useMemo(() => {
    const allBranches = data?.data?.filter((b) => b.lat && b.lng) || [];
    
    if (isSuperAdmin()) {
      return allBranches;
    }
    
    // Get user's assigned branch IDs
    const userBranchIds = user?.cabang?.map(c => c.cabangId) || [];
    return allBranches.filter(b => userBranchIds.includes(b.branch_id));
  }, [data, user, isSuperAdmin]);

  // Default center (Indonesia)
  const defaultCenter = [-6.2, 106.8];
  const defaultZoom = 10;

  if (isLoading) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
        style={{ height }}
      >
        <div className="flex flex-col items-center text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin mb-2" />
          <span>Memuat peta...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-red-50 rounded-lg ${className}`}
        style={{ height }}
      >
        <div className="text-center text-red-600">
          <p className="font-medium">Gagal memuat data peta</p>
          <button 
            onClick={() => refetch()}
            className="mt-2 px-4 py-1 bg-red-100 rounded-md hover:bg-red-200"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden shadow-md z-0 ${className}`}>
      {/* Last Sync Indicator */}
      <div className="absolute top-3 right-3 z-[400]">
        <LastSyncIndicator 
          lastUpdated={dataUpdatedAt}
          onRefresh={refetch}
        />
      </div>

      {/* Map Container */}
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height, width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <FitBounds branches={branches} />

        {branches.map((branch) => {
          const colorClass = getMarkerColor(branch);
          const icon = createColoredIcon(colorClass, branch.name || "Cabang");

          return (
            <Marker
              key={branch.branch_id}
              position={[branch.lat, branch.lng]}
              icon={icon}
            >
              <Popup>
                <BranchMarkerPopup 
                  branch={branch} 
                  onViewDetail={() => onBranchClick?.(branch)}
                />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 z-[400] bg-white rounded-lg shadow-md p-2 text-xs">
        <div className="font-medium mb-1 text-gray-700">Legenda:</div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Buka & Ada Transaksi</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Buka (Belum Ada Transaksi)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Tutup (Shift Nonaktif)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            <span>Nonaktif</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchMapView;
