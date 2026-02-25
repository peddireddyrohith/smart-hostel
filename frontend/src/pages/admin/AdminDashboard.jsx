import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import api from '../../api/axios.js';
import {
  MdMeetingRoom, MdPeople, MdPayment, MdReport,
  MdCheckCircle, MdTrendingUp,
} from 'react-icons/md';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(res => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="spinner" />
    </div>
  );

  const stats = [
    { label: 'Total Rooms',     value: data?.totalRooms,     icon: <MdMeetingRoom size={22} />, color: 'bg-blue-500/20 text-blue-400' },
    { label: 'Occupied Rooms',  value: data?.occupiedRooms,  icon: <MdCheckCircle size={22} />, color: 'bg-green-500/20 text-green-400' },
    { label: 'Available Rooms', value: data?.availableRooms, icon: <MdMeetingRoom size={22} />, color: 'bg-indigo-500/20 text-indigo-400' },
    { label: 'Total Tenants',   value: data?.totalTenants,   icon: <MdPeople size={22} />,      color: 'bg-purple-500/20 text-purple-400' },
    { label: 'Open Complaints', value: data?.openComplaints, icon: <MdReport size={22} />,      color: 'bg-amber-500/20 text-amber-400' },
    { label: 'Total Revenue',   value: `₹${(data?.totalRevenue || 0).toLocaleString('en-IN')}`, icon: <MdTrendingUp size={22} />, color: 'bg-emerald-500/20 text-emerald-400' },
  ];

  // Build chart labels and data from monthly revenue
  const chartLabels = data?.monthlyRevenue?.map(m => `${MONTHS[m._id.month - 1]} ${m._id.year}`) || [];
  const chartValues = data?.monthlyRevenue?.map(m => m.total) || [];

  const chartData = {
    labels: chartLabels,
    datasets: [{
      label: 'Revenue (₹)',
      data: chartValues,
      fill: true,
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.15)',
      pointBackgroundColor: '#6366f1',
      pointRadius: 5,
      tension: 0.4,
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1f2937',
        borderColor: '#374151',
        borderWidth: 1,
        titleColor: '#f9fafb',
        bodyColor: '#9ca3af',
        callbacks: { label: (ctx) => `₹${ctx.raw.toLocaleString('en-IN')}` },
      },
    },
    scales: {
      x: { grid: { color: '#1f2937' }, ticks: { color: '#6b7280' } },
      y: { grid: { color: '#1f2937' }, ticks: { color: '#6b7280', callback: (v) => `₹${v.toLocaleString()}` } },
    },
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back! Here's what's happening in your hostel.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map(({ label, value, icon, color }) => (
          <div key={label} className="stat-card">
            <div className={`stat-icon ${color}`}>{icon}</div>
            <div>
              <p className="text-gray-400 text-sm">{label}</p>
              <p className="text-white text-2xl font-bold mt-0.5">{value ?? '—'}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white font-semibold text-lg">Monthly Revenue</h2>
            <p className="text-gray-500 text-sm">Last 6 months</p>
          </div>
          <span className="badge-purple">Chart.js</span>
        </div>
        {chartLabels.length > 0 ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <div className="text-center text-gray-600 py-12">No payment data yet</div>
        )}
      </div>
    </div>
  );
}
