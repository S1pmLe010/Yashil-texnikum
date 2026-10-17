import { teacherCrud } from '@/lib/api';
import { Exam } from '@/lib/models';

export const { POST, DELETE } = teacherCrud(
  Exam,
  ['group', 'subjectId', 'title', 'date', 'room'],
  (u, b) => ({ teacherId: u.id, group: String(b.group || '').trim().toUpperCase() }),
);
