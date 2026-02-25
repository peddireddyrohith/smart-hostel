import { useState, useEffect, useRef } from 'react';
import { MdNotifications, MdCheck, MdCheckCircle, MdInfo, MdWarning, MdError } from 'react-icons/md';
import api from '../api/axios.js';
import toast from 'react-hot-toast';

const icons = {
  info: <MdInfo className="text-blue-400" size={20} />,
  success: <MdCheckCircle className="text-emerald-400" size={20} />,
  warning: <MdWarning className="text-amber-400" size={20} />,
  error: <MdError className="text-red-400" size={20} />,
};

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/auth/notifications');
      setNotifications(res.data.data);
      setUnreadCount(res.data.data.filter(n => !n.isRead).length);
    } catch (err) {
      console.error('Failed to load notifications');
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Optional: poll every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    if (!open) fetchNotifications();
    setOpen(!open);
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/auth/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      toast.error('Could not mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/auth/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      toast.error('Could not mark all as read');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={toggleDropdown}
        className={`relative p-2 rounded-lg transition-colors ${open ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
      >
        <MdNotifications size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500 text-[9px] items-center justify-center text-white font-bold pb-px">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="p-3 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
            <h3 className="font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-[25rem] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <MdNotifications size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800/50">
                {notifications.map(n => (
                  <div 
                    key={n._id} 
                    className={`p-3 hover:bg-gray-800/50 transition-colors flex gap-3 ${n.isRead ? 'opacity-70' : 'bg-indigo-500/5'}`}
                    onClick={() => !n.isRead && markAsRead(n._id)}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {icons[n.type] || icons.info}
                    </div>
                    <div className="flex-1 min-w-0 pb-1">
                      <div className="flex justify-between items-start mb-0.5 gap-2">
                        <p className={`text-sm tracking-tight ${n.isRead ? 'text-gray-300' : 'text-white font-medium'}`}>
                          {n.title}
                        </p>
                        <span className="text-[10px] text-gray-500 flex-shrink-0 mt-0.5">
                          {new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 leading-snug">{n.message}</p>
                    </div>
                    {!n.isRead && (
                      <div className="flex-shrink-0 flex items-center pt-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); markAsRead(n._id); }}
                          className="text-gray-500 hover:text-emerald-400 transition-colors"
                          title="Mark as read"
                        >
                          <MdCheck size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
