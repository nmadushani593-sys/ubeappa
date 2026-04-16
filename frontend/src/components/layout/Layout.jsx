import { Bell } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import toast from 'react-hot-toast';
import Sidebar from './Sidebar';
import NotificationToast from '../common/NotificationToast';
import { useSocket } from '../../context/SocketContext';

const beep = 'data:audio/wav;base64,UklGRlQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YTAAAAAAAP//AAD//wAA//8AAP//AAD//wAA';

export default function Layout() {
  const socketRef = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return undefined;

    const handleNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 20));
      toast.custom(() => <NotificationToast notification={notification} />);
      new Audio(beep).play().catch(() => null);
    };

    socket.on('notification', handleNotification);
    return () => socket.off('notification', handleNotification);
  }, [socketRef]);

  const unreadCount = useMemo(() => notifications.length, [notifications]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0B141A] text-white">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-end border-b border-white/5 bg-[#111B21] px-6">
          <div className="relative">
            <button onClick={() => setOpen((value) => !value)} className="relative rounded-full bg-white/5 p-3 text-gray-300 transition hover:bg-white/10 hover:text-white">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white">{Math.min(unreadCount, 99)}</span>}
            </button>
            {open && (
              <div className="absolute right-0 mt-3 max-h-[28rem] w-96 overflow-y-auto rounded-2xl border border-white/10 bg-[#111B21] p-3 shadow-2xl">
                <div className="mb-3 flex items-center justify-between px-1">
                  <span className="text-sm font-semibold">Notifications</span>
                  <button onClick={() => setNotifications([])} className="text-xs text-emerald-300">Clear</button>
                </div>
                <div className="space-y-2">
                  {notifications.length ? notifications.map((notification) => <NotificationToast key={notification.id} notification={notification} />) : <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-gray-400">No notifications yet.</div>}
                </div>
              </div>
            )}
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
