import { guard, json, fail } from '@/lib/api';
import { Message } from '@/lib/models';
import bus from '@/lib/events';

function resolveGroup(user, requested) {
  if (user.role === 'student') return user.group;
  return (requested || '').trim().toUpperCase();
}

export const GET = guard(async (req, user) => {
  const group = resolveGroup(user, new URL(req.url).searchParams.get('group'));
  if (!group) return json({ messages: [] });
  const list = await Message.find({ group }).sort({ createdAt: -1 }).limit(100).lean();
  return json({ messages: list.reverse().map(serialize) });
});

export const POST = guard(async (req, user) => {
  const b = await req.json();
  const group = resolveGroup(user, b.group);
  if (!group) return fail('Guruh tanlanmagan');
  const text = (b.text || '').trim().slice(0, 2000);
  if (!text && !b.fileUrl) return fail('Xabar bo‘sh');
  const doc = await Message.create({
    group, text, fileUrl: b.fileUrl || '', fileName: b.fileName || '',
    authorId: user.id, authorName: user.fullName, authorRole: user.role,
  });
  const msg = serialize(doc.toObject());
  bus.emit(`chat:${group}`, msg);
  return json({ ok: true, message: msg });
});

function serialize(m) {
  return {
    id: String(m._id), group: m.group, text: m.text, fileUrl: m.fileUrl, fileName: m.fileName,
    authorId: String(m.authorId), authorName: m.authorName, authorRole: m.authorRole,
    createdAt: new Date(m.createdAt).toISOString(),
  };
}
