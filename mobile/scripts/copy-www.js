// 把根目录 index.html 复制到 www/（与 electron/scripts/copy-html.js 同思路）
// 注意：www/ 是 .gitignore 的，新克隆 / 交接包里没有这个目录，
// 所以必须先建目录再复制，否则 copyFileSync 直接 ENOENT。
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', '..', 'index.html');
const DST = path.join(__dirname, '..', 'www', 'index.html');

if(!fs.existsSync(SRC)){
  console.error('[copy-www] 找不到 ' + SRC + '（本脚本必须在 <仓库>/mobile/scripts/ 里）');
  process.exit(1);
}

fs.mkdirSync(path.dirname(DST), { recursive: true });
fs.copyFileSync(SRC, DST);
console.log('copied:', path.relative(process.cwd(), DST), fs.statSync(DST).size, 'bytes');
