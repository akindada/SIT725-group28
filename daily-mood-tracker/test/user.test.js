const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
const mongoose = require('mongoose');
const { app, startServer } = require('../server');
const User = require('../models/User');
const Mood = require('../models/Mood');

chai.use(chaiHttp);

let server;
let authToken;
let moodId;

before(async () => {
  server = await startServer(); // Start server with DB connection
});

after(async () => {
  if (server) {
    await server.close();
  }
  await mongoose.disconnect();
});

describe('User and Mood API Tests', () => {

  describe('🧑 User Routes', () => {
    it('should register a new user', (done) => {
      chai.request(app)
        .post('/api/users/register')
        .send({ username: 'testuser', password: '1234', email: 'test@example.com' })
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property('token');
          authToken = res.body.token; // Store token here if you want to skip login
          done();
        });
    });

    it('should login user and return token', (done) => {
      chai.request(app)
        .post('/api/users/login')
        .send({ email: 'test@example.com', password: '1234' })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('token');
          authToken = res.body.token;
          done();
        });
    });
  });

  describe('😊 Mood Routes', () => {
    it('should submit a mood', (done) => {
      chai.request(app)
        .post('/api/moods') // ✅ Correct endpoint
        .set('Authorization', `Bearer ${authToken}`)
        .send({ mood: 'Happy', description: 'Feeling great!' }) // ✅ Field should be `description`
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property('mood');
          expect(res.body).to.have.property('_id');
          moodId = res.body._id; // ✅ Store the correct mood ID
          done();
        });
    });

    it('should return mood history', (done) => {
      chai.request(app)
        .get('/api/moods') // ✅ Correct endpoint
        .set('Authorization', `Bearer ${authToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          done();
        });
    });

    it('should update mood note', (done) => {
      chai.request(app)
        .put(`/api/moods/${moodId}`) // ✅ Correct endpoint
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'Updated mood note.' }) // ✅ Field should be `description`
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('description', 'Updated mood note.');
          done();
        });
    });
  });

});
