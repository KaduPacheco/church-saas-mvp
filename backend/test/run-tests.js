const { spawnSync } = require('node:child_process');
const path = require('node:path');

const tests = [
  'backoffice-auth.service.test.js',
  'congregations.service.test.js',
  'authorize.middleware.test.js',
];

let failures = 0;

for (const testFile of tests) {
  const result = spawnSync(process.execPath, [path.join(__dirname, testFile)], {
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    failures += 1;
  }
}

if (failures > 0) {
  process.exitCode = 1;
}
