'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from './Icon';

export default function AuthForm({ mode }) {
  const router = useRouter();
  const isReg = mode === 'register';
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const body = Object.fromEntries(new FormData(e.currentTarget));
    if (isReg) body.role = role;
    const res = await fetch(`/api/auth/${isReg ? 'register' : 'login'}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error || 'Xatolik yuz berdi');
    router.replace('/dashboard');
    router.refresh();
  }

  return (
    <main className="grid min-h-screen place-items-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-800 text-white">
            <Icon name="book" className="h-6 w-6" />
          </div>
          <div>
            <div className="text-lg font-extrabold text-slate-900">Yashil Texnikum Portal</div>
            <div className="text-xs text-slate-500">Kompyuter tarmoqlari va IT-servis</div>
          </div>
        </div>

        <form onSubmit={submit} className="card space-y-3.5 p-6">
          <h1 className="text-xl font-bold text-slate-900">{isReg ? "Ro'yxatdan o'tish" : 'Tizimga kirish'}</h1>

          {isReg ? (
            <>
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                {[['student', "O'quvchi"], ['teacher', "Ustoz"]].map(([v, l]) => (
                  <button type="button" key={v} onClick={() => setRole(v)}
                    className={`rounded-lg py-2 text-sm font-semibold transition ${role === v ? 'bg-white text-brand-800 shadow' : 'text-slate-500'}`}>
                    {l}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Ism</label><input name="name" required className="input" /></div>
                <div><label className="label">Familiya</label><input name="surname" required className="input" /></div>
              </div>
              <div><label className="label">Foydalanuvchi nomi</label><input name="username" required className="input" placeholder="azizbek_26i4" autoComplete="username" /></div>
              <div><label className="label">Elektron pochta</label><input name="email" type="email" required className="input" autoComplete="email" /></div>
              {role === 'student' ? (
                <div><label className="label">Guruh</label><input name="group" required className="input" placeholder="26 IT 4" /></div>
              ) : (
                <div><label className="label">Ustoz kodi</label><input name="teacherCode" type="password" required className="input" placeholder="Maktab ma'muriyatidan oling" /></div>
              )}
              <div><label className="label">Parol</label><input name="password" type="password" minLength={6} required className="input" autoComplete="new-password" /></div>
            </>
          ) : (
            <>
              <div><label className="label">Foydalanuvchi nomi yoki pochta</label><input name="login" required className="input" autoComplete="username" /></div>
              <div><label className="label">Parol</label><input name="password" type="password" required className="input" autoComplete="current-password" /></div>
            </>
          )}

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button disabled={busy} className="btn w-full py-2.5">{busy ? 'Kuting…' : isReg ? "Ro'yxatdan o'tish" : 'Kirish'}</button>
          <p className="text-center text-sm text-slate-500">
            {isReg ? (
              <>Akkauntingiz bormi? <Link href="/login" className="font-semibold text-brand-700">Kirish</Link></>
            ) : (
              <>Akkauntingiz yo'qmi? <Link href="/register" className="font-semibold text-brand-700">Ro'yxatdan o'tish</Link></>
            )}
          </p>
        </form>
      </div>
    </main>
  );
}
