const colorMap = {
  green: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  yellow: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  red: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
  blue: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
  gray: 'bg-gray-500/10 text-gray-300 border-gray-500/20',
  purple: 'bg-violet-500/10 text-violet-300 border-violet-500/20'
};

export default function Badge({ children, color = 'gray', className = '' }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${colorMap[color] || colorMap.gray} ${className}`}>{children}</span>;
}
