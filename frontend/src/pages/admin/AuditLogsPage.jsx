import { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import { MdCheckCircle, MdError, MdSearch } from 'react-icons/md';

const actionColors = {
  LOGIN:               'text-emerald-400',
  LOGOUT:              'text-gray-400',
  LOGIN_FAILED:        'text-red-400',
  REGISTER:            'text-blue-400',
  ROOM_CREATED:        'text-indigo-400',
  ROOM_ALLOCATED:      'text-purple-400',
  PAYMENT_MARKED_PAID: 'text-emerald-400',
};

export default function AuditLogsPage() {
  const [logs, setLogs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/admin/audit-logs')
      .then(r => setLogs(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(l =>
    l.action?.toLowerCase().includes(search.toLowerCase()) ||
    l.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Audit Logs</h1>
          <p className="page-subtitle">Security trail — last 100 events (auto-deleted after 90 days)</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl px-3">
          <MdSearch className="text-gray-500" size={18} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search action or user..."
            className="bg-transparent py-2 text-sm text-gray-300 placeholder-gray-500 outline-none w-48"
          />
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Status</th><th>Action</th><th>User</th>
                <th>Description</th><th>IP Address</th><th>Time</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10"><div className="spinner mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-gray-600 py-10">No logs found.</td></tr>
              ) : filtered.map(log => (
                <tr key={log._id}>
                  <td>
                    {log.status === 'success'
                      ? <MdCheckCircle className="text-emerald-400" size={18} />
                      : <MdError className="text-red-400" size={18} />}
                  </td>
                  <td>
                    <span className={`font-mono text-xs font-semibold ${actionColors[log.action] || 'text-gray-400'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td>
                    {log.user
                      ? <div>
                          <p className="text-white text-sm">{log.user.name}</p>
                          <p className="text-gray-500 text-xs capitalize">{log.user.role}</p>
                        </div>
                      : <span className="text-gray-600 text-sm">Anonymous</span>}
                  </td>
                  <td className="text-gray-400 text-sm max-w-[260px]">
                    <p className="truncate">{log.description}</p>
                  </td>
                  <td>
                    <span className="font-mono text-xs text-gray-500">{log.ipAddress || '—'}</span>
                  </td>
                  <td className="text-gray-400 text-xs whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
