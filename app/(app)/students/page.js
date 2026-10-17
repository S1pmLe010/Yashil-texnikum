import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { connect } from '@/lib/db';
import { User } from '@/lib/models';
import { resolveGroup } from '@/lib/data';
import GroupSwitcher from '@/components/GroupSwitcher';

export const metadata = { title: 'Talabalar — Yashil Texnikum' };

export default async function Students({ searchParams }) {
  const user = await getSession();
  if (user.role !== 'teacher') redirect('/dashboard');
  await connect();
  const { group, groups } = await resolveGroup(user, searchParams);
  const students = group ? await User.find({ role: 'student', group }).sort({ surname: 1 }).lean() : [];

  return (
    <>
      <section className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Talabalar</h1>
          <p className="text-sm text-slate-500">{group ? `${group} guruhi • ${students.length} nafar` : 'Guruh tanlanmagan'}</p>
        </div>
        <GroupSwitcher groups={groups} current={group} />
      </section>
      <section className="card overflow-x-auto p-0">
        <table className="w-full min-w-[560px]">
          <thead className="border-b border-slate-100 bg-slate-50/70"><tr><th className="th">#</th><th className="th">F.I.Sh.</th><th className="th">Foydalanuvchi</th><th className="th">Pochta</th><th className="th">Telefon</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((s, i) => (
              <tr key={s._id}>
                <td className="td text-slate-400">{i + 1}</td>
                <td className="td font-semibold">{s.surname} {s.name}</td>
                <td className="td">@{s.username}</td>
                <td className="td">{s.email}</td>
                <td className="td">{s.phone || '—'}</td>
              </tr>
            ))}
            {!students.length && <tr><td colSpan={5} className="td py-10 text-center text-slate-500">Bu guruhda talaba yo'q.</td></tr>}
          </tbody>
        </table>
      </section>
    </>
  );
}
