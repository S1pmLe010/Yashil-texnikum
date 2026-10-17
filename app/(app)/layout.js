import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }) {
  const user = await getSession();
  if (!user) redirect('/login');
  const initials = (user.name[0] + user.surname[0]).toUpperCase();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar user={user} />
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between px-4 py-3 md:px-8">
          <div className="text-sm font-semibold text-slate-500">Yashil Texnikum Portal</div>
          <div className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <div className="text-sm font-semibold text-slate-900">{user.fullName}</div>
              <div className="text-[11px] text-slate-500">
                {user.role === 'teacher' ? 'Ustoz' : `Talaba (${user.group})`}
              </div>
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">{initials}</div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl space-y-5 px-4 pb-10 md:px-8">{children}</main>
        <footer className="pb-6 text-center text-xs text-slate-400">2026-2027 o'quv yili • I-semestr • Yashil Texnikum</footer>
      </div>
    </div>
  );
}
