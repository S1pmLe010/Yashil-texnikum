export const DAYS = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
export const PAIRS = {
  1: { label: 'I juftlik', time: '08:30 – 09:50' },
  2: { label: 'II juftlik', time: '10:00 – 11:20' },
  3: { label: 'III juftlik', time: '11:40 – 13:00' },
  4: { label: 'IV juftlik', time: '13:10 – 14:30' },
};
export const KINDS = ["Ma'ruza", 'Amaliy', 'Laboratoriya', 'Seminar'];
const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];

function tashkent(date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tashkent', year: 'numeric', month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short',
  }).formatToParts(new Date(date));
  const o = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return { y: +o.year, m: +o.month, d: +o.day, hh: o.hour === '24' ? '00' : o.hour, mm: o.minute, wd: o.weekday };
}

export function fmtDate(date) {
  if (!date) return '';
  const t = tashkent(date);
  return `${t.d}-${MONTHS[t.m - 1]}, ${t.y}`;
}
export function fmtDateTime(date) {
  const t = tashkent(date);
  return `${t.d}-${MONTHS[t.m - 1]}, ${t.hh}:${t.mm}`;
}
export function fmtTime(date) {
  const t = tashkent(date);
  return `${t.hh}:${t.mm}`;
}
/** Bugun haftaning qaysi kuni (Dushanba=1 ... Yakshanba=7) */
export function todayDow() {
  const map = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  return map[tashkent(new Date()).wd];
}
export function fmtSize(bytes = 0) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
export function daysLeft(date) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}
export function timeLeft(date) {
  const ms = new Date(date).getTime() - Date.now();
  if (ms <= 0) return "Muddati o'tgan";
  const h = Math.floor(ms / 3600000);
  if (h < 48) return `${h} soat qoldi`;
  return `${Math.ceil(h / 24)} kun qoldi`;
}
export function gradeOf(percent) {
  if (percent >= 86) return 5;
  if (percent >= 71) return 4;
  if (percent >= 55) return 3;
  return 2;
}
export const plain = (x) => JSON.parse(JSON.stringify(x));
