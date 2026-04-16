import { Send, StickyNote } from 'lucide-react';
import { useEffect, useRef } from 'react';

export default function MessageInput({ value, setValue, onSend, noteMode, setNoteMode, conversationId, socketRef, suggestions = [], onSuggestionClick, suggestionsLoading = false }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
  }, [value]);

  const handleSubmit = () => {
    if (!value.trim()) return;
    onSend();
  };

  return (
    <div className="border-t border-white/5 bg-[#202C33] p-4">
      <div className="mb-3 flex flex-wrap gap-2">
        {suggestionsLoading ? <span className="text-xs text-gray-500">Loading suggestions…</span> : suggestions.map((suggestion) => (
          <button key={suggestion} onClick={() => onSuggestionClick(suggestion)} className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-gray-300 transition hover:bg-emerald-500/15 hover:text-emerald-200">
            {suggestion}
          </button>
        ))}
      </div>
      <div className={`flex items-end gap-3 rounded-2xl border px-3 py-3 ${noteMode ? 'border-amber-400/40 bg-amber-400/5' : 'border-white/10 bg-white/5'}`}>
        <button onClick={() => setNoteMode((prev) => !prev)} className={`rounded-xl p-3 transition ${noteMode ? 'bg-amber-400/20 text-amber-200' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
          <StickyNote className="h-5 w-5" />
        </button>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onFocus={() => socketRef?.current?.emit('typing:start', { conversationId })}
          onBlur={() => socketRef?.current?.emit('typing:stop', { conversationId })}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && event.ctrlKey) {
              event.preventDefault();
              handleSubmit();
            }
          }}
          rows={1}
          placeholder={noteMode ? 'Add internal note...' : 'Type a message...'}
          className="max-h-[120px] min-h-[42px] flex-1 resize-none border-0 bg-transparent text-sm text-white outline-none placeholder:text-gray-500"
        />
        <button onClick={handleSubmit} disabled={!value.trim()} className="rounded-xl bg-emerald-500 p-3 text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-900/50">
          <Send className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-2 text-[11px] text-gray-500">Ctrl+Enter to send. Shift+Enter for newline.</div>
    </div>
  );
}
