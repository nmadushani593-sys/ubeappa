import { Smartphone } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { phoneNumbersAPI } from '../api';
import Badge from '../components/common/Badge';
import ConnectPhoneModal from '../components/phone/ConnectPhoneModal';
import CertificateCard from '../components/phone/CertificateCard';
import { useAuth } from '../context/AuthContext';

export default function PhoneNumbers() {
  const { user } = useAuth();
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [openConnect, setOpenConnect] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  const load = async () => {
    const response = await phoneNumbersAPI.getAll();
    setPhoneNumbers(response.data.phoneNumbers || []);
    if (selectedCertificate) {
      const current = (response.data.phoneNumbers || []).find((item) => item._id === selectedCertificate._id);
      setSelectedCertificate(current || null);
    }
  };

  useEffect(() => {
    load().catch(() => toast.error('Failed to load phone numbers'));
  }, []);

  const getCertificate = async (phoneNumber) => {
    try {
      await phoneNumbersAPI.getCertificate(phoneNumber._id);
      await load();
      setSelectedCertificate((prev) => phoneNumbers.find((item) => item._id === phoneNumber._id) || prev || phoneNumber);
      toast.success('Certificate fetched');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch certificate');
    }
  };

  const deletePhoneNumber = async (id) => {
    try {
      await phoneNumbersAPI.remove(id);
      await load();
      toast.success('Phone number deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete phone number');
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0B141A] p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-300"><Smartphone className="h-6 w-6" /></div>
          <div>
            <div className="text-2xl font-semibold text-white">Phone Numbers</div>
            <div className="text-sm text-gray-400">Connect and register WhatsApp Business numbers.</div>
          </div>
        </div>
        <button onClick={() => setOpenConnect(true)} className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white">Connect Number</button>
      </div>

      {selectedCertificate && <div className="mb-6"><CertificateCard phoneNumber={selectedCertificate} onClose={() => setSelectedCertificate(null)} onUpdated={load} /></div>}

      <div className="grid gap-4 xl:grid-cols-2">
        {phoneNumbers.map((phoneNumber) => (
          <div key={phoneNumber._id} className="rounded-3xl border border-white/10 bg-[#111B21] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xl font-semibold text-white">{phoneNumber.displayName}</div>
                <div className="mt-1 text-sm text-gray-400">{phoneNumber.phoneNumber}</div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge color={phoneNumber.status === 'connected' ? 'green' : phoneNumber.status === 'error' ? 'red' : 'yellow'}>{phoneNumber.status}</Badge>
                  <Badge color="blue">{phoneNumber.qualityRating || 'UNKNOWN'}</Badge>
                </div>
              </div>
              <div className="rounded-xl bg-white/5 px-3 py-2 text-[11px] font-mono text-gray-400">{phoneNumber.phoneNumberId}</div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={() => getCertificate(phoneNumber)} className="rounded-xl bg-white/5 px-4 py-2.5 text-sm text-white">Get Certificate</button>
              <button onClick={() => setSelectedCertificate(phoneNumber)} className="rounded-xl bg-white/5 px-4 py-2.5 text-sm text-white">Register</button>
              <button onClick={() => setSelectedCertificate(phoneNumber)} className="rounded-xl bg-white/5 px-4 py-2.5 text-sm text-white">Verify Code</button>
              {user?.role === 'admin' && <button onClick={() => deletePhoneNumber(phoneNumber._id)} className="rounded-xl bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300">Delete</button>}
            </div>
          </div>
        ))}
      </div>

      <ConnectPhoneModal open={openConnect} onClose={() => setOpenConnect(false)} onConnected={load} />
    </div>
  );
}
