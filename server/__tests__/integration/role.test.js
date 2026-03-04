import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { getTestPrismaClient, clearTestDb } from '../utils/testDbManager';
import { createRole } from '../factories/userFactory';
import { createUserWithModulePermissions } from '../helpers/permissionSetup';

let app;
let agent;

describe('Role Management API Integration Tests', () => {
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
    const result = await createUserWithModulePermissions('role', {}, prisma);
    await agent
      .post('/api/auth/login')
      .set('User-Agent', 'test-agent')
      .set('X-Forwarded-For', '127.0.0.1')
      .send({ username: result.user.username, password: result.plainPassword });
    return result;
  };

  // ========================================
  // POSITIVE TEST CASES
  // ========================================

  describe('GET /api/roles - Positive Cases', () => {
    it('✅ Should return roles list', async () => {
      await authenticateAgent();

      const response = await agent.get('/api/roles').expect(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('GET /api/roles/:roleId - Positive Cases', () => {
    it('✅ Should return role by valid ID with permissions', async () => {
      const { role } = await authenticateAgent();

      const response = await agent.get(`/api/roles/${role.id}`).expect(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(role.id);
    });
  });

  describe('POST /api/roles - Positive Cases', () => {
    it('✅ Should create role with required fields', async () => {
      await authenticateAgent();
      const ts = Date.now();

      const response = await agent
        .post('/api/roles')
        .send({
          namaRole: `NEW_ROLE_${ts}`,
          deskripsi: 'A new test role',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.namaRole).toBe(`NEW_ROLE_${ts}`);
    });
  });

  describe('PUT /api/roles/:roleId - Positive Cases', () => {
    it('✅ Should update role', async () => {
      await authenticateAgent();
      const role = await createRole({ namaRole: `ORIG_${Date.now()}` }, prisma);

      const response = await agent
        .put(`/api/roles/${role.id}`)
        .send({
          namaRole: `UPDATED_${Date.now()}`,
          deskripsi: 'Updated description',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/roles/:roleId/clone - Positive Cases', () => {
    it('✅ Should clone role with permissions', async () => {
      const { role } = await authenticateAgent();

      const response = await agent
        .post(`/api/roles/${role.id}/clone`)
        .send({
          namaRole: `CLONED_${Date.now()}`,
          deskripsi: 'Cloned role',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      // Cloned role should be different from original
      expect(response.body.data.id).not.toBe(role.id);
    });
  });

  describe('DELETE /api/roles/:roleId - Positive Cases', () => {
    it('✅ Should delete role', async () => {
      await authenticateAgent();
      const role = await createRole({ namaRole: `DEL_${Date.now()}` }, prisma);

      const response = await agent
        .delete(`/api/roles/${role.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  // ========================================
  // NEGATIVE TEST CASES
  // ========================================

  describe('POST /api/roles - Negative Cases', () => {
    it('❌ Should return 400 when namaRole is missing', async () => {
      await authenticateAgent();

      const response = await agent
        .post('/api/roles')
        .send({ deskripsi: 'Test' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when deskripsi is missing', async () => {
      await authenticateAgent();

      const response = await agent
        .post('/api/roles')
        .send({ namaRole: 'TEST' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should return 400 when namaRole exceeds 100 chars', async () => {
      await authenticateAgent();

      const response = await agent
        .post('/api/roles')
        .send({
          namaRole: 'a'.repeat(101),
          deskripsi: 'Test',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('❌ Should handle duplicate namaRole', async () => {
      await authenticateAgent();
      const ts = Date.now();

      // Create first
      await agent.post('/api/roles').send({
        namaRole: `DUP_${ts}`,
        deskripsi: 'First',
      }).expect(201);

      // Try duplicate
      const response = await agent.post('/api/roles').send({
        namaRole: `DUP_${ts}`,
        deskripsi: 'Duplicate',
      });

      expect([400, 409]).toContain(response.status);
    });
  });

  describe('GET /api/roles/:roleId - Negative Cases', () => {
    it('❌ Should return 404 for non-existent role', async () => {
      await authenticateAgent();

      const response = await agent
        .get('/api/roles/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/roles/:roleId - Negative Cases', () => {
    it('❌ Should return 404 for non-existent role', async () => {
      await authenticateAgent();

      const response = await agent
        .delete('/api/roles/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  // ========================================
  // AUTHENTICATION TESTS
  // ========================================

  describe('Authentication & Authorization', () => {
    it('❌ Should deny access without authentication', async () => {
      const freshAgent = request.agent(app);
      const response = await freshAgent.get('/api/roles').expect(401);
      expect(response.body.success).toBe(false);
    });

    it('❌ Should deny create without role:create permission', async () => {
      const { user, plainPassword } = await createUserWithModulePermissions(
        'kategori', {}, prisma
      );

      await agent
        .post('/api/auth/login')
        .set('User-Agent', 'test-agent')
        .set('X-Forwarded-For', '127.0.0.1')
        .send({ username: user.username, password: plainPassword });

      const response = await agent
        .post('/api/roles')
        .send({ namaRole: 'TEST', deskripsi: 'Test' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
