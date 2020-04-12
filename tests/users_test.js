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

describe('Users', async () => {
  // await mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true })
  //   .catch();

  const admin = await new db.Admin({
    username: 'admin200',
    email: 'admin200@gmail.com',
    password: 'admin200',
    role: 2,
  }).save();

  const student = await new db.Student({
    username: 's135',
    email: 's135@s135.com',
    password: 's135',
    role: 0,
  }).save();

  const token = await admin.generateAuthToken();
  const tokenStudent = await student.generateAuthToken();


  describe('GET users/', () => {
    it('it should GET user profile', (done) => {
      chai.request(server)
        .get('/users/')
        .set('Authorization', token)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.data.should.be.a('object');
          res.body.should.have.property('success');
          done();
        });
    });
  });

  describe('LOGIN users/login', () => {
    it('it should give error message, password not match', (done) => {
      const admin1 = {
        username: 'admin200',
        password: 'admin200',
      };
      chai.request(server)
        .post('/users/login')
        .send(admin1)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('success').eql(true);
          res.body.should.have.property('token');
          done();
        });
    });

    it('it should give error message, password not match', (done) => {
      const admin2 = {
        username: 'admin200',
        password: 'adminsdf200',
      };
      chai.request(server)
        .post('/users/login')
        .send(admin2)
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
      const student3 = {
        username: 's1356',
        email: 's@s.com',
        password: 's1356',
        role: 0,
      };
      chai.request(server)
        .post('/users/register')
        .send(student3)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('success').eql(true);
          res.body.should.have.property('token');
          done();
        });
    });

    it('it should give error register since username email already exist', (done) => {
      const student2 = {
        username: 's1356',
        email: 's@s.com',
        password: 's1356',
        role: 0,
      };
      chai.request(server)
        .post('/users/register')
        .send(student2)
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
      chai.request(server)
        .post('/users/auth')
        .set('Authorization', tokenStudent)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('username').eql(student.username);
          res.body.should.have.property('role').eql(student.role);
          done();
        });
    });

    it('it should not give an authentication for user', (done) => {
      const tokenInValid = 'invalidtoken';
      chai.request(server)
        .post('/users/auth')
        .set('Authorization', tokenInValid)
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
      const studentAfter = {
        username: 's315',
      };
      chai.request(server)
        .patch('/users/edit')
        .set('Authorization', tokenStudent)
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
