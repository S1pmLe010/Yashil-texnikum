import { teacherCrud } from '@/lib/api';
import { Subject } from '@/lib/models';

export const { POST, DELETE } = teacherCrud(Subject, ['name'], (u) => ({ teacherId: u.id, teacherName: u.fullName }));
