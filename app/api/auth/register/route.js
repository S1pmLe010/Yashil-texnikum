import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { connect } from '@/lib/db';
import { User } from '@/lib/models';
import { signToken, cookieOptions } from '@/lib/auth';
import { json, fail } from '@/lib/api';

export async function POST(req) {
  try {
    await connect();
    const b = await req.json();
    const name = (b.name || '').trim();
    const surname = (b.surname || '').trim();
    const username = (b.username || '').trim().toLowerCase();
    const email = (b.email || '').trim().toLowerCase();
    const password = b.password || '';
    const role = b.role === 'teacher' ? 'teacher' : 'student';
    const group = (b.group || '').trim().toUpperCase();

    if (!name || !surname || !username || !email) return fail("Barcha maydonlarni to'ldiring");
    if (!/^[a-z0-9_.]{3,24}$/.test(username)) return fail("Foydalanuvchi nomi 3–24 ta harf, raqam, _ yoki . dan iborat bo'lsin");
    if (!/^\S+@\S+\.\S+$/.test(email)) return fail("Elektron pochta noto'g'ri");
    if (password.length < 6) return fail("Parol kamida 6 ta belgi bo'lsin");

    if (role === 'student' && !group) return fail('Guruhingizni kiriting (masalan: 26 IT 4)');
    if (role === 'teacher') {
      if (!process.env.TEACHER_CODE) return fail("Ustoz ro'yxatdan o'tishi serverda yoqilmagan (TEACHER_CODE yo'q)", 403);
      if (b.teacherCode !== process.env.TEACHER_CODE) return fail("Ustoz kodi noto'g'ri", 403);
    }

    if (await User.findOne({ $or: [{ username }, { email }] })) {
      return fail('Bunday foydalanuvchi nomi yoki pochta allaqachon mavjud', 409);
    }

    const user = await User.create({
      name, surname, username, email, role,
      group: role === 'student' ? group : '',
      passwordHash: await bcrypt.hash(password, 10),
    });
    const token = await signToken({ id: String(user._id), role });
    cookies().set('token', token, cookieOptions);
    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return fail(e.message || 'Server xatosi', 500);
  }
}
