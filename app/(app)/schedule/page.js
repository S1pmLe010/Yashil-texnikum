import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { connect } from '@/lib/db';
import { Lesson, Subject } from '@/lib/models';
import { resolveGroup } from '@/lib/data';
import { DAYS, PAIRS, KINDS, todayDow } from '@/lib/format';
import { AddButton, DeleteButton } from '@/components/Form';
import GroupSwitcher from '@/components/GroupSwitcher';

export const metadata = { title: 'Dars jadvali — Yashil Texnikum' };

export default async function Schedule({ searchParams }) {
  const user = await getSession();
  await connect();
  const isTeacher = user.role === 'teacher';
  const { group, groups } = await resolveGroup(user, searchParams);
  const dow = todayDow();
  const dayParam = searchParams?.day || (dow <= 6 ? String(dow) : 'all');
  const [subjects, lessons] = await Promise.all([
    Subject.find().sort({ name: 1 }).lean(),
    group ? Lesson.find({ group }).sort({ day: 1, pair: 1 }).lean() : [],
  ]);
  const subj = Object.fromEntries(subjects.map((s) => [String(s._id), s.name]));
  const shown = dayParam === 'all' ? lessons : lessons.filter((l) => String(l.day) === dayParam);
  const q = isTeacher ? `&group=${encodeURIComponent(group)}` : '';

  return (
    <>
      <section className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Haftalik dars jadvali</h1>
          <p className="text-sm text-slate-500">{group ? `${group} guruhi` : 'Guruh tanlanmagan'} • Kompyuter tarmoqlari va IT-servis</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isTeacher && <GroupSwitcher groups={groups} current={group} />}
          {isTeacher && (
            <>
              <AddButton small label="Fan qo'shish" endpoint="/api/subjects" fields={[{ name: 'name', label: 'Fan nomi', required: true }]} />
              <AddButton
                label="Dars qo'shish"
                endpoint="/api/lessons"
                hidden={{}}
                fields={[
                  { name: 'group', label: 'Guruh', required: true, defaultValue: group, placeholder: '26 IT 4' },
                  { name: 'subjectId', label: 'Fan', type: 'select', required: true, options: subjects.map((s) => ({ value: String(s._id), label: s.name })) },
                  { name: 'day', label: 'Kun', type: 'select', required: true, noEmpty: true, options: DAYS.map((d, i) => ({ value: i + 1, label: d })) },
                  { name: 'pair', label: 'Juftlik', type: 'select', required: true, noEmpty: true, options: Object.entries(PAIRS).map(([k, v]) => ({ value: k, label: `${v.label} (${v.time})` })) },
                  { name: 'kind', label: 'Turi', type: 'select', noEmpty: true, options: KINDS.map((k) => ({ value: k, label: k })) },
                  { name: 'room', label: 'Xona / joylashuv', placeholder: '303-xona' },
                ]}
              />
            </>
          )}
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <Link href={`/schedule?day=all${q}`} className={`pill ${dayParam === 'all' ? 'pill-active' : ''}`}>Barcha kunlar</Link>
        {DAYS.map((d, i) => (
          <Link key={d} href={`/schedule?day=${i + 1}${q}`} className={`pill ${dayParam === String(i + 1) ? 'pill-active' : ''}`}>{d}</Link>
        ))}
      </div>

      <section className="card overflow-x-auto p-0">
        <table className="w-full min-w-[640px]">
          <thead className="border-b border-slate-100 bg-slate-50/70">
            <tr><th className="th">Kun</th><th className="th">Juftlik</th><th className="th">Fan</th><th className="th">Turi</th><th className="th">O'qituvchi</th><th className="th">Xona</th>{isTeacher && <th className="th" />}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shown.map((l) => (
              <tr key={l._id}>
                <td className="td font-medium">{DAYS[l.day - 1]}</td>
                <td className="td"><div className="font-semibold">{PAIRS[l.pair].label}</div><div className="text-xs text-slate-500">{PAIRS[l.pair].time}</div></td>
                <td className="td font-semibold text-slate-900">{subj[String(l.subjectId)] || '—'}</td>
                <td className="td"><span className="chip chip-green">{l.kind}</span></td>
                <td className="td">{l.teacherName}</td>
                <td className="td">{l.room || '—'}</td>
                {isTeacher && <td className="td text-right"><DeleteButton endpoint="/api/lessons" id={String(l._id)} /></td>}
              </tr>
            ))}
            {!shown.length && (
              <tr><td colSpan={7} className="td py-10 text-center text-slate-500">
                {isTeacher ? "Bu kunga dars qo'shilmagan. Avval «Fan qo'shish», keyin «Dars qo'shish» tugmasini bosing." : "Bu kunga dars rejalashtirilmagan."}
              </td></tr>
            )}
          </tbody>
        </table>
      </section>
      <p className="text-xs text-slate-500">Juftliklar: {Object.entries(PAIRS).map(([k, v]) => `${v.label} ${v.time}`).join(' • ')}</p>
    </>
  );
}
