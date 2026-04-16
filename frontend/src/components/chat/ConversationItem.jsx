import { formatDistanceToNow } from 'date-fns';
import Avatar from '../common/Avatar';

export default function ConversationItem({ conversation, active, onClick }) {
  const customer = conversation.customer || {};
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border p-3 text-left transition ${active ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-transparent bg-white/5 hover:border-white/10 hover:bg-white/10'}`}
    >
      <div className="flex items-start gap-3">
        <Avatar name={customer.name} src={customer.avatar} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="truncate font-medium text-white">{customer.name || customer.phone}</div>
            <div className="shrink-0 text-[11px] text-gray-500">
              {conversation.lastMessage?.timestamp ? formatDistanceToNow(new Date(conversation.lastMessage.timestamp), { addSuffix: true }) : ''}
            </div>
          </div>
          <div className="mt-1 truncate text-sm text-gray-400">{conversation.lastMessage?.content || 'No messages yet'}</div>
          <div className="mt-2 flex items-center justify-between">
            <div className="text-xs uppercase tracking-[0.18em] text-gray-500">{conversation.status}</div>
            {conversation.unreadCount > 0 && <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-semibold text-white">{conversation.unreadCount}</span>}
          </div>
        </div>
      </div>
    </button>
  );
}
