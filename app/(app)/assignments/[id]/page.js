import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { connect } from '@/lib/db';
import { Assignment, Submission, User, Subject } from '@/lib/models';
import { fmtDateTime } from '@/lib/format';
import { GradeForm } from '@/components/WorkForms';
import Icon from '@/components/Icon';

export default async function Review({ params }) {
  const user = await getSession();
  if (user.role !== 'teacher') redirect('/assignments');
  await connect();
  let a;
  try { a = await Assignment.findById(params.id).lean(); } catch { notFound(); }
  if (!a) notFound();

  const [students, subs, subject] = await Promise.all([
    User.find({ role: 'student', group: a.group }).sort({ surname: 1 }).lean(),
    Submission.find({ assignmentId: a._id }).lean(),
    Subject.findById(a.subjectId).lean(),
  ]);
  const byStudent = Object.fromEntries(subs.map((s) => [String(s.studentId), s]));

  return (
    <>
      <Link href={`/assignments?group=${encodeURIComponent(a.group)}`} className="text-sm font-semibold text-brand-700">← Vazifalarga qaytish</Link>
      <section className="card">
        <span className="chip chip-green">{subject?.name}</span>
        <h1 className="mt-1.5 text-xl font-extrabold text-slate-900">{a.title}</h1>
        <p className="text-sm text-slate-500">{a.group} • Muddat: {fmtDateTime(a.deadline)} • Maks: {a.maxScore} ball</p>
      </section>

      <section className="card overflow-x-auto p-0">
        <table className="w-full min-w-[720px]">
          <thead className="border-b border-slate-100 bg-slate-50/70">
            <tr><th className="th">Talaba</th><th className="th">Holat</th><th className="th">Ish</th><th className="th">Baho</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((s) => {
              const sub = byStudent[String(s._id)];
              return (
                <tr key={s._id}>
                  <td className="td font-semibold">{s.name} {s.surname}</td>
                  <td className="td">
                    {!sub && <span className="chip chip-red">Topshirmagan</span>}
                    {sub?.status === 'submitted' && <span className="chip chip-amber">Baholanmagan</span>}
                    {sub?.status === 'graded' && <span className="chip chip-green">{sub.score}/{a.maxScore}</span>}
                  </td>
                  <td className="td text-sm">
                    {sub?.fileUrl && <a href={sub.fileUrl} target="_blank" className="inline-flex items-center gap-1 font-semibold text-brand-700"><Icon name="file" className="h-3.5 w-3.5" />{sub.fileName}</a>}
                    {sub?.comment && <div className="text-xs text-slate-500">“{sub.comment}”</div>}
                    {!sub && '—'}
                  </td>
                  <td className="td">
                    {sub ? <GradeForm submissionId={String(sub._id)} max={a.maxScore} score={sub.score} feedback={sub.feedback} /> : '—'}
                  </td>
                </tr>
              );
            })}
            {!students.length && <tr><td colSpan={4} className="td py-8 text-center text-slate-500">Bu guruhda hali talaba yo'q.</td></tr>}
          </tbody>
        </table>
      </section>
    </>
  );
}
