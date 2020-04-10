/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable max-len */

const chai = require('chai');
const chaiHttp = require('chai-http');
const db = require('../db/models');
const server = require('../app');

const should = chai.should();


chai.use(chaiHttp);

describe('Programs', () => {
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
      const program = new db.Program({
        name: 'Teknik Asikin Aja',
        description: 'lorem ipsum dono?',
      });
      program.save((errSavedProgram, savedProgram) => {
        chai.request(server)
          .get(`/programs/${savedProgram.id}`)
          .send(savedProgram)
          .end((err, res) => {
            res.should.have.status(200);
            res.body.data.should.be.a('object');
            res.body.data.should.have.property('name');
            res.body.data.should.have.property('description');
            res.body.data.should.have.property('list_teacher');
            res.body.data.should.have.property('list_course');
            res.body.data.should.have.property('_id').eql(savedProgram.id);
            done();
          });
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
      const admin = {
        username: 'admin_testprogram',
        email: 'admin_testprogram@admin_testprogram.com',
        password: 'admin_testprogram',
        role: 2,
      };
      const program = {
        name: 'Teknik Baru dummy',
        description: 'lorem ipsum dono?',
      };
      chai.request(server)
        .post('/users/register')
        .send(admin)
        .end((errAdmin, resAdmin) => {
          chai.request(server)
            .post('/programs/new')
            .set('Authorization', resAdmin.body.token)
            .send(program)
            .end((err, res) => {
              res.should.have.status(200);
              res.body.should.have.property('success').eql(true);
              res.body.should.have.property('id');
              done();
            });
        });
    });

    it('it should not POST a program because user is not an admin', (done) => {
      const admin = {
        username: 'admin_testprogram',
        email: 'admin_testprogram@admin_testprogram.com',
        password: 'admin_testprogram',
        role: 1,
      };
      const program = {
        name: 'Teknik Baru dummy',
        description: 'lorem ipsum dono?',
      };
      chai.request(server)
        .post('/users/register')
        .send(admin)
        .end((errAdmin, resAdmin) => {
          chai.request(server)
            .post('/programs/new')
            .set('Authorization', resAdmin.body.token)
            .send(program)
            .end((err, res) => {
              res.should.have.status(404);
              res.body.should.have.property('success').eql(false);
              res.body.should.have.property('error').eql('Admin not found');
              done();
            });
        });
    });
  });

  describe('PATCH program', () => {
    it('it should Edit a program', (done) => {
      const admin = {
        username: 'a787',
        email: 'a999@a999.com',
        password: 'a787',
        role: 2,
      };
      const program = new db.Program({
        name: 'Teknik Baru dummy patch',
        description: 'lorem ipsum dono  ?',
      });
      chai.request(server)
        .post('/users/register')
        .send(admin)
        .end((errAdmin, resAdmin) => {
          program.save((errSavedProgram, savedProgram) => {
            chai.request(server)
              .patch(`/programs/edit/${savedProgram.id}`)
              .set('Authorization', resAdmin.body.token)
              .send(program)
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.have.property('success').eql(true);
                done();
              });
          });
        });
    });
  });

  describe('DELETE program', () => {
    it('it should Delete a program', (done) => {
      const admin = {
        username: 'admin_testprogram2',
        email: 'admin_testprogram2@admin_testprogram.com',
        password: 'admin_testprogram2',
        role: 2,
      };
      const program = new db.Program({
        name: 'Teknik Baru dummy patch',
        description: 'lorem ipsum dono  ?',
      });
      chai.request(server)
        .post('/users/register')
        .send(admin)
        .end((errAdmin, resAdmin) => {
          program.save((errSavedProgram, savedProgram) => {
            chai.request(server)
              .delete(`/programs/delete/${savedProgram.id}`)
              .set('Authorization', resAdmin.body.token)
              .send(program)
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.have.property('success').eql(true);
                done();
              });
          });
        });
    });
  });

  describe('ADD TEACHER in program', () => {
    it('it should add a teacher in a program', (done) => {
      const admin = {
        username: 'admin100',
        email: 'admin100@admin100.com',
        password: 'admin100',
        role: 2,
      };
      const program = new db.Program({
        name: 'Teknik Baru dummy add teacher',
        description: 'lorem ipsum dono  ?',
      });
      const teacher = new db.Teacher({
        username: 'teacher100',
        email: 'teacher100@t.com',
        password: 'teacher100',
        role: 1,
      });
      chai.request(server)
        .post('/users/register')
        .send(admin)
        .end((errAdmin, resAdmin) => {
          program.save((errSavedProgram, savedProgram) => {
            teacher.save((errSavedTeacher, savedTeacher) => {
              chai.request(server)
                .post(`/programs/teacher/${savedProgram.id}`)
                .set('Authorization', resAdmin.body.token)
                .send({ username: 'teacher100' })
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.have.property('success').eql(true);
                  done();
                });
            });
          });
        });
    });
  });

  describe('REMOVE TEACHER in program', () => {
    it('it should remove a teacher in a program', (done) => {
      const admin = {
        username: 'admin101',
        email: 'admin101@admin101.com',
        password: 'admin101',
        role: 2,
      };
      const program = new db.Program({
        name: 'Teknik Baru dummy remove teacher',
        description: 'lorem ipsum dono  ?',
      });
      const teacher = new db.Teacher({
        username: 'teacher101',
        email: 'teacher101@t.com',
        password: 'teacher101',
        role: 1,
      });
      chai.request(server)
        .post('/users/register')
        .send(admin)
        .end((errAdmin, resAdmin) => {
          program.save((errSavedProgram, savedProgram) => {
            teacher.save((errSavedTeacher, savedTeacher) => {
              chai.request(server)
                .delete(`/programs/teacher/${savedProgram.id}`)
                .set('Authorization', resAdmin.body.token)
                .send({ username: 'teacher101' })
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.have.property('success').eql(true);
                  done();
                });
            });
          });
        });
    });
  });

  describe('ADD COURSE in program', () => {
    it('it should add a course in a program', (done) => {
      const admin = {
        username: 'admin102',
        email: 'admin102@admin100.com',
        password: 'admin102',
        role: 2,
      };
      const program = new db.Program({
        name: 'Teknik Baru dummy add course',
        description: 'lorem ipsum dono  ?',
      });
      const course = {
        name: 'Dummy',
        code: 'T987',
        description: 'lorem ipsum dolor',
      };
      chai.request(server)
        .post('/users/register')
        .send(admin)
        .end((errAdmin, resAdmin) => {
          program.save((errSavedProgram, savedProgram) => {
            chai.request(server)
              .post(`/programs/course/${savedProgram.id}`)
              .set('Authorization', resAdmin.body.token)
              .send(course)
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.have.property('success').eql(true);
                done();
              });
          });
        });
    });
  });

  describe('SET PREREQUISITE COURSE in program', () => {
    it('it should set a prerequisite course in a program', (done) => {
      const admin = {
        username: 'admin102',
        password: 'admin102',
      };
      const program = new db.Program({
        name: 'Teknik Baru dummy set prereq course',
        description: 'lorem ipsum dono  ?',
      });
      const course1 = new db.Course({
        name: 'Dummy',
        code: 'T988',
        description: 'lorem ipsum dolor',
      });
      const course2 = new db.Course({
        name: 'Dummy2',
        code: 'T989',
        description: 'lorem ipsum dolor',
      });
      const prereq = {
        course: 'T989',
        prerequisite: ['T988'],
      };
      chai.request(server)
        .post('/users/login')
        .send(admin)
        .end((errAdmin, resAdmin) => {
          program.save((errSavedProgram, savedProgram) => {
            chai.request(server)
              .post(`/programs/course/${savedProgram.id}`)
              .set('Authorization', resAdmin.body.token)
              .send(course1)
              .end((errCourse1, resCourse1) => {
                chai.request(server)
                  .post(`/programs/course/${savedProgram.id}`)
                  .set('Authorization', resAdmin.body.token)
                  .send(course2)
                  .end((errCourse2, resCourse2) => {
                    chai.request(server)
                      .patch(`/programs/setprereq/${savedProgram.id}`)
                      .set('Authorization', resAdmin.body.token)
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
        });
    });
  });
});
