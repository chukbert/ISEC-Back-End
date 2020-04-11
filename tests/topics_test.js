/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
// process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const db = require('../db/models');
const server = require('../app');
// let server = require('../server');
const should = chai.should();


chai.use(chaiHttp);

describe('Topics', () => {
  describe('/GET topics', () => {
    it('it should GET all the topics', (done) => {
      chai.request(server)
        .get('/topics/')
        .end((err, res) => {
          res.should.have.status(200);
          res.body.data.should.be.a('array');
          done();
        });
    });
  });

  describe('/GET/topics/:id ', () => {
    it('it should GET a topic by the given id', (done) => {
      const topic = new db.Topic({ name: 'dummy_topic' });
      topic.save((err, restopic) => {
        chai.request(server)
          .get(`/topics/${topic.id}`)
          .send(restopic)
          .end((errGet, res) => {
            res.should.have.status(200);
            res.body.data.should.be.a('object');
            res.body.data.should.have.property('name');
            res.body.data.should.have.property('_id').eql(topic.id);
            done();
          });
      });
    });

    it('it should not GET a topic because id not exist', (done) => {
      const topic = new db.Topic({ name: 'dummy_topic' });
      chai.request(server)
        .get('/topics/indexnotfound')
        .end((errGet, res) => {
          res.should.have.status(500);
          done();
        });
    });
  });

  describe('/POST topic', () => {
    it('it should POST a topic', (done) => {
      const topic = {
        name: 'unit-testing',
      };
      chai.request(server)
        .post('/topics/new')
        .send(topic)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('success').eql(true);
          done();
        });
    });

    it('it should not POST a topic', (done) => {
      const topic = {
        nama: 'unit-testing',
      };
      chai.request(server)
        .post('/topics/new')
        .send(topic)
        .end((err, res) => {
          res.should.have.status(500);
          res.body.should.have.property('success').eql(false);
          done();
        });
    });
  });

  describe('/PATCH/edit/:id topic', () => {
    it('it should UPDATE a topic given the id', (done) => {
      const topic = new db.Topic({ name: 'Teori Bilangan' });
      topic.save((err, resTopic) => {
        chai.request(server)
          .patch(`/topics/edit/${resTopic.id}`)
          .send({ name: 'Kombinatorika' })
          .end((errUpdate, res) => {
            res.should.have.status(200);
            res.body.should.have.property('success').eql(true);
            done();
          });
      });
    });

    it('it should not UPDATE a topic given id not exist', (done) => {
      chai.request(server)
        .patch('/topics/edit/idnotexist')
        .send({ name: 'Kombinatorika' })
        .end((errUpdate, res) => {
          res.should.have.status(500);
          res.body.should.have.property('success').eql(false);
          res.body.should.have.property('error');
          done();
        });
    });
  });

  describe('/DELETE/topics/delete/:id', () => {
    it('it should DELETE a topic given the id', (done) => {
      const topic = new db.Topic({ name: 'Teori Bilangan' });
      topic.save((errSave, topicSave) => {
        chai.request(server)
          .delete(`/topics/delete/${topicSave.id}`)
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('success').eql(true);
            done();
          });
      });
    });
  });
});
