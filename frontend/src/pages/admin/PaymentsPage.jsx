import { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import toast from 'react-hot-toast';
import { MdCheckCircle, MdDownload, MdSearch } from 'react-icons/md';

const statusBadge = {
  paid:    'badge-green',
  pending: 'badge-yellow',
  overdue: 'badge-red',
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [marking, setMarking]   = useState(null);

  const fetchPayments = () => {
    api.get('/admin/payments')
      .then(r => setPayments(r.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPayments(); }, []);

  const filtered = payments.filter(p =>
    p.tenant?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.room?.roomNumber?.includes(search)
  );

  const markPaid = async (id) => {
    setMarking(id);
    try {
      await api.put(`/admin/payments/${id}`);
      toast.success('Payment marked as paid! Receipt generated.');
      fetchPayments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setMarking(null);
    }
  };

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="page-subtitle">Track and manage rent payments</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl px-3">
          <MdSearch className="text-gray-500" size={18} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by tenant or room..."
            className="bg-transparent py-2 text-sm text-gray-300 placeholder-gray-500 outline-none w-52"
          />
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Tenant</th><th>Room</th><th>Month</th>
                <th>Amount</th><th>Status</th><th>Paid At</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10"><div className="spinner mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-gray-600 py-10">No payments found.</td></tr>
              ) : filtered.map(p => (
                <tr key={p._id}>
                  <td>
                    <div>
                      <p className="text-white font-medium text-sm">{p.tenant?.name}</p>
                      <p className="text-gray-500 text-xs">{p.tenant?.email}</p>
                    </div>
                  </td>
                  <td><span className="badge-blue">Room {p.room?.roomNumber}</span></td>
                  <td className="text-gray-300">
                    {MONTHS[(p.month ?? 1) - 1]} {p.year}
                  </td>
                  <td className="font-semibold text-white">
                    ₹{p.amount?.toLocaleString('en-IN')}
                  </td>
                  <td><span className={statusBadge[p.status] || 'badge-gray'}>{p.status}</span></td>
                  <td className="text-gray-400 text-xs">
                    {p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      {p.status !== 'paid' && (
                        <button
                          onClick={() => markPaid(p._id)}
                          disabled={marking === p._id}
                          className="btn-success py-1 px-2.5 text-xs"
                        >
                          {marking === p._id
                            ? <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                            : <><MdCheckCircle size={14} /> Mark Paid</>}
                        </button>
                      )}
                      {p.receiptFilename && (
                        <a
                          href={`/api/tenant/payments/${p._id}/receipt`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                          title="Download Receipt"
                        >
                          <MdDownload size={16} />
                        </a>
                      )}
                    </div>
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
