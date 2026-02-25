import { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import toast from 'react-hot-toast';
import { MdPeople, MdMeetingRoom, MdClose, MdSearch, MdPersonRemove, MdDelete } from 'react-icons/md';

export default function TenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [allocModal, setAllocModal] = useState(null); // stores selected tenant
  const [selectedRoom, setSelectedRoom] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [tRes, rRes] = await Promise.all([
        api.get('/admin/tenants'),
        api.get('/admin/rooms'),
      ]);
      setTenants(tRes.data.data);
      setRooms(rRes.data.data.filter(r => r.status === 'available'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = tenants.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleAllocate = async () => {
    if (!selectedRoom) return toast.error('Please select a room');
    setSaving(true);
    try {
      await api.put(`/admin/rooms/${selectedRoom}/allocate`, { tenantId: allocModal._id });
      toast.success(`Room allocated to ${allocModal.name}!`);
      fetchData();
      setAllocModal(null);
      setSelectedRoom('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Allocation failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (tenant) => {
    try {
      await api.put(`/admin/tenants/${tenant._id}`, { isActive: !tenant.isActive });
      toast.success(`Tenant ${tenant.isActive ? 'deactivated' : 'activated'}`);
      fetchData();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (tenant) => {
    if (!confirm(`Are you absolutely sure you want to delete ${tenant.name}? This will also delete their payments and complaints.`)) return;
    try {
      await api.delete(`/admin/tenants/${tenant._id}`);
      toast.success('Tenant deleted successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete tenant');
    }
  };

  const handleUnallocate = async (id, tenantName) => {
    if (!confirm(`Are you sure you want to remove ${tenantName} from their room?`)) return;
    try {
      await api.put(`/admin/rooms/${id}/unallocate`);
      toast.success('Room unallocated successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot unallocate');
    }
  };

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Tenants</h1>
          <p className="page-subtitle">Manage tenant accounts and room allocations</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl px-3">
          <MdSearch className="text-gray-500" size={18} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search tenants..."
            className="bg-transparent py-2 text-sm text-gray-300 placeholder-gray-500 outline-none w-48"
          />
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Tenant</th><th>Phone</th><th>Room</th>
                <th>Joined</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10"><div className="spinner mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-gray-600 py-10">No tenants found.</td></tr>
              ) : filtered.map(tenant => (
                <tr key={tenant._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {tenant.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{tenant.name}</p>
                        <p className="text-gray-500 text-xs">{tenant.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>{tenant.phone || <span className="text-gray-600">—</span>}</td>
                  <td>
                    {tenant.allocatedRoom
                      ? (
                          <div className="flex items-center gap-2">
                            <span className="badge-blue">Room {tenant.allocatedRoom.roomNumber}</span>
                            <button onClick={() => handleUnallocate(tenant.allocatedRoom._id, tenant.name)} className="text-gray-400 hover:text-amber-400 transition-colors" title={`Remove ${tenant.name} from room`}>
                              <MdPersonRemove size={14} />
                            </button>
                          </div>
                      )
                      : <button onClick={() => setAllocModal(tenant)} className="text-indigo-400 hover:text-indigo-300 text-xs flex items-center gap-1">
                          <MdMeetingRoom size={14} /> Allocate
                        </button>
                    }
                  </td>
                  <td className="text-gray-400 text-xs">
                    {new Date(tenant.joiningDate).toLocaleDateString('en-IN')}
                  </td>
                  <td>
                    <span className={tenant.isActive ? 'badge-green' : 'badge-red'}>
                      {tenant.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleStatus(tenant)}
                        className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
                          tenant.isActive
                            ? 'text-amber-400 hover:bg-amber-500/10'
                            : 'text-emerald-400 hover:bg-emerald-500/10'
                        }`}
                      >
                        {tenant.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      
                      {!tenant.isActive && !tenant.allocatedRoom && (
                        <button 
                          onClick={() => handleDelete(tenant)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete Tenant"
                        >
                          <MdDelete size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Allocate Room Modal */}
      {allocModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-semibold text-lg">Allocate Room</h2>
              <button onClick={() => setAllocModal(null)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800">
                <MdClose size={20} />
              </button>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl mb-5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                {allocModal.name.charAt(0)}
              </div>
              <div>
                <p className="text-white font-medium text-sm">{allocModal.name}</p>
                <p className="text-gray-500 text-xs">{allocModal.email}</p>
              </div>
            </div>
            <div className="mb-5">
              <label className="label">Select Available Room</label>
              <select value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)} className="input">
                <option value="">-- Choose a room --</option>
                {rooms.map(r => (
                  <option key={r._id} value={r._id}>
                    Room {r.roomNumber} — {r.type} — ₹{r.rent?.toLocaleString('en-IN')}/mo
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setAllocModal(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={handleAllocate} disabled={saving} className="btn-primary flex-1 justify-center">
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Allocate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
