import { cookies } from 'next/headers';
import { json } from '@/lib/api';

export async function POST() {
  cookies().set('token', '', { path: '/', maxAge: 0 });
  return json({ ok: true });
}
