import Anthropic from '@anthropic-ai/sdk';
import { guard, json, fail } from '@/lib/api';

export const runtime = 'nodejs';
export const maxDuration = 60;

const SYSTEM = (user, topic) => `Sen "Yashil Texnikum" kompyuter tarmoqlari va IT-servis mutaxassisligi o'quvchilari uchun AI Repetitorsan.
O'quvchi: ${user.fullName}${user.group ? ` (${user.group} guruhi)` : ''}.${topic ? ` Joriy fan: ${topic}.` : ''}
Qoidalar:
- O'quvchi qaysi tilda yozsa (o'zbek lotin yoki rus), shu tilda javob ber. Odatda o'zbek tilida.
- Tushuntirishni oddiy misollar bilan, qadamma-qadam ber. Kod kerak bo'lsa, qisqa va ishlaydigan misol yoz (\`\`\` bilan).
- Mavzu oxirida 1 ta qisqa tekshiruv savoli ber.
- Faqat o'quv mavzulari: axborot xavfsizligi, kompyuter tarmoqlari, dasturlash, ma'lumotlar bazasi, elektronika, matematika, fizika, ingliz tili (IT). Boshqa mavzuda muloyimlik bilan o'quv mavzusiga qaytar.
- Uy vazifasini shunchaki tayyor yechib berma: yo'l-yo'riq ko'rsat va fikrlashga undagin.
- Tarmoq xavfsizligi mavzusida faqat himoya va ta'lim maqsadidagi tushuntirish ber; real tizimlarga hujum qilish ko'rsatmalarini berma.`;

export const POST = guard(async (req, user) => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return fail("AI Repetitor sozlanmagan: .env faylida ANTHROPIC_API_KEY ni kiriting", 503);

  const { messages = [], topic = '' } = await req.json();
  const history = messages
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
  if (!history.length || history[history.length - 1].role !== 'user') return fail('Savol yuboring');
  while (history[0].role !== 'user') history.shift();

  const client = new Anthropic({ apiKey: key });
  try {
    const res = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
      max_tokens: 1200,
      system: SYSTEM(user, String(topic).slice(0, 60)),
      messages: history,
    });
    const text = res.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
    return json({ reply: text });
  } catch (e) {
    console.error(e);
    return fail("AI javob bera olmadi. Birozdan keyin qayta urinib ko'ring", 502);
  }
});
