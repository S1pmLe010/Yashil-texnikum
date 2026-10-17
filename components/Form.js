'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from './Icon';

export async function uploadFile(file) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/api/upload', { method: 'POST', body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Yuklashda xatolik');
  return data; // { url, name, size }
}

/**
 * Modal ichidagi forma. fields: [{ name, label, type: text|number|date|datetime-local|textarea|select|file,
 * options: [{value,label}], required, placeholder, defaultValue }]
 * hidden: forma bilan birga yuboriladigan qo'shimcha qiymatlar
 */
export function AddButton({ label, title, endpoint, fields, hidden = {}, method = 'POST', submitLabel = 'Saqlash', small = false }) {
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
      const body = { ...hidden };
      for (const f of fields) {
        if (f.type === 'file') {
          const file = fd.get(f.name);
          if (file && file.size) {
            const up = await uploadFile(file);
            body.fileUrl = up.url;
            body.fileName = up.name;
            body.size = up.size;
          } else if (f.required) throw new Error('Fayl tanlang');
        } else {
          body[f.name] = fd.get(f.name);
        }
      }
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Xatolik yuz berdi');
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className={small ? 'btn-ghost' : 'btn'}>
        <Icon name="plus" /> {label}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4" onClick={() => setOpen(false)}>
          <form
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-md space-y-3 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">{title || label}</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700">
                <Icon name="x" />
              </button>
            </div>
            {fields.map((f) => (
              <div key={f.name}>
                <label className="label">{f.label}</label>
                {f.type === 'textarea' ? (
                  <textarea name={f.name} rows={3} required={f.required} placeholder={f.placeholder} defaultValue={f.defaultValue} className="input" />
                ) : f.type === 'select' ? (
                  <select name={f.name} required={f.required} defaultValue={f.defaultValue ?? ''} className="input">
                    {!f.noEmpty && <option value="">— tanlang —</option>}
                    {f.options.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    name={f.name}
                    type={f.type || 'text'}
                    required={f.required && f.type !== 'file'}
                    placeholder={f.placeholder}
                    defaultValue={f.defaultValue}
                    min={f.min}
                    max={f.max}
                    className="input"
                  />
                )}
              </div>
            ))}
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setOpen(false)} className="btn-ghost">Bekor qilish</button>
              <button disabled={busy} className="btn">{busy ? 'Saqlanmoqda…' : submitLabel}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

export function DeleteButton({ endpoint, id, confirmText = "O'chirishni tasdiqlaysizmi?" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function del() {
    if (!confirm(confirmText)) return;
    setBusy(true);
    const res = await fetch(`${endpoint}?id=${id}`, { method: 'DELETE' });
    setBusy(false);
    if (!res.ok) alert((await res.json().catch(() => ({}))).error || 'Xatolik');
    else router.refresh();
  }
  return (
    <button onClick={del} disabled={busy} className="btn-danger" title="O'chirish">
      {busy ? '…' : "O'chirish"}
    </button>
  );
}
