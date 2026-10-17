'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfileForm({ user }) {
  const router = useRouter();
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const body = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch('/api/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg({ ok: false, text: data.error || 'Xatolik' });
    setMsg({ ok: true, text: "O'zgarishlar saqlandi" });
    e.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <h2 className="card-title">Shaxsiy ma'lumotlar</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label">Ism</label><input name="name" defaultValue={user.name} required className="input" /></div>
        <div><label className="label">Familiya</label><input name="surname" defaultValue={user.surname} required className="input" /></div>
        <div><label className="label">Foydalanuvchi nomi</label><input value={user.username} disabled className="input bg-slate-50" readOnly /></div>
        <div><label className="label">Telefon</label><input name="phone" defaultValue={user.phone} placeholder="+998 90 123 45 67" className="input" /></div>
        <div><label className="label">Elektron pochta</label><input value={user.email} disabled className="input bg-slate-50" readOnly /></div>
        <div><label className="label">{user.role === 'teacher' ? 'Rol' : 'Guruh'}</label><input value={user.role === 'teacher' ? 'Ustoz' : user.group} disabled className="input bg-slate-50" readOnly /></div>
      </div>

      <h2 className="card-title pt-2">Parolni almashtirish</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label">Joriy parol</label><input name="currentPassword" type="password" autoComplete="current-password" className="input" /></div>
        <div><label className="label">Yangi parol</label><input name="newPassword" type="password" minLength={6} autoComplete="new-password" className="input" /></div>
      </div>

      {msg && <p className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? 'bg-brand-50 text-brand-800' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>}
      <button disabled={busy} className="btn">{busy ? 'Saqlanmoqda…' : "O'zgarishlarni saqlash"}</button>
    </form>
  );
}
