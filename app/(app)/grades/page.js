import { getSession } from '@/lib/auth';
import { connect } from '@/lib/db';
import { Subject, User, Grade, Exam } from '@/lib/models';
import { resolveGroup, studentScores, summarize } from '@/lib/data';
import { fmtDate } from '@/lib/format';
import { AddButton, DeleteButton } from '@/components/Form';
import GroupSwitcher from '@/components/GroupSwitcher';

export const metadata = { title: 'Baholar & Imtihonlar — Yashil Texnikum' };

const gradeChip = (g) => (g >= 5 ? 'chip-green' : g === 4 ? 'chip-blue' : g === 3 ? 'chip-amber' : 'chip-red');

export default async function Grades({ searchParams }) {
  const user = await getSession();
  await connect();
  const isTeacher = user.role === 'teacher';
  const { group, groups } = await resolveGroup(user, searchParams);

  const [subjects, exams] = await Promise.all([
    Subject.find().sort({ name: 1 }).lean(),
    group ? Exam.find({ group, date: { $gte: new Date(Date.now() - 86400000) } }).sort({ date: 1 }).lean() : [],
  ]);
  const subj = Object.fromEntries(subjects.map((s) => [String(s._id), s.name]));
  const subjectOptions = subjects.map((s) => ({ value: String(s._id), label: s.name }));

  const examList = (
    <section className="card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="card-title">Nazoratlar jadvali</h2>
        {isTeacher && (
          <AddButton small label="Imtihon qo'shish" endpoint="/api/exams" fields={[
            { name: 'group', label: 'Guruh', required: true, defaultValue: group },
            { name: 'subjectId', label: 'Fan', type: 'select', required: true, options: subjectOptions },
            { name: 'title', label: 'Nomi', required: true, placeholder: 'Oraliq nazorat' },
            { name: 'date', label: 'Sana', type: 'date', required: true },
            { name: 'room', label: 'Xona', placeholder: '303-xona' },
          ]} />
        )}
      </div>
      {exams.length ? (
        <ul className="space-y-2">
          {exams.map((e) => (
            <li key={e._id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm">
              <div>
                <div className="font-semibold text-slate-900">{e.title}</div>
                <div className="text-xs text-slate-500">{subj[String(e.subjectId)]} • {fmtDate(e.date)} {e.room && `• ${e.room}`}</div>
              </div>
              {isTeacher && <DeleteButton endpoint="/api/exams" id={String(e._id)} />}
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-slate-500">Rejalashtirilgan imtihon yo'q.</p>}
    </section>
  );

  if (!isTeacher) {
    const rows = await studentScores(user.id, group);
    const { subjects: per, avg5, avgPercent } = summarize(rows);
    return (
      <>
        <section className="card">
          <h1 className="text-xl font-extrabold text-slate-900">Baholar va imtihon natijalari</h1>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[["O'rtacha baho", avg5 ?? '—'], ["O'rtacha foiz", avgPercent != null ? `${avgPercent}%` : '—'], ['Baholangan fanlar', per.length]].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="text-xs text-slate-500">{k}</div>
                <div className="mt-1 text-3xl font-extrabold text-brand-700">{v}</div>
              </div>
            ))}
          </div>
        </section>
        <div className="grid gap-5 lg:grid-cols-3">
          <section className="card overflow-x-auto p-0 lg:col-span-2">
            <table className="w-full">
              <thead className="border-b border-slate-100 bg-slate-50/70"><tr><th className="th">Fan</th><th className="th">Baholangan ishlar</th><th className="th">Foiz</th><th className="th">Baho</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {per.map((p) => (
                  <tr key={p.subjectId}>
                    <td className="td font-semibold">{subj[p.subjectId] || 'Fan'}</td>
                    <td className="td text-xs text-slate-600">{p.items.map((i) => `${i.title}: ${i.score}/${i.max}`).join(' • ')}</td>
                    <td className="td">{p.percent}%</td>
                    <td className="td"><span className={`chip ${gradeChip(p.grade)}`}>{p.grade}</span></td>
                  </tr>
                ))}
                {!per.length && <tr><td colSpan={4} className="td py-10 text-center text-slate-500">Hali baholar yo'q. Vazifalarni topshiring, ustoz baholagach shu yerda ko'rinadi.</td></tr>}
              </tbody>
            </table>
          </section>
          {examList}
        </div>
        <p className="text-xs text-slate-500">Baho shkalasi: 86–100% → 5 • 71–85% → 4 • 55–70% → 3 • 55% dan past → 2</p>
      </>
    );
  }

  // Ustoz ko'rinishi
  const students = group ? await User.find({ role: 'student', group }).sort({ surname: 1 }).lean() : [];
  const table = await Promise.all(
    students.map(async (s) => ({ s, sum: summarize(await studentScores(String(s._id), group)) })),
  );
  const recent = students.length
    ? await Grade.find({ studentId: { $in: students.map((s) => s._id) } }).sort({ createdAt: -1 }).limit(15).lean()
    : [];
  const sName = Object.fromEntries(students.map((s) => [String(s._id), `${s.name} ${s.surname}`]));

  return (
    <>
      <section className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Baholar va reyting</h1>
          <p className="text-sm text-slate-500">{group ? `${group} guruhi • ${students.length} ta talaba` : 'Guruh tanlanmagan'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <GroupSwitcher groups={groups} current={group} />
          <AddButton label="Baho qo'yish" endpoint="/api/grades" fields={[
            { name: 'studentId', label: 'Talaba', type: 'select', required: true, options: students.map((s) => ({ value: String(s._id), label: `${s.surname} ${s.name}` })) },
            { name: 'subjectId', label: 'Fan', type: 'select', required: true, options: subjectOptions },
            { name: 'title', label: 'Nima uchun', required: true, placeholder: 'Joriy nazorat / Laboratoriya' },
            { name: 'score', label: 'Ball', type: 'number', required: true, min: 0 },
            { name: 'max', label: 'Maksimal ball', type: 'number', defaultValue: 100, min: 1 },
          ]} />
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="card overflow-x-auto p-0 lg:col-span-2">
          <table className="w-full">
            <thead className="border-b border-slate-100 bg-slate-50/70"><tr><th className="th">Talaba</th><th className="th">Fanlar</th><th className="th">O'rtacha foiz</th><th className="th">Baho</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {table.map(({ s, sum }) => (
                <tr key={s._id}>
                  <td className="td font-semibold">{s.surname} {s.name}</td>
                  <td className="td">{sum.subjects.length}</td>
                  <td className="td">{sum.avgPercent != null ? `${sum.avgPercent}%` : '—'}</td>
                  <td className="td">{sum.avg5 != null ? <span className={`chip ${gradeChip(Math.round(sum.avg5))}`}>{sum.avg5}</span> : '—'}</td>
                </tr>
              ))}
              {!table.length && <tr><td colSpan={4} className="td py-10 text-center text-slate-500">Bu guruhda talaba yo'q.</td></tr>}
            </tbody>
          </table>
        </section>
        <div className="space-y-5">
          {examList}
          <section className="card">
            <h2 className="card-title mb-3">So'nggi qo'yilgan baholar</h2>
            <ul className="space-y-2">
              {recent.map((g) => (
                <li key={g._id} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">{sName[String(g.studentId)]}</div>
                    <div className="text-xs text-slate-500">{subj[String(g.subjectId)]} • {g.title} • {g.score}/{g.max}</div>
                  </div>
                  <DeleteButton endpoint="/api/grades" id={String(g._id)} />
                </li>
              ))}
              {!recent.length && <li className="text-sm text-slate-500">Hali baho qo'yilmagan.</li>}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
