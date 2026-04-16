export default function Avatar({ name = '', src = '', size = 'md' }) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' };
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';

  if (src) {
    return <img src={src} alt={name} className={`rounded-full object-cover ${sizes[size]}`} />;
  }

  return (
    <div className={`flex items-center justify-center rounded-full bg-emerald-600/20 font-semibold text-emerald-300 ${sizes[size]}`}>
      {initials}
    </div>
  );
}
