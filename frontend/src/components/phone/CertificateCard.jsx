import { useState } from 'react';
import toast from 'react-hot-toast';
import { Download, Copy, RefreshCcw } from 'lucide-react';
import { phoneNumbersAPI } from '../../api';
import Badge from '../common/Badge';

export default function CertificateCard({ phoneNumber, onClose, onUpdated }) {
  const [certificate, setCertificate] = useState(phoneNumber.certificate || '');
  const [showRegistration, setShowRegistration] = useState(false);
  const [method, setMethod] = useState('SMS');
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const refreshCertificate = async () => {
    setLoading(true);
    try {
      const response = await phoneNumbersAPI.getCertificate(phoneNumber._id);
      setCertificate(response.data.certificate || '');
      onUpdated?.();
      toast.success('Certificate refreshed');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to refresh certificate');
    } finally {
      setLoading(false);
    }
  };

  const copyCertificate = async () => {
    await navigator.clipboard.writeText(certificate || '');
    toast.success('Certificate copied!');
  };

  const downloadCertificate = () => {
    const blob = new Blob([certificate], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `certificate_${phoneNumber.displayName.replace(/\s+/g, '_')}.pem`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const sendCode = async () => {
    setLoading(true);
    try {
      await phoneNumbersAPI.requestCode(phoneNumber._id, { method });
      toast.success(`Verification code sent via ${method}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const completeRegistration = async () => {
    setLoading(true);
    try {
      await phoneNumbersAPI.verifyCode(phoneNumber._id, { code });
      await phoneNumbersAPI.register(phoneNumber._id, { pin, certificate });
      toast.success('Phone number registered successfully');
      onUpdated?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-[#111B21] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xl font-semibold text-white">📱 {phoneNumber.displayName}</div>
          <div className="mt-2 flex gap-2">
            <Badge color={phoneNumber.status === 'connected' ? 'green' : phoneNumber.status === 'error' ? 'red' : 'yellow'}>{phoneNumber.status}</Badge>
            <Badge color="blue">{phoneNumber.qualityRating || 'UNKNOWN'}</Badge>
          </div>
        </div>
        <button onClick={onClose} className="text-sm text-gray-400">Close</button>
      </div>
      <div className="mt-5 text-sm text-gray-300">To connect this number and send messages:</div>
      <ol className="mt-3 list-inside list-decimal space-y-1 text-sm text-gray-400">
        <li>Download the certificate or copy it</li>
        <li>Follow instructions to confirm your number</li>
      </ol>
      <div className="mt-5 grid gap-1 text-sm text-gray-300">
        <div><span className="text-gray-500">Display Name:</span> {phoneNumber.displayName}</div>
        <div><span className="text-gray-500">Phone Number ID:</span> <span className="font-mono text-xs">{phoneNumber.phoneNumberId}</span></div>
      </div>
      <textarea readOnly rows={6} value={certificate} className="mt-5 w-full rounded-2xl border border-white/10 bg-[#0B141A] p-4 font-mono text-xs text-gray-200 outline-none" />
      <div className="mt-4 flex flex-wrap gap-3">
        <button onClick={copyCertificate} className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-sm text-white"><Copy className="h-4 w-4" /> Copy to Clipboard</button>
        <button onClick={downloadCertificate} className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-sm text-white"><Download className="h-4 w-4" /> Download .pem</button>
        <button onClick={refreshCertificate} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-sm text-white"><RefreshCcw className="h-4 w-4" /> Refresh Certificate</button>
        <button onClick={() => setShowRegistration((prev) => !prev)} className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white">Begin Registration</button>
      </div>
      {showRegistration && (
        <div className="mt-6 space-y-5 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div>
            <div className="mb-3 text-sm font-semibold text-white">Step 1 — Request verification code</div>
            <div className="flex gap-3">
              <select value={method} onChange={(event) => setMethod(event.target.value)} className="rounded-xl border border-white/10 bg-[#0B141A] px-3 py-2.5 text-white outline-none">
                <option value="SMS">SMS</option>
                <option value="VOICE">VOICE</option>
              </select>
              <button onClick={sendCode} disabled={loading} className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white">Send Code</button>
            </div>
          </div>
          <div>
            <div className="mb-3 text-sm font-semibold text-white">Step 2 — Enter code + certificate</div>
            <div className="grid gap-3 md:grid-cols-2">
              <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="6-digit code" className="rounded-xl border border-white/10 bg-[#0B141A] px-3 py-2.5 text-white outline-none" />
              <input value={pin} onChange={(event) => setPin(event.target.value)} placeholder="2-step PIN (optional)" className="rounded-xl border border-white/10 bg-[#0B141A] px-3 py-2.5 text-white outline-none" />
            </div>
            <textarea value={certificate} onChange={(event) => setCertificate(event.target.value)} rows={5} className="mt-3 w-full rounded-xl border border-white/10 bg-[#0B141A] p-3 text-sm text-white outline-none" />
            <button onClick={completeRegistration} disabled={loading} className="mt-3 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white">Complete Registration</button>
          </div>
        </div>
      )}
    </div>
  );
}
