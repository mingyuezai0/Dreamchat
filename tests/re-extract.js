// Re-extract the <script> body from index.html into check-latest.js for node --check.
// index.html 的定位统一交给 resolve-index.js（DREAMCHAT_INDEX > 仓库内 ../index.html），
// 本文件不再自带候选人列表，避免四个脚本各抄一份、搬目录时漏改。
const fs = require('fs');
const { HTML_PATH, readHtml } = require('./resolve-index');

var html = readHtml();
var a = html.indexOf('<script>');
var b = html.lastIndexOf('</script>');
if (a < 0 || b < 0) { console.error('script tags not found'); process.exit(1); }
var js = html.slice(a + '<script>'.length, b);
fs.writeFileSync(__dirname + '/check-latest.js', js, 'utf8');
console.log('wrote check-latest.js: ' + js.length + ' chars   <- ' + HTML_PATH);
