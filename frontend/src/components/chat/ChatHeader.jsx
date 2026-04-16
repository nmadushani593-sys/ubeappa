import { CheckCheck, Phone, UserPlus } from 'lucide-react';
import Badge from '../common/Badge';
import Avatar from '../common/Avatar';

export default function ChatHeader({ conversation, agents = [], onAssign, onResolve }) {
  const customer = conversation?.customer || {};

  return (
    <div className="flex items-center justify-between border-b border-white/5 bg-[#202C33] px-5 py-4">
      <div className="flex items-center gap-3">
        <Avatar name={customer.name} src={customer.avatar} />
        <div>
          <div className="font-semibold text-white">{customer.name || customer.phone}</div>
          <div className="text-sm text-gray-400">{customer.phone}</div>
        </div>
        <Badge color={conversation?.status === 'resolved' ? 'green' : conversation?.status === 'pending' ? 'yellow' : 'blue'}>{conversation?.status || 'open'}</Badge>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm text-gray-300 lg:flex">
          <Phone className="h-4 w-4" />
          {conversation?.phoneNumber?.displayName || 'No sender number'}
        </div>
        <select
          value={conversation?.assignedAgent?._id || conversation?.assignedAgent || ''}
          onChange={(event) => onAssign(event.target.value)}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
        >
          <option value="">Unassigned</option>
          {agents.map((agent) => (
            <option key={agent._id} value={agent._id}>
              {agent.name}
            </option>
          ))}
        </select>
        <button onClick={onResolve} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400">
          <CheckCheck className="h-4 w-4" />
          Resolve
        </button>
        <div className="hidden rounded-xl bg-white/5 p-2 text-gray-400 xl:block">
          <UserPlus className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
