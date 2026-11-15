/* resolve-index.js — 找到一个 index.html 并对外提供路径（四个测试脚本共用，别再各抄一份）
 *
 * 解析顺序（第一个存在的胜出）：
 *   1. 环境变量 DREAMCHAT_INDEX（绝对路径，换位置/多副本时用它覆盖）
 *   2. <本文件目录>/../index.html        —— 测试在仓库内（repo/tests/）时的标准布局
 *   3. <本文件目录>/../../repo/index.html —— 测试被放在交接包外层时的老布局
 * 都找不到就直接报错退出，并打印排查提示（**不要再回退到某个硬编码的旧绝对路径**，
 * 那正是 v0.4.8 之前 idcheck 在交接包里必挂的原因）。
 */
const fs = require('fs');
const path = require('path');

const HERE = __dirname;
const CANDIDATES = [
  process.env.DREAMCHAT_INDEX,
  path.join(HERE, '..', 'index.html'),
  path.join(HERE, '..', '..', 'repo', 'index.html')
].filter(Boolean);

function isFile(p){
  try{ return fs.statSync(p).isFile(); }catch(e){ return false; }
}

const found = CANDIDATES.filter(isFile)[0];

if(!found){
  console.error('[resolve-index] 找不到 index.html，试过：');
  CANDIDATES.forEach(function(p){ console.error('  - ' + p); });
  console.error('对策：设环境变量 DREAMCHAT_INDEX 指向你的 index.html，例如');
  console.error('  set DREAMCHAT_INDEX=D:\\path\\to\\repo\\index.html');
  process.exit(1);
}

const HTML_PATH = path.resolve(found);
const ROOT = path.dirname(HTML_PATH);   // 仓库根目录（mobile/、tests/ 等都在它下面）

function readHtml(){ return fs.readFileSync(HTML_PATH, 'utf8'); }

/* 取 <script>…</script> 与 <style>…</style> 的内容；应用是单文件，所有静态断言都基于这两段 */
function readParts(){
  const html = readHtml();
  const s = html.match(/<script>([\s\S]*?)<\/script>/);
  const c = html.match(/<style>([\s\S]*?)<\/style>/);
  return { html: html, script: s ? s[1] : '', cssBlock: c ? c[1] : '' };
}

module.exports = { HTML_PATH, ROOT, readHtml, readParts, CANDIDATES };
