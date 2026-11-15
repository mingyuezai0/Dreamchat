/* bump.js — 一条命令同步「版本号 + CHANGELOG +（可选）教程版本」，并做一致性校验
 *
 * 为什么要有它：版本号散在六处（index.html / build.gradle 三行 / mobile 两个 package 文件 /
 * electron package.json），手工同步必然漏一处；漏了不会报错，只会让 APK 或安装包版本对不上。
 *
 * 用法
 *   node tools/bump.js --check                      # 只校验：六处是否都等于 APP_VERSION（CI / 测试用）
 *   node tools/bump.js --title "标题" \
 *        --add "新增条目" --fix "修复条目" --opt "优化条目"   # 每个参数可重复，自动 +0.0.1
 *   node tools/bump.js --version 0.5.0 --title "…" …        # 显式指定版本（仍校验逢十进一）
 *   node tools/bump.js … --tut                       # 同时 BOARD_TUT_VERSION +1（教程文案改了才加）
 *   node tools/bump.js … --date 2026-11-15           # 默认取今天（本地日期）
 *
 * CHANGELOG 书写规范（用户要求，持续有效）：**每条按「新增 / 修复 / 优化」三类书写，简洁明了**。
 * 本脚本会把 --add / --fix / --opt 的内容按这个顺序写成 [{#新增}… 条目 …{#修复} … {#优化} …]，
 * 前端 showLogView 把以 # 开头的条目渲染成分类小标题。空分类会被自动省略，三类全空则拒绝写入。
 */
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..');
const INDEX = path.join(REPO, 'index.html');
const GRADLE = path.join(REPO, 'mobile', 'android', 'app', 'build.gradle');
const MOBILE_PKG = path.join(REPO, 'mobile', 'package.json');
const MOBILE_LOCK = path.join(REPO, 'mobile', 'package-lock.json');
const ELECTRON_PKGS = [
  path.join(REPO, '..', 'electron', 'package.json'),     // 交接包里的电子工程快照（仓库同级的 electron\）
  'D:\\electron\\package.json'                            // 常驻工具链（存在才改）
];

const has = function(p){ try{ fs.statSync(p); return true; }catch(e){ return false; } };
const read = function(p){ return fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''); };   // 去 BOM：Windows 编辑器很容易写出带 BOM 的 json
const write = function(p, s){ fs.writeFileSync(p, s, 'utf8'); };

/* ---------- 取当前状态 ---------- */
function currentVersion(){
  const m = read(INDEX).match(/var APP_VERSION = '([\d.]+)'/);
  if(!m) fail('index.html 里找不到 APP_VERSION');
  return m[1];
}
function currentTut(){
  const m = read(INDEX).match(/var BOARD_TUT_VERSION = (\d+)/);
  return m ? parseInt(m[1], 10) : null;
}
function gradleVersionCode(){
  const m = read(GRADLE).match(/versionCode\s+(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

function fail(msg){
  console.error('[bump] ' + msg);
  process.exit(1);
}

/* 逢十进一：0.4.9 的下一个是 0.5.0，绝不是 0.4.10 */
function nextVersion(v){
  const p = v.split('.').map(Number);
  if(p.length !== 3 || p.some(isNaN)) fail('版本号格式不是 X.Y.Z：' + v);
  if(p[2] < 9) return p[0] + '.' + p[1] + '.' + (p[2] + 1);
  return p[0] + '.' + (p[1] + 1) + '.0';
}

/* ---------- 参数 ---------- */
const argv = process.argv.slice(2);
function flag(name){
  const i = argv.indexOf('--' + name);
  return i > -1;
}
function opt(name){
  const i = argv.indexOf('--' + name);
  return i > -1 ? argv[i + 1] : null;
}
function optAll(name){
  const out = [];
  argv.forEach(function(a, i){ if(a === '--' + name && argv[i + 1]) out.push(argv[i + 1]); });
  return out;
}

const cur = currentVersion();

/* ---------- --check：只校验一致性 ---------- */
if(flag('check')){
  const problems = [];
  const vc = gradleVersionCode();
  const checks = [];

  const gradleName = (read(GRADLE).match(/versionName\s+"([\d.]+)"/) || [])[1];
  const gradleApk = (read(GRADLE).match(/outputFileName\s*=\s*"梦语-([\d.]+)\.apk"/) || [])[1];
  checks.push(['mobile/android/app/build.gradle versionName', gradleName, cur]);
  checks.push(['mobile/android/app/build.gradle outputFileName', gradleApk, cur]);

  checks.push(['mobile/package.json', JSON.parse(read(MOBILE_PKG)).version, cur]);
  try{
    const lock = JSON.parse(read(MOBILE_LOCK));
    checks.push(['mobile/package-lock.json', lock.version, cur]);
    checks.push(['mobile/package-lock.json packages[""]', lock.packages && lock.packages[''] ? lock.packages[''].version : null, cur]);
  }catch(e){ problems.push('mobile/package-lock.json 解析失败：' + e.message); }

  ELECTRON_PKGS.forEach(function(p){
    if(!has(p)) return;
    try{ checks.push([path.relative(REPO, p) || p, JSON.parse(read(p)).version, cur]); }
    catch(e){ problems.push(p + ' 解析失败：' + e.message); }
  });

  checks.forEach(function(c){
    if(c[1] !== c[2]) problems.push(c[0] + ' = ' + c[1] + '，应为 ' + c[2]);
  });

  // CHANGELOG 头部必须是当前版本
  const head = (read(INDEX).match(/var CHANGELOG = \[[^\n]*\n\s*\{ v:'([\d.]+)'/) || [])[1];
  if(head !== cur) problems.push('CHANGELOG 头部是 v' + head + '，应为 v' + cur);

  console.log('[bump --check] 版本 ' + cur + '，versionCode ' + vc + '，六处一致性检查：' +
              (problems.length ? problems.length + ' 处不一致' : '全部一致'));
  problems.forEach(function(p){ console.error('  ✗ ' + p); });
  process.exit(problems.length ? 1 : 0);
}

/* ---------- 写入版本 ---------- */
const target = opt('version') || nextVersion(cur);
if(!/^\d+\.\d+\.\d+$/.test(target)) fail('--version 必须是 X.Y.Z：' + target);
if(target !== nextVersion(cur) && !flag('force')){
  fail('按「每次 +0.0.1、逢十进一」规则，' + cur + ' 的下一个版本是 ' + nextVersion(cur) +
       '，而不是 ' + target + '（确实要跳版本请加 --force）');
}

const title = opt('title');
if(!title) fail('缺少 --title "本次更新标题"');

const groups = [
  ['新增', optAll('add')],
  ['修复', optAll('fix')],
  ['优化', optAll('opt')]
];
if(!groups.some(function(g){ return g[1].length; })){
  fail('至少给一条 --add / --fix / --opt（CHANGELOG 统一按「新增 / 修复 / 优化」三类书写）');
}

const date = opt('date') || (function(){
  const d = new Date();
  const pad = function(n){ return (n < 10 ? '0' : '') + n; };
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
})();

/* 生成 CHANGELOG 条目源码（含 #新增 / #修复 / #优化 分类标记） */
const q = function(s){ return "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'"; };
const itemLines = [];
groups.forEach(function(g){
  if(!g[1].length) return;
  itemLines.push('#' + g[0]);
  g[1].forEach(function(t){ itemLines.push(t); });
});
const entry =
  "  { v:'" + target + "', date:'" + date + "', title:" + q(title) + ", items:[\n" +
  itemLines.map(function(t){ return '    ' + q(t) + ','; }).join('\n').replace(/,$/, '') + '\n' +
  '  ]},\n';

/* 1) index.html：APP_VERSION + CHANGELOG 头部 +（可选）BOARD_TUT_VERSION */
let html = read(INDEX);
if(html.indexOf("var CHANGELOG = [") < 0) fail('index.html 里找不到 CHANGELOG');
html = html.replace(/var APP_VERSION = '[\d.]+'/, "var APP_VERSION = '" + target + "'");
html = html.replace(/(var CHANGELOG = \[[^\n]*\n)/, '$1' + entry);
if(flag('tut')){
  const t = currentTut();
  if(t === null) fail('找不到 BOARD_TUT_VERSION');
  html = html.replace(/var BOARD_TUT_VERSION = \d+/, 'var BOARD_TUT_VERSION = ' + (t + 1));
}
write(INDEX, html);
console.log('[index.html]        APP_VERSION -> ' + target + (flag('tut') ? '，BOARD_TUT_VERSION -> ' + (currentTut() + 1) : ''));

/* 2) build.gradle：versionCode +1、versionName、outputFileName */
let gr = read(GRADLE);
const vc = gradleVersionCode();
gr = gr.replace(/versionCode\s+\d+/, 'versionCode ' + (vc + 1));
gr = gr.replace(/versionName\s+"[\d.]+"/, 'versionName "' + target + '"');
gr = gr.replace(/outputFileName\s*=\s*"梦语-[\d.]+\.apk"/, 'outputFileName = "梦语-' + target + '.apk"');
write(GRADLE, gr);
console.log('[build.gradle]      versionCode ' + vc + ' -> ' + (vc + 1) + '，versionName -> ' + target + '，APK 名 -> 梦语-' + target + '.apk');

/* 3) mobile/package.json 与 package-lock.json */
[MOBILE_PKG, MOBILE_LOCK].forEach(function(p){
  if(!has(p)) return;
  const j = JSON.parse(read(p));
  j.version = target;
  if(j.packages && j.packages['']) j.packages[''].version = target;
  write(p, JSON.stringify(j, null, 2) + '\n');
  console.log('[' + path.basename(p) + ']'.padEnd(20 - path.basename(p).length) + 'version -> ' + target);
});

/* 4) Electron package.json（交接包快照 + 常驻工具链，存在才改） */
ELECTRON_PKGS.forEach(function(p){
  if(!has(p)) return;
  const j = JSON.parse(read(p));
  j.version = target;
  write(p, JSON.stringify(j, null, 2) + '\n');
  console.log('[electron/package.json] version -> ' + target + '   (' + p + ')');
});

console.log('\nbump: ' + cur + ' -> ' + target + ' 完成。');
console.log('下一步：node tests/re-extract.js && node --check tests/check-latest.js && node tests/idcheck.js && node tests/test17.js && node tests/test18.js');
