const fs = require('fs-extra'); fs.copySync('./src/generated', './dist/src/generated'); console.log('Copied generated prisma client to dist');
