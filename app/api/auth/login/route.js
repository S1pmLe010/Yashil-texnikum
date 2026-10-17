import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { connect } from '@/lib/db';
import { User } from '@/lib/models';
import { signToken, cookieOptions } from '@/lib/auth';
import { json, fail } from '@/lib/api';

export async function POST(req) {
  try {
    await connect();
    const { login = '', password = '' } = await req.json();
    const q = login.trim().toLowerCase();
    const user = q && (await User.findOne({ $or: [{ username: q }, { email: q }] }));
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return fail("Login yoki parol noto'g'ri", 401);
    }
    const token = await signToken({ id: String(user._id), role: user.role });
    cookies().set('token', token, cookieOptions);
    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return fail(e.message || 'Server xatosi', 500);
  }
}
