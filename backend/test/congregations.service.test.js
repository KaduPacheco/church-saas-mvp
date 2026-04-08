const assert = require('node:assert/strict');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const serviceModulePath = path.join(
  projectRoot,
  'src',
  'modules',
  'congregations',
  'congregations.service.js'
);

const modulePaths = {
  db: path.join(projectRoot, 'src', 'config', 'database.js'),
  uuid: require.resolve('uuid', { paths: [projectRoot] }),
};

function loadCongregationsService(mocks) {
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
    congregations: (seedData.congregations || []).map(cloneRecord),
    users: (seedData.users || []).map(cloneRecord),
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
  if (table !== 'congregations') {
    return row;
  }

  return {
    ...row,
    users_count: data.users.filter(
      (user) => user.church_id === row.church_id && user.congregation_id === row.id
    ).length,
    members_count: data.members.filter(
      (member) => member.church_id === row.church_id && member.congregation_id === row.id
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
    congregations: [
      {
        id: 'cong-a',
        church_id: 'tenant-a',
        name: 'Central',
        address: 'Rua A, 100',
        status: 'active',
        created_at: '2026-04-01T10:00:00.000Z',
        updated_at: '2026-04-02T10:00:00.000Z',
      },
      {
        id: 'cong-b',
        church_id: 'tenant-a',
        name: 'Bela Vista',
        address: 'Rua B, 200',
        status: 'inactive',
        created_at: '2026-04-03T10:00:00.000Z',
        updated_at: '2026-04-04T10:00:00.000Z',
      },
      {
        id: 'cong-c',
        church_id: 'tenant-b',
        name: 'Outra Igreja',
        address: 'Rua C, 300',
        status: 'active',
        created_at: '2026-04-05T10:00:00.000Z',
        updated_at: '2026-04-06T10:00:00.000Z',
      },
    ],
    users: [
      { id: 'user-a1', church_id: 'tenant-a', congregation_id: 'cong-a' },
      { id: 'user-a2', church_id: 'tenant-a', congregation_id: 'cong-b' },
      { id: 'user-b1', church_id: 'tenant-b', congregation_id: 'cong-c' },
    ],
    members: [
      { id: 'member-a1', church_id: 'tenant-a', congregation_id: 'cong-a' },
      { id: 'member-a2', church_id: 'tenant-a', congregation_id: 'cong-a' },
      { id: 'member-a3', church_id: 'tenant-a', congregation_id: 'cong-b' },
      { id: 'member-b1', church_id: 'tenant-b', congregation_id: 'cong-c' },
    ],
  };
}

async function testListCongregationsRespectsTenantIsolation() {
  const db = createDbMock(createSeedData());
  const { service, cleanup } = loadCongregationsService({
    [modulePaths.db]: db,
    [modulePaths.uuid]: { v4: () => 'generated-id' },
  });

  try {
    const result = await service.listCongregations({
      churchId: 'tenant-a',
      page: 1,
      perPage: 10,
    });

    assert.equal(result.data.length, 2);
    assert.deepEqual(
      result.data.map((item) => item.id),
      ['cong-b', 'cong-a']
    );
    assert.equal(result.meta.total, 2);
    assert.deepEqual(result.data[0].counts, { users: 1, members: 1 });
    assert.deepEqual(result.data[1].counts, { users: 1, members: 2 });
    assert.deepEqual(result.summary, {
      total: 2,
      active: 1,
      inactive: 1,
      linkedUsers: 2,
      linkedMembers: 3,
      scope: 'tenant',
      scopeLabel: 'Sede / tenant completo',
    });
  } finally {
    cleanup();
  }
}

async function testScopedUserSeesOnlyOwnCongregation() {
  const db = createDbMock(createSeedData());
  const { service, cleanup } = loadCongregationsService({
    [modulePaths.db]: db,
    [modulePaths.uuid]: { v4: () => 'generated-id' },
  });

  try {
    const result = await service.listCongregations({
      churchId: 'tenant-a',
      actorCongregationId: 'cong-b',
      page: 1,
      perPage: 10,
    });

    assert.equal(result.data.length, 1);
    assert.equal(result.data[0].id, 'cong-b');
    assert.equal(result.summary.scope, 'congregation');

    await assert.rejects(
      () =>
        service.getCongregationById({
          churchId: 'tenant-a',
          actorCongregationId: 'cong-b',
          congregationId: 'cong-a',
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

async function testCreateCongregationValidatesUniquenessAndPersistsTenant() {
  const db = createDbMock(createSeedData());
  const { service, cleanup } = loadCongregationsService({
    [modulePaths.db]: db,
    [modulePaths.uuid]: { v4: () => 'generated-id' },
  });

  try {
    const created = await service.createCongregation({
      churchId: 'tenant-a',
      name: 'Nova Unidade',
      address: 'Rua Nova, 400',
    });

    assert.equal(created.id, 'generated-id');
    assert.equal(created.churchId, 'tenant-a');
    assert.equal(created.status, 'active');

    await assert.rejects(
      () =>
        service.createCongregation({
          churchId: 'tenant-a',
          name: 'central',
          address: 'Endereco duplicado',
        }),
      (error) => {
        assert.equal(error.code, 'CONFLICT');
        return true;
      }
    );
  } finally {
    cleanup();
  }
}

async function testUpdateCongregationStatusAndScopedWriteProtection() {
  const db = createDbMock(createSeedData());
  const { service, cleanup } = loadCongregationsService({
    [modulePaths.db]: db,
    [modulePaths.uuid]: { v4: () => 'generated-id' },
  });

  try {
    const updated = await service.updateCongregationStatus({
      churchId: 'tenant-a',
      congregationId: 'cong-b',
      status: 'active',
    });

    assert.equal(updated.id, 'cong-b');
    assert.equal(updated.status, 'active');
    assert.equal(
      db.__data.congregations.find((item) => item.id === 'cong-b').status,
      'active'
    );

    await assert.rejects(
      () =>
        service.createCongregation({
          churchId: 'tenant-a',
          actorCongregationId: 'cong-b',
          name: 'Bloqueada',
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
    ['congregations list respects tenant isolation and counters', testListCongregationsRespectsTenantIsolation],
    ['scoped tenant user only sees its own congregation', testScopedUserSeesOnlyOwnCongregation],
    ['congregations create persists within tenant and blocks duplicate names', testCreateCongregationValidatesUniquenessAndPersistsTenant],
    ['congregations status update works and scoped writes are forbidden', testUpdateCongregationStatusAndScopedWriteProtection],
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
