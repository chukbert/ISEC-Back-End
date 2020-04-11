// /* eslint-disable no-undef */
// /* eslint-disable no-unused-vars */
// /* eslint-disable max-len */

// const chai = require('chai');
// const chaiHttp = require('chai-http');
// const db = require('../db/models');
// const server = require('../app');

// const should = chai.should();


// chai.use(chaiHttp);

// describe('Enroll Programs', () => {
//   describe('GET enrollprograms/', () => {
//     it('it should GET an enrollprogram info from user', (done) => {
//       const student = {
//         username: 'studenttest',
//         email: 'studenttest@studenttest.com',
//         password: 'studenttest',
//         role: 0,
//       };
//       chai.request(server)
//         .post('/users/register')
//         .send(student)
//         .end((errStudent, resStudent) => {
//           chai.request(server)
//             .get('/users/')
//             .set('Authorization', resStudent.body.token)
//             .end((err, res) => {
//               res.should.have.status(200);
//               res.body.data.should.be.a('object');
//               res.body.should.have.property('success');
//               done();
//             });
//         });
//     });
//   });

//   describe('LOGIN users/login', () => {
//     it('it should give a token for user', (done) => {
//       const admin = {
//         username: 'admin200',
//         password: 'adminsdf200',
//       };
//       chai.request(server)
//         .post('/users/login')
//         .send(admin)
//         .end((err, res) => {
//           res.should.have.status(200);
//           res.body.should.have.property('success').eql(true);
//           res.body.should.have.property('token');
//           done();
//         });
//     });
//   });

//   describe('REGISTER users/register', () => {
//     it('it should register a user', (done) => {
//       const student = {
//         username: 's135',
//         email: 's@s.com',
//         password: 's135',
//         role: 0,
//       };
//       chai.request(server)
//         .post('/users/register')
//         .send(student)
//         .end((err, res) => {
//           res.should.have.status(200);
//           res.body.should.have.property('success').eql(true);
//           res.body.should.have.property('token');
//           done();
//         });
//     });
//   });

//   describe('AUTH users/auth', () => {
//     it('it should give an authentication for user', (done) => {
//       const student = {
//         username: 's135',
//         password: 's135',
//         role: 0,
//       };
//       chai.request(server)
//         .post('/users/login')
//         .send(student)
//         .end((errStudent, resStudent) => {
//           chai.request(server)
//             .post('/users/auth')
//             .set('Authorization', resStudent.body.token)
//             .end((err, res) => {
//               res.should.have.status(200);
//               res.body.should.have.property('username').eql(student.username);
//               res.body.should.have.property('role').eql(student.role);
//               done();
//             });
//         });
//     });
//   });

//   describe('EDIT users/edit', () => {
//     it('it should edit a user profile', (done) => {
//       const studentBefore = {
//         username: 's135',
//         password: 's135',
//       };
//       const studentAfter = {
//         username: 's315',
//       };
//       chai.request(server)
//         .post('/users/login')
//         .send(studentBefore)
//         .end((errStudent, resStudentBefore) => {
//           chai.request(server)
//             .patch('/users/edit')
//             .set('Authorization', resStudentBefore.body.token)
//             .send(studentAfter)
//             .end((err, res) => {
//               res.should.have.status(200);
//               res.body.should.have.property('success').eql(true);
//               done();
//             });
//         });
//     });
//   });
// });
