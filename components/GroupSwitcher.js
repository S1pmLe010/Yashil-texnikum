'use client';
import { useRouter, usePathname } from 'next/navigation';

export default function GroupSwitcher({ groups, current }) {
  const router = useRouter();
  const path = usePathname();
  if (!groups.length) {
    return <div className="chip chip-amber">Hali guruh yo'q — o'quvchilar ro'yxatdan o'tgach yoki jadval qo'shsangiz paydo bo'ladi</div>;
  }
  return (
    <label className="inline-flex items-center gap-2 text-sm text-slate-600">
      Guruh:
      <select
        value={current}
        onChange={(e) => router.push(`${path}?group=${encodeURIComponent(e.target.value)}`)}
        className="input !w-auto !py-1.5 font-semibold"
      >
        {groups.map((g) => <option key={g} value={g}>{g}</option>)}
      </select>
    </label>
  );
}
