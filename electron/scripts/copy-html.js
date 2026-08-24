/* 打包前把仓库根目录的 index.html 复制到 app/index.html
   —— 应用本体永远只有一份（仓库根目录），electron 打包的是它的副本 */
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', '..', 'index.html');
const dstDir = path.join(__dirname, '..', 'app');
const dst = path.join(dstDir, 'index.html');

fs.mkdirSync(dstDir, { recursive: true });
fs.copyFileSync(src, dst);
console.log('copied: ../../index.html -> app/index.html (' + fs.statSync(dst).size + ' bytes)');
