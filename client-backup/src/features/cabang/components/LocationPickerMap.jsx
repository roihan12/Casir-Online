import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { X, MapPin, Check } from "lucide-react";

// Fix default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom draggable marker icon
const markerIcon = L.divIcon({
  className: "custom-marker",
  html: `
    <div class="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white cursor-move">
      <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
      </svg>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Component to handle map clicks
const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng);
    },
  });
  return null;
};

// Component to recenter map
const RecenterMap = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

/**
 * Location Picker Map Component
 * Allows user to pick a location by clicking on the map
 * 
 * @param {boolean} isOpen - Whether the modal is open
 * @param {function} onClose - Callback when modal is closed
 * @param {function} onConfirm - Callback when location is confirmed (receives {lat, lng})
 * @param {number} initialLat - Initial latitude
 * @param {number} initialLng - Initial longitude
 */
const LocationPickerMap = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  initialLat, 
  initialLng 
}) => {
  const [selectedPosition, setSelectedPosition] = useState(null);
  
  // Default center (Indonesia - Jakarta)
  const defaultCenter = [-6.2088, 106.8456];
  
  useEffect(() => {
    if (isOpen) {
      // Set initial position if provided
      if (initialLat && initialLng) {
        setSelectedPosition({ lat: parseFloat(initialLat), lng: parseFloat(initialLng) });
      } else {
        setSelectedPosition(null);
      }
    }
  }, [isOpen, initialLat, initialLng]);

  const handleLocationSelect = (latlng) => {
    setSelectedPosition({ lat: latlng.lat, lng: latlng.lng });
  };

  const handleMarkerDrag = (e) => {
    const marker = e.target;
    const position = marker.getLatLng();
    setSelectedPosition({ lat: position.lat, lng: position.lng });
  };

  const handleConfirm = () => {
    if (selectedPosition) {
      onConfirm(selectedPosition);
      onClose();
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setSelectedPosition(newPos);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  if (!isOpen) return null;

  const mapCenter = selectedPosition 
    ? [selectedPosition.lat, selectedPosition.lng]
    : (initialLat && initialLng) 
      ? [parseFloat(initialLat), parseFloat(initialLng)]
      : defaultCenter;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="flex items-center gap-2 text-white">
            <MapPin className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Pilih Lokasi di Peta</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-1 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map Container */}
        <div className="h-[400px] relative">
          <MapContainer
            center={mapCenter}
            zoom={15}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapClickHandler onLocationSelect={handleLocationSelect} />
            <RecenterMap center={selectedPosition ? [selectedPosition.lat, selectedPosition.lng] : null} />

            {selectedPosition && (
              <Marker
                position={[selectedPosition.lat, selectedPosition.lng]}
                icon={markerIcon}
                draggable={true}
                eventHandlers={{
                  dragend: handleMarkerDrag,
                }}
              />
            )}
          </MapContainer>

          {/* Instructions overlay */}
          <div className="absolute top-3 left-3 bg-white rounded-lg shadow-md px-3 py-2 text-xs text-gray-600 z-[1000]">
            Klik pada peta untuk memilih lokasi, atau drag marker untuk menyesuaikan
          </div>
        </div>

        {/* Coordinates Display */}
        <div className="px-6 py-3 bg-gray-50 border-t">
          <div className="flex items-center justify-between">
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-gray-500">Latitude:</span>
                <span className="ml-2 font-mono font-medium text-gray-900">
                  {selectedPosition ? selectedPosition.lat.toFixed(8) : "-"}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Longitude:</span>
                <span className="ml-2 font-mono font-medium text-gray-900">
                  {selectedPosition ? selectedPosition.lng.toFixed(8) : "-"}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              className="text-xs bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-300 flex items-center gap-1"
            >
              <MapPin className="w-3 h-3" />
              Lokasi Saya
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedPosition}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              selectedPosition
                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <Check className="w-4 h-4" />
            Konfirmasi Lokasi
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPickerMap;
