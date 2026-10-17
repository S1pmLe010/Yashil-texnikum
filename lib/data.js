import { connect } from './db';
import { User, Lesson, Assignment, Submission, Grade } from './models';
import { gradeOf } from './format';

export async function getGroups() {
  await connect();
  const [a, b, c] = await Promise.all([
    User.distinct('group', { role: 'student' }),
    Lesson.distinct('group'),
    Assignment.distinct('group'),
  ]);
  return [...new Set([...a, ...b, ...c].filter(Boolean))].sort();
}

/** O'quvchi uchun o'z guruhi; ustoz uchun ?group= yoki birinchi guruh */
export async function resolveGroup(user, searchParams) {
  if (user.role === 'student') return { group: user.group, groups: [user.group] };
  const groups = await getGroups();
  const asked = String(searchParams?.group || '').trim().toUpperCase();
  return { group: asked || groups[0] || '', groups };
}

/** O'quvchining baholangan ishlari + ustoz qo'ygan baholar */
export async function studentScores(studentId, group) {
  await connect();
  const assigns = await Assignment.find({ group }).lean();
  const aMap = new Map(assigns.map((a) => [String(a._id), a]));
  const [subs, grades] = await Promise.all([
    Submission.find({ studentId, status: 'graded', assignmentId: { $in: assigns.map((a) => a._id) } }).lean(),
    Grade.find({ studentId }).lean(),
  ]);
  const rows = [];
  for (const s of subs) {
    const a = aMap.get(String(s.assignmentId));
    if (a) rows.push({ subjectId: String(a.subjectId), title: a.title, score: s.score, max: a.maxScore, source: 'Vazifa' });
  }
  for (const g of grades) {
    rows.push({ subjectId: String(g.subjectId), title: g.title, score: g.score, max: g.max, source: 'Ustoz bahosi' });
  }
  return rows;
}

/** Fanlar bo'yicha foiz va umumiy o'rtacha (5 ballik shkala) */
export function summarize(rows) {
  const per = new Map();
  for (const r of rows) {
    const p = per.get(r.subjectId) || { score: 0, max: 0, items: [] };
    p.score += r.score;
    p.max += r.max || 100;
    p.items.push(r);
    per.set(r.subjectId, p);
  }
  const subjects = [...per.entries()].map(([subjectId, p]) => {
    const percent = p.max ? Math.round((p.score / p.max) * 100) : 0;
    return { subjectId, percent, grade: gradeOf(percent), items: p.items };
  });
  const avgPercent = subjects.length ? Math.round(subjects.reduce((s, x) => s + x.percent, 0) / subjects.length) : null;
  const avg5 = subjects.length ? +(subjects.reduce((s, x) => s + x.grade, 0) / subjects.length).toFixed(1) : null;
  return { subjects, avgPercent, avg5 };
}
