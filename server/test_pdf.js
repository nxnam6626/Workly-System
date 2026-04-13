const path = require('path');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function test() {
  const standardFontDataUrl = path.join(process.cwd(), 'node_modules/pdfjs-dist/standard_fonts/').replace(/\\/g, '/') + '/';
  console.log(standardFontDataUrl);
}
test();
