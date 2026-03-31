const { execSync } = require('child_process');
const fs = require('fs');
try {
  const out = execSync('npx jest --config ./test/jest-e2e.json', { encoding: 'utf8' });
  fs.writeFileSync('out-test.txt', out);
} catch (e) {
  fs.writeFileSync('out-test.txt', e.stdout + '\n' + e.stderr);
}
