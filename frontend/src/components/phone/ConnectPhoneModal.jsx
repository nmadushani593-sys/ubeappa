import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import { phoneNumbersAPI } from '../../api';

const initialForm = {
  displayName: '',
  phoneNumber: '',
  phoneNumberId: '',
  wabaId: '',
  accessToken: '',
  verifyToken: ''
};

export default function ConnectPhoneModal({ open, onClose, onConnected }) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await phoneNumbersAPI.connect(form);
      const phoneNumber = response.data.phoneNumber;
      if (phoneNumber?._id) {
        await phoneNumbersAPI.getCertificate(phoneNumber._id).catch(() => null);
      }
      toast.success('Phone number connected');
      setForm(initialForm);
      onConnected?.();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to connect number');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Connect Number">
      <form onSubmit={handleSubmit} className="grid gap-4">
        {[
          ['displayName', 'Display Name', 'Hexa bbh'],
          ['phoneNumber', 'Phone Number', '+94771234567'],
          ['phoneNumberId', 'Phone Number ID', '12345678901234'],
          ['wabaId', 'WABA ID', 'WhatsApp Business Account ID'],
          ['accessToken', 'Access Token', 'Meta Graph API token'],
          ['verifyToken', 'Verify Token', 'Webhook verify token']
        ].map(([key, label, placeholder]) => (
          <label key={key} className="text-sm text-gray-300">
            <span className="mb-1 block">{label}</span>
            <input
              type={key.toLowerCase().includes('token') ? 'password' : 'text'}
              value={form[key]}
              onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
              placeholder={placeholder}
              className="w-full rounded-xl border border-white/10 bg-[#0B141A] px-4 py-3 text-white outline-none"
              required
            />
          </label>
        ))}
        <button disabled={loading} className="rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-white disabled:opacity-60">
          {loading ? 'Connecting...' : 'Connect Number'}
        </button>
      </form>
    </Modal>
  );
}
