import { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import toast from 'react-hot-toast';
import { MdAdd, MdClose, MdReport } from 'react-icons/md';

const statusBadge   = { open: 'badge-red', 'in-progress': 'badge-yellow', resolved: 'badge-green' };
const priorityBadge = { low: 'badge-gray', medium: 'badge-blue', high: 'badge-red' };
const categoryIcon  = { maintenance: '🔧', noise: '📢', cleanliness: '🧹', security: '🔒', other: '📝' };

const EMPTY = { title: '', description: '', category: 'maintenance' };

export default function MyComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(false);
  const [form, setForm]             = useState(EMPTY);
  const [saving, setSaving]         = useState(false);

  const fetchComplaints = () => {
    api.get('/tenant/complaints')
      .then(r => setComplaints(r.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchComplaints(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/tenant/complaints', form);
      toast.success('Complaint submitted! Admin will review it shortly.');
      setModal(false);
      setForm(EMPTY);
      fetchComplaints();
    } catch (err) {
      const res = err.response?.data;
      // Validation errors come back as { errors: [{field, message}] }
      const msg = res?.message
        || res?.errors?.[0]?.message
        || 'Failed to submit';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">My Complaints</h1>
          <p className="page-subtitle">Track and submit your complaints</p>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <MdAdd size={18} /> New Complaint
        </button>
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="spinner" /></div>
      ) : complaints.length === 0 ? (
        <div className="card text-center py-16">
          <MdReport size={48} className="mx-auto mb-3 text-gray-700" />
          <p className="text-white font-semibold mb-1">No Complaints Yet</p>
          <p className="text-gray-500 text-sm mb-5">Everything looking good? Submit an issue if something needs attention.</p>
          <button className="btn-primary mx-auto" onClick={() => setModal(true)}>
            <MdAdd size={18} /> Submit Complaint
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map(c => (
            <div key={c._id} className="card-hover">
              <div className="flex items-start justify-between gap-4">
                {/* Left */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="text-2xl mt-0.5 flex-shrink-0">{categoryIcon[c.category]}</div>
                  <div className="min-w-0">
                    <h3 className="text-white font-semibold truncate">{c.title}</h3>
                    <p className="text-gray-400 text-sm mt-0.5 line-clamp-2">{c.description}</p>
                    {c.adminRemarks && (
                      <div className="mt-2 p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                        <p className="text-indigo-300 text-xs font-medium mb-0.5">Admin Response:</p>
                        <p className="text-gray-300 text-sm">{c.adminRemarks}</p>
                      </div>
                    )}
                  </div>
                </div>
                {/* Right: badges + date */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className={statusBadge[c.status]}>{c.status}</span>
                  <span className={priorityBadge[c.priority]}>{c.priority}</span>
                  <p className="text-gray-600 text-xs">
                    {new Date(c.createdAt).toLocaleDateString('en-IN')}
                  </p>
                  {c.resolvedAt && (
                    <p className="text-emerald-500 text-xs">
                      Resolved {new Date(c.resolvedAt).toLocaleDateString('en-IN')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Complaint Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-semibold text-lg">Submit a Complaint</h2>
              <button onClick={() => setModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800">
                <MdClose size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Category</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="input">
                  <option value="maintenance">🔧 Maintenance</option>
                  <option value="noise">📢 Noise</option>
                  <option value="cleanliness">🧹 Cleanliness</option>
                  <option value="security">🔒 Security</option>
                  <option value="other">📝 Other</option>
                </select>
              </div>
              <div>
                <label className="label">Title</label>
                <input
                  value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                  className="input" placeholder="e.g. AC not working in room" required
                />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  className="input resize-none" rows={4} minLength={10}
                  placeholder="Describe the issue in detail (min 10 characters)..." required
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
