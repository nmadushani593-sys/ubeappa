import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { authAPI } from '../api';
import Avatar from '../components/common/Avatar';
import { useAuth } from '../context/AuthContext';

const initialForm = { name: '', email: '', password: '', role: 'agent' };

export default function Agents() {
  const { user } = useAuth();
  const [agents, setAgents] = useState([]);
  const [form, setForm] = useState(initialForm);

  const load = async () => {
    const response = await authAPI.getUsers();
    setAgents(response.data.users || []);
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      load().catch(() => toast.error('Failed to load agents'));
    }
  }, [user?.role]);

  if (user?.role !== 'admin') {
    return <div className="flex h-full items-center justify-center bg-[#0B141A] text-gray-500">Admins only.</div>;
  }

  const createAgent = async (event) => {
    event.preventDefault();
    try {
      await authAPI.register(form);
      setForm(initialForm);
      await load();
      toast.success('Agent created');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create agent');
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0B141A] p-6">
      <div className="grid gap-6 xl:grid-cols-[1.4fr_420px]">
        <div className="rounded-3xl border border-white/10 bg-[#111B21] p-5">
          <div className="mb-5 text-2xl font-semibold text-white">Agents</div>
          <div className="space-y-3">
            {agents.map((agent) => (
              <div key={agent._id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar name={agent.name} src={agent.avatar} />
                    <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#111B21] ${agent.status === 'online' ? 'bg-emerald-400' : agent.status === 'away' ? 'bg-amber-400' : 'bg-gray-500'}`} />
                  </div>
                  <div>
                    <div className="font-medium text-white">{agent.name}</div>
                    <div className="text-sm text-gray-400">{agent.email}</div>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-400">
                  <div>{agent.assignedConversations || 0} assigned</div>
                  <div>Last seen {formatDistanceToNow(new Date(agent.lastSeen || Date.now()), { addSuffix: true })}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-[#111B21] p-5">
          <div className="mb-5 text-xl font-semibold text-white">Create Agent</div>
          <form onSubmit={createAgent} className="space-y-4">
            <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Full name" className="w-full rounded-xl border border-white/10 bg-[#0B141A] px-4 py-3 text-white outline-none" required />
            <input value={form.email} type="email" onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} placeholder="Email" className="w-full rounded-xl border border-white/10 bg-[#0B141A] px-4 py-3 text-white outline-none" required />
            <input value={form.password} type="password" onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))} placeholder="Password" className="w-full rounded-xl border border-white/10 bg-[#0B141A] px-4 py-3 text-white outline-none" required />
            <select value={form.role} onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-[#0B141A] px-4 py-3 text-white outline-none">
              <option value="agent">agent</option>
              <option value="admin">admin</option>
            </select>
            <button className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-white">Create Agent</button>
          </form>
        </div>
      </div>
    </div>
  );
}
