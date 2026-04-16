import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';

export default function CustomerInfoPanel({ conversation, agents, tags, onSaveCustomer, onAddTag, onRemoveTag, onAssign, onAddNote, onOpenTemplate }) {
  const customer = conversation?.customer;
  const [form, setForm] = useState({ name: '', email: '', company: '', notes: '' });
  const [tagName, setTagName] = useState('');

  useEffect(() => {
    setForm({
      name: customer?.name || '',
      email: customer?.email || '',
      company: customer?.company || '',
      notes: customer?.notes || ''
    });
  }, [customer]);

  if (!conversation || !customer) {
    return <div className="flex h-full items-center justify-center border-l border-white/5 bg-[#111B21] p-6 text-center text-sm text-gray-500">Select a conversation to view customer details.</div>;
  }

  return (
    <div className="h-full overflow-y-auto border-l border-white/5 bg-[#111B21] p-5">
      <div className="rounded-3xl bg-white/5 p-5">
        <div className="flex flex-col items-center text-center">
          <Avatar name={customer.name} src={customer.avatar} size="lg" />
          <div className="mt-3 text-lg font-semibold text-white">{customer.name}</div>
          <div className="text-sm text-gray-400">{customer.phone}</div>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {(customer.tags || []).map((tag) => <Badge key={tag._id} color="green">{tag.name}</Badge>)}
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-4 rounded-3xl bg-white/5 p-5">
        <div className="grid gap-3">
          {[
            ['name', 'Name'],
            ['email', 'Email'],
            ['company', 'Company']
          ].map(([key, label]) => (
            <label key={key} className="block text-sm text-gray-300">
              <span className="mb-1 block">{label}</span>
              <input value={form[key]} onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-[#0B141A] px-3 py-2.5 text-white outline-none" />
            </label>
          ))}
          <label className="block text-sm text-gray-300">
            <span className="mb-1 block">Notes</span>
            <textarea value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} rows={4} className="w-full rounded-xl border border-white/10 bg-[#0B141A] px-3 py-2.5 text-white outline-none" />
          </label>
          <button onClick={() => onSaveCustomer(form)} className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white">Save customer</button>
        </div>
      </div>

      <div className="mt-5 rounded-3xl bg-white/5 p-5">
        <div className="mb-3 text-sm font-semibold text-white">Tags</div>
        <div className="mb-3 flex flex-wrap gap-2">
          {(customer.tags || []).map((tag) => (
            <button key={tag._id} onClick={() => onRemoveTag(tag._id)} className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
              {tag.name} ×
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={tagName} onChange={(event) => setTagName(event.target.value)} list="tag-options" placeholder="Add tag" className="flex-1 rounded-xl border border-white/10 bg-[#0B141A] px-3 py-2.5 text-sm text-white outline-none" />
          <datalist id="tag-options">
            {tags.map((tag) => <option key={tag._id} value={tag.name} />)}
          </datalist>
          <button onClick={() => { if (tagName.trim()) { onAddTag(tagName.trim()); setTagName(''); } }} className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white">Add</button>
        </div>
      </div>

      <div className="mt-5 rounded-3xl bg-white/5 p-5 text-sm text-gray-300">
        <div className="mb-3 text-sm font-semibold text-white">Conversation</div>
        <div className="space-y-2">
          <div className="flex justify-between"><span>History count</span><span>{customer.totalConversations || 0}</span></div>
          <div className="flex justify-between"><span>Created</span><span>{formatDistanceToNow(new Date(conversation.createdAt), { addSuffix: true })}</span></div>
          <div className="flex justify-between"><span>Last active</span><span>{formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}</span></div>
        </div>
        <div className="mt-4">
          <select value={conversation.assignedAgent?._id || conversation.assignedAgent || ''} onChange={(event) => onAssign(event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0B141A] px-3 py-2.5 text-white outline-none">
            <option value="">Assign agent</option>
            {agents.map((agent) => <option key={agent._id} value={agent._id}>{agent.name}</option>)}
          </select>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={onAddNote} className="flex-1 rounded-xl bg-amber-400/20 px-3 py-2.5 font-medium text-amber-200">Add internal note</button>
          <button onClick={onOpenTemplate} className="flex-1 rounded-xl bg-sky-500/20 px-3 py-2.5 font-medium text-sky-200">Send template</button>
        </div>
      </div>
    </div>
  );
}
