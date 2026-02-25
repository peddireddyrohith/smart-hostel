import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api/axios.js';
import toast from 'react-hot-toast';
import { MdDownload, MdPayment, MdCheckCircle, MdWarning } from 'react-icons/md';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const statusBadge = { paid: 'badge-green', pending: 'badge-yellow', overdue: 'badge-red' };

export default function MyPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [current, setCurrent]   = useState(null);
  const [room, setRoom]         = useState(null);  // null = no room allocated
  const [loading, setLoading]   = useState(true);
  const [paying, setPaying]     = useState(false);
  const location = useLocation();

  const fetchData = async () => {
    const [pRes, cRes, rRes] = await Promise.all([
      api.get('/tenant/payments'),
      api.get('/tenant/payments/current'),
      api.get('/tenant/room'),
    ]);
    setPayments(pRes.data.data);
    setCurrent(cRes.data.data);
    setRoom(rRes.data.data);   // null if no room assigned
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // Auto-verify when Cashfree redirects back with ?order_id=
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const orderId = params.get('order_id');
    if (!orderId) return;
    window.history.replaceState({}, '', '/tenant/payments'); // clean URL
    api.get(`/tenant/payments/verify/${orderId}`)
      .then(r => {
        if (r.data.status === 'paid') {
          toast.success('✅ Payment confirmed! Your rent is paid.');
          fetchData();
        } else {
          toast('⏳ Payment is processing...', { icon: '⏳' });
        }
      })
      .catch(() => toast.error('Could not verify payment'));
  }, [location.search]);


  // Initiate Cashfree payment — opens checkout in new tab using payment_session_id
  const handlePay = async () => {
    setPaying(true);
    try {
      const { data } = await api.post('/tenant/payments/initiate');
      // Load Cashfree SDK dynamically and open checkout
      if (!window.Cashfree) {
        await loadCashfreeSDK();
      }
      const cashfree = window.Cashfree({ mode: 'sandbox' });
      cashfree.checkout({
        paymentSessionId: data.paymentSessionId,
        returnUrl: `${window.location.origin}/tenant/payments?order_id=${data.orderId}`,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment initiation failed');
    } finally {
      setPaying(false);
    }
  };

  const downloadReceipt = async (paymentId, filename) => {
    try {
      const res = await api.get(`/tenant/payments/${paymentId}/receipt`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a   = document.createElement('a');
      a.href = url;
      a.download = filename || 'receipt.pdf';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Could not download receipt');
    }
  };

  const loadCashfreeSDK = () =>
    new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      script.onload = resolve;
      document.head.appendChild(script);
    });

  if (loading) return (
    <div className="flex items-center justify-center h-64"><div className="spinner" /></div>
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Payments</h1>
        <p className="page-subtitle">Your rent payment history</p>
      </div>

      {/* Current Month Banner — only show if tenant has a room */}
      {room && (current?.status === 'paid' ? (
        <div className="card mb-6 border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-center gap-3">
            <MdCheckCircle className="text-emerald-400" size={28} />
            <div>
              <p className="text-white font-semibold">This Month's Rent is Paid ✓</p>
              <p className="text-gray-400 text-sm">
                Paid on {new Date(current.paidAt).toLocaleDateString('en-IN')} — ₹{current.amount?.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="card mb-6 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <MdWarning className="text-amber-400" size={28} />
              <div>
                <p className="text-white font-semibold">Rent Due This Month</p>
                <p className="text-gray-400 text-sm">
                  {current
                    ? `${MONTHS[(current.month ?? 1) - 1]} ${current.year} — ₹${current.amount?.toLocaleString('en-IN')}`
                    : 'Click Pay Now to initiate payment for this month'}
                </p>
              </div>
            </div>
            <button onClick={handlePay} disabled={paying} className="btn-primary">
              {paying
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><MdPayment size={18} /> Pay Now</>}
            </button>
          </div>
        </div>
      ))}

      {/* Payment History Table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-white font-semibold">Payment History</h2>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Month</th><th>Amount</th><th>Status</th>
                <th>Payment ID</th><th>Paid On</th><th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-gray-600 py-10">No payments yet.</td></tr>
              ) : payments.map(p => (
                <tr key={p._id}>
                  <td className="font-medium text-white">
                    {MONTHS[(p.month ?? 1) - 1]} {p.year}
                  </td>
                  <td className="font-semibold text-white">₹{p.amount?.toLocaleString('en-IN')}</td>
                  <td><span className={statusBadge[p.status] || 'badge-gray'}>{p.status}</span></td>
                  <td>
                    <span className="font-mono text-xs text-gray-500">
                      {p.cashfreePaymentId || '—'}
                    </span>
                  </td>
                  <td className="text-gray-400 text-xs">
                    {p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td>
                    {p.receiptFilename ? (
                      <button
                        onClick={() => downloadReceipt(p._id, p.receiptFilename)}
                        className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-xs transition-colors"
                      >
                        <MdDownload size={14} /> Download
                      </button>
                    ) : <span className="text-gray-600">—</span>}
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
