const path = require('path');
const fs = require('fs');

const target = path.join(__dirname, '..', 'dist', 'src', 'generated', 'prisma', 'index.js');
console.log('Target path:', target);
console.log('Exists:', fs.existsSync(target));

try {
    const prisma = require(target);
    console.log('Successfully required PrismaClient');
} catch (e) {
    console.error('Failed to require:', e);
}
