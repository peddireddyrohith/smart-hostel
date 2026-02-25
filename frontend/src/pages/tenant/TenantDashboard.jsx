import { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Link } from 'react-router-dom';
import {
  MdHome, MdPayment, MdReport, MdCheckCircle,
  MdWarning, MdArrowForward,
} from 'react-icons/md';

export default function TenantDashboard() {
  const { user } = useAuth();
  const [room, setRoom]       = useState(null);
  const [payment, setPayment] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/tenant/room'),
      api.get('/tenant/payments/current'),
      api.get('/tenant/complaints'),
    ]).then(([rRes, pRes, cRes]) => {
      setRoom(rRes.data.data);
      setPayment(pRes.data.data);
      setComplaints(cRes.data.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="spinner" />
    </div>
  );

  const openComplaints = complaints.filter(c => c.status !== 'resolved').length;

  return (
    <div>
      {/* Greeting */}
      <div className="page-header">
        <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
        <p className="page-subtitle">Here's a summary of your stay.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="stat-card">
          <div className="stat-icon bg-indigo-500/20 text-indigo-400"><MdHome size={22} /></div>
          <div>
            <p className="text-gray-400 text-sm">My Room</p>
            <p className="text-white text-xl font-bold">{room ? `Room ${room.roomNumber}` : 'Not Allocated'}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className={`stat-icon ${payment?.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
            <MdPayment size={22} />
          </div>
          <div>
            <p className="text-gray-400 text-sm">This Month's Rent</p>
            <p className="text-white text-xl font-bold">
              {payment ? `₹${payment.amount?.toLocaleString('en-IN')}` : '—'}
            </p>
            <p className={`text-xs font-medium mt-0.5 ${payment?.status === 'paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {payment?.status === 'paid' ? '✓ Paid' : payment ? '⚠ Pending' : 'No record'}
            </p>
          </div>
        </div>
        <div className="stat-card">
          <div className={`stat-icon ${openComplaints > 0 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
            <MdReport size={22} />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Open Complaints</p>
            <p className="text-white text-xl font-bold">{openComplaints}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room Details */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Room Details</h2>
            <Link to="/tenant/room" className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1">
              View <MdArrowForward size={16} />
            </Link>
          </div>
          {room ? (
            <div className="space-y-3">
              {[
                ['Room Number', `Room ${room.roomNumber}`],
                ['Type',        room.type],
                ['Floor',       `Floor ${room.floor}`],
                ['Monthly Rent', `₹${room.rent?.toLocaleString('en-IN')}`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className="text-white font-medium capitalize">{value}</span>
                </div>
              ))}
              {room.amenities?.length > 0 && (
                <div className="pt-2 flex flex-wrap gap-1.5">
                  {room.amenities.map(a => (
                    <span key={a} className="badge-purple capitalize">{a}</span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              <MdHome size={40} className="mx-auto mb-2 opacity-30" />
              <p>No room allocated yet.<br />Contact your admin.</p>
            </div>
          )}
        </div>

        {/* Payment Status */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">This Month's Payment</h2>
            <Link to="/tenant/payments" className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1">
              History <MdArrowForward size={16} />
            </Link>
          </div>
          {payment ? (
            <div className="space-y-3">
              {payment.status === 'paid' ? (
                <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <MdCheckCircle className="text-emerald-400" size={28} />
                  <div>
                    <p className="text-emerald-400 font-semibold">Rent Paid ✓</p>
                    <p className="text-gray-400 text-xs">Paid on {new Date(payment.paidAt).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <MdWarning className="text-amber-400" size={28} />
                  <div>
                    <p className="text-amber-400 font-semibold">Payment Pending</p>
                    <p className="text-gray-400 text-xs">Amount due: ₹{payment.amount?.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              )}
              {payment.status !== 'paid' && (
                <Link to="/tenant/payments" className="btn-primary w-full justify-center">
                  Pay Now
                </Link>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              <MdPayment size={40} className="mx-auto mb-2 opacity-30" />
              <p>No payment record for this month.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
