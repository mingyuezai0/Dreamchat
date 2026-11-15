/* stats.js — 统计 index.html 的规模并生成「函数 → 行号」代码地图
 *
 * 目的：交接文档里手写的「8,347 行 / 384 个函数」这类数字迟早会漂，
 * 改成本脚本生成，文档只写「跑 node tools/stats.js」。
 *
 *   node tools/stats.js            # 打印统计，并写 docs/code-map.md
 *   node tools/stats.js --print    # 只打印，不写文件
 */
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..');
const INDEX = path.join(REPO, 'index.html');
const OUT = path.join(REPO, 'docs', 'code-map.md');

const html = fs.readFileSync(INDEX, 'utf8');
const bytes = Buffer.byteLength(html, 'utf8');
const lines = html.split('\n');

const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
const cssMatch = html.match(/<style>([\s\S]*?)<\/style>/);
const script = scriptMatch ? scriptMatch[1] : '';
const css = cssMatch ? cssMatch[1] : '';
const scriptStartLine = html.slice(0, html.indexOf('<script>')).split('\n').length;

/* ---- 函数索引 ---- */
const fns = [];
lines.forEach(function(line, i){
  let m = line.match(/^\s*function\s+([A-Za-z_$][\w$]*)\s*\(/);
  if(m) fns.push({ name: m[1], line: i + 1, kind: 'function' });
  else if((m = line.match(/^\s*var\s+([A-Za-z_$][\w$]*)\s*=\s*function\s*\(/)))
    fns.push({ name: m[1], line: i + 1, kind: 'var=function' });
});

/* ---- 规模指标 ---- */
const metrics = {
  '文件大小': bytes.toLocaleString('en-US') + ' 字节',
  '总行数': lines.length,
  '其中 CSS': css.split('\n').length + ' 行 / ' + css.length.toLocaleString('en-US') + ' 字符',
  '其中 JS': script.split('\n').length + ' 行 / ' + script.length.toLocaleString('en-US') + ' 字符',
  'JS 起始行': scriptStartLine,
  '顶层函数': fns.length,
  'HTML id': (html.match(/\sid="/g) || []).length,
  'JS 里的 $() 引用': (script.match(/\$\('/g) || []).length,
  'fetch 调用点': (script.match(/fetch\(/g) || []).length,
  'addEventListener': (html.match(/addEventListener/g) || []).length,
  'innerHTML 赋值': (html.match(/innerHTML/g) || []).length,
  'localStorage 键': (script.match(/localStorage\.(get|set)Item/g) || []).length
};

const appVer = (html.match(/var APP_VERSION = '([\d.]+)'/) || [])[1];
const tutVer = (html.match(/var BOARD_TUT_VERSION = (\d+)/) || [])[1];
const clCount = (script.match(/\n\s*\{ v:'\d/g) || []).length;

console.log('=== 梦语 index.html 统计 ===');
console.log('版本: v' + appVer + '   教程版本: ' + tutVer + '   CHANGELOG 条目: ' + clCount);
Object.keys(metrics).forEach(function(k){
  console.log('  ' + k.padEnd(16, ' ') + ': ' + metrics[k]);
});

if(process.argv.includes('--print')) process.exit(0);

/* ---- 写代码地图 ---- */
const pad = function(n){ return String(n); };
let md = '# 代码地图（自动生成，勿手改）\n\n';
md += '> 由 `node tools/stats.js` 生成。修改 `index.html` 后重跑即可，别手写行号。\n';
md += '> 版本 v' + appVer + ' / 教程版本 ' + tutVer + ' / CHANGELOG ' + clCount + ' 条\n\n';
md += '## 规模\n\n| 项 | 值 |\n|---|---|\n';
Object.keys(metrics).forEach(function(k){ md += '| ' + k + ' | ' + metrics[k] + ' |\n'; });
md += '\n## 函数索引（' + fns.length + ' 个，按行号排序）\n\n';
md += '| 行 | 函数 |\n|---:|---|\n';
fns.forEach(function(f){ md += '| ' + pad(f.line) + ' | `' + f.name + '()` |\n'; });
md += '\n';

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, md, 'utf8');
console.log('\n已写入 ' + path.relative(REPO, OUT) + '（' + fns.length + ' 个函数）');
