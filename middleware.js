import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC = ['/login', '/register', '/api/auth'];

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const token = req.cookies.get('token')?.value;

  let valid = false;
  if (token) {
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me'));
      valid = true;
    } catch {}
  }

  if (isPublic) {
    // Kirgan foydalanuvchi login/register'ga qaytmasin
    if (valid && (pathname === '/login' || pathname === '/register')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  }
  if (!valid) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Tizimga kiring' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
