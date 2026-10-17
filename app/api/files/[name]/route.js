import fs from 'fs/promises';
import path from 'path';
import { guard, fail } from '@/lib/api';

export const runtime = 'nodejs';

const TYPES = {
  pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
  gif: 'image/gif', webp: 'image/webp', txt: 'text/plain; charset=utf-8',
  mp4: 'video/mp4', mp3: 'audio/mpeg',
};

export const GET = guard(async (req, user, { params }) => {
  const name = path.basename(params.name);
  try {
    const buf = await fs.readFile(path.join(process.cwd(), 'uploads', name));
    const ext = name.split('.').pop().toLowerCase();
    const original = name.replace(/^[a-f0-9]{12}-/, '');
    return new Response(buf, {
      headers: {
        'Content-Type': TYPES[ext] || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${original}"`,
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return fail('Fayl topilmadi', 404);
  }
});
