import { guard, json, fail } from '@/lib/api';
import { Submission, Assignment } from '@/lib/models';

// O'quvchi topshiradi (qayta topshirsa yangilanadi, baho tozalanadi)
export const POST = guard(async (req, user) => {
  const b = await req.json();
  const a = await Assignment.findById(b.assignmentId).lean();
  if (!a || a.group !== user.group) return fail('Topshiriq topilmadi', 404);
  if (!b.fileUrl && !(b.comment || '').trim()) return fail("Fayl yoki izoh qo'shing");
  const existing = await Submission.findOne({ assignmentId: a._id, studentId: user.id });
  if (existing?.status === 'graded') return fail("Baholangan ishni qayta topshirib bo'lmaydi", 409);
  await Submission.findOneAndUpdate(
    { assignmentId: a._id, studentId: user.id },
    {
      $set: {
        fileUrl: b.fileUrl || '', fileName: b.fileName || '',
        comment: (b.comment || '').slice(0, 500), status: 'submitted',
      },
    },
    { upsert: true },
  );
  return json({ ok: true });
}, { role: 'student' });

// Ustoz baholaydi
export const PATCH = guard(async (req) => {
  const b = await req.json();
  const sub = await Submission.findById(b.id);
  if (!sub) return fail('Topilmadi', 404);
  const a = await Assignment.findById(sub.assignmentId).lean();
  const score = Number(b.score);
  if (Number.isNaN(score) || score < 0 || score > (a?.maxScore ?? 100)) return fail("Ball noto'g'ri");
  sub.score = score;
  sub.feedback = (b.feedback || '').slice(0, 500);
  sub.status = 'graded';
  await sub.save();
  return json({ ok: true });
}, { role: 'teacher' });
