import { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import {
  MdHome, MdMeetingRoom, MdLayers, MdCurrencyRupee,
  MdWifi, MdAcUnit, MdBathroom, MdSecurity, MdTv,
} from 'react-icons/md';

// Map amenity names to icons (fallback to a dot)
const amenityIcons = {
  wifi:              <MdWifi size={16} />,
  ac:                <MdAcUnit size={16} />,
  'attached bathroom': <MdBathroom size={16} />,
  bathroom:          <MdBathroom size={16} />,
  security:          <MdSecurity size={16} />,
  tv:                <MdTv size={16} />,
};

const typeColors = { single: 'badge-indigo', double: 'badge-purple', triple: 'badge-blue' };

export default function MyRoomPage() {
  const [room, setRoom]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tenant/room')
      .then(r => setRoom(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64"><div className="spinner" /></div>
  );

  if (!room) return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-600">
      <MdHome size={56} className="mb-3 opacity-30" />
      <h2 className="text-white font-semibold text-lg mb-1">No Room Allocated</h2>
      <p className="text-gray-500 text-sm">Please contact your admin to get a room assigned.</p>
    </div>
  );

  const details = [
    { icon: <MdMeetingRoom size={18} />,      label: 'Room Number',   value: `Room ${room.roomNumber}` },
    { icon: <MdHome size={18} />,             label: 'Type',          value: room.type },
    { icon: <MdLayers size={18} />,           label: 'Floor',         value: `Floor ${room.floor}` },
    { icon: <MdCurrencyRupee size={18} />,    label: 'Monthly Rent',  value: `₹${room.rent?.toLocaleString('en-IN')}` },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Room</h1>
        <p className="page-subtitle">Your current accommodation details</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main Room Card */}
        <div className="lg:col-span-2 card">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-800">
            <div className="w-16 h-16 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center">
              <MdHome size={30} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-white text-2xl font-bold">Room {room.roomNumber}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={typeColors[room.type] || 'badge-gray'}>{room.type}</span>
                <span className={room.status === 'occupied' ? 'badge-blue' : 'badge-green'}>{room.status}</span>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            {details.map(({ icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 p-4 bg-gray-800/50 rounded-xl">
                <span className="text-indigo-400 mt-0.5">{icon}</span>
                <div>
                  <p className="text-gray-500 text-xs">{label}</p>
                  <p className="text-white font-semibold capitalize mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Description */}
          {room.description && (
            <div className="mt-4 p-4 bg-gray-800/50 rounded-xl">
              <p className="text-gray-400 text-xs mb-1">Description</p>
              <p className="text-gray-300 text-sm">{room.description}</p>
            </div>
          )}
        </div>

        {/* Amenities Card */}
        <div className="card">
          <h3 className="text-white font-semibold mb-4">Amenities</h3>
          {room.amenities?.length > 0 ? (
            <div className="space-y-3">
              {room.amenities.map(a => (
                <div key={a} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
                  <span className="text-indigo-400">
                    {amenityIcons[a.toLowerCase()] || <span className="w-4 h-4 rounded-full bg-indigo-500 block" />}
                  </span>
                  <span className="text-gray-300 text-sm capitalize">{a}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-sm">No amenities listed.</p>
          )}

          {/* Quick Info */}
          <div className="mt-6 pt-5 border-t border-gray-800">
            <p className="text-gray-500 text-xs mb-3 uppercase tracking-wide font-semibold">Monthly Summary</p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Rent Due</span>
              <span className="text-white font-bold">₹{room.rent?.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-400">Due Date</span>
              <span className="text-amber-400 font-medium">5th of every month</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
