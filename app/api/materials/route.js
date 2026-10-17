import { teacherCrud } from '@/lib/api';
import { Material } from '@/lib/models';

export const { POST, DELETE } = teacherCrud(
  Material,
  ['subjectId', 'title', 'kind', 'fileUrl', 'fileName', 'size', 'link'],
  (u) => ({ teacherId: u.id, teacherName: u.fullName }),
);
