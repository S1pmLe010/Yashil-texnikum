import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { connect } from '@/lib/db';
import { Lesson, Assignment, Submission, Exam, Material, Announcement, User, Subject } from '@/lib/models';
import { resolveGroup, studentScores, summarize } from '@/lib/data';
import { PAIRS, DAYS, todayDow, fmtDate, timeLeft, fmtSize } from '@/lib/format';
import GroupSwitcher from '@/components/GroupSwitcher';
import Icon from '@/components/Icon';

export const metadata = { title: 'Bosh sahifa — Yashil Texnikum' };

export default async function Dashboard({ searchParams }) {
  const user = await getSession();
  await connect();
  const { group, groups } = await resolveGroup(user, searchParams);
  const isTeacher = user.role === 'teacher';
  const dow = todayDow();
  const now = new Date();

  const [subjects, lessons, assignments, exams, materials, announcements] = await Promise.all([
    Subject.find().lean(),
    group && dow <= 6 ? Lesson.find({ group, day: dow }).sort({ pair: 1 }).lean() : [],
    group ? Assignment.find({ group, deadline: { $gte: now } }).sort({ deadline: 1 }).limit(20).lean() : [],
    group ? Exam.find({ group, date: { $gte: now } }).sort({ date: 1 }).limit(3).lean() : [],
    Material.find().sort({ createdAt: -1 }).limit(3).lean(),
    group ? Announcement.find({ group }).sort({ createdAt: -1 }).limit(2).lean() : [],
  ]);
  const subj = Object.fromEntries(subjects.map((s) => [String(s._id), s.name]));

  let stats = [];
  let urgent = [];
  if (isTeacher) {
    const aIds = (await Assignment.find({ group }).select('_id').lean()).map((a) => a._id);
    const [students, toGrade] = await Promise.all([
      group ? User.countDocuments({ role: 'student', group }) : 0,
      Submission.countDocuments({ assignmentId: { $in: aIds }, status: 'submitted' }),
    ]);
    stats = [
      ['Talabalar', students],
      ['Baholanishi kerak', toGrade],
      ['Bugungi darslar', lessons.length],
    ];
    urgent = assignments.slice(0, 3);
  } else {
    const [mine, rows] = await Promise.all([
      Submission.find({ studentId: user.id, assignmentId: { $in: assignments.map((a) => a._id) } }).lean(),
      studentScores(user.id, group),
    ]);
    const done = new Set(mine.map((s) => String(s.assignmentId)));
    urgent = assignments.filter((a) => !done.has(String(a._id))).slice(0, 3);
    const { avg5 } = summarize(rows);
    stats = [
      ["O'rtacha baho", avg5 ?? '—'],
      ['Topshirilmagan vazifa', urgent.length],
      ['Bugungi darslar', lessons.length],
    ];
  }

  const next = lessons[0];
  return (
    <>
      <section className="card bg-gradient-to-br from-white to-brand-50">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="chip chip-green">{dow <= 6 ? DAYS[dow - 1] : 'Yakshanba'} • {fmtDate(now)}</div>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Xush kelibsiz, {user.name}! 👋</h1>
            <p className="mt-1 text-sm text-slate-600">
              {lessons.length
                ? `Bugun sizda ${lessons.length} ta juftlik rejalashtirilgan.`
                : "Bugun dars yo'q. Dam oling yoki vazifalarni bajaring."}
            </p>
            {next && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm shadow-sm">
                <Icon name="clock" className="h-4 w-4 text-brand-600" />
                Birinchi dars: <b>{subj[String(next.subjectId)]}</b>
                <span className="text-slate-500">{PAIRS[next.pair].time} • {next.room}</span>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            {stats.map(([k, v]) => (
              <div key={k} className="min-w-[110px] rounded-xl bg-white px-4 py-3 shadow-sm">
                <div className="text-[11px] text-slate-500">{k}</div>
                <div className="mt-1 text-2xl font-extrabold text-brand-700">{v}</div>
              </div>
            ))}
          </div>
        </div>
        {isTeacher && <div className="mt-4"><GroupSwitcher groups={groups} current={group} /></div>}
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="card-title">Bugungi dars jadvali</h2>
            <Link href={`/schedule${isTeacher ? `?group=${encodeURIComponent(group)}` : ''}`} className="text-xs font-semibold text-brand-700">To'liq jadval →</Link>
          </div>
          {lessons.length ? (
            <ul className="space-y-2">
              {lessons.map((l) => (
                <li key={l._id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3">
                  <div>
                    <div className="text-[11px] font-semibold text-brand-700">{PAIRS[l.pair].label} • {PAIRS[l.pair].time}</div>
                    <div className="text-sm font-semibold text-slate-900">{subj[String(l.subjectId)]} <span className="font-normal text-slate-500">({l.kind})</span></div>
                    <div className="text-xs text-slate-500">{l.teacherName} • {l.room}</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-slate-500">Bugun darslar yo'q.</p>}
        </section>

        <section className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="card-title">Shoshilinch vazifalar</h2>
            <Link href="/assignments" className="text-xs font-semibold text-brand-700">Barchasi</Link>
          </div>
          {urgent.length ? (
            <ul className="space-y-2">
              {urgent.map((a) => (
                <li key={a._id} className="rounded-xl bg-slate-50 p-3">
                  <div className="text-[11px] font-semibold text-slate-500">{subj[String(a.subjectId)]}</div>
                  <div className="text-sm font-semibold text-slate-900">{a.title}</div>
                  <div className="mt-1 text-xs text-amber-700">{timeLeft(a.deadline)}</div>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-slate-500">Hozircha shoshilinch vazifa yo'q.</p>}
        </section>

        <section className="card">
          <h2 className="card-title mb-3">Yaqinlashayotgan imtihonlar</h2>
          {exams.length ? (
            <ul className="space-y-2">
              {exams.map((e) => (
                <li key={e._id} className="rounded-xl bg-slate-50 p-3 text-sm">
                  <div className="font-semibold text-slate-900">{e.title}</div>
                  <div className="text-xs text-slate-500">{subj[String(e.subjectId)]} • {fmtDate(e.date)} {e.room && `• ${e.room}`}</div>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-slate-500">Rejalashtirilgan imtihon yo'q.</p>}
        </section>

        <section className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="card-title">Yangi materiallar</h2>
            <Link href="/materials" className="text-xs font-semibold text-brand-700">Resurslar</Link>
          </div>
          {materials.length ? (
            <ul className="space-y-2">
              {materials.map((m) => (
                <li key={m._id} className="flex items-center justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-slate-900">{m.title}</div>
                    <div className="text-xs text-slate-500">{subj[String(m.subjectId)]} {m.size ? `• ${fmtSize(m.size)}` : ''}</div>
                  </div>
                  <a href={m.fileUrl || m.link} target="_blank" className="text-brand-700"><Icon name="download" /></a>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-slate-500">Materiallar hali yuklanmagan.</p>}
        </section>

        <section className="card bg-brand-50">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="card-title">E'lonlar</h2>
            <Link href="/chat" className="text-xs font-semibold text-brand-700">Chat</Link>
          </div>
          {announcements.length ? (
            <ul className="space-y-3">
              {announcements.map((a) => (
                <li key={a._id}>
                  <div className="text-sm font-semibold text-slate-900">{a.title}</div>
                  <div className="line-clamp-2 text-xs text-slate-600">{a.body}</div>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-slate-500">E'lonlar yo'q.</p>}
        </section>

        <Link href="/ai" className="card flex items-center gap-3 transition hover:shadow-md">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-100 text-brand-700"><Icon name="bot" className="h-5 w-5" /></div>
          <div>
            <div className="card-title">AI Repetitor</div>
            <div className="text-xs text-slate-500">Mavzu bo'yicha savol bering</div>
          </div>
        </Link>
      </div>
    </>
  );
}
