import { teacherCrud } from '@/lib/api';
import { Lesson } from '@/lib/models';

export const { POST, DELETE } = teacherCrud(
  Lesson,
  ['group', 'subjectId', 'day', 'pair', 'room', 'kind'],
  (u, b) => ({ teacherId: u.id, teacherName: u.fullName, group: String(b.group || '').trim().toUpperCase() }),
);
