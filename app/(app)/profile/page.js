import { getSession } from '@/lib/auth';
import ProfileForm from '@/components/ProfileForm';

export const metadata = { title: 'Profil — Yashil Texnikum' };

export default async function Page() {
  const user = await getSession();
  return (
    <>
      <section className="card flex items-center gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-600 text-2xl font-bold text-white">
          {(user.name[0] + user.surname[0]).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">{user.fullName}</h1>
          <span className="chip chip-green mt-1">{user.role === 'teacher' ? 'Ustoz' : `Talaba • ${user.group}`}</span>
        </div>
      </section>
      <ProfileForm user={user} />
    </>
  );
}
