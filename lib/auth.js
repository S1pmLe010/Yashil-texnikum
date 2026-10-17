import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { connect } from './db';
import { User } from './models';

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me');

export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret());
}

export async function readToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload;
  } catch {
    return null;
  }
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production' && process.env.INSECURE_COOKIES !== '1',
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
};

/** Joriy foydalanuvchi (oddiy obyekt) yoki null */
export async function getSession() {
  const t = cookies().get('token')?.value;
  if (!t) return null;
  const p = await readToken(t);
  if (!p?.id) return null;
  await connect();
  const u = await User.findById(p.id).lean();
  if (!u) return null;
  return {
    id: String(u._id),
    name: u.name,
    surname: u.surname,
    fullName: `${u.name} ${u.surname}`,
    username: u.username,
    email: u.email,
    role: u.role,
    group: u.group || '',
    phone: u.phone || '',
  };
}
