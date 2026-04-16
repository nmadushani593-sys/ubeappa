import { Bot, Check, CheckCheck, FileText } from 'lucide-react';
import { format } from 'date-fns';

function StatusTicks({ status }) {
  if (!status || status === 'pending') return null;
  if (status === 'sent') return <Check className="h-3.5 w-3.5" />;
  return <CheckCheck className={`h-3.5 w-3.5 ${status === 'read' ? 'text-sky-400' : ''}`} />;
}

export default function MessageBubble({ message }) {
  const isNote = message.isNote || message.type === 'note';
  const isCustomer = message.fromCustomer;
  const isAI = message.aiGenerated;
  const wrapper = isNote ? 'justify-center' : isCustomer ? 'justify-start' : 'justify-end';
  const bubble = isNote
    ? 'w-full bg-amber-400/15 border-amber-400/30 text-amber-100'
    : isCustomer
      ? 'bg-white text-gray-900 border-white/70'
      : isAI
        ? 'bg-sky-500/15 text-sky-50 border-sky-400/20'
        : 'bg-whatsapp-light text-gray-900 border-emerald-200';

  return (
    <div className={`flex ${wrapper}`}>
      <div className={`max-w-[85%] rounded-2xl border px-4 py-3 shadow-sm ${bubble}`}>
        {isNote && <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">🔒 Internal Note</div>}
        {isAI && !isNote && (
          <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-sky-500/20 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200">
            <Bot className="h-3 w-3" />
            AI
          </div>
        )}
        {message.mediaUrl && message.type === 'image' && <img src={message.mediaUrl} alt={message.caption || 'image'} className="mb-3 max-h-72 rounded-xl object-cover" />}
        {message.mediaUrl && message.type === 'audio' && <audio controls className="mb-3 w-full"><source src={message.mediaUrl} /></audio>}
        {message.type === 'document' && (
          <a href={message.mediaUrl || '#'} target="_blank" rel="noreferrer" className="mb-3 inline-flex items-center gap-2 rounded-xl bg-black/10 px-3 py-2 text-sm font-medium">
            <FileText className="h-4 w-4" />
            {message.content || 'View document'}
          </a>
        )}
        <div className="whitespace-pre-wrap break-words text-sm leading-6">{message.content || message.caption}</div>
        <div className="mt-2 flex items-center justify-end gap-1 text-[11px] text-gray-500">
          <span>{format(new Date(message.timestamp || message.createdAt || Date.now()), 'HH:mm')}</span>
          {!isCustomer && <StatusTicks status={message.status} />}
        </div>
      </div>
    </div>
  );
}
