import React, { useState, useEffect, useRef } from "react";
import { MapPin, Navigation } from "lucide-react";

// Note: This component uses Leaflet for map visualization.
// You'll need to install these packages:
// npm install leaflet react-leaflet

// Import these in your actual implementation
// import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from "react-leaflet";
// import "leaflet/dist/leaflet.css";
// import L from "leaflet";

const CabangMap = ({
  latitude,
  longitude,
  radiusGeofence = 100,
  editable = false,
  onLocationChange,
  onRadiusChange,
  width = "100%",
  height = "400px",
  className = "",
}) => {
  const [position, setPosition] = useState({
    lat: latitude || -6.175392,
    lng: longitude || 106.827153,
  });
  const [radius, setRadius] = useState(radiusGeofence);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const mapRef = useRef(null);

  // For demonstration without actual map libraries
  const isDemoMode = true;

  // Update position when props change
  useEffect(() => {
    if (latitude && longitude) {
      setPosition({
        lat: parseFloat(latitude),
        lng: parseFloat(longitude),
      });
    }
  }, [latitude, longitude]);

  // Update radius when prop changes
  useEffect(() => {
    if (radiusGeofence) {
      setRadius(parseInt(radiusGeofence));
    }
  }, [radiusGeofence]);

  // Get user's current location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });

          if (editable) {
            setPosition({ lat: latitude, lng: longitude });
            onLocationChange &&
              onLocationChange({ lat: latitude, lng: longitude });
          }

          // If using actual map library, you would center the map here
          // mapRef.current?.setView([latitude, longitude], 15);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert(
            "Tidak dapat mengakses lokasi Anda. Pastikan izin lokasi diaktifkan."
          );
        }
      );
    } else {
      alert("Geolocation tidak didukung oleh browser Anda.");
    }
  };

  // Handle map click for editable mode
  const handleMapClick = (e) => {
    if (!editable) return;

    // In a real implementation, this would use actual map click coordinates
    // For demo, just log the action
    console.log("Map clicked at position:", e);

    // Update position and notify parent
    const newPosition = { lat: e.lat, lng: e.lng };
    setPosition(newPosition);
    onLocationChange && onLocationChange(newPosition);
  };

  // Handle radius change
  const handleRadiusChange = (newRadius) => {
    setRadius(newRadius);
    onRadiusChange && onRadiusChange(newRadius);
  };

  // Format coordinates for display
  const formatCoordinate = (coord) => {
    return coord.toFixed(6);
  };

  if (isDemoMode) {
    // Demo implementation (for display without actual map libraries)
    return (
      <div
        className={`border rounded-lg overflow-hidden relative ${className}`}
        style={{ width, height, background: "#f0f0f0" }}
      >
        <div className="absolute top-3 right-3 z-10 bg-white rounded-lg shadow-md p-2">
          <div className="text-xs font-medium text-gray-700">Koordinat:</div>
          <div className="text-xs text-gray-600 mt-1">
            Lat: {formatCoordinate(position.lat)}
          </div>
          <div className="text-xs text-gray-600">
            Lng: {formatCoordinate(position.lng)}
          </div>
          <div className="text-xs font-medium text-gray-700 mt-2">
            Radius Geofence:
          </div>
          <div className="text-xs text-gray-600">{radius} meter</div>

          {editable && (
            <div className="mt-3">
              <input
                type="range"
                min="50"
                max="500"
                step="10"
                value={radius}
                onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          )}
        </div>

        {editable && (
          <div className="absolute bottom-3 right-3 z-10">
            <button
              onClick={getUserLocation}
              className="bg-indigo-600 text-white p-2 rounded-full shadow-md hover:bg-indigo-700"
              title="Gunakan Lokasi Saat Ini"
            >
              <Navigation className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-center h-full">
          {isMapLoaded ? (
            <div className="text-gray-400">
              Map would be displayed here with marker at
              <br />
              Lat: {formatCoordinate(position.lat)}, Lng:{" "}
              {formatCoordinate(position.lng)}
            </div>
          ) : (
            <div className="text-center">
              <MapPin className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
              <p className="text-gray-500">
                {editable
                  ? "Klik untuk memilih lokasi cabang"
                  : "Lokasi cabang"}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                {position.lat
                  ? `${formatCoordinate(position.lat)}, ${formatCoordinate(
                      position.lng
                    )}`
                  : "Lokasi belum diatur"}
              </p>
              {!position.lat && (
                <button
                  onClick={getUserLocation}
                  className="mt-3 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-md text-sm flex items-center mx-auto"
                >
                  <Navigation className="h-4 w-4 mr-1" />
                  Gunakan Lokasi Saat Ini
                </button>
              )}
            </div>
          )}
        </div>

        {/* Actual implementation would render the map here using:
        <MapContainer
          center={[position.lat, position.lng]}
          zoom={15}
          style={{ height: "100%", width: "100%" }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[position.lat, position.lng]} />
          <Circle 
            center={[position.lat, position.lng]}
            radius={radius}
            pathOptions={{ color: "indigo", fillColor: "indigo", fillOpacity: 0.2 }}
          />
          {editable && <LocationMarker onLocationChange={handleMapClick} />}
        </MapContainer>
        */}
      </div>
    );
  }

  // The actual implementation would return the real map component here
  return null;
};

export default CabangMap;
