const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'generated');
const dest = path.join(__dirname, '..', 'dist', 'generated');

if (!fs.existsSync(src)) {
  console.warn('generated/ not found, skip copy');
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
console.log('Copied generated/ -> dist/generated/');
