const assert = require('node:assert/strict');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const serviceModulePath = path.join(
  projectRoot,
  'src',
  'modules',
  'roles',
  'roles.service.js'
);

const modulePaths = {
  db: path.join(projectRoot, 'src', 'config', 'database.js'),
  uuid: require.resolve('uuid', { paths: [projectRoot] }),
};

function loadRolesService(mocks) {
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

function createDbMock(seedData = {}) {
  const data = {
    roles: (seedData.roles || []).map(cloneRecord),
    members: (seedData.members || []).map(cloneRecord),
  };

  class QueryBuilder {
    constructor(table, state = null) {
      this.table = table;
      this.state = state
        ? JSON.parse(JSON.stringify(state))
        : {
            filters: [],
            ilike: [],
            not: [],
            whereIn: [],
            order: null,
            limit: null,
            offset: 0,
            countAlias: null,
            first: false,
          };
    }

    where(criteria) {
      this.state.filters.push(criteria);
      return this;
    }

    andWhere(field, value) {
      return this.where({ [field]: value });
    }

    andWhereNot(field, value) {
      this.state.not.push({ field, value });
      return this;
    }

    whereIn(field, values) {
      this.state.whereIn.push({ field, values });
      return this;
    }

    andWhereILike(field, pattern) {
      this.state.ilike.push({ field, pattern });
      return this;
    }

    whereRaw(sql, bindings = []) {
      if (sql.includes('LOWER(name) = LOWER(?)')) {
        this.state.filters.push({
          __type: 'lowercaseNameEquals',
          value: String(bindings[0] || '').toLowerCase(),
        });
      }

      return this;
    }

    modify(callback) {
      callback(this);
      return this;
    }

    count(aliasExpression) {
      this.state.countAlias = parseAlias(aliasExpression);
      return this;
    }

    select() {
      return this;
    }

    orderBy(field, direction = 'asc') {
      this.state.order = {
        field: normalizeField(field),
        direction: direction.toLowerCase(),
      };
      return this;
    }

    limit(value) {
      this.state.limit = value;
      return this;
    }

    offset(value) {
      this.state.offset = value;
      return this;
    }

    clone() {
      return new QueryBuilder(this.table, this.state);
    }

    first() {
      this.state.first = true;
      return this;
    }

    insert(payload) {
      const record = cloneRecord(Array.isArray(payload) ? payload[0] : payload);
      record.created_at = record.created_at || '2026-04-08T00:00:00.000Z';
      record.updated_at = record.updated_at || '2026-04-08T00:00:00.000Z';
      data[this.table].push(record);

      return {
        returning: async () => [cloneRecord(record)],
      };
    }

    async update(payload) {
      const rows = this.getMatchedRows(false);
      rows.forEach((row) => Object.assign(row, payload));
      return rows.length;
    }

    as() {
      return this;
    }

    then(resolve, reject) {
      return Promise.resolve(this.execute()).then(resolve, reject);
    }

    getMatchedRows(clone = true) {
      let rows = data[this.table];

      for (const filter of this.state.filters) {
        if (filter.__type === 'lowercaseNameEquals') {
          rows = rows.filter(
            (row) => String(row.name || '').toLowerCase() === filter.value
          );
          continue;
        }

        rows = rows.filter((row) =>
          Object.entries(filter).every(([field, expectedValue]) => {
            const normalizedField = normalizeField(field);
            return row[normalizedField] === expectedValue;
          })
        );
      }

      for (const filter of this.state.ilike) {
        const field = normalizeField(filter.field);
        const needle = String(filter.pattern || '')
          .replace(/%/g, '')
          .toLowerCase();

        rows = rows.filter((row) =>
          String(row[field] || '').toLowerCase().includes(needle)
        );
      }

      for (const filter of this.state.not) {
        const field = normalizeField(filter.field);
        rows = rows.filter((row) => row[field] !== filter.value);
      }

      for (const filter of this.state.whereIn) {
        const field = normalizeField(filter.field);
        rows = rows.filter((row) => filter.values.includes(row[field]));
      }

      return clone ? rows.map(cloneRecord) : rows;
    }

    execute() {
      let rows = this.getMatchedRows(true).map((row) => decorateRow(this.table, row, data));

      if (this.state.order) {
        const { field, direction } = this.state.order;
        rows.sort((left, right) => {
          const comparison = String(left[field] || '').localeCompare(String(right[field] || ''));
          return direction === 'desc' ? comparison * -1 : comparison;
        });
      }

      if (this.state.offset) {
        rows = rows.slice(this.state.offset);
      }

      if (typeof this.state.limit === 'number') {
        rows = rows.slice(0, this.state.limit);
      }

      if (this.state.countAlias) {
        return [{ [this.state.countAlias]: rows.length }];
      }

      if (this.state.first) {
        return rows[0] || null;
      }

      return rows;
    }
  }

  function db(table) {
    return new QueryBuilder(table);
  }

  db.fn = {
    now() {
      return 'NOW';
    },
  };

  db.__data = data;

  return db;
}

function decorateRow(table, row, data) {
  if (table !== 'roles') {
    return row;
  }

  return {
    ...row,
    members_count: data.members.filter(
      (member) => member.church_id === row.church_id && member.role_id === row.id
    ).length,
  };
}

function parseAlias(aliasExpression) {
  const match = String(aliasExpression).match(/\s+as\s+(.+)$/i);
  return match ? match[1] : String(aliasExpression);
}

function normalizeField(field) {
  return String(field).split('.').pop();
}

function cloneRecord(value) {
  return JSON.parse(JSON.stringify(value));
}

function createSeedData() {
  return {
    roles: [
      {
        id: 'role-a-system',
        church_id: 'tenant-a',
        name: 'Pastor',
        description: 'Lider espiritual da igreja',
        is_system: true,
        is_active: true,
        created_at: '2026-04-01T10:00:00.000Z',
        updated_at: '2026-04-02T10:00:00.000Z',
      },
      {
        id: 'role-a-custom',
        church_id: 'tenant-a',
        name: 'Coordenador de Midia',
        description: 'Coordena a equipe de comunicacao',
        is_system: false,
        is_active: false,
        created_at: '2026-04-03T10:00:00.000Z',
        updated_at: '2026-04-04T10:00:00.000Z',
      },
      {
        id: 'role-b-system',
        church_id: 'tenant-b',
        name: 'Pastor',
        description: 'Outro tenant',
        is_system: true,
        is_active: true,
        created_at: '2026-04-05T10:00:00.000Z',
        updated_at: '2026-04-06T10:00:00.000Z',
      },
    ],
    members: [
      { id: 'member-a1', church_id: 'tenant-a', role_id: 'role-a-system' },
      { id: 'member-a2', church_id: 'tenant-a', role_id: 'role-a-system' },
      { id: 'member-a3', church_id: 'tenant-a', role_id: 'role-a-custom' },
      { id: 'member-b1', church_id: 'tenant-b', role_id: 'role-b-system' },
    ],
  };
}

async function testListRolesRespectsTenantIsolationAndCounters() {
  const db = createDbMock(createSeedData());
  const { service, cleanup } = loadRolesService({
    [modulePaths.db]: db,
    [modulePaths.uuid]: { v4: () => 'generated-role' },
  });

  try {
    const result = await service.listRoles({
      churchId: 'tenant-a',
      page: 1,
      perPage: 10,
    });

    assert.equal(result.data.length, 2);
    assert.deepEqual(
      result.data.map((item) => item.id),
      ['role-a-custom', 'role-a-system']
    );
    assert.deepEqual(result.data[0].counts, { members: 1 });
    assert.deepEqual(result.data[1].counts, { members: 2 });
    assert.equal(result.meta.total, 2);
    assert.deepEqual(result.summary, {
      total: 2,
      active: 1,
      inactive: 1,
      system: 1,
      custom: 1,
      linkedMembers: 3,
      scope: 'tenant',
      scopeLabel: 'Sede / tenant completo',
    });
  } finally {
    cleanup();
  }
}

async function testGetRoleByIdRespectsTenantIsolationAndScopedRead() {
  const db = createDbMock(createSeedData());
  const { service, cleanup } = loadRolesService({
    [modulePaths.db]: db,
    [modulePaths.uuid]: { v4: () => 'generated-role' },
  });

  try {
    const role = await service.getRoleById({
      churchId: 'tenant-a',
      actorCongregationId: 'cong-a',
      roleId: 'role-a-system',
    });

    assert.equal(role.id, 'role-a-system');
    assert.equal(role.isSystem, true);
    assert.equal(role.counts.members, 2);
    assert.equal(role.scope, 'congregation');

    await assert.rejects(
      () =>
        service.getRoleById({
          churchId: 'tenant-a',
          roleId: 'role-b-system',
        }),
      (error) => {
        assert.equal(error.code, 'NOT_FOUND');
        return true;
      }
    );
  } finally {
    cleanup();
  }
}

async function testCreateRoleValidatesUniquenessAndBlocksScopedWrites() {
  const db = createDbMock(createSeedData());
  const { service, cleanup } = loadRolesService({
    [modulePaths.db]: db,
    [modulePaths.uuid]: { v4: () => 'generated-role' },
  });

  try {
    const created = await service.createRole({
      churchId: 'tenant-a',
      name: 'Lider de Jovens',
      description: 'Coordena o ministerio de jovens',
    });

    assert.equal(created.id, 'generated-role');
    assert.equal(created.churchId, 'tenant-a');
    assert.equal(created.status, 'active');
    assert.equal(created.isSystem, false);

    await assert.rejects(
      () =>
        service.createRole({
          churchId: 'tenant-a',
          name: 'pastor',
        }),
      (error) => {
        assert.equal(error.code, 'CONFLICT');
        return true;
      }
    );

    await assert.rejects(
      () =>
        service.createRole({
          churchId: 'tenant-a',
          actorCongregationId: 'cong-a',
          name: 'Cargo Bloqueado',
        }),
      (error) => {
        assert.equal(error.code, 'FORBIDDEN');
        return true;
      }
    );
  } finally {
    cleanup();
  }
}

async function testUpdateRolePersistsAndSystemRoleRemainsProtected() {
  const db = createDbMock(createSeedData());
  const { service, cleanup } = loadRolesService({
    [modulePaths.db]: db,
    [modulePaths.uuid]: { v4: () => 'generated-role' },
  });

  try {
    const updated = await service.updateRole({
      churchId: 'tenant-a',
      roleId: 'role-a-custom',
      name: 'Coordenador de Comunicacao',
      description: 'Atualizado',
    });

    assert.equal(updated.id, 'role-a-custom');
    assert.equal(updated.name, 'Coordenador de Comunicacao');
    assert.equal(updated.description, 'Atualizado');

    await assert.rejects(
      () =>
        service.updateRole({
          churchId: 'tenant-a',
          roleId: 'role-a-system',
          name: 'Pastor Senior',
        }),
      (error) => {
        assert.equal(error.code, 'FORBIDDEN');
        return true;
      }
    );
  } finally {
    cleanup();
  }
}

async function testUpdateRoleStatusWorksAndSystemRoleCannotBeInactivated() {
  const db = createDbMock(createSeedData());
  const { service, cleanup } = loadRolesService({
    [modulePaths.db]: db,
    [modulePaths.uuid]: { v4: () => 'generated-role' },
  });

  try {
    const updated = await service.updateRoleStatus({
      churchId: 'tenant-a',
      roleId: 'role-a-custom',
      status: 'active',
    });

    assert.equal(updated.id, 'role-a-custom');
    assert.equal(updated.status, 'active');
    assert.equal(
      db.__data.roles.find((role) => role.id === 'role-a-custom').is_active,
      true
    );

    await assert.rejects(
      () =>
        service.updateRoleStatus({
          churchId: 'tenant-a',
          roleId: 'role-a-system',
          status: 'inactive',
        }),
      (error) => {
        assert.equal(error.code, 'FORBIDDEN');
        return true;
      }
    );
  } finally {
    cleanup();
  }
}

async function run() {
  const tests = [
    ['roles list respects tenant isolation and counters', testListRolesRespectsTenantIsolationAndCounters],
    ['roles detail respects tenant isolation and scoped read remains allowed', testGetRoleByIdRespectsTenantIsolationAndScopedRead],
    ['roles create validates uniqueness and blocks scoped writes', testCreateRoleValidatesUniquenessAndBlocksScopedWrites],
    ['roles update persists and protects onboarding system roles', testUpdateRolePersistsAndSystemRoleRemainsProtected],
    ['roles status update works and system roles cannot be inactivated', testUpdateRoleStatusWorksAndSystemRoleCannotBeInactivated],
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
