'use client';
import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';

const TOPICS = ['Axborot xavfsizligi', 'Kompyuter tarmoqlari', 'IT & Dasturlash', 'Ma\'lumotlar bazasi', 'Matematika', 'Fizika', 'Ingliz tili (IT)'];
const SUGGEST = ['RSA va AES farqi nima?', 'Linuxda sudo huquqlarini tekshirish', 'Subnet maskasini oddiy misolda tushuntir', 'SQL JOIN turlari'];

function Rich({ text }) {
  const parts = text.split(/```(?:\w+)?\n?([\s\S]*?)```/g);
  return (
    <div className="prose-chat text-sm leading-relaxed">
      {parts.map((p, i) =>
        i % 2 ? (
          <pre key={i}><code>{p.trim()}</code></pre>
        ) : (
          p.split(/\n{2,}/).filter(Boolean).map((para, j) => (
            <p key={`${i}-${j}`} className="whitespace-pre-line">
              {para.split(/(\*\*[^*]+\*\*)/g).map((s, k) =>
                s.startsWith('**') && s.endsWith('**') ? <b key={k}>{s.slice(2, -2)}</b> : s,
              )}
            </p>
          ))
        ),
      )}
    </div>
  );
}

export default function AiChat({ name }) {
  const [messages, setMessages] = useState([]);
  const [topic, setTopic] = useState(TOPICS[0]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const bottom = useRef(null);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, busy]);

  async function send(text) {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    const next = [...messages, { role: 'user', content: q }];
    setMessages(next);
    setInput('');
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, topic }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Xatolik');
      setMessages([...next, { role: 'assistant', content: data.reply }]);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="card">
        <h1 className="text-xl font-extrabold text-slate-900">AI Repetitor</h1>
        <p className="text-sm text-slate-500">O'quv rejangiz bo'yicha savol bering, {name}. Javoblar tushuntirish va misollar bilan keladi.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <button key={t} onClick={() => setTopic(t)} className={`pill !py-1 !text-xs ${topic === t ? 'pill-active' : ''}`}>{t}</button>
          ))}
        </div>
      </section>

      <section className="card flex h-[60vh] flex-col !p-0">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {!messages.length && (
            <div className="grid h-full place-items-center text-center">
              <div>
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-100 text-brand-700"><Icon name="bot" className="h-6 w-6" /></div>
                <p className="mt-3 text-sm text-slate-500">Savol bering yoki quyidagilardan birini tanlang:</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {SUGGEST.map((s) => <button key={s} onClick={() => send(s)} className="chip chip-green !px-3 !py-1.5 hover:opacity-80">{s}</button>)}
                </div>
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${m.role === 'user' ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-800'}`}>
                {m.role === 'user' ? <p className="whitespace-pre-line text-sm">{m.content}</p> : <Rich text={m.content} />}
              </div>
            </div>
          ))}
          {busy && <div className="text-sm text-slate-400">AI javob yozmoqda…</div>}
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div ref={bottom} />
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 border-t border-slate-100 p-3">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={`${topic} bo'yicha savolingiz…`} className="input" maxLength={2000} />
          <button disabled={busy || !input.trim()} className="btn"><Icon name="send" /> Yuborish</button>
        </form>
      </section>
    </div>
  );
}
