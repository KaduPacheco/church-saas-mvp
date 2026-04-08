const assert = require('node:assert/strict');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const serviceModulePath = path.join(
  projectRoot,
  'src',
  'modules',
  'backoffice',
  'auth',
  'backoffice-auth.service.js'
);

const modulePaths = {
  bcrypt: require.resolve('bcryptjs', { paths: [projectRoot] }),
  jwt: require.resolve('jsonwebtoken', { paths: [projectRoot] }),
  db: path.join(projectRoot, 'src', 'config', 'database.js'),
  env: path.join(projectRoot, 'src', 'config', 'env.js'),
  logger: path.join(projectRoot, 'src', 'utils', 'logger.js'),
  auditService: path.join(projectRoot, 'src', 'modules', 'backoffice', 'audit', 'audit.service.js'),
};

function loadBackofficeAuthService(mocks) {
  const originalEntries = new Map();

  for (const [moduleId, mockExport] of Object.entries(mocks)) {
    originalEntries.set(moduleId, require.cache[moduleId]);
    require.cache[moduleId] = {
      id: moduleId,
      filename: moduleId,
      loaded: true,
      exports: mockExport,
    };
  }

  delete require.cache[serviceModulePath];
  const service = require(serviceModulePath);

  return {
    service,
    cleanup() {
      delete require.cache[serviceModulePath];

      for (const [moduleId, originalEntry] of originalEntries.entries()) {
        if (originalEntry) {
          require.cache[moduleId] = originalEntry;
        } else {
          delete require.cache[moduleId];
        }
      }
    },
  };
}

function createDbMock({ firstResponses = {} } = {}) {
  const updates = [];

  function db(table) {
    const state = {
      table,
      where: null,
    };

    const query = {
      join() {
        return query;
      },
      select() {
        return query;
      },
      where(criteria) {
        state.where = criteria;
        return query;
      },
      async first() {
        const responseKey = `${state.table}:${JSON.stringify(state.where)}`;
        return firstResponses[responseKey] ?? null;
      },
      async update(payload) {
        updates.push({
          table: state.table,
          where: state.where,
          payload,
        });

        return 1;
      },
    };

    return query;
  }

  db.fn = {
    now() {
      return 'NOW';
    },
  };

  db.__updates = updates;
  return db;
}

function createDefaultEnv() {
  return {
    platformJwt: {
      secret: 'platform-secret',
      refreshSecret: 'platform-refresh-secret',
      expiresIn: '15m',
      refreshExpiresIn: '7d',
    },
  };
}

function createDefaultLogger() {
  return {
    info() {},
    warn() {},
    error() {},
    debug() {},
  };
}

function createDefaultAuditService() {
  return {
    async register() {
      return null;
    },
  };
}

async function testRefreshSuccess() {
  const storedRefreshToken = 'stored-refresh-token';
  const platformUser = {
    id: 'platform-user-1',
    role_id: 'role-1',
    name: 'Platform User',
    email: 'platform@example.com',
    refresh_token: storedRefreshToken,
    is_active: true,
    last_login: null,
    role_slug: 'super_admin',
    role_name: 'Super Admin',
    role_is_active: true,
    permissions: ['platform:*'],
  };

  const db = createDbMock({
    firstResponses: {
      [`platform_users as pu:${JSON.stringify({ 'pu.id': platformUser.id, 'pu.is_active': true })}`]:
        platformUser,
    },
  });

  const jwt = {
    verify(token, secret) {
      assert.equal(token, storedRefreshToken);
      assert.equal(secret, 'platform-refresh-secret');

      return {
        scope: 'platform',
        platformUserId: platformUser.id,
      };
    },
    sign: (() => {
      const tokens = ['new-access-token', 'new-refresh-token'];
      return () => tokens.shift();
    })(),
  };

  const { service, cleanup } = loadBackofficeAuthService({
    [modulePaths.db]: db,
    [modulePaths.env]: createDefaultEnv(),
    [modulePaths.jwt]: jwt,
    [modulePaths.bcrypt]: {},
    [modulePaths.logger]: createDefaultLogger(),
    [modulePaths.auditService]: createDefaultAuditService(),
  });

  try {
    const result = await service.refresh({ refreshToken: storedRefreshToken });

    assert.deepEqual(result, {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      user: {
        id: platformUser.id,
        name: platformUser.name,
        email: platformUser.email,
        roleId: platformUser.role_id,
        roleSlug: platformUser.role_slug,
        roleName: platformUser.role_name,
        permissions: ['platform:*'],
        lastLogin: null,
      },
    });

    assert.equal(db.__updates.length, 1);
    assert.deepEqual(db.__updates[0].where, { id: platformUser.id });
    assert.equal(db.__updates[0].payload.refresh_token, 'new-refresh-token');
    assert.equal(db.__updates[0].payload.updated_at, 'NOW');
    assert.ok(db.__updates[0].payload.refresh_token_expires instanceof Date);
  } finally {
    cleanup();
  }
}

async function testRefreshMismatchFailure() {
  const platformUserId = 'platform-user-2';
  const providedRefreshToken = 'provided-refresh-token';
  const db = createDbMock({
    firstResponses: {
      [`platform_users as pu:${JSON.stringify({ 'pu.id': platformUserId, 'pu.is_active': true })}`]:
        {
          id: platformUserId,
          role_id: 'role-2',
          name: 'Support User',
          email: 'support@example.com',
          refresh_token: 'different-refresh-token',
          is_active: true,
          last_login: null,
          role_slug: 'support',
          role_name: 'Support',
          role_is_active: true,
          permissions: ['platform:audit:read'],
        },
    },
  });

  const jwt = {
    verify() {
      return {
        scope: 'platform',
        platformUserId,
      };
    },
    sign() {
      throw new Error('sign should not be called when refresh token mismatches');
    },
  };

  const warnings = [];
  const { service, cleanup } = loadBackofficeAuthService({
    [modulePaths.db]: db,
    [modulePaths.env]: createDefaultEnv(),
    [modulePaths.jwt]: jwt,
    [modulePaths.bcrypt]: {},
    [modulePaths.logger]: {
      ...createDefaultLogger(),
      warn(message) {
        warnings.push(message);
      },
    },
    [modulePaths.auditService]: createDefaultAuditService(),
  });

  try {
    await assert.rejects(
      () => service.refresh({ refreshToken: providedRefreshToken }),
      (error) => {
        assert.equal(error.code, 'UNAUTHORIZED');
        assert.equal(error.message, 'Refresh token da plataforma invalido. Faca login novamente.');
        return true;
      }
    );

    assert.equal(db.__updates.length, 1);
    assert.deepEqual(db.__updates[0], {
      table: 'platform_users',
      where: { id: platformUserId },
      payload: {
        refresh_token: null,
        refresh_token_expires: null,
        updated_at: 'NOW',
      },
    });
    assert.equal(warnings.length, 1);
  } finally {
    cleanup();
  }
}

async function testLogoutClearsRefreshToken() {
  const platformUserId = 'platform-user-3';
  const db = createDbMock();

  const { service, cleanup } = loadBackofficeAuthService({
    [modulePaths.db]: db,
    [modulePaths.env]: createDefaultEnv(),
    [modulePaths.jwt]: {},
    [modulePaths.bcrypt]: {},
    [modulePaths.logger]: createDefaultLogger(),
    [modulePaths.auditService]: createDefaultAuditService(),
  });

  try {
    await service.logout(platformUserId);

    assert.deepEqual(db.__updates[0], {
      table: 'platform_users',
      where: { id: platformUserId },
      payload: {
        refresh_token: null,
        refresh_token_expires: null,
        updated_at: 'NOW',
      },
    });
  } finally {
    cleanup();
  }
}

async function run() {
  const tests = [
    ['backoffice auth refresh rotates tokens when refresh token is valid', testRefreshSuccess],
    [
      'backoffice auth refresh clears saved token and fails on token mismatch',
      testRefreshMismatchFailure,
    ],
    ['backoffice auth logout clears saved refresh token', testLogoutClearsRefreshToken],
  ];

  let failures = 0;

  for (const [name, testFn] of tests) {
    try {
      await testFn();
      console.log(`PASS ${name}`);
    } catch (error) {
      failures += 1;
      console.error(`FAIL ${name}`);
      console.error(error);
    }
  }

  if (failures > 0) {
    process.exitCode = 1;
  }
}

run();
