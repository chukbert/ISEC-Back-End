/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable max-len */

const mongoose = require('mongoose');
const chai = require('chai');
const chaiHttp = require('chai-http');
const db = require('../db/models');
const server = require('../app');

const should = chai.should();


chai.use(chaiHttp);

describe('Programs', async () => {
  // await mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true })
  //   .catch();

  const program = await new db.Program({
    name: 'Teknik Asikin Aja',
    description: 'lorem ipsum dono?',
  }).save();

  const admin = await new db.Admin({
    username: 'admin_testprogram',
    email: 'admin_testprogram@admin_testprogram.com',
    password: 'admin_testprogram',
    role: 2,
  }).save();

  const teacher = await new db.Teacher({
    username: 'teacher20',
    email: 'teacher20@teacher20.com',
    password: 'teacher20',
    role: 1,
  }).save();

  const course1 = await new db.Course({
    name: 'Dummy',
    code: 'T988',
    description: 'lorem ipsum dolor',
  }).save();

  const course2 = await new db.Course({
    name: 'Dummy2',
    code: 'T989',
    description: 'lorem ipsum dolor',
  }).save();

  const program5 = await new db.Program({
    name: 'Teknik Elektro',
    description: 'lorem ipsum dono?',
    list_course: [{
      course_id: course1.id,
      prerequisite: [],
    }, {
      course_id: course2.id,
      prerequisite: [],
    }],
  }).save();


  const token = await admin.generateAuthToken();
  const tokenTeacher = await teacher.generateAuthToken();


  describe('GET programs/', () => {
    it('it should GET all the programs', (done) => {
      chai.request(server)
        .get('/programs/')
        .end((err, res) => {
          res.should.have.status(200);
          res.body.data.should.be.a('array');
          done();
        });
    });
  });

  describe('GET programs/:id ', () => {
    it('it should GET a program by the given id', (done) => {
      chai.request(server)
        .get(`/programs/${program.id}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.data.should.be.a('object');
          res.body.data.should.have.property('name');
          res.body.data.should.have.property('description');
          res.body.data.should.have.property('list_teacher');
          res.body.data.should.have.property('list_course');
          res.body.data.should.have.property('_id').eql(program.id);
          done();
        });
    });

    it('it should not GET a program because id does not exist', (done) => {
      chai.request(server)
        .get('/programs/idnotexist')
        .end((err, res) => {
          res.should.have.status(500);
          res.body.should.have.property('success').eql(false);
          res.body.should.have.property('error');
          done();
        });
    });
  });

  describe('POST program', () => {
    it('it should POST a program', (done) => {
      const program2 = {
        name: 'Teknik Baru dummy',
        description: 'lorem ipsum dono?',
      };

      chai.request(server)
        .post('/programs/new')
        .set('Authorization', token)
        .send(program2)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('success').eql(true);
          res.body.should.have.property('id');
          done();
        });
    });

    it('it should not POST a program because user is not an admin', (done) => {
      const program3 = {
        name: 'Teknik Baru dummy',
        description: 'lorem ipsum dono?',
      };

      chai.request(server)
        .post('/programs/new')
        .set('Authorization', tokenTeacher)
        .send(program3)
        .end((err, res) => {
          res.should.have.status(404);
          res.body.should.have.property('success').eql(false);
          res.body.should.have.property('error').eql('Admin not found');
          done();
        });
    });
  });

  describe('PATCH program', () => {
    it('it should Edit a program', (done) => {
      chai.request(server)
        .patch(`/programs/edit/${program.id}`)
        .set('Authorization', token)
        .send({ name: 'Teknik Nuklir' })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('success').eql(true);
          done();
        });
    });
  });

  describe('DELETE program', () => {
    it('it should Delete a program', (done) => {
      chai.request(server)
        .delete(`/programs/delete/${program.id}`)
        .set('Authorization', token)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('success').eql(true);
          done();
        });
    });
  });

  describe('ADD TEACHER in program', () => {
    it('it should add a teacher in a program', (done) => {
      chai.request(server)
        .post(`/programs/teacher/${program5.id}`)
        .set('Authorization', token)
        .send({ username: 'teacher20' })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('success').eql(true);
          done();
        });
    });
  });

  describe('REMOVE TEACHER in program', () => {
    it('it should remove a teacher in a program', (done) => {
      chai.request(server)
        .delete(`/programs/teacher/${program5.id}`)
        .set('Authorization', token)
        .send({ username: 'teacher20' })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('success').eql(true);
          done();
        });
    });
  });

  describe('ADD COURSE in program', () => {
    it('it should add a course in a program', (done) => {
      const course = {
        name: 'Dummy',
        code: 'T987',
        description: 'lorem ipsum dolor',
      };

      chai.request(server)
        .post(`/programs/course/${program5.id}`)
        .set('Authorization', token)
        .send(course)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('success').eql(true);
          done();
        });
    });
  });

  describe('SET PREREQUISITE COURSE in program', () => {
    it('it should set a prerequisite course in a program', (done) => {
      const prereq = {
        course: 'T989',
        prerequisite: ['T988'],
      };


      chai.request(server)
        .patch(`/programs/setprereq/${program5.id}`)
        .set('Authorization', token)
        .send(prereq)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('success').eql(true);
          res.body.should.have.property('note').eql('prerequisites updated');
          done();
        });
    });
  });
});
