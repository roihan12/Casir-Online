import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { getTestPrismaClient, clearTestDb } from '../utils/testDbManager';
import { createCabang, createRole } from '../factories/userFactory';
import { createUserWithModulePermissions } from '../helpers/permissionSetup';

let app;
let agent;

describe('User Management API Integration Tests', () => {
  let prisma;

  beforeAll(async () => {
    prisma = getTestPrismaClient();
    const appModule = await import('../../src/app.js');
    app = appModule.default;
    agent = request.agent(app);
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await clearTestDb();
  });

  const authenticateAgent = async () => {
    const result = await createUserWithModulePermissions('user', {}, prisma);
    await agent
      .post('/api/auth/login')
      .set('User-Agent', 'test-agent')
      .set('X-Forwarded-For', '127.0.0.1')
      .send({ username: result.user.username, password: result.plainPassword });
    return result;
  };

  // Helper: build valid user create payload
  const buildCreateUserPayload = async () => {
    const cabang = await createCabang({}, prisma);
    const role = await createRole({}, prisma);
    const ts = Date.now();
    return {
      payload: {
        username: `newuser_${ts}`,
        password: 'password123',
        namaLengkap: 'New Test User',
        email: `newuser_${ts}@example.com`,
        userRoles: [{ roleId: role.id, cabangId: cabang.id }],
        userCabang: [{ cabangId: cabang.id, isPrimary: true }],
      },
      cabang,
      role,
    };
  };

  // ========================================
  // POSITIVE TEST CASES
  // ========================================

  describe('GET /api/users - Positive Cases', () => {
    it('✅ Should return users list', async () => {
      await authenticateAgent();

      const response = await agent.get('/api/users').expect(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/users/:id - Positive Cases', () => {
    it('✅ Should return user by valid ID', async () => {
      const { user } = await authenticateAgent();

      const response = await agent.get(`/api/users/${user.id}`).expect(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(user.id);
    });
  });

  describe('POST /api/users - Positive Cases', () => {
    it('✅ Should create user with required fields', async () => {
      await authenticateAgent();
      const { payload } = await buildCreateUserPayload();

      const response = await agent
        .post('/api/users')
        .send(payload)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.username).toBe(payload.username);
      // Password should not be in response
      expect(response.body.data.password).toBeUndefined();
    });
  });

  describe('PUT /api/users/:id - Positive Cases', () => {
    it('✅ Should update user namaLengkap', async () => {
      await authenticateAgent();
      const { payload } = await buildCreateUserPayload();

      // Create user first
      const createRes = await agent.post('/api/users').send(payload).expect(201);
      const userId = createRes.body.data.id;

      const response = await agent
        .put(`/api/users/${userId}`)
        .send({ namaLengkap: 'Updated Name' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/users/:id/status - Positive Cases', () => {
    it('✅ Should change user status to nonaktif', async () => {
      await authenticateAgent();
      const { payload } = await buildCreateUserPayload();
      const createRes = await agent.post('/api/users').send(payload).expect(201);
      const userId = createRes.body.data.id;

      const response = await agent
        .put(`/api/users/${userId}/status`)
        .send({ status: 'nonaktif' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/users/:id/reset-password - Positive Cases', () => {
    it('✅ Should reset user password', async () => {
      await authenticateAgent();
      const { payload } = await buildCreateUserPayload();
      const createRes = await agent.post('/api/users').send(payload).expect(201);
      const userId = createRes.body.data.id;

      const response = await agent
        .post(`/api/users/${userId}/reset-password`)
        .send({ newPassword: 'newpassword456' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/users/:id - Positive Cases', () => {
    it('✅ Should delete user', async () => {
      await authenticateAgent();
      const { payload } = await buildCreateUserPayload();
      const createRes = await agent.post('/api/users').send(payload).expect(201);
      const userId = createRes.body.data.id;

      const response = await agent
        .delete(`/api/users/${userId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  // ========================================
  // NEGATIVE TEST CASES
  // ========================================

  describe('POST /api/users - Negative Cases', () => {
    it('❌ Should return 400 when username is missing', async () => {
      await authenticateAgent();
      const { payload } = await buildCreateUserPayload();
      delete payload.username;

      const response = await agent.post('/api/users').send(payload).expect(400);
      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when password is too short', async () => {
      await authenticateAgent();
      const { payload } = await buildCreateUserPayload();
      payload.password = '123';

      const response = await agent.post('/api/users').send(payload).expect(400);
      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when email is invalid', async () => {
      await authenticateAgent();
      const { payload } = await buildCreateUserPayload();
      payload.email = 'not-an-email';

      const response = await agent.post('/api/users').send(payload).expect(400);
      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when userRoles is missing', async () => {
      await authenticateAgent();
      const { payload } = await buildCreateUserPayload();
      delete payload.userRoles;

      const response = await agent.post('/api/users').send(payload).expect(400);
      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when userCabang is missing', async () => {
      await authenticateAgent();
      const { payload } = await buildCreateUserPayload();
      delete payload.userCabang;

      const response = await agent.post('/api/users').send(payload).expect(400);
      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when status is invalid', async () => {
      await authenticateAgent();
      const { payload } = await buildCreateUserPayload();
      payload.status = 'INVALID';

      const response = await agent.post('/api/users').send(payload).expect(400);
      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 409 when username already exists', async () => {
      await authenticateAgent();
      const { payload } = await buildCreateUserPayload();

      // Create user first
      await agent.post('/api/users').send(payload).expect(201);

      // Try creating with same username
      const payload2 = { ...payload, email: `dupe_${Date.now()}@example.com` };

      const response = await agent.post('/api/users').send(payload2);
      expect([400, 409]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users/:id - Negative Cases', () => {
    it('❌ Should return 404 for non-existent user', async () => {
      await authenticateAgent();

      const response = await agent
        .get('/api/users/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/:id/status - Negative Cases', () => {
    it('❌ Should return 400 when status is invalid', async () => {
      await authenticateAgent();
      const { payload } = await buildCreateUserPayload();
      const createRes = await agent.post('/api/users').send(payload).expect(201);

      const response = await agent
        .put(`/api/users/${createRes.body.data.id}/status`)
        .send({ status: 'INVALID' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/users/:id/reset-password - Negative Cases', () => {
    it('❌ Should return 400 when newPassword is too short', async () => {
      await authenticateAgent();
      const { payload } = await buildCreateUserPayload();
      const createRes = await agent.post('/api/users').send(payload).expect(201);

      const response = await agent
        .post(`/api/users/${createRes.body.data.id}/reset-password`)
        .send({ newPassword: '12' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  // ========================================
  // AUTHENTICATION TESTS
  // ========================================

  describe('Authentication & Authorization', () => {
    it('❌ Should deny access without authentication', async () => {
      const freshAgent = request.agent(app);
      const response = await freshAgent.get('/api/users').expect(401);
      expect(response.body.success).toBe(false);
    });

    it('❌ Should deny create without user:create permission', async () => {
      const { user, plainPassword } = await createUserWithModulePermissions(
        'kategori', {}, prisma
      );

      await agent
        .post('/api/auth/login')
        .set('User-Agent', 'test-agent')
        .set('X-Forwarded-For', '127.0.0.1')
        .send({ username: user.username, password: plainPassword });

      const response = await agent
        .post('/api/users')
        .send({ username: 'test', password: 'password123', namaLengkap: 'Test', email: 'test@test.com' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
