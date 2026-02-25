import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import { MdMenu } from 'react-icons/md';
import { useAuth } from '../context/AuthContext.jsx';
import NotificationDropdown from './NotificationDropdown.jsx';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Header Bar */}
        <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 lg:px-6 flex-shrink-0">

          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <MdMenu size={22} />
          </button>

          {/* Page title area (left side on desktop) */}
          <div className="hidden lg:block" />

          {/* Right side: notifications + avatar */}
          <div className="flex items-center gap-3 ml-auto">
            <NotificationDropdown />

            {/* User Avatar */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-300">
                {user?.name}
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
