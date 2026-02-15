import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin, Plus, Edit, Trash2, Users, Search, Filter,
  Loader2, CheckCircle, XCircle, AlertCircle, Navigation
} from 'lucide-react';
import {
  getAttendanceLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  getLocationUsers,
  assignUserToLocation,
  unassignUserFromLocation
} from '../services/attendanceService';
import { useCabang } from '../../cabang/hooks/useCabang';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'

/**
 * LocationManagementPage Component
 * Admin page for managing attendance locations
 */
const LocationManagementPage = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [viewingUsers, setViewingUsers] = useState(null);
  const [notification, setNotification] = useState(null);

  // Fetch locations
  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAttendanceLocations({ search: searchTerm });
      setLocations(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load locations');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  // Load locations on mount and search change
  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchLocations();
    }, 500);
    return () => clearTimeout(debounce);
  }, [fetchLocations]);

  // Handle create/edit location
  const handleSaveLocation = async (locationData) => {
    try {
      if (editingLocation) {
        await updateLocation(editingLocation.id, locationData);
        showNotification('Location updated successfully', 'success');
      } else {
        await createLocation(locationData);
        showNotification('Location created successfully', 'success');
      }
      setShowModal(false);
      setEditingLocation(null);
      fetchLocations();
    } catch (err) {
      showNotification(err.message || 'Failed to save location', 'error');
    }
  };

  // Handle delete location
  const handleDeleteLocation = async (locationId) => {
    if (!confirm('Are you sure you want to delete this location?')) return;

    try {
      await deleteLocation(locationId);
      showNotification('Location deleted successfully', 'success');
      fetchLocations();
    } catch (err) {
      showNotification(err.message || 'Failed to delete location', 'error');
    }
  };

  // View location users
  const handleViewUsers = async (locationId) => {
    try {
      const response = await getLocationUsers(locationId);
      const users = Array.isArray(response) ? response : response.data || [];
      setViewingUsers({ locationId, users });
    } catch (err) {
      showNotification(err.message || 'Failed to load location users', 'error');
    }
  };

  // Show notification
  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Attendance Locations</h1>
              <p className="text-gray-600 mt-1">Manage geofencing areas for employee attendance</p>
            </div>
            <button
              onClick={() => { setEditingLocation(null); setShowModal(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Location
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              notification.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <p className={`flex-1 ${notification.type === 'success' ? 'text-green-900' : 'text-red-900'}`}>
              {notification.message}
            </p>
            <button onClick={() => setNotification(null)} className="text-gray-600 hover:text-gray-800">×</button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-900">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}

        {/* Locations Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.map((location) => (
              <LocationCard
                key={location.id}
                location={location}
                onEdit={() => { setEditingLocation(location); setShowModal(true); }}
                onDelete={() => handleDeleteLocation(location.id)}
                onViewUsers={() => handleViewUsers(location.id)}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && locations.length === 0 && !error && (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No locations found</h3>
            <p className="text-gray-600 mb-4">Create your first attendance location to get started</p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Location
            </button>
          </div>
        )}
      </div>

      {/* Location Form Modal */}
      {showModal && (
        <LocationFormModal
          location={editingLocation}
          onSave={handleSaveLocation}
          onClose={() => { setShowModal(false); setEditingLocation(null); }}
        />
      )}

      {/* Users Modal */}
      {viewingUsers && (
        <LocationUsersModal
          locationId={viewingUsers.locationId}
          users={viewingUsers.users}
          onClose={() => {
             setViewingUsers(null);
             fetchLocations(); // Also refresh location list to update counts
          }}
          onUpdate={() => handleViewUsers(viewingUsers.locationId)}
        />
      )}
    </div>
  );
};

/**
 * Location Card Component
 */
const LocationCard = ({ location, onEdit, onDelete, onViewUsers }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${location.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
            <MapPin className={`w-5 h-5 ${location.isActive ? 'text-green-600' : 'text-green-600'}`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{location.nama}</h3>
            <p className="text-sm text-gray-600 truncate max-w-[200px]">{location.alamat}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          location.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {location.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-600 mb-4">
        <p>Latitude: {Number(location.latitude).toFixed(6)}</p>
        <p>Longitude: {Number(location.longitude).toFixed(6)}</p>
        <p>Radius: {location.radius}m</p>
        {location.requireFaceRecognition && (
          <p className="text-blue-600">✓ Face recognition required</p>
        )}
        {location.isRequireAssignment && (
          <p className="text-purple-600">✓ Assignment required</p>
        )}
        {location.cabang && (
             <p className="text-gray-500">Branch: {location.cabang.nama}</p>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <button
          onClick={onViewUsers}
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
        >
          <Users className="w-4 h-4" />
          {location._count?.userLokasiAbsensis || 0} users
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Recenter Map Component
 */
const RecenterMap = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

/**
 * Location Picker Component with Interactive Map
 */
const LocationPicker = ({ position, onPositionChange, radius }) => {
  // We don't need local state for marker position if we trust the parent's position
  // But to be safe and responsive, we can use it, or just use props.
  // Using props directly coupled with RecenterMap is cleaner.

  return (
    <>
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: '400px', width: '100%', borderRadius: '0.5rem', zIndex: 0 }}
        className="mb-4 text-left" // Added text-left to fix potential alignment issues
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap center={position} />
        <MapClickHandler onMapClick={(coords) => onPositionChange(coords)} />
        <Marker
          position={position}
          draggable={true}
          eventHandlers={{
            dragend: (e) => {
              const { lat, lng } = e.target.getLatLng();
              onPositionChange({ latitude: lat, longitude: lng });
            },
          }}
        >
          {/* Popup shows coordinates */}
          <Popup>
            <div className="text-sm">
              <div className="font-semibold">Selected Location</div>
              <div>Lat: {position[0].toFixed?.(6) || position[0]}</div>
              <div>Lng: {position[1].toFixed?.(6) || position[1]}</div>
              {radius && <div>Radius: {radius}m</div>}
            </div>
          </Popup>
        </Marker>

        {/* Circle for geofence radius */}
        {radius && (
          <CircleMarker
            center={position}
            radius={radius}
            pathOptions={{
              color: '#3b82f6',
              fillColor: '#3b82f6',
              fillOpacity: 0.1,
              weight: 2
            }}
          />
        )}
      </MapContainer>

      <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
        <Navigation className="w-4 h-4" />
        <span>Click map or drag marker to set location</span>
      </div>
    </>
  );
};

/**
 * Map Click Handler Component
 */
const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onMapClick({ latitude: lat, longitude: lng });
    }
  });

  return null;
};

/**
 * Circle Marker Component
 */
const CircleMarker = ({ center, radius, pathOptions }) => {
  const map = useMap();
  
  // Re-adding circle when center or radius changes
  useEffect(() => {
      if (!map) return;
      
      const circle = L.circle([center[0], center[1]], { radius, ...pathOptions }).addTo(map);
      
      return () => {
          circle.remove();
      };
  }, [map, center, radius, pathOptions]); // Add dependencies

  return null;
};

/**
 * Location Form Modal Component
 */
const LocationFormModal = ({ location, onSave, onClose }) => {
  const { allCabang, isLoading: isLoadingCabang } = useCabang();
  
  const [formData, setFormData] = useState(location || {
    nama: '',
    alamat: '',
    latitude: -6.2088,
    longitude: 106.8456,
    radius: 100,
    minFaceMatchScore: 0.75,
    requireFaceRecognition: false,
    isRequireAssignment: false,
    isActive: true,
    cabangId: '', // Default empty
  });

  // If editing, ensure we have the correct data structure
  useEffect(() => {
    if (location) {
        setFormData(prev => ({
            ...prev,
            ...location, // properties from location
            // Ensure boolean fields are boolean
            requireFaceRecognition: !!location.requireFaceRecognition,
            isRequireAssignment: !!location.isRequireAssignment,
            isActive: !!location.isActive,
            // Handle number fields
             minFaceMatchScore: location.minFaceMatchScore || 0.75,
             radius: location.radius || 100,
             // Handle branch ID
             cabangId: location.cabangId || location.cabang?.id || '',
        }));
    }
  }, [location]);


  const handlePositionChange = (coords) => {
    setFormData(prev => ({
      ...prev,
      latitude: coords.latitude,
      longitude: coords.longitude
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">{location ? 'Edit Location' : 'New Location'}</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location Name</label>
            <input
              type="text"
              required
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              placeholder="e.g., Main Office, Warehouse, Branch Store"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Branch (Cabang)</label>
             {isLoadingCabang ? (
                 <div className="text-sm text-gray-500">Loading branches...</div>
             ) : (
                <select
                    required
                    value={formData.cabangId}
                    onChange={(e) => setFormData({ ...formData, cabangId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Select Branch</option>
                    {allCabang?.map((cabang) => (
                        <option key={cabang.id} value={cabang.id}>
                            {cabang.namaCabang}
                        </option>
                    ))}
                </select>
             )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              value={formData.alamat}
              onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
              placeholder="Full address of the location"
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Interactive Map for Location Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📍 Select Location on Map
            </label>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <LocationPicker
                position={[formData.latitude, formData.longitude]}
                onPositionChange={handlePositionChange}
                radius={formData.radius}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                required
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                placeholder="-6.2088"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                required
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                placeholder="106.8456"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Geofence Radius (meters)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={formData.radius}
                onChange={(e) => setFormData({ ...formData, radius: parseInt(e.target.value) })}
                className="flex-1"
              />
              <span className="text-sm font-medium text-gray-900 w-20 text-right">{formData.radius}m</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Employees must be within this radius to clock in/out
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Face Match Score (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.5"
                max="1.0"
                value={formData.minFaceMatchScore}
                onChange={(e) => setFormData({ ...formData, minFaceMatchScore: parseFloat(e.target.value) })}
                placeholder="0.75"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum 75% similarity required
              </p>
            </div>
            <div className="flex flex-col justify-end space-y-2">
                 <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requireFaceRecognition}
                      onChange={(e) => setFormData({ ...formData, requireFaceRecognition: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span className="text-sm text-gray-700">Require face recognition</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={formData.isRequireAssignment}
                        onChange={(e) => setFormData({ ...formData, isRequireAssignment: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span className="text-sm text-gray-700">Require assignment</span>
                  </label>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <span className="text-sm font-medium text-gray-900">Active</span>
              <span className="text-sm text-gray-500">- Location can be used for attendance</span>
            </label>
          </div>
        </form>

        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {location ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Location Users Modal Component
 */
import { useUsers } from '../../users/hooks/useUsers';

/**
 * Location Users Modal Component
 */
const LocationUsersModal = ({ locationId, users, onClose, onUpdate }) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch all users for selection
  const { getUsersQuery } = useUsers();
  const { data: allUsersData, isLoading: isLoadingUsers } = getUsersQuery;
  const allUsers = allUsersData?.data || [];

  // Filter out users who are already assigned
  const availableUsers = allUsers.filter(
    user => !users.some(assignedUser => assignedUser.id === user.id)
  );

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;

    try {
      setIsSubmitting(true);
      await assignUserToLocation({
        userId: selectedUserId,
        lokasiAbsensiId: locationId,
        isDefault
      });
      setSelectedUserId('');
      setIsDefault(false);
      onUpdate(); // Refresh list
    } catch (error) {
      alert(error.message || 'Failed to assign user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnassign = async (userId) => {
    if (!confirm('Are you sure you want to remove this user from the location?')) return;

    try {
      await unassignUserFromLocation({
        userId,
        lokasiAbsensiId: locationId
      });
      onUpdate(); // Refresh list
    } catch (error) {
      alert(error.message || 'Failed to unassign user');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full flex flex-col max-h-[90vh]">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Manage Users</h2>
          <p className="text-sm text-gray-500 mt-1">Assign users to this location</p>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* Assign User Form */}
          <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Add User</h3>
            <form onSubmit={handleAssign} className="space-y-3">
              <div>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  disabled={isLoadingUsers || isSubmitting}
                >
                  <option value="">Select a user...</option>
                  {availableUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.namaLengkap || user.nama} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="text-sm text-gray-600">Set as default</span>
                </label>
                
                <button
                  type="submit"
                  disabled={!selectedUserId || isSubmitting}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Adding...' : 'Add'}
                </button>
              </div>
            </form>
          </div>

          {/* Assigned Users List */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Assigned Users ({users.length})</h3>
            {users.length === 0 ? (
              <p className="text-gray-500 text-center py-4 text-sm">No users assigned to this location</p>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <div key={user.assignmentId || user.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex-shrink-0 flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-xs">{(user.namaLengkap || user.nama || '?').charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{user.namaLengkap || user.nama}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      {user.isDefault && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-medium rounded-full">
                          Default
                        </span>
                      )}
                      <button
                        onClick={() => handleUnassign(user.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove user"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 rounded-b-lg flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationManagementPage;
