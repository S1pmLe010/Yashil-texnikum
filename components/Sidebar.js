'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Icon from './Icon';

const NAV = [
  { href: '/dashboard', label: 'Bosh sahifa', icon: 'home' },
  { href: '/schedule', label: 'Dars jadvali', icon: 'calendar' },
  { href: '/materials', label: 'Fanlar & Materiallar', icon: 'book' },
  { href: '/assignments', label: 'Vazifalar', icon: 'tasks' },
  { href: '/grades', label: 'Baholar & Imtihonlar', icon: 'star' },
  { href: '/ai', label: 'AI Repetitor', icon: 'bot' },
  { href: '/chat', label: "Guruh Chati & E'lonlar", icon: 'chat' },
  { href: '/students', label: 'Talabalar', icon: 'users', teacherOnly: true },
  { href: '/profile', label: 'Profil & Sozlamalar', icon: 'user' },
];

export default function Sidebar({ user }) {
  const path = usePathname();
  const router = useRouter();
  const items = NAV.filter((n) => !n.teacherOnly || user.role === 'teacher');

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  return (
    <aside className="sticky top-0 z-20 flex shrink-0 flex-col border-b border-white/60 bg-white/70 backdrop-blur md:h-screen md:w-64 md:border-b-0 md:border-r">
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-800 text-white">
          <Icon name="book" className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold text-slate-900">Yashil Texnikum</div>
          <div className="mt-0.5 inline-block rounded-md bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-800">
            {user.role === 'teacher' ? 'Ustoz paneli' : `${user.group} guruhi`}
          </div>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:overflow-y-auto md:pb-0">
        {items.map((n) => {
          const active = path === n.href || path.startsWith(n.href + '/');
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex shrink-0 items-center gap-3 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                active ? 'bg-brand-500 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon name={n.icon} />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="hidden border-t border-slate-100 p-3 md:block">
        <button onClick={logout} className="btn-ghost w-full justify-start text-slate-600">
          <Icon name="logout" /> Chiqish
        </button>
      </div>
    </aside>
  );
}
