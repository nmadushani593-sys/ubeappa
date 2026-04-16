import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import { phoneNumbersAPI, templatesAPI } from '../api';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';

const initialForm = { name: '', category: 'UTILITY', language: 'en_US', body: '', phoneNumber: '' };

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [openSend, setOpenSend] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [sendForm, setSendForm] = useState({ templateId: '', to: '' });

  const load = async () => {
    const [templatesResponse, phoneNumbersResponse] = await Promise.all([templatesAPI.getAll(), phoneNumbersAPI.getAll()]);
    setTemplates(templatesResponse.data.templates || []);
    setPhoneNumbers(phoneNumbersResponse.data.phoneNumbers || []);
  };

  useEffect(() => {
    load().catch(() => toast.error('Failed to load templates'));
  }, []);

  const createTemplate = async (event) => {
    event.preventDefault();
    try {
      await templatesAPI.create(form);
      setForm(initialForm);
      setOpenCreate(false);
      load().catch(() => null);
      toast.success('Template created');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create template');
    }
  };

  const sendTemplate = async () => {
    try {
      const template = templates.find((item) => item._id === sendForm.templateId);
      await templatesAPI.send(sendForm.templateId, { to: sendForm.to, phoneNumber: template?.phoneNumber?._id || template?.phoneNumber });
      setOpenSend(false);
      setSendForm({ templateId: '', to: '' });
      toast.success('Template sent');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send template');
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0B141A] p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="text-2xl font-semibold text-white">Templates</div>
          <div className="text-sm text-gray-400">Create and send reusable WhatsApp templates.</div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setOpenSend(true)} className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-medium text-white">Send Template</button>
          <button onClick={() => setOpenCreate(true)} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Create Template</button>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => (
          <div key={template._id} className="rounded-3xl border border-white/10 bg-[#111B21] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-white">{template.name}</div>
                <div className="mt-2 flex gap-2">
                  <Badge color="blue">{template.category}</Badge>
                  <Badge color={template.status === 'APPROVED' ? 'green' : 'yellow'}>{template.status}</Badge>
                </div>
              </div>
              <button onClick={async () => { await templatesAPI.remove(template._id); load().catch(() => null); }} className="text-sm text-rose-300">Delete</button>
            </div>
            <div className="mt-4 text-sm text-gray-300">{template.body}</div>
          </div>
        ))}
      </div>

      <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="Create Template">
        <form onSubmit={createTemplate} className="grid gap-4">
          <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Template name" className="rounded-xl border border-white/10 bg-[#0B141A] px-4 py-3 text-white outline-none" required />
          <div className="grid gap-4 md:grid-cols-3">
            <select value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))} className="rounded-xl border border-white/10 bg-[#0B141A] px-4 py-3 text-white outline-none">
              <option value="MARKETING">MARKETING</option>
              <option value="UTILITY">UTILITY</option>
              <option value="AUTHENTICATION">AUTHENTICATION</option>
            </select>
            <input value={form.language} onChange={(event) => setForm((prev) => ({ ...prev, language: event.target.value }))} placeholder="en_US" className="rounded-xl border border-white/10 bg-[#0B141A] px-4 py-3 text-white outline-none" />
            <select value={form.phoneNumber} onChange={(event) => setForm((prev) => ({ ...prev, phoneNumber: event.target.value }))} className="rounded-xl border border-white/10 bg-[#0B141A] px-4 py-3 text-white outline-none">
              <option value="">Select phone number</option>
              {phoneNumbers.map((phoneNumber) => <option key={phoneNumber._id} value={phoneNumber._id}>{phoneNumber.displayName}</option>)}
            </select>
          </div>
          <textarea value={form.body} onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))} rows={5} placeholder="Template body" className="rounded-xl border border-white/10 bg-[#0B141A] px-4 py-3 text-white outline-none" required />
          <button className="rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-white">Create</button>
        </form>
      </Modal>

      <Modal open={openSend} onClose={() => setOpenSend(false)} title="Send Template">
        <div className="space-y-4">
          <select value={sendForm.templateId} onChange={(event) => setSendForm((prev) => ({ ...prev, templateId: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-[#0B141A] px-4 py-3 text-white outline-none">
            <option value="">Select template</option>
            {templates.map((template) => <option key={template._id} value={template._id}>{template.name}</option>)}
          </select>
          <input value={sendForm.to} onChange={(event) => setSendForm((prev) => ({ ...prev, to: event.target.value }))} placeholder="Customer phone number" className="w-full rounded-xl border border-white/10 bg-[#0B141A] px-4 py-3 text-white outline-none" />
          <button onClick={sendTemplate} className="rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-white">Send</button>
        </div>
      </Modal>
    </div>
  );
}
