/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable max-len */

const chai = require('chai');
const chaiHttp = require('chai-http');
const db = require('../db/models');
const server = require('../app');

const should = chai.should();


chai.use(chaiHttp);

describe('Enroll Programs', () => {
  describe('GET enrollprograms/', () => {
    it('it should not GET an enrollprogram info from user', (done) => {
      const student = {
        username: 'studenttest',
        email: 'studenttest@studenttest.com',
        password: 'studenttest',
        role: 0,
      };
      chai.request(server)
        .post('/users/register')
        .send(student)
        .end((errStudent, resStudent) => {
          chai.request(server)
            .get('/enrollprograms/')
            .set('Authorization', resStudent.body.token)
            .end((err, res) => {
              res.should.have.status(200);
              res.body.should.have.property('data');
              res.body.data.should.be.a('array');
              done();
            });
        });
    });
  });

  describe('GET enrollprograms/:id', () => {
    it('it should get enroll program info given id program', (done) => {
      const student = {
        username: 'studenttest',
        password: 'studenttest',
      };
      const program = new db.Program({
        name: 'Teknik Test',
        description: 'testing',
      });
      chai.request(server)
        .post('/users/login')
        .send(student)
        .end((errStudent, resStudent) => {
          program.save((errSaveProgram, savedProgram) => {
            chai.request(server)
              .post(`/enrollprograms/new/${savedProgram.id}`)
              .set('Authorization', resStudent.body.token)
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.have.property('success').eql(true);
                res.body.should.have.property('user_id');
                res.body.should.have.property('id');
                done();
              });
          });
        });
    });

    it('it should not GET enroll program because id program not exist', (done) => {
      const student = {
        username: 'studenttest',
        password: 'studenttest',
      };
      const idProgram = 'fake';
      chai.request(server)
        .post('/users/login')
        .send(student)
        .end((errStudent, resStudent) => {
          chai.request(server)
            .post(`/enrollprograms/new/${idProgram}`)
            .set('Authorization', resStudent.body.token)
            .end((err, res) => {
              res.should.have.status(500);
              res.body.should.have.property('success').eql(false);
              res.body.should.have.property('error');
              done();
            });
        });
    });
  });

  describe('POST enrollprograms/new/:id', () => {
    it('it should enroll to program', (done) => {
      const student = {
        username: 'studenttest',
        password: 'studenttest',
      };
      const program = new db.Program({
        name: 'Teknik Test',
        description: 'testing',
      });
      chai.request(server)
        .post('/users/login')
        .send(student)
        .end((errStudent, resStudent) => {
          program.save((errSaveProgram, savedProgram) => {
            chai.request(server)
              .post(`/enrollprograms/new/${savedProgram.id}`)
              .set('Authorization', resStudent.body.token)
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.have.property('success').eql(true);
                res.body.should.have.property('user_id');
                res.body.should.have.property('id');
                done();
              });
          });
        });
    });

    it('it should not enroll to program', (done) => {
      const student = {
        username: 'studenttest',
        password: 'studenttest',
      };
      const idProgram = 'idnotexist';
      chai.request(server)
        .post('/users/login')
        .send(student)
        .end((errStudent, resStudent) => {
          chai.request(server)
            .post(`/enrollprograms/new/${idProgram}`)
            .set('Authorization', resStudent.body.token)
            .end((err, res) => {
              res.should.have.status(500);
              res.body.should.have.property('success').eql(false);
              done();
            });
        });
    });
  });

  describe('POST enrollprograms/new/:id', () => {
    it('it should enroll to program', (done) => {
      const student = {
        username: 'studenttest',
        password: 'studenttest',
      };
      const program = new db.Program({
        name: 'Teknik Test',
        description: 'testing',
      });
      chai.request(server)
        .post('/users/login')
        .send(student)
        .end((errStudent, resStudent) => {
          program.save((errSaveProgram, savedProgram) => {
            chai.request(server)
              .post(`/enrollprograms/new/${savedProgram.id}`)
              .set('Authorization', resStudent.body.token)
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.have.property('success').eql(true);
                res.body.should.have.property('user_id');
                res.body.should.have.property('id');
                done();
              });
          });
        });
    });

    it('it should not enroll to program', (done) => {
      const student = {
        username: 'studenttest',
        password: 'studenttest',
      };
      const idProgram = 'idnotexist';
      chai.request(server)
        .post('/users/login')
        .send(student)
        .end((errStudent, resStudent) => {
          chai.request(server)
            .post(`/enrollprograms/new/${idProgram}`)
            .set('Authorization', resStudent.body.token)
            .end((err, res) => {
              res.should.have.status(500);
              res.body.should.have.property('success').eql(false);
              done();
            });
        });
    });
  });

  // describe('GET enrollprograms/:id/courses/:courseid', () => {
  //   it('it should GET a course in a program', (done) => {
  //     const admin = {
  //       username: 'a9876',
  //       email: 'ada9876min102@a9876.com',
  //       password: 'a9876',
  //       role: 2,
  //     };
  //     const program = {
  //       name: 'DUMMY',
  //       description: 'lorem ipsum dono  ?',
  //     };
  //     const course = {
  //       name: 'Dummy',
  //       code: 'E12345',
  //       description: 'lorem ipsum dolor',
  //     };
  //     const student = {
  //       username: 'studenttest',
  //       password: 'studenttest',
  //     };
  //     chai.request(server)
  //       .post('/users/register')
  //       .send(admin)
  //       .end((errAdmin, resAdmin) => {
  //         chai.request(server)
  //           .post('/programs/new')
  //           .set('Authorization', resAdmin.body.token)
  //           .send(program)
  //           .end((errNewProgram, resNewProgram) => {
  //             chai.request(server)
  //               .post(`/programs/course/${resNewProgram.id}`)
  //               .set('Authorization', resAdmin.body.token)
  //               .send(course)
  //               .end((errProgram, resProgram) => {
  //                 chai.request(server)
  //                   .post('/users/login')
  //                   .send(student)
  //                   .end((errStudent, resStudent) => {
  //                     chai.request(server)
  //                       .post(`/enrollprograms/new/${resProgram.id}`)
  //                       .set('Authorization', resStudent.body.token)
  //                       .end((errEnroll, resEnroll) => {
  //                         chai.request(server)
  //                           .get(`/enrollprograms/${resProgram.id}/courses/${resProgram.list_course[0].course_id}`)
  //                           .set('Authorization', resStudent.body.token)
  //                           .end((err, res) => {
  //                             res.should.have.status(200);
  //                             res.body.should.have.property('success').eql(true);
  //                             done();
  //                           });
  //                       });
  //                   });
  //               });
  //           });
  //       });
  //   });
  // });
});
