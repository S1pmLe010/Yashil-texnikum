import { teacherCrud } from '@/lib/api';
import { Announcement } from '@/lib/models';

export const { POST, DELETE } = teacherCrud(
  Announcement,
  ['group', 'title', 'body'],
  (u, b) => ({ teacherId: u.id, teacherName: u.fullName, group: String(b.group || '').trim().toUpperCase() }),
);
