const chai = require('chai');
const expect = chai.expect;
const request = require('supertest');
const mongoose = require('mongoose');
const { app, startServer } = require('../server');
const User = require('../models/User');

let server;

before(async () => {
  server = await startServer(); // Wait for DB connection + server start
});

after(async () => {
  if (server) {
    await server.close(); // Gracefully shut down server
  }
  await mongoose.disconnect(); // Cleanly disconnect DB
});

describe('Admin Routes', function () {
  let adminToken;
  let createdUserId;

  before(async function () {
    // Clear users before testing
    await User.deleteMany({});
  });

  after(async function () {
    await mongoose.connection.close();
  });

  describe('POST /register', function () {
    it('should register a new admin successfully', async function () {
      const res = await request(app)
        .post('/admin/register')
        .send({ username: 'adminuser', email: 'admin@example.com', password: 'adminpass' });

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('token');
      expect(res.body.user).to.include({ username: 'adminuser', email: 'admin@example.com', role: 'admin' });
    });

    it('should reject registration if fields missing', async function () {
      const res = await request(app)
        .post('/admin/register')
        .send({ username: '', email: '', password: '' });

      expect(res.status).to.equal(400);
      expect(res.body.msg).to.equal('All fields are required');
    });

    it('should reject duplicate email registration', async function () {
      const res = await request(app)
        .post('/admin/register')
        .send({ username: 'adminuser2', email: 'admin@example.com', password: 'adminpass' });

      expect(res.status).to.equal(400);
      expect(res.body.msg).to.equal('Admin with this email already exists');
    });
  });

  describe('POST /login', function () {
    it('should login admin successfully', async function () {
      const res = await request(app)
        .post('/admin/login')
        .send({ email: 'admin@example.com', password: 'adminpass' });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('token');
      expect(res.body.user).to.include({ email: 'admin@example.com', role: 'admin' });

      adminToken = res.body.token; // save token for auth tests
    });

    it('should fail login for wrong email', async function () {
      const res = await request(app)
        .post('/admin/login')
        .send({ email: 'wrong@example.com', password: 'adminpass' });

      expect(res.status).to.equal(401);
      expect(res.body.msg).to.equal('Admin not found or incorrect email');
    });

    it('should fail login for wrong password', async function () {
      const res = await request(app)
        .post('/admin/login')
        .send({ email: 'admin@example.com', password: 'wrongpass' });

      expect(res.status).to.equal(401);
      expect(res.body.msg).to.equal('Invalid password');
    });

    it('should fail login if missing fields', async function () {
      const res = await request(app)
        .post('/admin/login')
        .send({ email: '' });

      expect(res.status).to.equal(401);
      expect(res.body.msg).to.equal('Email and password are required');
    });
  });

  describe('GET /dashboard', function () {
    it('should get admin dashboard info with valid token', async function () {
      const res = await request(app)
        .get('/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.msg).to.match(/Welcome Admin/);
      expect(res.body.user).to.include({ email: 'admin@example.com', role: 'admin' });
    });

    it('should fail without token', async function () {
      const res = await request(app)
        .get('/admin/dashboard');

      expect(res.status).to.equal(401);
    });
  });

  describe('GET /dashboard/data', function () {
    it('should get dashboard data with valid token', async function () {
      const res = await request(app)
        .get('/admin/dashboard/data')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.user).to.include({ email: 'admin@example.com', role: 'admin' });
    });
  });

  describe('User management routes', function () {
    it('should create a new user', async function () {
      const res = await request(app)
        .post('/admin/users/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ username: 'testuser', email: 'user@example.com', password: 'userpass', role: 'user' });

      expect(res.status).to.equal(201);
      expect(res.body.msg).to.equal('User created successfully');

      const user = await User.findOne({ email: 'user@example.com' });
      createdUserId = user._id.toString();
    });

    it('should fail to create user with missing fields', async function () {
      const res = await request(app)
        .post('/admin/users/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ username: '', email: '', password: '', role: '' });

      expect(res.status).to.equal(400);
      expect(res.body.msg).to.equal('All fields are required');
    });

    it('should get paginated users list', async function () {
      const res = await request(app)
        .get('/admin/users?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('users').that.is.an('array');
      expect(res.body).to.have.property('totalUsers').that.is.a('number');
      expect(res.body).to.have.property('page').that.equals(1);
      expect(res.body).to.have.property('totalPages').that.is.a('number');
    });

    it('should edit a user', async function () {
      const res = await request(app)
        .put(`/admin/users/${createdUserId}/edit`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ username: 'updateduser', email: 'updated@example.com', role: 'user' });

      expect(res.status).to.equal(200);
      expect(res.body.msg).to.equal('User updated successfully');

      const updatedUser = await User.findById(createdUserId);
      expect(updatedUser.username).to.equal('updateduser');
      expect(updatedUser.email).to.equal('updated@example.com');
    });

    it('should fail edit if user not found', async function () {
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .put(`/admin/users/${fakeId}/edit`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ username: 'name', email: 'email@example.com', role: 'user' });

      expect(res.status).to.equal(404);
      expect(res.body.msg).to.equal('User not found');
    });

    it('should suspend and unsuspend user', async function () {
      // Suspend
      let res = await request(app)
        .put(`/admin/users/${createdUserId}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.msg).to.equal('User suspended successfully');

      let user = await User.findById(createdUserId);
      expect(user.suspended).to.be.true;

      // Unsuspend
      res = await request(app)
        .put(`/admin/users/${createdUserId}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.msg).to.equal('User unsuspended successfully');

      user = await User.findById(createdUserId);
      expect(user.suspended).to.be.false;
    });

    it('should delete a user', async function () {
      const res = await request(app)
        .delete(`/admin/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.msg).to.equal('User deleted successfully');

      const deletedUser = await User.findById(createdUserId);
      expect(deletedUser).to.be.null;
    });

    it('should return 404 deleting non-existent user', async function () {
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .delete(`/admin/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(404);
      expect(res.body.msg).to.equal('User not found');
    });
  });

  describe('GET /analytics', function () {
    it('should return analytics data', async function () {
      const res = await request(app)
        .get('/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.all.keys('totalUsers', 'totalAdmins', 'totalSuspended', 'totalActive');
    });
  });
});
