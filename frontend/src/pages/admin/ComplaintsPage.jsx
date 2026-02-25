import { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import toast from 'react-hot-toast';
import { MdClose } from 'react-icons/md';

const statusBadge   = { open: 'badge-red', 'in-progress': 'badge-yellow', resolved: 'badge-green' };
const priorityBadge = { low: 'badge-gray', medium: 'badge-blue', high: 'badge-red' };
const categoryIcon  = { maintenance: '🔧', noise: '📢', cleanliness: '🧹', security: '🔒', other: '📝' };

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(null);
  const [form, setForm]             = useState({ status: '', priority: '', adminRemarks: '' });
  const [saving, setSaving]         = useState(false);

  const fetchComplaints = () => {
    api.get('/admin/complaints')
      .then(r => setComplaints(r.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchComplaints(); }, []);

  const openModal = (c) => {
    setModal(c);
    setForm({ status: c.status, priority: c.priority, adminRemarks: c.adminRemarks || '' });
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/complaints/${modal._id}`, form);
      toast.success('Complaint updated!');
      fetchComplaints();
      setModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Complaints</h1>
        <p className="page-subtitle">Review and resolve tenant complaints</p>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Tenant</th><th>Room</th><th>Category</th>
                <th>Title</th><th>Priority</th><th>Status</th>
                <th>Date</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10"><div className="spinner mx-auto" /></td></tr>
              ) : complaints.length === 0 ? (
                <tr><td colSpan={8} className="text-center text-gray-600 py-10">No complaints found. 🎉</td></tr>
              ) : complaints.map(c => (
                <tr key={c._id}>
                  <td>
                    <p className="text-white text-sm font-medium">{c.tenant?.name}</p>
                    <p className="text-gray-500 text-xs">{c.tenant?.email}</p>
                  </td>
                  <td><span className="badge-blue">Room {c.room?.roomNumber}</span></td>
                  <td>
                    <span className="text-sm">{categoryIcon[c.category]} <span className="text-gray-400 capitalize">{c.category}</span></span>
                  </td>
                  <td className="max-w-[180px]">
                    <p className="text-white text-sm font-medium truncate">{c.title}</p>
                  </td>
                  <td><span className={priorityBadge[c.priority]}>{c.priority}</span></td>
                  <td><span className={statusBadge[c.status]}>{c.status}</span></td>
                  <td className="text-gray-400 text-xs">
                    {new Date(c.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td>
                    <button
                      onClick={() => openModal(c)}
                      className="text-xs font-medium text-indigo-400 hover:text-indigo-300 px-2.5 py-1 rounded-lg hover:bg-indigo-500/10 transition-colors"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-lg">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-lg">Manage Complaint</h2>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"><MdClose size={20} /></button>
            </div>

            {/* Complaint preview */}
            <div className="bg-gray-800 rounded-xl p-4 mb-5">
              <p className="text-white font-medium">{modal.title}</p>
              <p className="text-gray-400 text-sm mt-1">{modal.description}</p>
              <div className="flex gap-2 mt-2">
                <span className={categoryIcon[modal.category]}>{categoryIcon[modal.category]}</span>
                <span className="text-gray-500 text-xs capitalize">{modal.category}</span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-500 text-xs">by {modal.tenant?.name}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="input">
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
                <div>
                  <label className="label">Priority</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="input">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Admin Remarks</label>
                <textarea
                  value={form.adminRemarks}
                  onChange={e => setForm({...form, adminRemarks: e.target.value})}
                  className="input resize-none" rows={3}
                  placeholder="Add your response or resolution notes..."
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setModal(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button onClick={handleUpdate} disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Update'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
