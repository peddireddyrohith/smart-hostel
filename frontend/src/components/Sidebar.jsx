import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import {
  MdDashboard, MdMeetingRoom, MdPeople, MdPayment,
  MdReport, MdSecurity, MdLogout, MdApartment,
  MdHome, MdReceiptLong, MdReportProblem,
} from 'react-icons/md';

const adminLinks = [
  { to: '/admin/dashboard',  icon: <MdDashboard size={20} />,   label: 'Dashboard' },
  { to: '/admin/rooms',      icon: <MdMeetingRoom size={20} />,  label: 'Rooms' },
  { to: '/admin/tenants',    icon: <MdPeople size={20} />,       label: 'Tenants' },
  { to: '/admin/payments',   icon: <MdPayment size={20} />,      label: 'Payments' },
  { to: '/admin/complaints', icon: <MdReport size={20} />,       label: 'Complaints' },
  { to: '/admin/audit-logs', icon: <MdSecurity size={20} />,     label: 'Audit Logs' },
];

const tenantLinks = [
  { to: '/tenant/dashboard',  icon: <MdDashboard size={20} />,       label: 'Dashboard' },
  { to: '/tenant/room',       icon: <MdHome size={20} />,            label: 'My Room' },
  { to: '/tenant/payments',   icon: <MdReceiptLong size={20} />,     label: 'My Payments' },
  { to: '/tenant/complaints', icon: <MdReportProblem size={20} />,   label: 'My Complaints' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = user?.role === 'admin' ? adminLinks : tenantLinks;

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-800
        flex flex-col z-30 transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>

        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
              <MdApartment size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-sm leading-tight">Smart Hostel</h1>
              <p className="text-gray-500 text-xs">PG Management</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="px-4 py-4 border-b border-gray-800">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
              <span className={`text-xs font-medium ${user?.role === 'admin' ? 'text-indigo-400' : 'text-emerald-400'}`}>
                {user?.role === 'admin' ? '⚡ Admin' : '🏠 Tenant'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider px-2 mb-3">
            Navigation
          </p>
          {links.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
            >
              {icon}
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="nav-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <MdLogout size={20} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
