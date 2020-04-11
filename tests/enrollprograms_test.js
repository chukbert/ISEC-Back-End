/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable max-len */

const mongoose = require('mongoose');
const chai = require('chai');
const chaiHttp = require('chai-http');
const db = require('../db/models');
const server = require('../app');

const should = chai.should();

const {
  Topic, Course, Program, Teacher, Admin, Student, EnrollProgram,
} = db;

chai.use(chaiHttp);

describe('Enroll Programs', async () => {
  await mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true })
    .catch();

  const student = await new Student({
    username: 'studenttest',
    email: 'studenttest@studenttest.com',
    password: 'studenttest',
    role: 0,
  }).save();

  const admin = await new Admin({
    username: 'admintest',
    email: 'admintest@admintest.com',
    password: 'admintest',
    role: 0,
  }).save();

  const topic1 = await new Topic({
    name: 'Inheritance',
  }).save();

  const topic2 = await new Topic({
    name: 'Exception',
  }).save();

  const course1 = await new Course({
    name: 'Object-oriented Programming',
    code: 'IF2110',
    description: 'lorem ipsum',
    list_topic: [topic1.id, topic2.id],
  }).save();

  const program1 = await new Program({
    name: 'Teknik Informatika',
    description: 'lorem ipsum dono?',
    list_teacher: [],
    list_course: [{
      course_id: course1.id,
      prerequisite: [],
    }],
  }).save();

  const token = await student.generateAuthToken();

  describe('GET enrollprograms/', () => {
    it('it should not GET an enrollprogram info from user', (done) => {
      chai.request(server)
        .get('/enrollprograms/')
        .set('Authorization', token)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('data');
          res.body.data.should.be.a('array');
          done();
        });
    });
  });

  describe('POST enrollprograms/new/:id', () => {
    it('it should enroll to existing program', (done) => {
      chai.request(server)
        .post(`/enrollprograms/new/${program1.id}`)
        .set('Authorization', token)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('success').eql(true);
          res.body.should.have.property('user_id');
          res.body.should.have.property('id');
          done();
        });
    });

    it('it should not enroll to non-existing program', (done) => {
      chai.request(server)
        .post('/enrollprograms/new/somethingrandom')
        .set('Authorization', token)
        .end((err, res) => {
          res.should.have.status(500);
          res.body.should.have.property('success').eql(false);
          done();
        });
    });
  });

  describe('GET enrollprograms/:id', () => {
    it('it should get enroll program info given id program', (done) => {
      chai.request(server)
        .get(`/enrollprograms/${program1.id}`)
        .set('Authorization', token)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('success').eql(true);
          res.body.should.have.property('data');
          res.body.data.should.have.property('program_id');
          res.body.data.should.have.property('user_id');
          res.body.data.should.have.property('status_program');
          done();
        });
    });

    it('it should not GET enroll program because id program not exist', (done) => {
      chai.request(server)
        .get('/enrollprograms/somethingrandom')
        .set('Authorization', token)
        .end((err, res) => {
          res.should.have.status(500);
          res.body.should.have.property('success').eql(false);
          res.body.should.have.property('error');
          done();
        });
    });
  });

  describe('GET enrollprograms/:id/courses/:courseid', () => {
    it('it should GET a course in a program', (done) => {
      chai.request(server)
        .get(`/enrollprograms/${program1.id}/courses/${course1.id}`)
        .set('Authorization', token)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('success').eql(true);
          res.body.should.have.property('data');
          done();
        });
    });
    it('it should not GET an non-existing course in a program', (done) => {
      chai.request(server)
        .get(`/enrollprograms/${program1.id}/courses/somethingrandom`)
        .set('Authorization', token)
        .end((err, res) => {
          res.should.have.status(404);
          res.body.should.have.property('success').eql(false);
          res.body.should.have.property('error');
          done();
        });
    });
    it('it should not GET a course in a non-existing program', (done) => {
      chai.request(server)
        .get(`/enrollprograms/somethingrandom/courses/${course1.id}`)
        .set('Authorization', token)
        .end((err, res) => {
          res.should.have.status(500);
          res.body.should.have.property('success').eql(false);
          res.body.should.have.property('error');
          done();
        });
    });
  });

  describe('PATCH enrollprograms/enroll/:program_id', () => {
    it('it should not PATCH or enroll student to non-existing course in a program', (done) => {
      chai.request(server)
        .patch(`/enrollprograms/enroll/${program1.id}`)
        .set('Authorization', token)
        .send({ course_id: 'somethingrandom' })
        .end((err, res) => {
          res.should.have.status(500);
          res.body.should.have.property('success').eql(false);
          res.body.should.have.property('error');
          done();
        });
    });

    it('it should not PATCH or enroll student to course in a non-existing program', (done) => {
      chai.request(server)
        .patch('/enrollprograms/enroll/somethingrandom')
        .set('Authorization', token)
        .send({ course_id: course1.id })
        .end((err, res) => {
          res.should.have.status(500);
          res.body.should.have.property('success').eql(false);
          res.body.should.have.property('error');
          done();
        });
    });

    it('it should PATCH or enroll student to course in a program', (done) => {
      chai.request(server)
        .patch(`/enrollprograms/enroll/${program1.id}`)
        .set('Authorization', token)
        .send({ course_id: course1.id })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('success').eql(true);
          done();
        });
    });
  });

  describe('PATCH enrollprograms/start_topic/:program_id', () => {
    it('it should not PATCH or start non-existing topic in a course', (done) => {
      chai.request(server)
        .patch(`/enrollprograms/start_topic/${program1.id}`)
        .set('Authorization', token)
        .send({ course_id: course1.id, topic_id: 'somethingrandom' })
        .end((err, res) => {
          res.should.have.status(500);
          res.body.should.have.property('success').eql(false);
          res.body.should.have.property('error');
          done();
        });
    });

    it('it should not PATCH or start topic in a non-existing course', (done) => {
      chai.request(server)
        .patch(`/enrollprograms/start_topic/${program1.id}`)
        .set('Authorization', token)
        .send({ course_id: 'somethingrandom', topic: topic1.id })
        .end((err, res) => {
          res.should.have.status(500);
          res.body.should.have.property('success').eql(false);
          res.body.should.have.property('error');
          done();
        });
    });

    it('it should not PATCH or start topic in a non-existing program', (done) => {
      chai.request(server)
        .patch('/enrollprograms/start_topic/somethingrandom')
        .set('Authorization', token)
        .send({ course_id: course1.id, topic: topic1.id })
        .end((err, res) => {
          res.should.have.status(500);
          res.body.should.have.property('success').eql(false);
          res.body.should.have.property('error');
          done();
        });
    });

    it('it should PATCH or start topic in a course', (done) => {
      chai.request(server)
        .patch(`/enrollprograms/start_topic/${program1.id}`)
        .set('Authorization', token)
        .send({ course_id: course1.id, topic: topic1.id })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('success').eql(true);
          done();
        });
    });
  });

  describe('PATCH enrollprograms/finish/:program_id', () => {
    it('it should not PATCH or finish non-existing topic in a course', (done) => {
      chai.request(server)
        .patch(`/enrollprograms/finish/${program1.id}`)
        .set('Authorization', token)
        .send({ course_id: course1.id, topic_id: 'somethingrandom' })
        .end((err, res) => {
          res.should.have.status(500);
          res.body.should.have.property('success').eql(false);
          res.body.should.have.property('error');
          done();
        });
    });

    it('it should not PATCH or finish topic in a non-existing course', (done) => {
      chai.request(server)
        .patch(`/enrollprograms/finish/${program1.id}`)
        .set('Authorization', token)
        .send({ course_id: 'somethingrandom', topic: topic1.id })
        .end((err, res) => {
          res.should.have.status(500);
          res.body.should.have.property('success').eql(false);
          res.body.should.have.property('error');
          done();
        });
    });

    it('it should not PATCH or finish topic in a non-existing program', (done) => {
      chai.request(server)
        .patch('/enrollprograms/finish/somethingrandom')
        .set('Authorization', token)
        .send({ course_id: course1.id, topic: topic1.id })
        .end((err, res) => {
          res.should.have.status(500);
          res.body.should.have.property('success').eql(false);
          res.body.should.have.property('error');
          done();
        });
    });

    it('it should PATCH or finish topic in a course', (done) => {
      chai.request(server)
        .patch(`/enrollprograms/finish/${program1.id}`)
        .set('Authorization', token)
        .send({ course_id: course1.id, topic: topic1.id })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('success').eql(true);
          res.body.should.have.property('status_topic').eql(2);
          done();
        });
    });
  });

  describe('PATCH enrollprograms/fail/:program_id', () => {
    it('it should not PATCH or fail student from non-existing course in a program', (done) => {
      chai.request(server)
        .patch(`/enrollprograms/fail/${program1.id}`)
        .set('Authorization', admin.generateAuthToken())
        .send({ student_id: student.id, course_id: 'somethingrandom' })
        .end((err, res) => {
          res.should.have.status(500);
          res.body.should.have.property('success').eql(false);
          res.body.should.have.property('error');
          done();
        });
    });

    it('it should not PATCH or fail student from course in a non-existing program', (done) => {
      chai.request(server)
        .patch('/enrollprograms/fail/somethingrandom')
        .set('Authorization', admin.generateAuthToken())
        .send({ student_id: student.id, course_id: course1.id })
        .end((err, res) => {
          res.should.have.status(500);
          res.body.should.have.property('success').eql(false);
          res.body.should.have.property('error');
          done();
        });
    });

    it('it should PATCH or fail student from course in a program', (done) => {
      chai.request(server)
        .patch(`/enrollprograms/fail/${program1.id}`)
        .set('Authorization', admin.generateAuthToken())
        .send({ student_id: student.id, course_id: course1.id })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('success').eql(true);
          done();
        });
    });
  });

  describe('DELETE enrollprograms/delete/:id', () => {
    it('it should delete enroll program given id program', (done) => {
      chai.request(server)
        .delete(`/enrollprograms/delete/${program1.id}`)
        .set('Authorization', token)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('success').eql(true);
          res.body.should.have.property('deleted');
          done();
        });
    });

    it('it should not delete enroll program because program does not exist', (done) => {
      chai.request(server)
        .delete('/enrollprograms/delete/somethingrandom')
        .set('Authorization', token)
        .end((err, res) => {
          res.should.have.status(500);
          res.body.should.have.property('success').eql(false);
          res.body.should.have.property('error');
          done();
        });
    });
  });
});

// docker-compose -f docker-compose-test.yml -p isec-backend-test down -v --remove-orphans && docker build -t kevin2000141/isec-backend:test . && DOCKER_HUB_USERNAME=kevin2000141 CI_COMMIT_SHORT_SHA=test docker-compose -f docker-compose-test.yml -p isec-backend-test up --abort-on-container-exit && docker-compose -f docker-compose-test.yml -p isec-backend-test down -v --remove-orphans
