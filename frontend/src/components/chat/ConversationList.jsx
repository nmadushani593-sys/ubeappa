import { Search } from 'lucide-react';
import ConversationItem from './ConversationItem';

const filters = ['all', 'open', 'pending', 'resolved'];

export default function ConversationList({ conversations, activeId, search, setSearch, filter, setFilter, onSelect }) {
  return (
    <div className="flex h-full flex-col border-r border-white/5 bg-[#111B21]">
      <div className="border-b border-white/5 p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search conversations"
            className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white outline-none ring-0 placeholder:text-gray-500 focus:border-emerald-500/40"
          />
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto">
          {filters.map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium uppercase tracking-[0.14em] ${filter === item ? 'bg-emerald-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {conversations.length ? conversations.map((conversation) => <ConversationItem key={conversation._id} conversation={conversation} active={activeId === conversation._id} onClick={() => onSelect(conversation)} />) : <div className="rounded-2xl border border-dashed border-white/10 p-5 text-center text-sm text-gray-400">No conversations found.</div>}
      </div>
    </div>
  );
}
