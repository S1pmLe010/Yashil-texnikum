import { getSession } from '@/lib/auth';
import AiChat from '@/components/AiChat';

export const metadata = { title: 'AI Repetitor — Yashil Texnikum' };

export default async function Page() {
  const user = await getSession();
  return <AiChat name={user.name} />;
}
