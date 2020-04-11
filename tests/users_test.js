/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable max-len */

const chai = require('chai');
const chaiHttp = require('chai-http');
const db = require('../db/models');
const server = require('../app');

const should = chai.should();


chai.use(chaiHttp);

describe('Users', () => {
  describe('GET users/', () => {
    it('it should GET user profile', (done) => {
      const admin = {
        username: 'admin200',
        email: 'admin200@gmail.com',
        password: 'admin200',
        role: 2,
      };
      chai.request(server)
        .post('/users/register')
        .send(admin)
        .end((errAdmin, resAdmin) => {
          chai.request(server)
            .get('/users/')
            .set('Authorization', resAdmin.body.token)
            .end((err, res) => {
              res.should.have.status(200);
              res.body.data.should.be.a('object');
              res.body.should.have.property('success');
              done();
            });
        });
    });
  });

  describe('LOGIN users/login', () => {
    it('it should give error message, password not match', (done) => {
      const admin = {
        username: 'admin200',
        password: 'admin200',
      };
      chai.request(server)
        .post('/users/login')
        .send(admin)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('success').eql(true);
          res.body.should.have.property('token');
          done();
        });
    });

    it('it should give error message, password not match', (done) => {
      const admin = {
        username: 'admin200',
        password: 'adminsdf200',
      };
      chai.request(server)
        .post('/users/login')
        .send(admin)
        .end((err, res) => {
          res.should.have.status(500);
          res.body.should.have.property('success').eql(false);
          res.body.should.have.property('error');
          done();
        });
    });
  });

  describe('REGISTER users/register', () => {
    it('it should register a user', (done) => {
      const student = {
        username: 's135',
        email: 's@s.com',
        password: 's135',
        role: 0,
      };
      chai.request(server)
        .post('/users/register')
        .send(student)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('success').eql(true);
          res.body.should.have.property('token');
          done();
        });
    });

    it('it should give error register since username email already exist', (done) => {
      const student = {
        username: 's135',
        email: 's@s.com',
        password: 's135',
        role: 0,
      };
      chai.request(server)
        .post('/users/register')
        .send(student)
        .end((err, res) => {
          res.should.have.status(500);
          res.body.should.have.property('success').eql(false);
          res.body.should.have.property('error');
          done();
        });
    });
  });

  describe('AUTH users/auth', () => {
    it('it should give an authentication for user', (done) => {
      const student = {
        username: 's135',
        password: 's135',
        role: 0,
      };
      chai.request(server)
        .post('/users/login')
        .send(student)
        .end((errStudent, resStudent) => {
          chai.request(server)
            .post('/users/auth')
            .set('Authorization', resStudent.body.token)
            .end((err, res) => {
              res.should.have.status(200);
              res.body.should.have.property('username').eql(student.username);
              res.body.should.have.property('role').eql(student.role);
              done();
            });
        });
    });

    it('it should not give an authentication for user', (done) => {
      const token = 'invalidtoken';
      chai.request(server)
        .post('/users/auth')
        .set('Authorization', token)
        .end((err, res) => {
          res.should.have.status(500);
          res.body.should.have.property('success').eql(false);
          res.body.should.have.property('error');
          done();
        });
    });
  });

  describe('EDIT users/edit', () => {
    it('it should edit user profile', (done) => {
      const studentBefore = {
        username: 's135',
        password: 's135',
      };
      const studentAfter = {
        username: 's315',
      };
      chai.request(server)
        .post('/users/login')
        .send(studentBefore)
        .end((errStudent, resStudentBefore) => {
          chai.request(server)
            .patch('/users/edit')
            .set('Authorization', resStudentBefore.body.token)
            .send(studentAfter)
            .end((err, res) => {
              res.should.have.status(200);
              res.body.should.have.property('success').eql(true);
              res.body.should.have.property('role');
              res.body.should.have.property('username');
              done();
            });
        });
    });
  });
});
