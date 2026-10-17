import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { connect } from '@/lib/db';
import { Material, Subject } from '@/lib/models';
import { fmtDate, fmtSize, KINDS } from '@/lib/format';
import { AddButton, DeleteButton } from '@/components/Form';
import Icon from '@/components/Icon';

export const metadata = { title: 'Fanlar & Materiallar — Yashil Texnikum' };

export default async function Materials({ searchParams }) {
  const user = await getSession();
  await connect();
  const isTeacher = user.role === 'teacher';
  const subjectId = searchParams?.subject || '';
  const q = (searchParams?.q || '').trim();

  const filter = {};
  if (subjectId) filter.subjectId = subjectId;
  if (q) filter.title = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };

  const [subjects, materials, counts] = await Promise.all([
    Subject.find().sort({ name: 1 }).lean(),
    Material.find(filter).sort({ createdAt: -1 }).limit(100).lean(),
    Material.aggregate([{ $group: { _id: '$subjectId', n: { $sum: 1 } } }]),
  ]);
  const subj = Object.fromEntries(subjects.map((s) => [String(s._id), s.name]));
  const cnt = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
  const total = Object.values(cnt).reduce((a, b) => a + b, 0);

  return (
    <>
      <section className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Fanlar va o'quv materiallari</h1>
          <p className="text-sm text-slate-500">{subjects.length} ta fan • {total} ta resurs</p>
        </div>
        {isTeacher && (
          <div className="flex gap-2">
            <AddButton small label="Fan qo'shish" endpoint="/api/subjects" fields={[{ name: 'name', label: 'Fan nomi', required: true }]} />
            <AddButton
              label="Material yuklash"
              endpoint="/api/materials"
              fields={[
                { name: 'subjectId', label: 'Fan', type: 'select', required: true, options: subjects.map((s) => ({ value: String(s._id), label: s.name })) },
                { name: 'title', label: 'Sarlavha', required: true },
                { name: 'kind', label: 'Turi', type: 'select', noEmpty: true, options: [...KINDS, 'Taqdimot', 'Video', 'Spravochnik'].map((k) => ({ value: k, label: k })) },
                { name: 'file', label: 'Fayl (25 MB gacha)', type: 'file' },
                { name: 'link', label: 'Yoki havola', placeholder: 'https://…' },
              ]}
            />
          </div>
        )}
      </section>

      <div className="flex flex-wrap gap-2">
        <Link href="/materials" className={`pill ${!subjectId ? 'pill-active' : ''}`}>Barcha fanlar ({total})</Link>
        {subjects.map((s) => (
          <Link key={s._id} href={`/materials?subject=${s._id}`} className={`pill ${subjectId === String(s._id) ? 'pill-active' : ''}`}>
            {s.name} ({cnt[String(s._id)] || 0})
          </Link>
        ))}
      </div>

      <form className="card flex gap-2 !p-3">
        {subjectId && <input type="hidden" name="subject" value={subjectId} />}
        <input name="q" defaultValue={q} placeholder="Material qidirish…" className="input" />
        <button className="btn-ghost">Qidirish</button>
      </form>

      <section className="space-y-3">
        {materials.map((m) => {
          const href = m.fileUrl || m.link;
          return (
            <article key={m._id} className="card flex flex-wrap items-center justify-between gap-3 !p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon name="file" className="h-5 w-5" /></div>
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="chip chip-green">{subj[String(m.subjectId)] || 'Fan'}</span>
                    <span className="chip chip-slate">{m.kind}</span>
                  </div>
                  <div className="mt-1 truncate text-sm font-semibold text-slate-900">{m.title}</div>
                  <div className="text-xs text-slate-500">{m.teacherName} • {fmtDate(m.createdAt)} {m.size ? `• ${fmtSize(m.size)}` : ''}</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {href && (
                  <a href={href} target="_blank" rel="noreferrer" className="btn-ghost">
                    <Icon name="download" /> {m.fileUrl ? 'Yuklab olish' : 'Ochish'}
                  </a>
                )}
                {isTeacher && <DeleteButton endpoint="/api/materials" id={String(m._id)} />}
              </div>
            </article>
          );
        })}
        {!materials.length && (
          <div className="card py-10 text-center text-sm text-slate-500">
            {isTeacher ? "Material topilmadi. «Material yuklash» orqali qo'shing." : 'Materiallar hali yuklanmagan.'}
          </div>
        )}
      </section>
    </>
  );
}
