import { Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationToast({ notification }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#111B21] p-4 text-sm text-white shadow-xl">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-emerald-500/15 p-2 text-emerald-300">
          <Bell className="h-4 w-4" />
        </div>
        <div>
          <div className="font-semibold">{notification.title}</div>
          <div className="mt-1 text-gray-300">{notification.message}</div>
          <div className="mt-2 text-xs text-gray-500">
            {formatDistanceToNow(new Date(notification.timestamp || Date.now()), { addSuffix: true })}
          </div>
        </div>
      </div>
    </div>
  );
}
