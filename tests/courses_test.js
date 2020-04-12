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

describe('Courses', async () => {
  // await mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true })
  //   .catch();

  const course = await new db.Course({
    name: 'dummy_course',
    code: '999',
    description: 'dummy test',
  }).save();

  const teacher = await new db.Teacher({
    username: 't999',
    email: 't999@t999.com',
    password: 't999',
    role: 1,
  }).save();

  const course4 = await new db.Course({
    name: 'dummy_course_99',
    code: '99912',
    description: 'dummy test',
  }).save();

  const token = await teacher.generateAuthToken();


  describe('GET courses/', () => {
    it('it should GET all the courses', (done) => {
      chai.request(server)
        .get('/courses/')
        .end((err, res) => {
          res.should.have.status(200);
          res.body.data.should.be.a('array');
          done();
        });
    });
  });

  describe('GET courses/:id ', () => {
    it('it should GET a course by the given id', (done) => {
      chai.request(server)
        .get(`/courses/${course.id}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.data.should.be.a('object');
          res.body.data.should.have.property('name');
          res.body.data.should.have.property('code');
          res.body.data.should.have.property('description');
          res.body.data.should.have.property('list_topic');
          res.body.data.should.have.property('_id').eql(course.id);
          done();
        });
    });
  });

  it('it should not GET a course because id does not exist', (done) => {
    chai.request(server)
      .get('/courses/idnotexist')
      .end((err, res) => {
        res.should.have.status(500);
        res.body.should.have.property('success').eql(false);
        res.body.should.have.property('error');
        done();
      });
  });

  describe('POST course', () => {
    it('it should POST a course', (done) => {
      const course2 = {
        name: 'dummy course',
        code: '111',
        description: 'lorem ipsum',
      };
      chai.request(server)
        .post('/courses/new')
        .send(course2)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('success').eql(true);
          res.body.should.have.property('id');
          done();
        });
    });

    it('it should not POST a course', (done) => {
      const course3 = {
        code: '111',
      };
      chai.request(server)
        .post('/courses/new')
        .send(course3)
        .end((err, res) => {
          res.should.have.status(500);
          res.body.should.have.property('success').eql(false);
          res.body.should.have.property('error');
          done();
        });
    });
  });

  describe('PATCH course/edit/:id', () => {
    it('it should UPDATE a course given the id', (done) => {
      chai.request(server)
        .patch(`/courses/edit/${course.id}`)
        .send({ name: 'Matdis' })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('success').eql(true);
          done();
        });
    });

    it('it should not UPDATE a course because id not exist', (done) => {
      chai.request(server)
        .patch('/courses/edit/idnotexist')
        .send({ name: 'Matdis' })
        .end((err, res) => {
          res.should.have.status(500);
          res.body.should.have.property('success').eql(false);
          done();
        });
    });
  });

  describe('DELETE courses/delete/:id', () => {
    it('it should DELETE a course given the id', (done) => {
      chai.request(server)
        .delete(`/courses/delete/${course.id}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('success').eql(true);
          done();
        });
    });

    it('it should not DELETE a course because id not exist', (done) => {
      chai.request(server)
        .delete('/courses/delete/indexnotfound')
        .end((err, res) => {
          res.should.have.status(500);
          res.body.should.be.a('object');
          res.body.should.have.property('success').eql(false);
          done();
        });
    });
  });

  describe('POST courses/topic/:id', () => {
    it('it should ADD topic to a course', (done) => {
      const topic = {
        name: 'topic baru',
      };
      chai.request(server)
        .post(`/courses/topic/${course4.id}`)
        .set('Authorization', token)
        .send(topic)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('success').eql(true);
          done();
        });
    });
  });
});
