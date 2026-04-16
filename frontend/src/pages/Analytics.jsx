import { useEffect, useState } from 'react';
import { BarChart, Bar, CartesianGrid, LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { MessageSquare, Clock3, Inbox, Users } from 'lucide-react';
import { analyticsAPI } from '../api';

const StatCard = ({ icon: Icon, label, value }) => (
  <div className="rounded-3xl border border-white/10 bg-[#111B21] p-5">
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm text-gray-400">{label}</div>
        <div className="mt-2 text-3xl font-semibold text-white">{value}</div>
      </div>
      <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-300"><Icon className="h-6 w-6" /></div>
    </div>
  </div>
);

export default function Analytics() {
  const [overview, setOverview] = useState({});
  const [messagesPerDay, setMessagesPerDay] = useState([]);
  const [topAgents, setTopAgents] = useState([]);
  const [responseTimes, setResponseTimes] = useState([]);

  const load = async () => {
    const [overviewResponse, messagesResponse, topAgentsResponse, responseTimesResponse] = await Promise.all([
      analyticsAPI.getOverview(),
      analyticsAPI.getMessagesPerDay(),
      analyticsAPI.getTopAgents(),
      analyticsAPI.getResponseTimes()
    ]);
    setOverview(overviewResponse.data.overview || {});
    setMessagesPerDay(messagesResponse.data.data || []);
    setTopAgents(topAgentsResponse.data.data || []);
    setResponseTimes(responseTimesResponse.data.data || []);
  };

  useEffect(() => {
    load().catch(() => null);
    const interval = setInterval(() => load().catch(() => null), 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full overflow-y-auto bg-[#0B141A] p-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={MessageSquare} label="Total Conversations" value={overview.totalConversations || 0} />
        <StatCard icon={Inbox} label="Open Now" value={overview.openConversations || 0} />
        <StatCard icon={Users} label="Total Messages" value={overview.totalMessages || 0} />
        <StatCard icon={Clock3} label="Avg Response Time" value={`${overview.avgResponseTimeMinutes || 0}m`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-[#111B21] p-5">
          <div className="mb-4 text-lg font-semibold text-white">Messages per day</div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={messagesPerDay}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#25D366" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#111B21] p-5">
          <div className="mb-4 text-lg font-semibold text-white">Top agents</div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topAgents}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Bar dataKey="conversationsHandled" fill="#128C7E" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-white/10 bg-[#111B21] p-5">
        <div className="mb-4 text-lg font-semibold text-white">Response times by agent</div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={responseTimes}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Bar dataKey="avgResponseTimeMinutes" fill="#38BDF8" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
