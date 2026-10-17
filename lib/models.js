import mongoose from 'mongoose';

const { Schema, model, models } = mongoose;
const oid = { type: Schema.Types.ObjectId };

const User = models.User || model('User', new Schema({
  name: { type: String, required: true, trim: true },
  surname: { type: String, required: true, trim: true },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['student', 'teacher'], required: true },
  group: { type: String, default: '', trim: true },
  phone: { type: String, default: '' },
}, { timestamps: true }));

const Subject = models.Subject || model('Subject', new Schema({
  name: { type: String, required: true, trim: true },
  teacherName: { type: String, default: '' },
  teacherId: oid,
}, { timestamps: true }));

const Lesson = models.Lesson || model('Lesson', new Schema({
  group: { type: String, required: true, trim: true },
  subjectId: { ...oid, ref: 'Subject', required: true },
  day: { type: Number, min: 1, max: 6, required: true },
  pair: { type: Number, min: 1, max: 4, required: true },
  room: { type: String, default: '' },
  kind: { type: String, default: "Ma'ruza" },
  teacherId: oid,
  teacherName: { type: String, default: '' },
}, { timestamps: true }));

const Material = models.Material || model('Material', new Schema({
  subjectId: { ...oid, ref: 'Subject', required: true },
  title: { type: String, required: true, trim: true },
  kind: { type: String, default: "Ma'ruza" },
  fileUrl: { type: String, default: '' },
  fileName: { type: String, default: '' },
  size: { type: Number, default: 0 },
  link: { type: String, default: '' },
  teacherId: oid,
  teacherName: { type: String, default: '' },
}, { timestamps: true }));

const Assignment = models.Assignment || model('Assignment', new Schema({
  group: { type: String, required: true, trim: true },
  subjectId: { ...oid, ref: 'Subject', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  deadline: { type: Date, required: true },
  maxScore: { type: Number, default: 100 },
  teacherId: oid,
  teacherName: { type: String, default: '' },
}, { timestamps: true }));

const Submission = models.Submission || model('Submission', new Schema({
  assignmentId: { ...oid, ref: 'Assignment', required: true },
  studentId: { ...oid, ref: 'User', required: true },
  fileUrl: { type: String, default: '' },
  fileName: { type: String, default: '' },
  comment: { type: String, default: '' },
  score: { type: Number, default: null },
  feedback: { type: String, default: '' },
  status: { type: String, enum: ['submitted', 'graded'], default: 'submitted' },
}, { timestamps: true }));
Submission.schema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

const Exam = models.Exam || model('Exam', new Schema({
  group: { type: String, required: true, trim: true },
  subjectId: { ...oid, ref: 'Subject', required: true },
  title: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  room: { type: String, default: '' },
  teacherId: oid,
}, { timestamps: true }));

const Grade = models.Grade || model('Grade', new Schema({
  studentId: { ...oid, ref: 'User', required: true },
  subjectId: { ...oid, ref: 'Subject', required: true },
  title: { type: String, required: true, trim: true },
  score: { type: Number, required: true },
  max: { type: Number, default: 100 },
  teacherId: oid,
}, { timestamps: true }));

const Announcement = models.Announcement || model('Announcement', new Schema({
  group: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  body: { type: String, default: '' },
  teacherId: oid,
  teacherName: { type: String, default: '' },
}, { timestamps: true }));

const Message = models.Message || model('Message', new Schema({
  group: { type: String, required: true, index: true },
  text: { type: String, default: '' },
  fileUrl: { type: String, default: '' },
  fileName: { type: String, default: '' },
  authorId: oid,
  authorName: { type: String, default: '' },
  authorRole: { type: String, default: 'student' },
}, { timestamps: true }));

export { User, Subject, Lesson, Material, Assignment, Submission, Exam, Grade, Announcement, Message };
