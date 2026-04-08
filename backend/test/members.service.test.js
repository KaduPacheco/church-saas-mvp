const assert = require('node:assert/strict');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const serviceModulePath = path.join(
  projectRoot,
  'src',
  'modules',
  'members',
  'members.service.js'
);

const modulePaths = {
  db: path.join(projectRoot, 'src', 'config', 'database.js'),
  uuid: require.resolve('uuid', { paths: [projectRoot] }),
};

function loadMembersService(mocks) {
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
    members: (seedData.members || []).map(cloneRecord),
    congregations: (seedData.congregations || []).map(cloneRecord),
  };

  class QueryBuilder {
    constructor(tableExpression, state = null) {
      this.table = normalizeTable(tableExpression);
      this.state = state
        ? JSON.parse(JSON.stringify(state))
        : {
            filters: [],
            ilikeGroups: [],
            whereIn: [],
            not: [],
            order: null,
            limit: null,
            offset: 0,
            countAlias: null,
            first: false,
          };
    }

    leftJoin() {
      return this;
    }

    where(arg1, arg2) {
      if (typeof arg1 === 'function') {
        const group = createConditionGroup();
        arg1(group);
        this.state.ilikeGroups.push(group.conditions);
        return this;
      }

      if (typeof arg1 === 'object' && arg1 !== null) {
        this.state.filters.push(arg1);
        return this;
      }

      this.state.filters.push({ [arg1]: arg2 });
      return this;
    }

    andWhere(arg1, arg2) {
      return this.where(arg1, arg2);
    }

    andWhereNot(field, value) {
      this.state.not.push({ field, value });
      return this;
    }

    whereIn(field, values) {
      this.state.whereIn.push({ field, values });
      return this;
    }

    whereILike(field, pattern) {
      this.state.ilikeGroups.push([{ field, pattern }]);
      return this;
    }

    orWhereILike(field, pattern) {
      const groups = this.state.ilikeGroups;

      if (groups.length === 0) {
        groups.push([]);
      }

      groups[groups.length - 1].push({ field, pattern });
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
        rows = rows.filter((row) =>
          Object.entries(filter).every(([field, expectedValue]) => {
            const normalizedField = normalizeField(field);
            return row[normalizedField] === expectedValue;
          })
        );
      }

      for (const group of this.state.ilikeGroups) {
        rows = rows.filter((row) =>
          group.some((condition) => {
            const field = normalizeField(condition.field);
            const needle = String(condition.pattern || '')
              .replace(/%/g, '')
              .toLowerCase();

            return String(row[field] || '').toLowerCase().includes(needle);
          })
        );
      }

      for (const filter of this.state.whereIn) {
        const field = normalizeField(filter.field);
        rows = rows.filter((row) => filter.values.includes(row[field]));
      }

      for (const filter of this.state.not) {
        const field = normalizeField(filter.field);
        rows = rows.filter((row) => row[field] !== filter.value);
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

  function db(tableExpression) {
    return new QueryBuilder(tableExpression);
  }

  db.fn = {
    now() {
      return 'NOW';
    },
  };

  db.__data = data;

  return db;
}

function createConditionGroup() {
  return {
    conditions: [],
    whereILike(field, pattern) {
      this.conditions.push({ field, pattern });
      return this;
    },
    orWhereILike(field, pattern) {
      this.conditions.push({ field, pattern });
      return this;
    },
  };
}

function decorateRow(table, row, data) {
  if (table !== 'members') {
    return row;
  }

  const congregation = data.congregations.find((item) => item.id === row.congregation_id);

  return {
    ...row,
    congregation_name: congregation?.name || null,
  };
}

function normalizeTable(tableExpression) {
  return String(tableExpression).split(/\s+as\s+/i)[0];
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
        status: 'active',
      },
      {
        id: 'cong-b',
        church_id: 'tenant-a',
        name: 'Bela Vista',
        status: 'active',
      },
      {
        id: 'cong-c',
        church_id: 'tenant-b',
        name: 'Outra Igreja',
        status: 'active',
      },
    ],
    members: [
      {
        id: 'member-a1',
        church_id: 'tenant-a',
        congregation_id: null,
        name: 'Ana Souza',
        email: 'ana@tenant-a.com',
        phone: '11999990001',
        document: '11111111111',
        status: 'active',
        gender: 'female',
        marital_status: 'single',
        birth_date: '1990-01-02',
        baptism_date: '2010-05-10',
        membership_date: '2011-03-20',
        address_street: 'Rua Um',
        address_number: '10',
        address_neighborhood: 'Centro',
        address_city: 'Sao Paulo',
        address_state: 'SP',
        address_zipcode: '01000-000',
        created_at: '2026-04-01T10:00:00.000Z',
        updated_at: '2026-04-02T10:00:00.000Z',
      },
      {
        id: 'member-a2',
        church_id: 'tenant-a',
        congregation_id: 'cong-a',
        name: 'Bruno Lima',
        email: 'bruno@tenant-a.com',
        phone: '11999990002',
        document: '22222222222',
        status: 'inactive',
        gender: 'male',
        marital_status: 'married',
        birth_date: '1988-03-04',
        baptism_date: '2008-05-10',
        membership_date: '2009-03-20',
        address_street: 'Rua Dois',
        address_number: '20',
        address_neighborhood: 'Norte',
        address_city: 'Sao Paulo',
        address_state: 'SP',
        address_zipcode: '02000-000',
        created_at: '2026-04-03T10:00:00.000Z',
        updated_at: '2026-04-04T10:00:00.000Z',
      },
      {
        id: 'member-a3',
        church_id: 'tenant-a',
        congregation_id: 'cong-b',
        name: 'Carla Dias',
        email: 'carla@tenant-a.com',
        phone: '11999990003',
        document: '33333333333',
        status: 'transferred',
        gender: 'female',
        marital_status: 'widowed',
        birth_date: '1985-07-08',
        baptism_date: '2005-09-11',
        membership_date: '2006-01-15',
        address_street: 'Rua Tres',
        address_number: '30',
        address_neighborhood: 'Sul',
        address_city: 'Campinas',
        address_state: 'SP',
        address_zipcode: '13000-000',
        created_at: '2026-04-05T10:00:00.000Z',
        updated_at: '2026-04-06T10:00:00.000Z',
      },
      {
        id: 'member-b1',
        church_id: 'tenant-b',
        congregation_id: 'cong-c',
        name: 'Daniel Rocha',
        email: 'daniel@tenant-b.com',
        phone: '21999990004',
        document: '44444444444',
        status: 'deceased',
        gender: 'male',
        marital_status: 'divorced',
        birth_date: '1970-10-12',
        baptism_date: '1990-08-02',
        membership_date: '1991-04-01',
        address_street: 'Rua Quatro',
        address_number: '40',
        address_neighborhood: 'Leste',
        address_city: 'Rio de Janeiro',
        address_state: 'RJ',
        address_zipcode: '20000-000',
        created_at: '2026-04-07T10:00:00.000Z',
        updated_at: '2026-04-08T10:00:00.000Z',
      },
    ],
  };
}

async function testListMembersRespectsTenantIsolationAndFilters() {
  const db = createDbMock(createSeedData());
  const { service, cleanup } = loadMembersService({
    [modulePaths.db]: db,
    [modulePaths.uuid]: { v4: () => 'generated-member' },
  });

  try {
    const result = await service.listMembers({
      churchId: 'tenant-a',
      search: 'bruno',
      status: 'inactive',
      congregationId: 'cong-a',
      page: 1,
      perPage: 10,
    });

    assert.equal(result.data.length, 1);
    assert.equal(result.data[0].id, 'member-a2');
    assert.equal(result.data[0].congregation.name, 'Central');
    assert.equal(result.meta.total, 1);
    assert.deepEqual(result.summary, {
      total: 1,
      active: 0,
      inactive: 1,
      transferred: 0,
      deceased: 0,
      scope: 'tenant',
      scopeLabel: 'Sede / tenant completo',
    });
  } finally {
    cleanup();
  }
}

async function testGetMemberByIdAndScopedVisibility() {
  const db = createDbMock(createSeedData());
  const { service, cleanup } = loadMembersService({
    [modulePaths.db]: db,
    [modulePaths.uuid]: { v4: () => 'generated-member' },
  });

  try {
    const member = await service.getMemberById({
      churchId: 'tenant-a',
      memberId: 'member-a1',
    });

    assert.equal(member.id, 'member-a1');
    assert.equal(member.congregation, null);
    assert.match(member.address.label, /Rua Um/);

    await assert.rejects(
      () =>
        service.getMemberById({
          churchId: 'tenant-a',
          actorCongregationId: 'cong-a',
          memberId: 'member-a3',
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

async function testCreateMemberPersistsWithinTenantAndScopedUserCannotEscapeCongregation() {
  const db = createDbMock(createSeedData());
  const { service, cleanup } = loadMembersService({
    [modulePaths.db]: db,
    [modulePaths.uuid]: { v4: () => 'generated-member' },
  });

  try {
    const created = await service.createMember({
      churchId: 'tenant-a',
      name: 'Eva Mendes',
      congregationId: 'cong-b',
      email: 'EVA@TENANT-A.COM',
      phone: '11999990005',
      document: '55555555555',
      addressCity: 'Santos',
      addressState: 'sp',
    });

    assert.equal(created.id, 'generated-member');
    assert.equal(created.churchId, 'tenant-a');
    assert.equal(created.congregationId, 'cong-b');
    assert.equal(created.email, 'eva@tenant-a.com');
    assert.equal(created.address.state, 'SP');
    assert.equal(created.status, 'active');

    await assert.rejects(
      () =>
        service.createMember({
          churchId: 'tenant-a',
          actorCongregationId: 'cong-a',
          name: 'Membro Fora de Escopo',
          congregationId: 'cong-b',
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

async function testUpdateMemberAndRejectCrossTenantCongregation() {
  const db = createDbMock(createSeedData());
  const { service, cleanup } = loadMembersService({
    [modulePaths.db]: db,
    [modulePaths.uuid]: { v4: () => 'generated-member' },
  });

  try {
    const updated = await service.updateMember({
      churchId: 'tenant-a',
      memberId: 'member-a2',
      name: 'Bruno Lima Atualizado',
      congregationId: null,
      phone: '11988887777',
      addressCity: 'Guarulhos',
    });

    assert.equal(updated.id, 'member-a2');
    assert.equal(updated.name, 'Bruno Lima Atualizado');
    assert.equal(updated.congregationId, null);
    assert.equal(updated.phone, '11988887777');
    assert.equal(updated.address.city, 'Guarulhos');

    await assert.rejects(
      () =>
        service.updateMember({
          churchId: 'tenant-a',
          memberId: 'member-a2',
          name: 'Bruno Lima',
          congregationId: 'cong-c',
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

async function testUpdateMemberStatusAndScopedFilterProtection() {
  const db = createDbMock(createSeedData());
  const { service, cleanup } = loadMembersService({
    [modulePaths.db]: db,
    [modulePaths.uuid]: { v4: () => 'generated-member' },
  });

  try {
    const updated = await service.updateMemberStatus({
      churchId: 'tenant-a',
      memberId: 'member-a3',
      status: 'active',
    });

    assert.equal(updated.id, 'member-a3');
    assert.equal(updated.status, 'active');
    assert.equal(
      db.__data.members.find((member) => member.id === 'member-a3').status,
      'active'
    );

    await assert.rejects(
      () =>
        service.listMembers({
          churchId: 'tenant-a',
          actorCongregationId: 'cong-a',
          congregationId: 'cong-b',
          page: 1,
          perPage: 10,
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
    ['members list respects tenant isolation and filters', testListMembersRespectsTenantIsolationAndFilters],
    ['members detail respects tenant and congregation visibility', testGetMemberByIdAndScopedVisibility],
    ['members create persists within tenant and blocks scoped escape', testCreateMemberPersistsWithinTenantAndScopedUserCannotEscapeCongregation],
    ['members update persists and rejects congregation from another tenant', testUpdateMemberAndRejectCrossTenantCongregation],
    ['members status update works and scoped filter escape is forbidden', testUpdateMemberStatusAndScopedFilterProtection],
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
