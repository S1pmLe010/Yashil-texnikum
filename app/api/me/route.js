import bcrypt from 'bcryptjs';
import { guard, json, fail } from '@/lib/api';
import { User } from '@/lib/models';

export const PATCH = guard(async (req, me) => {
  const b = await req.json();
  const u = await User.findById(me.id);
  if (b.name !== undefined) u.name = String(b.name).trim() || u.name;
  if (b.surname !== undefined) u.surname = String(b.surname).trim() || u.surname;
  if (b.phone !== undefined) u.phone = String(b.phone).trim();
  if (b.newPassword) {
    if (b.newPassword.length < 6) return fail("Yangi parol kamida 6 ta belgi bo'lsin");
    if (!(await bcrypt.compare(b.currentPassword || '', u.passwordHash))) return fail("Joriy parol noto'g'ri", 403);
    u.passwordHash = await bcrypt.hash(b.newPassword, 10);
  }
  await u.save();
  return json({ ok: true });
});
