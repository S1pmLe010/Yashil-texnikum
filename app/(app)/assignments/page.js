import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { connect } from '@/lib/db';
import { Assignment, Submission, Subject } from '@/lib/models';
import { resolveGroup } from '@/lib/data';
import { fmtDateTime, timeLeft } from '@/lib/format';
import { AddButton, DeleteButton } from '@/components/Form';
import { SubmitWork } from '@/components/WorkForms';
import GroupSwitcher from '@/components/GroupSwitcher';
import Icon from '@/components/Icon';

export const metadata = { title: 'Vazifalar — Yashil Texnikum' };

export default async function Assignments({ searchParams }) {
  const user = await getSession();
  await connect();
  const isTeacher = user.role === 'teacher';
  const { group, groups } = await resolveGroup(user, searchParams);

  const [subjects, assignments] = await Promise.all([
    Subject.find().sort({ name: 1 }).lean(),
    group ? Assignment.find({ group }).sort({ deadline: 1 }).lean() : [],
  ]);
  const subj = Object.fromEntries(subjects.map((s) => [String(s._id), s.name]));
  const ids = assignments.map((a) => a._id);

  let mine = {};
  let counts = {};
  if (isTeacher) {
    const agg = await Submission.aggregate([
      { $match: { assignmentId: { $in: ids } } },
      { $group: { _id: { a: '$assignmentId', s: '$status' }, n: { $sum: 1 } } },
    ]);
    for (const r of agg) {
      const k = String(r._id.a);
      counts[k] = counts[k] || { submitted: 0, graded: 0 };
      counts[k][r._id.s] = r.n;
    }
  } else {
    const subs = await Submission.find({ studentId: user.id, assignmentId: { $in: ids } }).lean();
    mine = Object.fromEntries(subs.map((s) => [String(s.assignmentId), s]));
  }

  const now = Date.now();
  return (
    <>
      <section className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Vazifalar va mustaqil ishlar</h1>
          <p className="text-sm text-slate-500">{group ? `${group} guruhi` : 'Guruh tanlanmagan'} • {assignments.length} ta vazifa</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isTeacher && <GroupSwitcher groups={groups} current={group} />}
          {isTeacher && (
            <AddButton
              label="Vazifa qo'shish"
              endpoint="/api/assignments"
              fields={[
                { name: 'group', label: 'Guruh', required: true, defaultValue: group, placeholder: '26 IT 4' },
                { name: 'subjectId', label: 'Fan', type: 'select', required: true, options: subjects.map((s) => ({ value: String(s._id), label: s.name })) },
                { name: 'title', label: 'Sarlavha', required: true },
                { name: 'description', label: 'Tavsif', type: 'textarea' },
                { name: 'deadline', label: 'Muddat', type: 'datetime-local', required: true },
                { name: 'maxScore', label: 'Maksimal ball', type: 'number', defaultValue: 100, min: 1 },
              ]}
            />
          )}
        </div>
      </section>

      <section className="space-y-3">
        {assignments.map((a) => {
          const id = String(a._id);
          const sub = mine[id];
          const overdue = new Date(a.deadline).getTime() < now;
          return (
            <article key={id} className="card !p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="chip chip-green">{subj[String(a.subjectId)] || 'Fan'}</span>
                    {!isTeacher && !sub && overdue && <span className="chip chip-red">Muddati o'tgan</span>}
                    {!isTeacher && sub?.status === 'submitted' && <span className="chip chip-blue">Topshirilgan</span>}
                    {!isTeacher && sub?.status === 'graded' && <span className="chip chip-green">Baholangan: {sub.score}/{a.maxScore}</span>}
                    {!isTeacher && !sub && !overdue && <span className="chip chip-amber">Topshirilmagan</span>}
                  </div>
                  <h3 className="mt-1.5 text-base font-bold text-slate-900">{a.title}</h3>
                  {a.description && <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{a.description}</p>}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1"><Icon name="clock" className="h-3.5 w-3.5" /> {fmtDateTime(a.deadline)} ({timeLeft(a.deadline)})</span>
                    <span>O'qituvchi: {a.teacherName}</span>
                    <span>Maks: {a.maxScore} ball</span>
                  </div>
                  {sub?.feedback && <p className="mt-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-900">Izoh: {sub.feedback}</p>}
                  {sub?.fileUrl && <a href={sub.fileUrl} target="_blank" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-700"><Icon name="file" className="h-3.5 w-3.5" /> {sub.fileName}</a>}
                </div>
                <div className="flex items-center gap-2">
                  {isTeacher ? (
                    <>
                      <span className="chip chip-slate">{(counts[id]?.submitted || 0) + (counts[id]?.graded || 0)} topshirdi • {counts[id]?.submitted || 0} kutmoqda</span>
                      <Link href={`/assignments/${id}`} className="btn-ghost">Ko'rish</Link>
                      <DeleteButton endpoint="/api/assignments" id={id} confirmText="Vazifa o'chirilsinmi?" />
                    </>
                  ) : sub?.status === 'graded' ? null : (
                    (!overdue || sub) && <SubmitWork assignmentId={id} resubmit={!!sub} />
                  )}
                </div>
              </div>
            </article>
          );
        })}
        {!assignments.length && (
          <div className="card py-10 text-center text-sm text-slate-500">
            {isTeacher ? "Vazifa yo'q. «Vazifa qo'shish» tugmasi orqali yarating." : "Hozircha vazifalar yo'q."}
          </div>
        )}
      </section>
    </>
  );
}
