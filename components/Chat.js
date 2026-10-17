'use client';
import { useEffect, useRef, useState } from 'react';
import { uploadFile } from './Form';
import { fmtTime } from '@/lib/format';
import Icon from './Icon';

export default function Chat({ group, me, initial }) {
  const [messages, setMessages] = useState(initial);
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(false);
  const [error, setError] = useState('');
  const bottom = useRef(null);
  const fileInput = useRef(null);

  const add = (msg) => setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));

  useEffect(() => {
    const es = new EventSource(`/api/messages/stream?group=${encodeURIComponent(group)}`);
    es.onopen = async () => {
      setLive(true);
      // Ulanish uzilgan paytdagi xabarlarni to'ldirib olish
      const r = await fetch(`/api/messages?group=${encodeURIComponent(group)}`);
      if (r.ok) setMessages((await r.json()).messages);
    };
    es.onmessage = (e) => add(JSON.parse(e.data));
    es.onerror = () => setLive(false);
    return () => es.close();
  }, [group]);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function send(e) {
    e.preventDefault();
    if (busy || (!text.trim() && !file)) return;
    setBusy(true);
    setError('');
    try {
      const body = { group, text };
      if (file) {
        const up = await uploadFile(file);
        body.fileUrl = up.url;
        body.fileName = up.name;
      }
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Yuborilmadi');
      add(data.message);
      setText('');
      setFile(null);
      if (fileInput.current) fileInput.current.value = '';
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card flex h-[70vh] flex-col !p-0">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <div>
          <div className="text-sm font-bold text-slate-900">{group} talabalari va o'qituvchilari</div>
          <div className="text-xs text-slate-500">Guruh chati</div>
        </div>
        <span className={`chip ${live ? 'chip-green' : 'chip-amber'}`}>{live ? '● Jonli' : 'Ulanmoqda…'}</span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/50 p-5">
        {messages.map((m) => {
          const mine = m.authorId === me;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[80%]">
                <div className={`mb-0.5 flex items-center gap-2 text-[11px] text-slate-500 ${mine ? 'justify-end' : ''}`}>
                  <b className="text-slate-700">{mine ? 'Siz' : m.authorName}</b>
                  {m.authorRole === 'teacher' && <span className="chip chip-blue !px-1.5 !py-0">Ustoz</span>}
                  {fmtTime(m.createdAt)}
                </div>
                <div className={`rounded-2xl px-4 py-2.5 text-sm ${mine ? 'bg-brand-500 text-white' : 'bg-white text-slate-800 shadow-sm'}`}>
                  {m.text && <p className="whitespace-pre-line break-words">{m.text}</p>}
                  {m.fileUrl && (
                    <a href={m.fileUrl} target="_blank" rel="noreferrer" className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold underline ${mine ? 'text-white' : 'text-brand-700'}`}>
                      <Icon name="file" className="h-3.5 w-3.5" /> {m.fileName || 'Fayl'}
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {!messages.length && <p className="py-10 text-center text-sm text-slate-500">Hali xabarlar yo'q. Birinchi bo'lib yozing!</p>}
        <div ref={bottom} />
      </div>

      <form onSubmit={send} className="border-t border-slate-100 p-3">
        {file && <div className="mb-2 flex items-center gap-2 text-xs text-slate-600"><Icon name="file" className="h-3.5 w-3.5" /> {file.name} <button type="button" onClick={() => { setFile(null); fileInput.current.value = ''; }} className="text-red-600">olib tashlash</button></div>}
        {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
        <div className="flex items-center gap-2">
          <label className="btn-ghost cursor-pointer !px-3" title="Fayl biriktirish">
            <Icon name="clip" />
            <input ref={fileInput} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder={`${group} guruhiga xabar yozing…`} className="input" maxLength={2000} />
          <button disabled={busy} className="btn"><Icon name="send" /> {busy ? '…' : 'Yuborish'}</button>
        </div>
      </form>
    </section>
  );
}
