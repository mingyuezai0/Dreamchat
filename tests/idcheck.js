/* idcheck.js — HTML 里的 id 与 JS 里的引用做双向核对
 *
 * 与 v0.4.8 之前的区别：**不再手写 id 白名单**（原来只覆盖 184 个，而 HTML 实际有 380+ 个，
 * 每加一个元素都要人肉补列表）。现在直接从源码两头抽，覆盖 100%：
 *   HTML 侧：所有 `id="xxx"`
 *   JS   侧：`$('xxx')`、`$('xxx', 根)`、`getElementById('xxx')`、`querySelector('#xxx')`
 *
 * 两条判定（任何一条不过就 exit 1）：
 *   1. JS 引用了但 HTML 里没有  → 拼错 / 元素被删了但代码还在（运行时 $() 返回 null 的经典来路）
 *   2. HTML 有但 JS 从不引用、又不在 ALLOW_STATIC 白名单 → 死 id，或写完忘了绑定
 */
const fs = require('fs');
const path = require('path');
const { HTML_PATH, readParts } = require('./resolve-index');

const { html, script } = readParts();

/* 合法「HTML 有、JS 不引用」的 id：只有这两类，新增白名单请在这里加注释说明原因 */
const ALLOW_STATIC = {
  // SVG defs（渐变 / 遮罩），只被同屏的 <use>/fill="url(#…)" 引用，JS 不碰
  splashLg: 1, splashMask: 1, lg1: 1, cmask1: 1, lg2: 1, cmask2: 1, lgA: 1, cmaskA: 1,
  // 纯静态提示文案
  contHint: 1, worldAiHint: 1, cardAiHint: 1,
  // 语义标记用，样式与脚本一律走 .fab 类选择器
  fabWrap: 1
};

const htmlIds = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(function(m){ return m[1].trim(); }));

const jsRefs = new Set();
function collect(re){
  const r = new RegExp(re.source, re.flags.indexOf('g') >= 0 ? re.flags : re.flags + 'g');
  let m;
  while((m = r.exec(script))) jsRefs.add(m[1]);
}
collect(/\$\('([A-Za-z0-9_-]+)'\)/);                  // $('msgList')
collect(/\$\([^,)]*,\s*'#?([A-Za-z0-9_-]+)'\)/);       // $('x', 根) / $(根, 'x')
collect(/getElementById\('([A-Za-z0-9_-]+)'\)/);       // 原生
collect(/querySelector(?:All)?\('#([A-Za-z0-9_-]+)'\)/); // CSS 选择器写法

let bad = 0;

const missingInHtml = [...jsRefs].filter(function(id){ return !htmlIds.has(id); }).sort();
missingInHtml.forEach(function(id){
  bad++;
  console.log('  ✗ JS 引用了不存在的 id: ' + id);
});

const neverRef = [...htmlIds].filter(function(id){ return !jsRefs.has(id) && !ALLOW_STATIC[id]; }).sort();
neverRef.forEach(function(id){
  bad++;
  console.log('  ✗ HTML 里的 id 从未被 JS 引用（死 id，或忘了绑定）: ' + id);
});

console.log('idcheck: HTML ' + htmlIds.size + ' 个 id / JS 引用 ' + jsRefs.size + ' 个 / 白名单 ' +
            Object.keys(ALLOW_STATIC).length + ' 个   <- ' + path.basename(HTML_PATH));
console.log(bad ? 'ID CHECK FAIL: ' + bad : 'ID CHECK OK');
process.exit(bad ? 1 : 0);
