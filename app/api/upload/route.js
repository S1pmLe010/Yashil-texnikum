import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { guard, json, fail } from '@/lib/api';

export const runtime = 'nodejs';
const MAX = 25 * 1024 * 1024;
const BLOCKED = /\.(exe|bat|cmd|sh|msi|com|scr|js|html?|svg|php)$/i;

export const POST = guard(async (req) => {
  const form = await req.formData();
  const file = form.get('file');
  if (!file || typeof file === 'string') return fail('Fayl tanlanmagan');
  if (file.size > MAX) return fail('Fayl hajmi 25 MB dan oshmasin');
  if (BLOCKED.test(file.name)) return fail("Bu turdagi fayllarni yuklab bo'lmaydi");

  const safe = path.basename(file.name).replace(/[^\w.\-]+/g, '_').slice(-80);
  const stored = `${crypto.randomBytes(6).toString('hex')}-${safe}`;
  const dir = path.join(process.cwd(), 'uploads');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, stored), Buffer.from(await file.arrayBuffer()));
  return json({ url: `/api/files/${stored}`, name: file.name, size: file.size });
});
