const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true });

// schemas
const TopicSchema = new mongoose.Schema({
  name: { type: String, required: true },
});

const CourseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  description: { type: String },
  list_topic: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }],
});

const ListCourseSchema = new mongoose.Schema({
  course_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Course' },
  prerequisite: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
});

const ProgramSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  list_teacher: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }],
  list_course: [ListCourseSchema],
});

const ListProgramsSchema = new mongoose.Schema({
  program_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Program' },
  course_id: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
});

const TeacherSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  role: Number,
  password: { type: String, required: true },
  programs: [ListProgramsSchema],
});

const AdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  role: Number,
  password: { type: String, required: true },
  program_id: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Program' }],
});

const StudentSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  role: Number,
  password: { type: String, required: true },
  enrollprogram_id: [{ type: mongoose.Schema.Types.ObjectId, ref: 'EnrollProgram' }],
});

const ListTopicCourseSchema = new mongoose.Schema({
  topic_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Topic' },
  status_topic: Number,
});

const ListCourseProgramSchema = new mongoose.Schema({
  course_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Course' },
  status_course: Number,
  topics: [ListTopicCourseSchema],
});

const EnrollProgramSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Student' },
  program_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Program' },
  status_program: Number,
  courses: [ListCourseProgramSchema],
});

StudentSchema.pre('save', function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  bcrypt.hash(this.password, Number(process.env.SALTROUNDS)).then((hashed) => {
    this.password = hashed;
    return next();
  });
});
StudentSchema.methods.comparePassword = function (candidatePassword, callback) {
  bcrypt.compare(candidatePassword, this.password, (err, ismatch) => {
    if (err) {
      return callback(err);
    }
    return callback(null, ismatch);
  });
};
StudentSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this.id }, process.env.JWTSECRET, { expiresIn: 12 * 3600 });
  return token;
};

AdminSchema.pre('save', function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  bcrypt.hash(this.password, Number(process.env.SALTROUNDS)).then((hashed) => {
    this.password = hashed;
    next();
  });
});
AdminSchema.methods.comparePassword = function (candidatePassword, callback) {
  bcrypt.compare(candidatePassword, this.password, (err, ismatch) => {
    if (err) {
      return callback(err);
    }
    return callback(null, ismatch);
  });
};
AdminSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this.id }, process.env.JWTSECRET, { expiresIn: 12 * 3600 });
  return token;
};

TeacherSchema.pre('save', function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  bcrypt.hash(this.password, Number(process.env.SALTROUNDS)).then((hashed) => {
    this.password = hashed;
    next();
  });
});
TeacherSchema.methods.comparePassword = function (candidatePassword, callback) {
  bcrypt.compare(candidatePassword, this.password, (err, ismatch) => {
    if (err) {
      return callback(err);
    }
    return callback(null, ismatch);
  });
};
TeacherSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this.id }, process.env.JWTSECRET, { expiresIn: 12 * 3600 });
  return token;
};

const Topic = mongoose.model('Topic', TopicSchema);
const Course = mongoose.model('Course', CourseSchema);
const Program = mongoose.model('Program', ProgramSchema);
const Teacher = mongoose.model('Teacher', TeacherSchema);
const Admin = mongoose.model('Admin', AdminSchema);
const Student = mongoose.model('Student', StudentSchema);
const EnrollProgram = mongoose.model('EnrollProgram', EnrollProgramSchema);

const models = {
  Topic,
  Course,
  Program,
  Teacher,
  Admin,
  Student,
  EnrollProgram,
};

module.exports = models;
