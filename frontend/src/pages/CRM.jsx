import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Search } from 'lucide-react';
import { customersAPI } from '../api';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';

export default function CRM() {
  const [customers, setCustomers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');

  const load = async () => {
    const response = await customersAPI.getAll({ search, limit: 100 });
    setCustomers(response.data.customers || []);
  };

  useEffect(() => {
    load().catch(() => toast.error('Failed to load customers'));
  }, [search]);

  const openCustomer = async (customer) => {
    try {
      const response = await customersAPI.getOne(customer._id);
      setSelected(response.data);
    } catch {
      toast.error('Failed to load customer');
    }
  };

  return (
    <div className="flex h-full bg-[#0B141A]">
      <div className="w-full max-w-xl border-r border-white/5 bg-[#111B21] p-6">
        <div className="relative mb-5">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customers" className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white outline-none" />
        </div>
        <div className="space-y-3 overflow-y-auto">
          {customers.map((customer) => (
            <button key={customer._id} onClick={() => openCustomer(customer)} className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10">
              <Avatar name={customer.name} src={customer.avatar} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-white">{customer.name}</div>
                <div className="truncate text-sm text-gray-400">{customer.phone}</div>
              </div>
              <Badge color="blue">{customer.totalConversations || 0}</Badge>
            </button>
          ))}
        </div>
      </div>
      <div className={`fixed right-0 top-16 h-[calc(100%-4rem)] w-full max-w-xl border-l border-white/10 bg-[#111B21] p-6 shadow-2xl transition-transform ${selected ? 'translate-x-0' : 'translate-x-full'}`}>
        {selected && (
          <div className="h-full overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-2xl font-semibold text-white">{selected.customer.name}</div>
                <div className="text-sm text-gray-400">{selected.customer.phone}</div>
              </div>
              <button onClick={() => setSelected(null)} className="text-sm text-gray-400">Close</button>
            </div>
            <div className="mt-6 grid gap-6">
              <div className="rounded-3xl bg-white/5 p-5">
                <div className="mb-3 font-semibold text-white">Profile</div>
                <div className="space-y-2 text-sm text-gray-300">
                  <div>Email: {selected.customer.email || '—'}</div>
                  <div>Company: {selected.customer.company || '—'}</div>
                  <div>Country: {selected.customer.country || '—'}</div>
                  <div>WhatsApp name: {selected.customer.whatsappProfileName || '—'}</div>
                </div>
              </div>
              <div className="rounded-3xl bg-white/5 p-5">
                <div className="mb-3 font-semibold text-white">Tags</div>
                <div className="flex flex-wrap gap-2">{(selected.customer.tags || []).map((tag) => <Badge key={tag._id} color="green">{tag.name}</Badge>)}</div>
              </div>
              <div className="rounded-3xl bg-white/5 p-5">
                <div className="mb-3 font-semibold text-white">Conversations</div>
                <div className="space-y-3">{(selected.conversations || []).map((conversation) => <div key={conversation._id} className="rounded-2xl border border-white/10 p-3 text-sm text-gray-300"><div className="font-medium text-white">{conversation.phoneNumber?.displayName || 'Unknown number'}</div><div className="mt-1">{conversation.lastMessage?.content || 'No messages yet'}</div></div>)}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
