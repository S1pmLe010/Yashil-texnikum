import { NextResponse } from 'next/server';
import { getSession } from './auth';
import { connect } from './db';

export const json = (data, status = 200) => NextResponse.json(data, { status });
export const fail = (error, status = 400) => NextResponse.json({ error }, { status });

/** Autentifikatsiya va (ixtiyoriy) rolni tekshiradigan o'ram */
export function guard(handler, { role } = {}) {
  return async (req, ctx) => {
    try {
      const user = await getSession();
      if (!user) return fail('Tizimga kiring', 401);
      if (role && user.role !== role) return fail("Bu amal uchun ruxsat yo'q", 403);
      await connect();
      return await handler(req, user, ctx);
    } catch (e) {
      console.error(e);
      if (e?.name === 'ValidationError') return fail("Ma'lumotlar noto'g'ri to'ldirilgan");
      if (e?.name === 'CastError') return fail("Noto'g'ri qiymat");
      return fail(e?.message || 'Server xatosi', 500);
    }
  };
}

const pick = (obj, keys) =>
  Object.fromEntries(keys.filter((k) => obj[k] !== undefined && obj[k] !== '').map((k) => [k, obj[k]]));

/**
 * Ustoz uchun oddiy yaratish/o'chirish. Faqat ruxsat etilgan maydonlar olinadi.
 * extra(user, body) qo'shimcha maydonlarni qaytaradi.
 */
export function teacherCrud(Model, fields, extra = () => ({})) {
  const POST = guard(async (req, user) => {
    const body = await req.json();
    const doc = await Model.create({ ...pick(body, fields), ...extra(user, body) });
    return json({ ok: true, id: String(doc._id) });
  }, { role: 'teacher' });

  const DELETE = guard(async (req) => {
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return fail('id kerak');
    await Model.findByIdAndDelete(id);
    return json({ ok: true });
  }, { role: 'teacher' });

  return { POST, DELETE };
}
