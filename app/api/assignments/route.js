import { teacherCrud } from '@/lib/api';
import { Assignment } from '@/lib/models';

export const { POST, DELETE } = teacherCrud(
  Assignment,
  ['group', 'subjectId', 'title', 'description', 'deadline', 'maxScore'],
  (u, b) => ({ teacherId: u.id, teacherName: u.fullName, group: String(b.group || '').trim().toUpperCase() }),
);
