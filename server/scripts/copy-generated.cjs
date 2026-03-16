const fs = require('fs');
const path = require('path');

// Copy src/generated/prisma -> dist/src/generated/prisma
const src = path.join(__dirname, '..', 'src', 'generated');
const dest = path.join(__dirname, '..', 'dist', 'src', 'generated');

if (!fs.existsSync(src)) {
  console.warn('src/generated/ not found, skip copy');
  process.exit(0);
}

function copyRecursive(a, b) {
  fs.mkdirSync(b, { recursive: true });
  fs.readdirSync(a).forEach((name) => {
    const srcPath = path.join(a, name);
    const destPath = path.join(b, name);
    if (fs.statSync(srcPath).isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

copyRecursive(src, dest);
console.log('Copied src/generated/ -> dist/src/generated/');
