import { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import toast from 'react-hot-toast';
import { MdAdd, MdEdit, MdDelete, MdPeople, MdClose, MdPersonRemove } from 'react-icons/md';

const EMPTY_FORM = { roomNumber: '', type: 'single', floor: 1, rent: '', amenities: '', description: '' };

const statusBadge = {
  available:   'badge-green',
  occupied:    'badge-blue',
  maintenance: 'badge-yellow',
};

export default function RoomsPage() {
  const [rooms, setRooms]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [editRoom, setEditRoom] = useState(null);
  const [form, setForm]       = useState(EMPTY_FORM);
  const [saving, setSaving]   = useState(false);

  const fetchRooms = () => {
    api.get('/admin/rooms')
      .then(r => setRooms(r.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRooms(); }, []);

  const openCreate = () => { setEditRoom(null); setForm(EMPTY_FORM); setModal(true); };
  const openEdit   = (room) => {
    setEditRoom(room);
    setForm({ ...room, amenities: room.amenities?.join(', ') || '' });
    setModal(true);
  };
  const closeModal = () => { setModal(false); setEditRoom(null); };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, amenities: form.amenities.split(',').map(a => a.trim()).filter(Boolean) };
    try {
      if (editRoom) {
        await api.put(`/admin/rooms/${editRoom._id}`, payload);
        toast.success('Room updated!');
      } else {
        await api.post('/admin/rooms', payload);
        toast.success('Room created!');
      }
      fetchRooms();
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this room?')) return;
    try {
      await api.delete(`/admin/rooms/${id}`);
      toast.success('Room deleted');
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete');
    }
  };

  const handleUnallocate = async (id) => {
    if (!confirm('Are you sure you want to remove the tenant from this room?')) return;
    try {
      await api.put(`/admin/rooms/${id}/unallocate`);
      toast.success('Tenant removed from room');
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot unallocate');
    }
  };

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Rooms</h1>
          <p className="page-subtitle">Manage hostel rooms and allocations</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <MdAdd size={18} /> Add Room
        </button>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Room No.</th><th>Type</th><th>Floor</th>
                <th>Rent</th><th>Status</th><th>Occupied By</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10"><div className="spinner mx-auto" /></td></tr>
              ) : rooms.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-gray-600 py-10">No rooms found. Add one!</td></tr>
              ) : rooms.map(room => (
                <tr key={room._id}>
                  <td className="font-semibold text-white">{room.roomNumber}</td>
                  <td className="capitalize">{room.type}</td>
                  <td>{room.floor}</td>
                  <td>₹{room.rent?.toLocaleString('en-IN')}</td>
                  <td><span className={statusBadge[room.status] || 'badge-gray'}>{room.status}</span></td>
                  <td>
                    {room.occupiedBy
                      ? <div className="flex items-center gap-1.5 text-indigo-400"><MdPeople size={14} />{room.occupiedBy.name}</div>
                      : <span className="text-gray-600">—</span>}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      {room.status === 'occupied' && (
                        <button onClick={() => handleUnallocate(room._id)} className="p-1.5 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors" title="Remove Tenant">
                          <MdPersonRemove size={16} />
                        </button>
                      )}
                      <button onClick={() => openEdit(room)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors" title="Edit">
                        <MdEdit size={16} />
                      </button>
                      <button onClick={() => handleDelete(room._id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                        <MdDelete size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-semibold text-lg">{editRoom ? 'Edit Room' : 'Add New Room'}</h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"><MdClose size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Room Number</label>
                  <input name="roomNumber" value={form.roomNumber} onChange={handleChange} className="input" placeholder="101" required />
                </div>
                <div>
                  <label className="label">Floor</label>
                  <input type="number" name="floor" value={form.floor} onChange={handleChange} className="input" min={1} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Type</label>
                  <select name="type" value={form.type} onChange={handleChange} className="input">
                    <option value="single">Single</option>
                    <option value="double">Double</option>
                    <option value="triple">Triple</option>
                  </select>
                </div>
                <div>
                  <label className="label">Monthly Rent (₹)</label>
                  <input type="number" name="rent" value={form.rent} onChange={handleChange} className="input" placeholder="5000" required />
                </div>
              </div>
              <div>
                <label className="label">Amenities <span className="text-gray-600">(comma separated)</span></label>
                <input name="amenities" value={form.amenities} onChange={handleChange} className="input" placeholder="wifi, ac, attached bathroom" />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} className="input resize-none" rows={2} placeholder="Optional notes..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : editRoom ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
