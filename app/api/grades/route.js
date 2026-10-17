import { teacherCrud } from '@/lib/api';
import { Grade } from '@/lib/models';

export const { POST, DELETE } = teacherCrud(
  Grade,
  ['studentId', 'subjectId', 'title', 'score', 'max'],
  (u) => ({ teacherId: u.id }),
);
