const assert = require('node:assert/strict');
const path = require('node:path');

const authorize = require(path.join(__dirname, '..', 'src', 'middlewares', 'authorize.js'));

async function runMiddleware(middleware, req) {
  return new Promise((resolve, reject) => {
    middleware(req, {}, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function testAuthorizeRejectsUserWithoutPermission() {
  const middleware = authorize('churches:write');

  await assert.rejects(
    () =>
      runMiddleware(middleware, {
        user: {
          permissions: ['churches:read'],
        },
      }),
    (error) => {
      assert.equal(error.code, 'FORBIDDEN');
      assert.match(error.message, /churches:write/);
      return true;
    }
  );
}

async function testAuthorizeAllowsMatchingPermissionAndAdminBypass() {
  await runMiddleware(authorize('churches:read'), {
    user: {
      permissions: ['churches:read'],
    },
  });

  await runMiddleware(authorize('churches:write'), {
    user: {
      permissions: ['admin:full'],
    },
  });
}

async function testAuthorizeRejectsMissingRolesWritePermission() {
  const middleware = authorize('roles:write');

  await assert.rejects(
    () =>
      runMiddleware(middleware, {
        user: {
          permissions: ['roles:read'],
        },
      }),
    (error) => {
      assert.equal(error.code, 'FORBIDDEN');
      assert.match(error.message, /roles:write/);
      return true;
    }
  );
}

async function run() {
  const tests = [
    ['authorize middleware rejects missing churches:write permission', testAuthorizeRejectsUserWithoutPermission],
    ['authorize middleware allows matching permission and admin bypass', testAuthorizeAllowsMatchingPermissionAndAdminBypass],
    ['authorize middleware rejects missing roles:write permission', testAuthorizeRejectsMissingRolesWritePermission],
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
