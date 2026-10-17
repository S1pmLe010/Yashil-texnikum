import { getSession } from '@/lib/auth';
import { connect } from '@/lib/db';
import { Message, Announcement } from '@/lib/models';
import { resolveGroup } from '@/lib/data';
import { fmtDate, plain } from '@/lib/format';
import Chat from '@/components/Chat';
import GroupSwitcher from '@/components/GroupSwitcher';
import { AddButton, DeleteButton } from '@/components/Form';

export const metadata = { title: "Guruh Chati & E'lonlar — Yashil Texnikum" };

export default async function ChatPage({ searchParams }) {
  const user = await getSession();
  await connect();
  const isTeacher = user.role === 'teacher';
  const { group, groups } = await resolveGroup(user, searchParams);

  if (!group) {
    return (
      <section className="card py-10 text-center text-sm text-slate-500">
        Chat uchun guruh yo'q. O'quvchilar ro'yxatdan o'tgach guruh paydo bo'ladi.
        <div className="mt-3"><GroupSwitcher groups={groups} current={group} /></div>
      </section>
    );
  }

  const [msgs, announcements] = await Promise.all([
    Message.find({ group }).sort({ createdAt: -1 }).limit(100).lean(),
    Announcement.find({ group }).sort({ createdAt: -1 }).limit(10).lean(),
  ]);
  const initial = plain(msgs.reverse().map((m) => ({
    id: String(m._id), group: m.group, text: m.text, fileUrl: m.fileUrl, fileName: m.fileName,
    authorId: String(m.authorId), authorName: m.authorName, authorRole: m.authorRole,
    createdAt: new Date(m.createdAt).toISOString(),
  })));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-extrabold text-slate-900">Guruh chati va rasmiy e'lonlar</h1>
        {isTeacher && <GroupSwitcher groups={groups} current={group} />}
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Chat key={group} group={group} me={user.id} initial={initial} />
        </div>
        <aside className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="card-title">E'lonlar doskasi</h2>
            {isTeacher && (
              <AddButton small label="E'lon" title="Yangi e'lon" endpoint="/api/announcements" fields={[
                { name: 'group', label: 'Guruh', required: true, defaultValue: group },
                { name: 'title', label: 'Sarlavha', required: true },
                { name: 'body', label: 'Matn', type: 'textarea' },
              ]} />
            )}
          </div>
          {announcements.map((a) => (
            <article key={a._id} className="card !p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-bold text-slate-900">{a.title}</div>
                {isTeacher && <DeleteButton endpoint="/api/announcements" id={String(a._id)} />}
              </div>
              {a.body && <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{a.body}</p>}
              <div className="mt-2 text-xs text-slate-400">{a.teacherName} • {fmtDate(a.createdAt)}</div>
            </article>
          ))}
          {!announcements.length && <div className="card text-sm text-slate-500">E'lonlar yo'q.</div>}
        </aside>
      </div>
    </>
  );
}
