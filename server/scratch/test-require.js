const path = require('path');
const target = path.resolve(__dirname, '../dist/src/generated/prisma/index.js');
console.log('Target Path:', target);
const fs = require('fs');
console.log('Exists Sync:', fs.existsSync(target));
try {
    const mod = require(target);
    console.log('Require Success!', Object.keys(mod.Prisma).length, 'keys in Prisma');
} catch (err) {
    console.error('Require FAILED with:');
    console.error(err);
}
