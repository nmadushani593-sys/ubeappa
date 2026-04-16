import { MessageCircle } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { user, login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/chat" />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Signed in');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111B21] px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#202C33] p-8 shadow-2xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
            <MessageCircle className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold text-white">WhatsApp Business Platform</h1>
          <p className="mt-2 text-sm text-gray-400">Sign in to manage conversations, automation, and phone numbers.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="Email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0B141A] px-4 py-3 text-white outline-none placeholder:text-gray-500" required />
          <input type="password" placeholder="Password" value={form.password} onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0B141A] px-4 py-3 text-white outline-none placeholder:text-gray-500" required />
          <button disabled={loading} className="w-full rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-60">
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500">First registered user becomes admin</p>
      </div>
    </div>
  );
}
