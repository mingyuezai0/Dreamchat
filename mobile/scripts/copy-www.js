// 把根目录 index.html 复制到 www/（与 electron/scripts/copy-html.js 同思路）
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', '..', 'index.html');
const DST = path.join(__dirname, '..', 'www', 'index.html');

fs.copyFileSync(SRC, DST);
console.log('copied:', path.relative(process.cwd(), DST), fs.statSync(DST).size, 'bytes');
