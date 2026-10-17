'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { uploadFile } from './Form';
import Icon from './Icon';

export function SubmitWork({ assignmentId, resubmit = false }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const fd = new FormData(e.currentTarget);
      const file = fd.get('file');
      const body = { assignmentId, comment: fd.get('comment') };
      if (file && file.size) {
        const up = await uploadFile(file);
        body.fileUrl = up.url;
        body.fileName = up.name;
      }
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Xatolik');
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn">
        <Icon name="upload" /> {resubmit ? 'Qayta topshirish' : 'Topshirish'}
      </button>
    );
  }
  return (
    <form onSubmit={submit} className="mt-3 w-full space-y-2 rounded-xl border border-slate-200 bg-white p-4">
      <input name="file" type="file" className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-800" />
      <textarea name="comment" rows={2} maxLength={500} placeholder="O'qituvchi uchun izoh (ixtiyoriy)" className="input" />
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost">Bekor qilish</button>
        <button disabled={busy} className="btn">{busy ? 'Yuklanmoqda…' : "O'qituvchiga yuborish"}</button>
      </div>
    </form>
  );
}

export function GradeForm({ submissionId, max, score, feedback }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const fd = new FormData(e.currentTarget);
    const res = await fetch('/api/submissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: submissionId, score: fd.get('score'), feedback: fd.get('feedback') }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error || 'Xatolik');
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
      <input name="score" type="number" min={0} max={max} step="any" required defaultValue={score ?? ''} placeholder={`/${max}`} className="input !w-20 !py-1.5" />
      <input name="feedback" defaultValue={feedback} placeholder="Izoh" className="input !w-48 !py-1.5" />
      <button disabled={busy} className="btn !px-3 !py-1.5">{busy ? '…' : 'Baholash'}</button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  );
}
