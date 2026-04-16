import { BarChart2, FileText, LogOut, MessageSquare, Smartphone, UserCheck, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import Avatar from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { icon: MessageSquare, label: 'Chats', to: '/chat' },
  { icon: BarChart2, label: 'Analytics', to: '/analytics' },
  { icon: Users, label: 'CRM', to: '/crm' },
  { icon: FileText, label: 'Templates', to: '/templates' },
  { icon: Smartphone, label: 'Numbers', to: '/phone-numbers' },
  { icon: UserCheck, label: 'Agents', to: '/agents', adminOnly: true }
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="flex h-full w-24 flex-col justify-between border-r border-white/5 bg-whatsapp-sidebar px-3 py-5">
      <div className="space-y-3">
        {navItems
          .filter((item) => !item.adminOnly || user?.role === 'admin')
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `flex flex-col items-center gap-2 rounded-2xl px-2 py-3 text-xs transition ${isActive ? 'bg-emerald-500/15 text-emerald-300' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl bg-white/5 p-3 text-center">
          <div className="relative mx-auto mb-2 w-fit">
            <Avatar name={user?.name} src={user?.avatar} size="md" />
            <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#111B21] ${user?.status === 'online' ? 'bg-emerald-400' : user?.status === 'away' ? 'bg-amber-400' : 'bg-gray-500'}`} />
          </div>
          <div className="truncate text-xs font-medium text-white">{user?.name}</div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.15em] text-gray-500">{user?.role}</div>
        </div>
        <button onClick={logout} className="flex w-full flex-col items-center gap-2 rounded-2xl px-2 py-3 text-xs text-gray-400 transition hover:bg-white/5 hover:text-white">
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
