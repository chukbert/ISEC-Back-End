/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable max-len */

const chai = require('chai');
const chaiHttp = require('chai-http');
const db = require('../db/models');
const server = require('../app');

const should = chai.should();


chai.use(chaiHttp);

describe('Courses', () => {
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
      const course = new db.Course({
        name: 'dummy_course',
        code: '999',
        description: 'dummy test',
      });
      course.save((errSavedCourse, savedCourse) => {
        chai.request(server)
          .get(`/courses/${savedCourse.id}`)
          .send(savedCourse)
          .end((err, res) => {
            res.should.have.status(200);
            res.body.data.should.be.a('object');
            res.body.data.should.have.property('name');
            res.body.data.should.have.property('code');
            res.body.data.should.have.property('description');
            res.body.data.should.have.property('list_topic');
            res.body.data.should.have.property('_id').eql(savedCourse.id);
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
  });

  describe('POST course', () => {
    it('it should POST a course', (done) => {
      const course = {
        name: 'dummy course',
        code: '111',
        description: 'lorem ipsum',
      };
      chai.request(server)
        .post('/courses/new')
        .send(course)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('success').eql(true);
          res.body.should.have.property('id');
          done();
        });
    });

    it('it should not POST a course', (done) => {
      const course = {
        code: '111',
      };
      chai.request(server)
        .post('/courses/new')
        .send(course)
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
      const course = new db.Course({
        name: 'dummy course patch',
        code: 'course999',
        description: 'lorem ipsum',
      });
      course.save((errSaveCourse, savedCourse) => {
        chai.request(server)
          .patch(`/courses/edit/${savedCourse.id}`)
          .send({ name: 'Matdis' })
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.have.property('success').eql(true);
            done();
          });
      });
    });

    it('it should not UPDATE a course because id not exist', (done) => {
      chai.request(server)
        .patch('/courses/edit/idnotexist')
        .send({ nam: 'Matdis' })
        .end((err, res) => {
          res.should.have.status(500);
          res.body.should.have.property('success').eql(false);
          done();
        });
    });
  });

  describe('DELETE courses/delete/:id', () => {
    it('it should DELETE a course given the id', (done) => {
      const course = new db.Course({
        name: 'Basis Data',
        code: 'IF123123',
        description: 'lorem ipsum',
      });
      course.save((errSave, courseSaved) => {
        chai.request(server)
          .delete(`/courses/delete/${courseSaved.id}`)
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('success').eql(true);
            done();
          });
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
});
