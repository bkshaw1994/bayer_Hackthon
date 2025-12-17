const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const userRoutes = require('../../routes/userRoutes');
const db = require('../testSetup');

process.env.JWT_SECRET = 'test_secret_key';

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

let token;

beforeAll(async () => {
  await db.connect();
});

beforeEach(async () => {
  const user = await User.create({
    name: 'Admin',
    userName: 'admin',
    email: 'admin@example.com',
    password: 'password',
  });
  token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
});

afterEach(async () => await db.clearDatabase());
afterAll(async () => await db.closeDatabase());

describe('User Controller Tests', () => {
  describe('GET /api/users', () => {
    beforeEach(async () => {
      await User.create([
        { name: 'User 1', userName: 'user1', email: 'user1@test.com', password: 'pass123' },
        { name: 'User 2', userName: 'user2', email: 'user2@test.com', password: 'pass456' },
      ]);
    });

    it('should get all users with authentication', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBeGreaterThanOrEqual(2);
    });

    it('should fail without authentication', async () => {
      const response = await request(app).get('/api/users');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/users/:id', () => {
    let userId;

    beforeEach(async () => {
      const user = await User.create({
        name: 'Test User',
        userName: 'testuser',
        email: 'testuser@test.com',
        password: 'password',
      });
      userId = user._id;
    });

    it('should get single user by id', async () => {
      const response = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.userName).toBe('testuser');
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/users', () => {
    it('should create new user and return JWT token without authentication', async () => {
      const newUser = {
        name: 'New User',
        userName: 'newuser',
        email: 'new@test.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/users')
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.userName).toBe('newuser');
      expect(response.body.data.token).toBeDefined();
      expect(typeof response.body.data.token).toBe('string');
    });

    it('should fail without required fields', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ name: 'Incomplete' });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/users/:id', () => {
    let userId;

    beforeEach(async () => {
      const user = await User.create({
        name: 'Update Test',
        userName: 'updatetest',
        email: 'update@test.com',
        password: 'password',
      });
      userId = user._id;
    });

    it('should update user successfully', async () => {
      const response = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Name');
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .put(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/users/:id', () => {
    let userId;

    beforeEach(async () => {
      const user = await User.create({
        name: 'Delete Test',
        userName: 'deletetest',
        email: 'delete@test.com',
        password: 'password',
      });
      userId = user._id;
    });

    it('should delete user successfully', async () => {
      const response = await request(app)
        .delete(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const deletedUser = await User.findById(userId);
      expect(deletedUser).toBeNull();
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .delete(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });
});
