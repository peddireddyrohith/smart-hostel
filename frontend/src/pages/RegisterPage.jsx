import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/axios.js';
import toast from 'react-hot-toast';
import {
  MdPerson, MdEmail, MdLock, MdPhone, MdApartment,
  MdVisibility, MdVisibilityOff,
} from 'react-icons/md';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'tenant' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      login(data.user, data.accessToken);
      toast.success(`Account created! Welcome, ${data.user.name}! 🎉`);
      navigate(data.user.role === 'admin' ? '/admin/dashboard' : '/tenant/dashboard');
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors?.length) {
        errors.forEach((e) => toast.error(e.message));
      } else {
        toast.error(err.response?.data?.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background blobs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-lg shadow-indigo-900/50">
            <MdApartment size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Create Account</h1>
          <p className="text-gray-400 mt-1">Join Smart Hostel today</p>
        </div>

        {/* Card */}
        <div className="glass p-8">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name */}
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <MdPerson className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input name="name" value={form.name} onChange={handleChange}
                  placeholder="Enter your full name" className="input pl-10" required />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <MdEmail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="Enter your email" className="input pl-10" required />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="label">Phone <span className="text-gray-600">(optional)</span></label>
              <div className="relative">
                <MdPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input name="phone" value={form.phone} onChange={handleChange}
                  placeholder="Enter your phone number" className="input pl-10" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <MdLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input type={showPass ? 'text' : 'password'} name="password" value={form.password}
                  onChange={handleChange} placeholder="Min 6 characters" className="input pl-10 pr-10" required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPass ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                </button>
              </div>
            </div>

            {/* Role Toggle */}
            <div>
              <label className="label">Register as</label>
              <div className="grid grid-cols-2 gap-3">
                {['tenant', 'admin'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm({ ...form, role: r })}
                    className={`py-2.5 rounded-xl border font-medium text-sm transition-all duration-200 capitalize ${
                      form.role === r
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-900/30'
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    {r === 'admin' ? '⚡ Admin' : '🏠 Tenant'}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base mt-2">
              {loading
                ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
