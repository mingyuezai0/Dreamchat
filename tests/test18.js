/* test18.js — 梦语 v0.4.6 动态断言（jsdom：先 seed localStorage，再 eval 应用脚本） */
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const { HTML_PATH, ROOT, readParts } = require('./resolve-index');
const parts = readParts();
const html = parts.html;
const APP_SCRIPT = parts.script;

let pass = 0, fail = 0;
function T(name, cond){ if(cond){ pass++; } else { fail++; console.log('  ✗ FAIL: '+name); } }

let streamQueue = [], jsonQueue = [], fetchLog = [];
function makeReader(chunks){ let i = 0; return { getReader(){ return { read(){ if(i < chunks.length){ return Promise.resolve({ value:Buffer.from(chunks[i++],'utf8'), done:false }); } return Promise.resolve({ value:undefined, done:true }); } }; } }; }

function settingsJson(){ return JSON.stringify({ apiKey:'test-key', model:'deepseek-v4-flash', thinking:false, theme:'default', apiBase:'https://api.deepseek.com/v1' }); }
function seedConv(extraChars, keywords){
  const now = Date.now();
  const chars = [{ id:11, name:'小智', avatar:{mode:'svg', value:''}, persona:'你是「小智」，一位好奇心旺盛的科学家。', present:true, memory:'', keywords:(keywords || [{ id:1, key:'杀父之仇', detail:'父亲被杀，誓要手刃仇人' }]), role:'minor', lastMemAt:0 }];
  if(extraChars) chars.push.apply(chars, extraChars);
  return { id:1001, mode:'chat', name:'测试群', chars:chars, history:[], selectedNext:[], randomOrder:false, world:'', player:'', apiKey:'', avatar:null, autoMemory:true,
    summary:'', summaryTs:0, autoSummary:0, maxReplyLen:0, relations:[], relationsTs:0, relationsAt:0,
    calDate:'2026-09-10', calAt:0, ctxLen:0, createdAt:now, lastActiveAt:now };
}

function boot(setupFn){
  streamQueue = []; jsonQueue = []; fetchLog = [];
  const dom = new JSDOM(html, {
    url:'https://localhost/',
    runScripts:'outside-only',
    pretendToBeVisual:true,
    beforeParse:function(w){
      w.fetch = function(url, opts){
        let body = {};
        try{ body = opts && opts.body ? JSON.parse(opts.body) : {}; }catch(e){}
        fetchLog.push({ url:String(url), body:body });
        if(body.stream){
          const chunks = streamQueue.length ? streamQueue.shift() : ['data: [DONE]\n\n'];
          return Promise.resolve({ ok:true, status:200, body:makeReader(chunks) });
        }
        const resp = jsonQueue.length ? jsonQueue.shift() : { choices:[{ message:{ content:'{}' } }] };
        return Promise.resolve({ ok:true, status:200, json:function(){ return Promise.resolve(resp); } });
      };
      w.IntersectionObserver = class { constructor(){} observe(){} unobserve(){} disconnect(){} };
      w.matchMedia = function(){ return { matches:false, addEventListener:function(){}, removeEventListener:function(){}, addListener:function(){}, removeListener:function(){} }; };
      w.URL.createObjectURL = function(){ return 'blob:mock'; };
      w.URL.revokeObjectURL = function(){};
      w.TextEncoder = TextEncoder;
      w.TextDecoder = TextDecoder;
    }
  });
  const w = dom.window;
  setupFn(w);
  w.eval(APP_SCRIPT);   // 应用脚本在 seed 之后运行
  return dom;
}
async function tick(n){ for(let i=0;i<(n||15);i++){ await new Promise(function(r){ setTimeout(r,0); }); } }
function $(d, s){ return d.querySelector(s); }
function getConv(w){ try{ return JSON.parse(w.localStorage.getItem('ds_convs'))[0]; }catch(e){ return null; } }
function allConvs(w){ try{ return JSON.parse(w.localStorage.getItem('ds_convs')) || []; }catch(e){ return []; } }
function realChars(cv){ return ((cv && cv.chars) || []).filter(function(c){ return !c.isTrans; }); }
function firstReal(cv){ return realChars(cv)[0]; }
function hasTrans(cv){ return ((cv && cv.chars) || []).some(function(c){ return !!c.isTrans; }); }
function getCards(w){ try{ return JSON.parse(w.localStorage.getItem('ds_cards')||'[]'); }catch(e){ return []; } }
function getWorlds(w){ try{ return JSON.parse(w.localStorage.getItem('ds_worlds')||'[]'); }catch(e){ return []; } }

/* ================= T1 Req1 编辑框保持原文大小 ================= */
async function t1(){
  const dom = boot(function(w){
    w.localStorage.setItem('ds_settings', settingsJson());
    const cv = seedConv();
    const now = Date.now();
    cv.history = [
      { id:101, speakerId:'user', speaker:'我', role:'user', text:'你好', time:now, status:'done' },
      { id:102, speakerId:11, speaker:'小智', role:'assistant', text:'你好呀！\n今天想聊点什么？', time:now, status:'done' }
    ];
    w.localStorage.setItem('ds_convs', JSON.stringify([cv]));
  });
  const w = dom.window, d = w.document;
  $(d, '.conv-item').click();
  const msg = $(d, '.msg[data-id="102"]');
  T('T1 消息 102 渲染', !!msg);
  if(!msg){ return; }
  const textEl = msg.querySelector('.text');
  Object.defineProperty(textEl, 'offsetHeight', { get:function(){ return 96; }, configurable:true });
  msg.querySelector('.msg-actions [data-act="edit"]').click();
  const ta = msg.querySelector('.edit-box');
  T('T1 编辑框出现', !!ta);
  T('T1 编辑框 minHeight = 原文高度', !!ta && ta.style.minHeight === '96px');
  T('T1 编辑框 value 为原文', !!ta && ta.value === '你好呀！\n今天想聊点什么？');
}

/* ================= T2 Req2 桌面操作栏紧凑 ================= */
async function t2(){
  const dom = boot(function(w){
    w.localStorage.setItem('ds_settings', settingsJson());
    const cv = seedConv();
    const now = Date.now();
    cv.history = [
      { id:101, speakerId:'user', speaker:'我', role:'user', text:'你好', time:now, status:'done' },
      { id:102, speakerId:11, speaker:'小智', role:'assistant', text:'你好呀', time:now, status:'done' }
    ];
    w.localStorage.setItem('ds_convs', JSON.stringify([cv]));
  });
  const w = dom.window, d = w.document;
  $(d, '.conv-item').click();
  const actions = $(d, '.msg[data-id="102"] .msg-actions');
  T('T2 操作栏无 space-between', !!actions && w.getComputedStyle(actions).justifyContent !== 'space-between');
  const count = $(d, '.msg[data-id="102"] .msg-actions .msg-count');
  T('T2 字数角标存在', !!count);
  T('T2 字数角标 margin-left:auto', !!count && w.getComputedStyle(count).marginLeft === 'auto');
  T('T2 字数 = 消息字数', !!count && count.textContent === '3字');
}

/* ================= T3 Req5 酒馆四能力 ================= */
async function t3(){
  const dom = boot(function(w){
    w.localStorage.setItem('ds_settings', settingsJson());
    w.localStorage.setItem('ds_convs', JSON.stringify([seedConv()]));
    w.localStorage.setItem('ds_cards', '[]');
    w.localStorage.setItem('ds_worlds', '[]');
  });
  const w = dom.window, d = w.document;
  $(d, '#btnTavern').click();
  T('T3 酒馆面板打开', !$(d, '#tavernView').classList.contains('hidden'));
  T('T3 无库存时配套生成按钮禁用', $(d, '#btnDeriveWorld').disabled && $(d, '#btnDeriveCard').disabled);
  T('T3 无库存时下拉占位', $(d, '#tavernCardPick').value === '' && $(d, '#tavernWorldPick').value === '');

  // --- 只生成角色卡（经结识弹窗）---
  $(d, '#btnMeetCard').click();
  T('T3 结识角色卡先弹填写弹窗', !$(d, '#meetCardModal').classList.contains('hidden'));
  $(d, '#mcName').value = '小雅';
  $(d, '#mcGender').value = '女';
  $(d, '#mcPersona').value = '温柔而坚韧的剑客';
  jsonQueue.push({ choices:[{ message:{ content: JSON.stringify({
    char:{ name:'路人甲', persona:'温柔而坚韧的剑客', keywords:[{ key:'杀父之仇', detail:'父亲被杀，誓要手刃仇人' }] }
  }) } }] });
  $(d, '#meetCardGo').click();
  await tick();
  let cards = getCards(w), worlds = getWorlds(w);
  T('T3 生成角色卡入库存', cards.length === 1 && cards[0].name === '小雅' && cards[0].persona.indexOf('剑客') >= 0);
  T('T3 弹窗填写的姓名沿用（覆盖 AI 起的名字）', cards[0].name === '小雅');
  T('T3 角色卡带关键词', cards[0].keywords.length === 1 && cards[0].keywords[0].key === '杀父之仇');
  T('T3 只生成角色卡不生成世界书', worlds.length === 0);
  T('T3 结识调用 AI', fetchLog.some(function(f){ var m = f.body.messages; return m && String(m[0].content).indexOf('酒馆老板') >= 0; }));
  T('T3 提示词注入客人构想（姓名/性别/人设）', fetchLog.some(function(f){ var m = f.body.messages; return m && String(m[1].content).indexOf('客人想结识这样一位角色') >= 0 && String(m[1].content).indexOf('姓名「小雅」') >= 0 && String(m[1].content).indexOf('性别「女」') >= 0 && String(m[1].content).indexOf('大致人设「温柔而坚韧的剑客」') >= 0; }));
  T('T3 结果展示角色卡', !$(d, '#tavernResult').classList.contains('hidden') && $(d, '#tavernResult').textContent.indexOf('小雅') >= 0);
  T('T3 生成后配套世界书按钮解锁', !$(d, '#btnDeriveWorld').disabled);

  // --- 只生成世界书（经结识弹窗）---
  $(d, '#btnMeetWorld').click();
  T('T3 结识世界书先弹填写弹窗', !$(d, '#meetWorldModal').classList.contains('hidden'));
  $(d, '#mwName').value = '星海城';
  $(d, '#mwType').value = '奇幻';
  $(d, '#mwDesc').value = '漂浮在云海之上的城市，以机关术闻名。';
  jsonQueue.push({ choices:[{ message:{ content: JSON.stringify({
    world:{ name:'某某世界', world:'漂浮在云海之上的城市，以机关术闻名。', keywords:[{ key:'云海', detail:'城市漂浮于云海' }] }
  }) } }] });
  $(d, '#meetWorldGo').click();
  await tick();
  cards = getCards(w); worlds = getWorlds(w);
  T('T3 生成世界书入库存', worlds.length === 1 && worlds[0].name === '星海城');
  T('T3 弹窗填写世界名沿用', worlds[0].name === '星海城');
  T('T3 世界书带关键词', worlds[0].keywords.length === 1 && worlds[0].keywords[0].key === '云海');
  T('T3 只生成世界书不再生成卡', cards.length === 1);
  T('T3 配套角色卡按钮解锁', !$(d, '#btnDeriveCard').disabled);

  // --- 已有角色卡 → 生成配套世界书 ---
  $(d, '#tavernCardPick').value = String(cards[0].id);
  jsonQueue.push({ choices:[{ message:{ content: JSON.stringify({
    world:{ name:'小雅的世界', world:'剑客纵横的江湖。', keywords:[] }
  }) } }] });
  $(d, '#btnDeriveWorld').click();
  await tick();
  worlds = getWorlds(w);
  T('T3 从角色卡生成配套世界书', worlds.length === 2 && worlds[1].name === '小雅的世界');
  T('T3 配套生成提示词注入角色卡', fetchLog.some(function(f){ var m = f.body.messages; return m && JSON.stringify(m).indexOf('参考的已有角色卡') >= 0; }));

  // --- 已有世界书 → 生成配套角色卡 ---
  $(d, '#tavernWorldPick').value = String(getWorlds(w)[0].id);
  jsonQueue.push({ choices:[{ message:{ content: JSON.stringify({
    char:{ name:'剑无名', persona:'沉默寡言的剑客', keywords:[{ key:'剑', detail:'以剑为生' }] }
  }) } }] });
  $(d, '#btnDeriveCard').click();
  await tick();
  cards = getCards(w);
  T('T3 从世界书生成配套角色卡', cards.length === 2 && cards[1].name === '剑无名');
  T('T3 配套生成提示词注入世界书', fetchLog.some(function(f){ var m = f.body.messages; return m && JSON.stringify(m).indexOf('参考的已有世界书') >= 0; }));
}

/* ================= T4 Req4 关键词详情随剧情更新 ================= */
async function t4(){
  const dom = boot(function(w){
    w.localStorage.setItem('ds_settings', settingsJson());
    const cv = seedConv();
    const now = Date.now();
    cv.selectedNext = [11];   // 群聊要有人被选中 / 被 @ 才会调 API
    cv.history = [];
    for(var i=0;i<8;i++){ cv.history.push({ id:200+i, speakerId:'user', speaker:'我', role:'user', text:'第'+(i+1)+'条消息', time:now, status:'done' }); }
    w.localStorage.setItem('ds_convs', JSON.stringify([cv]));
  });
  const w = dom.window, d = w.document;
  $(d, '.conv-item').click();
  streamQueue.push(['data: {"choices":[{"delta":{"content":"好的"}}]}\n\ndata: [DONE]\n\n']);
  jsonQueue.push({ choices:[{ message:{ content:'小智和主角一起踏上了复仇之路，最终手刃仇人。\n【关键词更新】\n杀父之仇：已复仇，放下了心结\n【世界观更新】\n复仇之后，世道骤变，宗门林立。' } }] });
  const input = $(d, '#input');
  input.value = '小智，我们出发吧';
  $(d, '#btnSend').click();
  await tick();
  const ch = firstReal(getConv(w));
  T('T4 角色记忆已更新', ch.memory.indexOf('复仇') >= 0);
  T('T4 记忆不含标记块', ch.memory.indexOf('【关键词更新】') === -1);
  T('T4 关键词详情已更新', ch.keywords[0].detail === '已复仇，放下了心结');
  T('T4 关键词 key 保持不变', ch.keywords[0].key === '杀父之仇');
  T('T4 世界观已随剧情更新', getConv(w).world === '复仇之后，世道骤变，宗门林立。');
}

/* ================= T5 Req3 关系图剧情推进自动重析 ================= */
async function t5(){
  const dom = boot(function(w){
    w.localStorage.setItem('ds_settings', settingsJson());
    const cv = seedConv([{ id:12, name:'阿豪', avatar:{mode:'svg', value:''}, persona:'幽默开朗的运动达人。', present:true, memory:'', keywords:[], role:'minor', lastMemAt:0 }]);
    const now = Date.now();
    cv.history = [];
    for(var i=0;i<35;i++){ cv.history.push({ id:400+i, speakerId:(i%2===0 ? 'user' : (i%4===1 ? 11 : 12)), speaker:(i%2===0 ? '我' : (i%4===1 ? '小智' : '阿豪')), role:(i%2===0 ? 'user' : 'assistant'), text:'消息'+i, time:now, status:'done' }); }
    cv.relations = [{ a:'我', b:'小智', rel:'朋友' }];
    cv.relationsAt = 0;
    w.localStorage.setItem('ds_convs', JSON.stringify([cv]));
  });
  const w = dom.window, d = w.document;
  $(d, '.conv-item').click();
  jsonQueue.push({ choices:[{ message:{ content:'[{"a":"我","b":"小智","rel":"好友"},{"a":"小智","b":"阿豪","rel":"兄弟"}]' } }] });
  $(d, '#btnMore').click();
  $(d, '.fab-item[data-act="rel"]').click();
  await tick();
  T('T5 关系图自动重新分析', fetchLog.some(function(f){ var m = f.body.messages; return m && String(m[0].content).indexOf('关系分析助手') >= 0; }));
  const cv = getConv(w);
  T('T5 关系更新为 AI 输出', cv.relations.length === 2 && cv.relations.some(function(e){ return e.rel === '好友'; }) && cv.relations.some(function(e){ return e.rel === '兄弟'; }));
  T('T5 relationsAt 已刷新', cv.relationsAt === 35);
}

/* ================= T6 回归：版本 / 顶部 / 更新日志 / 教程 ================= */
async function t6(){
  const dom = boot(function(w){
    w.localStorage.setItem('ds_settings', settingsJson());
    const cv = seedConv();
    const now = Date.now();
    cv.history = [
      { id:101, speakerId:'user', speaker:'我', role:'user', text:'你好', time:now, status:'done' },
      { id:102, speakerId:11, speaker:'小智', role:'assistant', text:'你好呀', time:now, status:'done' }
    ];
    w.localStorage.setItem('ds_convs', JSON.stringify([cv]));
  });
  const w = dom.window, d = w.document;
  const APPVER = (APP_SCRIPT.match(/var APP_VERSION = '([\d.]+)'/) || [])[1];
  T('T6 关于面板版本 = APP_VERSION', $(d, '#aboutVer').textContent === 'v' + APPVER);
  $(d, '.conv-item').click();
  T('T6 顶部只显示成员数', $(d, '#headerSub').textContent === '成员 1');
  T('T6 顶部无「在场」', $(d, '#headerSub').textContent.indexOf('在场') === -1);
  $(d, '#btnAbout').click();
  const rows = d.querySelectorAll('#clList .cl-row');
  T('T6 更新日志第一行 = 当前版本', rows.length > 0 && rows[0].textContent.indexOf(APPVER) >= 0);
  T('T6 更新日志第二行 v0.4.8', rows.length > 1 && rows[1].textContent.indexOf('0.4.8') >= 0);
  T('T6 更新日志第三行 v0.4.7', rows.length > 2 && rows[2].textContent.indexOf('0.4.7') >= 0);
  T('T6 更新日志第四行 v0.4.6', rows.length > 3 && rows[3].textContent.indexOf('0.4.6') >= 0);
  rows[0].click();   // 打开最新一版详情：新增 / 修复 / 优化 三个分类小标题
  const cats = d.querySelectorAll('#logDetail .cl-cat');
  T('T6 更新日志按新增 / 修复 / 优化分组', cats.length === 3 && cats[0].textContent === '新增' && cats[1].textContent === '修复' && cats[2].textContent === '优化');
  T('T6 分类小标题不显示 # 号', d.querySelector('#logDetail').textContent.indexOf('#新增') === -1);
  $(d, '#btnBackLog').click();
  $(d, '#btnBoard').click();
  const tuts = d.querySelectorAll('#boardGrid .board-note textarea');
  T('T6 黑板教程含酒馆结识', [].some.call(tuts, function(ta){ return ta.value.indexOf('酒馆') >= 0 && ta.value.indexOf('结识') >= 0; }));
  T('T6 黑板教程含导入确认弹窗 + AI 整理', [].some.call(tuts, function(ta){ return ta.value.indexOf('梦语 json 或酒馆 png') >= 0 && ta.value.indexOf('自动判断是否符合本软件格式') >= 0; }));
  T('T6 黑板教程含字数范围/强制字数', [].some.call(tuts, function(ta){ return ta.value.indexOf('字数范围') >= 0 && ta.value.indexOf('强制字数') >= 0; }));
  T('T6 黑板教程含记忆合理知晓', [].some.call(tuts, function(ta){ return ta.value.indexOf('没在场、不知情的情节不会被写进记忆') >= 0; }));
  T('T6 黑板教程含剧情时间线（仅作者可见）', [].some.call(tuts, function(ta){ return ta.value.indexOf('剧情时间线') >= 0 && ta.value.indexOf('只给作者') >= 0; }));
  T('T6 黑板教程含新建攻略/新建模拟占位', [].some.call(tuts, function(ta){ return ta.value.indexOf('新建攻略') >= 0 && ta.value.indexOf('新建模拟') >= 0; }));
  T('T6 黑板教程含关键词自主成长', [].some.call(tuts, function(ta){ return ta.value.indexOf('自主新增「关键词」') >= 0 || ta.value.indexOf('自主给「关键词」成长') >= 0 || ta.value.indexOf('自主成长「关键词」') >= 0; }));
  T('T6 黑板教程含垃圾桶恢复', [].some.call(tuts, function(ta){ return ta.value.indexOf('垃圾桶') >= 0 && ta.value.indexOf('恢复') >= 0 && ta.value.indexOf('30 个') >= 0; }));
  T('T6 黑板教程含导出选格式', [].some.call(tuts, function(ta){ return ta.value.indexOf('导出') >= 0 && ta.value.indexOf('梦语 json') >= 0; }));
  T('T6 黑板教程含头像裁剪', [].some.call(tuts, function(ta){ return ta.value.indexOf('裁剪') >= 0 && ta.value.indexOf('查看原图') >= 0; }));
  T('T6 黑板教程含关于链接确认', [].some.call(tuts, function(ta){ return ta.value.indexOf('先弹窗确认') >= 0; }));
  T('T6 黑板教程含对话温度与思考等级', [].some.call(tuts, function(ta){ return ta.value.indexOf('对话温度') >= 0 && ta.value.indexOf('思考等级') >= 0 && ta.value.indexOf('Medium / High / Max') >= 0; }));
  T('T6 黑板教程含续写生成温度', [].some.call(tuts, function(ta){ return ta.value.indexOf('生成温度') >= 0 && ta.value.indexOf('默认 0.7') >= 0; }));
  T('T6 黑板教程含收集世界书', [].some.call(tuts, function(ta){ return ta.value.indexOf('收集世界书') >= 0; }));
  T('T6 黑板教程故事头像措辞为书本图标', [].some.call(tuts, function(ta){ return ta.value.indexOf('（书本图标）') >= 0; }));
}

/* ================= T7 Req5 世界书导入弹窗 + 提取/模仿弹窗 ================= */
async function t7(){
  const dom = boot(function(w){
    w.localStorage.setItem('ds_settings', settingsJson());
    w.localStorage.setItem('ds_convs', JSON.stringify([seedConv()]));
    w.localStorage.setItem('ds_worlds', '[]');
  });
  const w = dom.window, d = w.document;
  $(d, '#btnWorlds').click();
  T('T7 世界书页打开', !$(d, '#worldView').classList.contains('hidden'));
  T('T7 第二行按钮存在', !!$(d, '#btnExtractWorld') && !!$(d, '#btnMimicWorld'));
  $(d, '#btnImportWorld').click();
  T('T7 导入弹窗打开', !$(d, '#worldImportModal').classList.contains('hidden'));
  T('T7 导入两个选项', !!$(d, '#btnWorldImportText') && !!$(d, '#btnWorldImportJson'));
  $(d, '#btnWorldImportJson').click();
  T('T7 选 json 后弹窗关闭', $(d, '#worldImportModal').classList.contains('hidden'));
  $(d, '#btnExtractWorld').click();
  T('T7 提取弹窗打开', !$(d, '#worldAiModal').classList.contains('hidden'));
  T('T7 提取标题正确', $(d, '#worldAiTitle').textContent === '提取世界书');
  T('T7 提取无模仿要求框', $(d, '#worldAiReqBox').classList.contains('hidden'));
  $(d, '#btnWorldAiGo').click();
  await tick();
  const toastTxt = $(d, '#toast .toast-txt');
  T('T7 未选文件点开始有提示', !!toastTxt && toastTxt.textContent.indexOf('选择') >= 0);
  $(d, '#btnWorldAiCancel').click();
  T('T7 提取弹窗关闭', $(d, '#worldAiModal').classList.contains('hidden'));
  $(d, '#btnMimicWorld').click();
  T('T7 模仿弹窗打开', !$(d, '#worldAiModal').classList.contains('hidden'));
  T('T7 模仿标题正确', $(d, '#worldAiTitle').textContent === '模仿世界书');
  T('T7 模仿显示要求框', !$(d, '#worldAiReqBox').classList.contains('hidden'));
}

/* ================= T8 Req 续写剧情（主页「＋」→ 选模式 → 新建会话） ================= */
const CONT_JSON = {
  members:[
    { name:'萧尘', role:'main', persona:'家族被灭的少年天才，背负血仇，性格坚韧。', memory:'灭门之夜抱着父亲的断剑逃出，被苏沐救下。', keywords:[{ key:'血仇', detail:'家族被灭，誓要查明真相' }] },
    { name:'苏沐', role:'minor', persona:'玄医谷外门弟子，温柔而坚定，医术高超。', memory:'在灭门之夜救下重伤的萧尘，与他结伴同行。', keywords:[{ key:'救人', detail:'救下重伤的萧尘' }] }
  ],
  world:{ world:'玄天大陆，宗门林立，医修与剑修并立，修炼决定地位。', keywords:[{ key:'玄天', detail:'萧尘与苏沐所在的大陆' }] },
  player:'你叫林渊，是穿越而来、知道这个世界走向的旅人。',
  summary:'灭门之夜的复仇之路：萧尘被苏沐所救，二人结伴追查家族被灭的真相，林渊穿越而来知晓走向。',
  timeline:'灭门之夜萧尘逃走\n苏沐救下萧尘\n二人结伴踏上复仇之路'
};
const CONT_TEXT = '玄天大陆，灭门之夜。少年萧尘抱着父亲的断剑逃出生天，被医师苏沐救下。苏沐是玄医谷外门弟子，温柔而坚定。两人结伴踏上复仇之路，誓要查明家族被灭的真相。你叫林渊，是穿越而来、知道这个世界走向的旅人。';
function putContFile(d, w, text){
  const file = new w.File([text], 'story.txt', { type:'text/plain' });
  Object.defineProperty($(d, '#contFileInput'), 'files', { value:[file], configurable:true });
  $(d, '#contFileInput').dispatchEvent(new w.Event('change'));
}
async function t8(){
  const dom = boot(function(w){
    w.localStorage.setItem('ds_settings', settingsJson());
    w.localStorage.setItem('ds_convs', JSON.stringify([seedConv()]));
    w.localStorage.setItem('ds_worlds', '[]');
  });
  const w = dom.window, d = w.document;

  // ---- 入口：主页「＋」→ 续写剧情 ----
  $(d, '#btnNewConv').click();
  T('T8 主页「＋」菜单里有续写剧情', !!d.querySelector('#newConvMenu [data-act="continue"]'));
  d.querySelector('#newConvMenu [data-act="continue"]').click();
  T('T8 续写剧情弹窗打开', !$(d, '#contModal').classList.contains('hidden'));
  T('T8 弹窗里有三种模式可选', d.querySelectorAll('input[name="contMode"]').length === 3);
  T('T8 默认选群聊', d.querySelector('input[name="contMode"]:checked').value === 'chat');
  T('T8 三个精炼度输入默认值', $(d, '#contCharLen').value === '200' && $(d, '#contWorldLen').value === '300' && $(d, '#contPlayerLen').value === '150');
  T('T8 总结精炼度默认 200', $(d, '#contSummaryLen').value === '200');
  T('T8 人称单选默认第一人称', d.querySelector('input[name="contPer"]:checked').value === 'first');

  $(d, '#btnContGo').click();
  await tick();
  T('T8 未选文件点开始有提示', $(d, '#toast .toast-txt').textContent.indexOf('选择') >= 0);

  putContFile(d, w, CONT_TEXT);
  await tick();
  T('T8 文件名与字数已显示', $(d, '#contFile').textContent.indexOf('story.txt') >= 0);

  const before = allConvs(w).length;
  jsonQueue.push({ choices:[{ message:{ content: JSON.stringify(CONT_JSON) } }] });
  $(d, '#btnContGo').click();
  await tick(30);

  const all = allConvs(w);
  T('T8 新建了一个会话（不是在原来的会话上改）', all.length === before + 1);
  const cv = all[all.length - 1];
  T('T8 新会话是群聊', cv.mode === 'chat');
  T('T8 新会话成员 2 位 + 转场角色', realChars(cv).length === 2 && hasTrans(cv));
  T('T8 成员角色分级生效', firstReal(cv).name === '萧尘' && firstReal(cv).role === 'main' && realChars(cv)[1].role === 'minor');
  T('T8 成员人设/记忆/关键词写入', firstReal(cv).persona.indexOf('血仇') >= 0 && firstReal(cv).memory.indexOf('灭门') >= 0 && firstReal(cv).keywords[0].key === '血仇');
  T('T8 世界观与关键词写入', cv.world.indexOf('玄天大陆') >= 0 && cv.worldKeywords.length === 1 && cv.worldKeywords[0].key === '玄天');
  T('T8 玩家设定写入', cv.player.indexOf('林渊') >= 0);
  T('T8 剧情总结写入 cv.summary', cv.summary.indexOf('灭门之夜') >= 0 && cv.summary.indexOf('复仇之路') >= 0);
  T('T8 剧情时间线写入 cv.worldMem', cv.worldMem.indexOf('灭门之夜萧尘逃走') >= 0 && cv.worldMem.indexOf('二人结伴踏上复仇之路') >= 0);
  T('T8 时间线按原文顺序保留（不重排）', cv.worldMem.split('\n')[0] === '灭门之夜萧尘逃走' && cv.worldMem.split('\n')[2] === '二人结伴踏上复仇之路');
  T('T8 时间线节流计数归零', cv.worldMemAt === 0);
  T('T8 旧成员 id 不再残留', firstReal(cv).id !== 11);
  T('T8 生成完弹窗自动关闭', $(d, '#contModal').classList.contains('hidden'));
  T('T8 成功后 toast', $(d, '#toast .toast-txt').textContent.indexOf('续写剧情生成成功') >= 0);

  const contCall = fetchLog.filter(function(f){ var m = f.body.messages; return m && String(m[0].content).indexOf('续写剧情助手') >= 0; });
  T('T8 续写调用 AI 且带精炼度', contCall.length === 1 && JSON.stringify(contCall[0].body.messages).indexOf('至少 200 字') >= 0);
  T('T8 续写提示词含第一人称视角', JSON.stringify(contCall[0].body.messages).indexOf('第一人称') >= 0 && JSON.stringify(contCall[0].body.messages).indexOf('主角由玩家扮演') >= 0);
  T('T8 续写提示词含时间线规格（6-20 条·旁观者视角）', JSON.stringify(contCall[0].body.messages).indexOf('5. 剧情时间线') >= 0 && JSON.stringify(contCall[0].body.messages).indexOf('6-20 条') >= 0);
  T('T8 续写提示词要求记忆按时间顺序且只记亲身经历', JSON.stringify(contCall[0].body.messages).indexOf('越早发生的写在越前面') >= 0 && JSON.stringify(contCall[0].body.messages).indexOf('并不知情的事不要写进 TA 的记忆') >= 0);

  // ---- 私聊模式：只留主角一位（没有「转场」） ----
  $(d, '#btnNewConv').click();
  d.querySelector('#newConvMenu [data-act="continue"]').click();
  const dmRadio = d.querySelector('input[name="contMode"][value="dm"]');
  dmRadio.checked = true;
  putContFile(d, w, CONT_TEXT);
  await tick();
  jsonQueue.push({ choices:[{ message:{ content: JSON.stringify(CONT_JSON) } }] });
  $(d, '#btnContGo').click();
  await tick(30);
  const all2 = allConvs(w);
  const dmCv = all2[all2.length - 1];
  T('T8 私聊模式新建的是私聊', dmCv.mode === 'dm');
  T('T8 私聊只取主角一位', dmCv.chars.length === 1 && dmCv.chars[0].name === '萧尘' && !dmCv.chars[0].isTrans);
  T('T8 私聊没有「转场」角色', !hasTrans(dmCv));

  // 提取/模仿精炼度（世界书面板）
  $(d, '#btnWorlds').click();
  $(d, '#btnExtractWorld').click();
  T('T8 提取弹窗内精炼度输入存在', !!$(d, '#worldAiLen') && $(d, '#worldAiLen').value === '200');
  $(d, '#btnWorldAiCancel').click();
}

/* ================= T9 续写剧情第三人称 + 角色卡提取/模仿 ================= */
async function t9(){
  const dom = boot(function(w){
    w.localStorage.setItem('ds_settings', settingsJson());
    w.localStorage.setItem('ds_convs', JSON.stringify([seedConv()]));
    w.localStorage.setItem('ds_cards', '[]');
  });
  const w = dom.window, d = w.document;

  // --- 第三人称续写（主页「＋」→ 续写剧情） ---
  $(d, '#btnNewConv').click();
  d.querySelector('#newConvMenu [data-act="continue"]').click();
  const third = d.querySelector('input[name="contPer"][value="third"]');
  T('T9 第三人称单选可切换', !!third && !third.checked);
  third.checked = true;
  const file = new w.File(['天启大陆，主角叶秋本是城西杂役，因一枚神秘玉佩觉醒血脉，踏上修仙之路。叶秋为人正直，重情重义。'], 'story2.txt', { type:'text/plain' });
  Object.defineProperty($(d, '#contFileInput'), 'files', { value:[file], configurable:true });
  $(d, '#contFileInput').dispatchEvent(new w.Event('change'));
  await tick();
  jsonQueue.push({ choices:[{ message:{ content: JSON.stringify({
    members:[
      { name:'叶秋', role:'main', persona:'因玉佩觉醒血脉的杂役少年，正直重情，踏上修仙之路。', memory:'本是城西杂役，获神秘玉佩后觉醒血脉。', keywords:[{ key:'玉佩', detail:'觉醒血脉的神秘物件' }] },
      { name:'师尊', role:'minor', persona:'云霞宗长老，严厉而护短。', memory:'收下叶秋为徒，指导他修炼。', keywords:[{ key:'收徒', detail:'收叶秋为亲传弟子' }] }
    ],
    world:{ world:'天启大陆，修仙世界，宗门林立。', keywords:[{ key:'修仙', detail:'天启大陆的力量体系' }] },
    player:'',
    summary:'叶秋从杂役因玉佩觉醒血脉，拜入云霞宗成为亲传弟子，逐步踏上修仙之路。'
  }) } }] });
  $(d, '#btnContGo').click();
  await tick();
  const cv3 = allConvs(w).pop();
  T('T9 第三人称主角作为 AI 成员生成', cv3.chars.some(function(c){ return c.name === '叶秋'; }));
  T('T9 第三人称玩家设定留空', cv3.player === '');
  T('T9 第三人称总结仍写入', cv3.summary.indexOf('叶秋') >= 0 && cv3.summary.indexOf('修仙') >= 0);
  T('T9 第三人称提示词注入', fetchLog.some(function(f){ var m = f.body.messages; return m && JSON.stringify(m).indexOf('主角作为 AI 成员生成') >= 0; }));

  // --- 角色卡提取：无该角色 ---
  $(d, '#btnCards').click();
  T('T9 角色卡页打开', !$(d, '#cardView').classList.contains('hidden'));
  $(d, '#btnExtractCard').click();
  T('T9 提取弹窗打开', !$(d, '#cardAiModal').classList.contains('hidden'));
  T('T9 提取标题正确', $(d, '#cardAiTitle').textContent === '提取角色');
  T('T9 角色名/精炼度输入存在', !!$(d, '#cardAiName') && $(d, '#cardAiLen').value === '200');
  const file2 = new w.File(['凤鸣山上，李青云一剑斩落千军，成为天下第一剑客。'], 'novel.txt', { type:'text/plain' });
  Object.defineProperty($(d, '#cardAiFileInput'), 'files', { value:[file2], configurable:true });
  $(d, '#cardAiFileInput').dispatchEvent(new w.Event('change'));
  await tick();
  T('T9 文件名已显示', $(d, '#cardAiFile').textContent.indexOf('novel.txt') >= 0);
  $(d, '#cardAiName').value = '张三丰';
  jsonQueue.push({ choices:[{ message:{ content:'{"found":false}' } }] });
  $(d, '#btnCardAiGo').click();
  await tick();
  const toast1 = $(d, '#toast .toast-txt');
  T('T9 无该角色提示', !!toast1 && toast1.textContent.indexOf('该文本没有该角色') >= 0);
  T('T9 未入库任何角色卡', getCards(w).length === 0);

  // --- 角色卡提取：有该角色 ---
  $(d, '#cardAiName').value = '李青云';
  jsonQueue.push({ choices:[{ message:{ content: JSON.stringify({
    found:true, name:'李青云', persona:'凤鸣山剑客，一剑斩落千军，天下第一剑。', keywords:[{ key:'剑道', detail:'天下第一剑客' }]
  }) } }] });
  $(d, '#btnCardAiGo').click();
  await tick();
  const cards = getCards(w);
  T('T9 提取角色卡入库', cards.length === 1 && cards[0].name === '李青云');
  T('T9 角色卡含人设', cards[0].persona.indexOf('天下第一剑') >= 0);
  T('T9 角色卡含关键词', cards[0].keywords.length === 1 && cards[0].keywords[0].key === '剑道');
  T('T9 提取成功 toast', $(d, '#toast .toast-txt').textContent.indexOf('提取成功') >= 0);
  T('T9 提取弹窗关闭', $(d, '#cardAiModal').classList.contains('hidden'));
  T('T9 卡片渲染到网格', $(d, '#cardGrid').textContent.indexOf('李青云') >= 0);

  // --- 模仿 ---
  $(d, '#btnMimicCard').click();
  T('T9 模仿标题正确', $(d, '#cardAiTitle').textContent === '模仿角色');
  const file3 = new w.File(['凤鸣山上，李青云一剑斩落千军，成为天下第一剑客。'], 'novel.txt', { type:'text/plain' });
  Object.defineProperty($(d, '#cardAiFileInput'), 'files', { value:[file3], configurable:true });
  $(d, '#cardAiFileInput').dispatchEvent(new w.Event('change'));
  await tick();
  $(d, '#cardAiName').value = '李青云';
  jsonQueue.push({ choices:[{ message:{ content: JSON.stringify({
    found:true, name:'楚惊鸿', persona:'名门剑客，剑意惊鸿，潇洒不羁。', keywords:[{ key:'剑意', detail:'剑出惊鸿' }]
  }) } }] });
  $(d, '#btnCardAiGo').click();
  await tick();
  const cards2 = getCards(w);
  T('T9 模仿原创角色卡入库', cards2.length === 2 && cards2[1].name === '楚惊鸿');
  T('T9 模仿卡关键词', cards2[1].keywords[0].key === '剑意');
}

/* ================= T10 v0.3.8 私聊模式 + 下轮对话展开 + 私聊设置智能体 ================= */
async function t10(){
  const dom = boot(function(w){
    w.localStorage.setItem('ds_settings', settingsJson());
    // 不 seed ds_convs → 新用户自带默认群聊
  });
  const w = dom.window, d = w.document;
  const convs0 = JSON.parse(w.localStorage.getItem('ds_convs'));
  T('T10 新用户自带默认群聊', Array.isArray(convs0) && convs0.length >= 1 && convs0[0].mode === 'chat');

  // --- 主页＋菜单改名 ---
  $(d, '#btnNewConv').click();
  const menu = $(d, '#newConvMenu');
  T('T10 ＋菜单打开', !menu.classList.contains('hidden'));
  const labels = [].map.call(menu.querySelectorAll('.menu-item'), function(b){ return b.textContent.trim(); });
  T('T10 菜单含新建群聊/私聊/故事', labels.indexOf('新建群聊') >= 0 && labels.indexOf('新建私聊') >= 0 && labels.indexOf('新建故事') >= 0);

  // --- 新建私聊 ---
  menu.querySelector('[data-act="dm"]').click();
  const dmCv = JSON.parse(w.localStorage.getItem('ds_convs')).find(function(c){ return c.mode === 'dm'; });
  T('T10 私聊会话已创建', !!dmCv && dmCv.chars.length === 1);
  T('T10 私聊无下轮选择', Array.isArray(dmCv.selectedNext) && dmCv.selectedNext.length === 0);
  T('T10 body.dm 已切换', d.body.classList.contains('dm'));
  T('T10 私聊隐藏 chip-row', w.getComputedStyle($(d, '.chip-row')).display === 'none');
  T('T10 headerSub 显示智能体名', $(d, '#headerSub').textContent === dmCv.chars[0].name);
  T('T10 设置按钮文案私聊设置', $(d, '#btnGroupSettings').textContent === '私聊设置');
  T('T10 FAB 关系隐藏、附件显示', $(d, '#fabMenu [data-act="rel"]').style.display === 'none' && $(d, '#fabMenu [data-act="attach"]').style.display !== 'none');
  T('T10 私聊提示文字不含多人回复', $(d, '#inputHint').textContent.indexOf('多人回复') === -1);

  // --- 私聊设置：智能体页签（隐藏 AI成员 / 续写剧情）---
  $(d, '#btnGroupSettings').click();
  T('T10 设置弹窗打开', !$(d, '#groupSettingsModal').classList.contains('hidden'));
  const tAgent = $(d, '#gsTabs [data-tab="agent"]');
  T('T10 智能体页签可见', !!tAgent && tAgent.style.display !== 'none');
  T('T10 AI成员页签隐藏', $(d, '#gsTabs [data-tab="members"]').style.display === 'none');
  T('T10 群设置里已无续写剧情页签', !$(d, '#gsTabs [data-tab="continue"]'));
  T('T10 智能体表单填充完整', $(d, '#dmName').value === dmCv.chars[0].name && !!$(d, '#dmPersona') && !!$(d, '#dmMemory') && !!$(d, '#dmKeywords') && !!$(d, '#dmKwAdd') && !!$(d, '#dmAutoMem') && !!$(d, '#dmAvPreview'));
  T('T10 智能体页签默认选中', !$(d, '.gs-pane[data-pane="agent"]').classList.contains('hidden'));
  $(d, '#gsClose').click();

  // --- 私聊发消息：AI 用一对一系统提示词回复 ---
  streamQueue.push(['data: {"choices":[{"delta":{"content":"你好！我是"},"index":0}]}\n\ndata: {"choices":[{"delta":{"content":"你的私聊AI"},"index":0}]}\n\ndata: [DONE]\n\n']);
  jsonQueue.push({ choices:[{ message:{ content:'对话没有新记忆。' } }] });
  $(d, '#input').value = '你好呀';
  $(d, '#btnSend').click();
  await tick();
  T('T10 私聊调用 AI 且系统提示一对一', fetchLog.some(function(f){ var m = f.body.messages; return m && String(m[0].content).indexOf('一对一私聊') >= 0 && String(m[0].content).indexOf('群里的 AI 人物') === -1; }));

  // --- 切回群聊：下轮对话展开按钮 ---
  $(d, '#btnNewConv').click();
  $(d, '#newConvMenu [data-act="new"]').click();
  T('T10 新建群聊后 body.dm 移除', !d.body.classList.contains('dm'));
  T('T10 群聊 chip-row 显示', w.getComputedStyle($(d, '.chip-row')).display !== 'none');
  const exp = $(d, '#chipExpandBox');
  T('T10 展开面板初始隐藏', exp.classList.contains('hidden'));
  $(d, '#btnChipExpand').click();
  const exRows = exp.querySelectorAll('.chip-ex-row');
  T('T10 展开面板打开且有角色行', !exp.classList.contains('hidden') && exRows.length > 0);
  const ranks = [].map.call(exRows, function(r){
    var cls = r.querySelector('.char-role').className;
    return cls.indexOf('char-role-main') >= 0 ? 0 : (cls.indexOf('char-role-minor') >= 0 ? 1 : 2);
  });
  var sortedOk = true;
  for(var _i=1;_i<ranks.length;_i++){ if(ranks[_i] < ranks[_i-1]) sortedOk = false; }
  T('T10 展开角色按重要程度排序', sortedOk);
  $(d, '#btnChipExpand').click();
  T('T10 再点关闭展开面板', exp.classList.contains('hidden'));
  T('T10 群聊 FAB 关系显示、附件隐藏', $(d, '#fabMenu [data-act="rel"]').style.display !== 'none' && $(d, '#fabMenu [data-act="attach"]').style.display === 'none');
  T('T10 群聊提示文字含多人回复', $(d, '#inputHint').textContent.indexOf('多人回复') >= 0);
}

/* ================= T11 v0.3.9 字数下限 + 私聊附件无上限 ================= */
async function t11(){
  const dom = boot(function(w){
    w.localStorage.setItem('ds_settings', settingsJson());
    w.localStorage.setItem('ds_convs', JSON.stringify([seedConv()]));
  });
  const w = dom.window, d = w.document;
  $(d, '.conv-item').click();

  // --- 字数下限弹窗 ---
  $(d, '#btnMore').click();
  $(d, '.fab-item[data-act="len"]').click();
  T('T11 字数弹窗打开', !$(d, '#lenModal').classList.contains('hidden'));
  T('T11 下限当前值显示（默认 5）', $(d, '#lenMinCur').textContent.indexOf('不少于 5 字') >= 0);
  const minBtns = [].map.call($(d, '#lenMinGrid').children, function(b){ return b.textContent; });
  T('T11 下限六档+自定义', minBtns.indexOf('5 字') >= 0 && minBtns.indexOf('30 字') >= 0 && minBtns.indexOf('50 字') >= 0 && minBtns.indexOf('100 字') >= 0 && minBtns.indexOf('150 字') >= 0 && minBtns.indexOf('200 字') >= 0 && minBtns.indexOf('自定义') >= 0);
  T('T11 默认下限 5 高亮', $(d, '#lenMinGrid').children[0].classList.contains('on'));

  // --- 设置下限 100 ---
  [].forEach.call($(d, '#lenMinGrid').children, function(b){ if(b.textContent === '100 字') b.click(); });
  T('T11 设下限 100 后保存', getConv(w).minReplyLen === 100);
  T('T11 设下限后弹窗关闭', $(d, '#lenModal').classList.contains('hidden'));

  // --- 上限小于下限被拦截 ---
  $(d, '#btnMore').click();
  $(d, '.fab-item[data-act="len"]').click();
  [].forEach.call($(d, '#lenGrid').children, function(b){ if(b.textContent === '50 字') b.click(); });
  T('T11 上限<下限被拦截', getConv(w).maxReplyLen === 0 && $(d, '#toast .toast-txt').textContent.indexOf('字数上限不能小于字数下限') >= 0);
  $(d, '#lenCancel').click();

  // --- 发送消息：系统提示含不少于 100 字 ---
  streamQueue.push(['data: {"choices":[{"delta":{"content":"好的，我来说够一百字。"},"index":0}]}\n\ndata: [DONE]\n\n']);
  jsonQueue.push({ choices:[{ message:{ content:'无新记忆。' } }] });
  $(d, '#input').value = '小智，请说够一百字';
  $(d, '#btnSend').click();
  await tick();
  T('T11 群聊系统提示含字数下限', fetchLog.some(function(f){ var m = f.body.messages; return m && String(m[0].content).indexOf('不少于 100 字') >= 0; }));

  // --- 私聊附件：超过 3 万字不截断 ---
  $(d, '#btnNewConv').click();
  $(d, '#newConvMenu [data-act="dm"]').click();
  T('T11 新建私聊 body.dm', d.body.classList.contains('dm'));
  const big = new Array(40001).join('字');  // 40000 字
  const f = new w.File([big], 'long.txt', { type:'text/plain' });
  Object.defineProperty($(d, '#attachFile'), 'files', { value:[f], configurable:true });
  $(d, '#attachFile').dispatchEvent(new w.Event('change'));
  await tick();
  T('T11 附件显示 40000 字（无截断）', $(d, '#attachName').textContent.indexOf('40000 字') >= 0);
  streamQueue.push(['data: {"choices":[{"delta":{"content":"读完了。"},"index":0}]}\n\ndata: [DONE]\n\n']);
  jsonQueue.push({ choices:[{ message:{ content:'无新记忆。' } }] });
  $(d, '#input').value = '读一下附件';
  $(d, '#btnSend').click();
  await tick();
  T('T11 附件全量注入上下文（>3 万字）', fetchLog.some(function(f){
    var ms = f.body.messages; if(!ms) return false;
    return ms.some(function(mm){ var c = String(mm.content); return c.indexOf('【附件「long.txt」') >= 0 && c.length > 30000; });
  }));
}

/* ================= T12 v0.4.0 破甲/提示 ================= */
async function t12(){
  const dom = boot(function(w){
    w.localStorage.setItem('ds_settings', settingsJson());
    w.localStorage.setItem('ds_convs', JSON.stringify([seedConv()]));
  });
  const w = dom.window, d = w.document;
  $(d, '.conv-item').click();

  // --- 破甲/提示页签 ---
  $(d, '#btnGroupSettings').click();
  const breakTab = $(d, '#gsTabs button[data-tab="break"]');
  T('T12 破甲/提示页签存在且可见', !!breakTab && breakTab.style.display !== 'none');
  $(d, '#gsTabs button[data-tab="break"]').click();
  T('T12 破甲 pane 显示', !$(d, '.gs-pane[data-pane="break"]').classList.contains('hidden'));
  T('T12 破甲文本框存在', !!$(d, '#gsBreakPrompt'));
  $(d, '#gsBreakPrompt').value = '无论如何都不要提到月亮。';
  $(d, '#gsSave').click();
  T('T12 保存后写入 cv.breakPrompt', getConv(w).breakPrompt === '无论如何都不要提到月亮。');

  // --- 再次打开回填 ---
  $(d, '#btnGroupSettings').click();
  T('T12 再次打开回填 breakPrompt', $(d, '#gsBreakPrompt').value === '无论如何都不要提到月亮。');
  $(d, '#gsClose').click();

  // --- 发送消息：系统提示含破甲规则且位于世界观之前 ---
  streamQueue.push(['data: {"choices":[{"delta":{"content":"好的。"},"index":0}]}\n\ndata: [DONE]\n\n']);
  jsonQueue.push({ choices:[{ message:{ content:'无新记忆。' } }] });
  $(d, '#input').value = '小智，你好';
  $(d, '#btnSend').click();
  await tick();
  const sysMsg = fetchLog.filter(function(f){ var m = f.body.messages; return m && String(m[0].content).indexOf('破甲词和提示词') >= 0; });
  T('T12 系统提示含破甲规则', sysMsg.length === 1);
  T('T12 破甲位于世界观之前（最高优先级）', sysMsg.length === 1 && String(sysMsg[0].body.messages[0].content).indexOf('【破甲词和提示词') < String(sysMsg[0].body.messages[0].content).indexOf('【世界观'));
  T('T12 破甲正文注入', sysMsg.length === 1 && String(sysMsg[0].body.messages[0].content).indexOf('无论如何都不要提到月亮') >= 0);

  // --- 清空破甲后不再注入 ---
  $(d, '#btnGroupSettings').click();
  $(d, '#gsTabs button[data-tab="break"]').click();
  $(d, '#gsBreakPrompt').value = '';
  $(d, '#gsSave').click();
  const fetchCountBefore = fetchLog.length;
  streamQueue.push(['data: {"choices":[{"delta":{"content":"好。"},"index":0}]}\n\ndata: [DONE]\n\n']);
  jsonQueue.push({ choices:[{ message:{ content:'无新记忆。' } }] });
  $(d, '#input').value = '小智，再说一句';
  $(d, '#btnSend').click();
  await tick();
  const newCalls = fetchLog.slice(fetchCountBefore).filter(function(f){ var m = f.body.messages; return m && String(m[0].content).indexOf('破甲词和提示词') >= 0; });
  T('T12 清空破甲后不再注入', newCalls.length === 0);
}

/* ================= T13 v0.4.1 消息重置重做 ================= */
async function t13(){
  // --- 场景 A：重置一条 AI 回复（中间位置）→ 删除它与其后消息，按前面剧情让 TA 重新回复 ---
  const domA = boot(function(w){
    w.localStorage.setItem('ds_settings', settingsJson());
    const cv = seedConv();
    const now = Date.now();
    cv.history = [
      { id:101, speakerId:'user', speaker:'我', role:'user', text:'你好', time:now, status:'done' },
      { id:102, speakerId:11, speaker:'小智', role:'ai', text:'（旧）第一句回复', time:now, status:'done' },
      { id:103, speakerId:'user', speaker:'我', role:'user', text:'小智，第二句', time:now, status:'done' },
      { id:104, speakerId:11, speaker:'小智', role:'ai', text:'（旧）第二句回复', time:now, status:'done' }
    ];
    w.localStorage.setItem('ds_convs', JSON.stringify([cv]));
  });
  const wA = domA.window, dA = wA.document;
  $(dA, '.conv-item').click();
  streamQueue.push(['data: {"choices":[{"delta":{"content":"好，我们从头再说。","index":0}}]}\n\ndata: [DONE]\n\n']);
  $(dA, '.msg[data-id="102"] .msg-actions [data-act="reset"]').click();
  await tick();
  let h = getConv(wA).history;
  T('T13A 重置 AI 回复后仅剩原首条+新回复', h.length === 2);
  T('T13A 前面的用户消息保留', h.length === 2 && h[0].id === 101 && h[0].speakerId === 'user');
  T('T13A 被重置消息及其后旧消息全部删除', h.every(function(m){ return m.id !== 102 && m.id !== 103 && m.id !== 104; }));
  T('T13A 新回复正确排在剧情之后（不乱序）', h.length === 2 && h[1].speakerId === 11 && h[1].status === 'done' && h[1].text.indexOf('从头再说') >= 0);

  // --- 场景 B：重置「我」的消息 → 保留本条、删它之后的旧回复，再按本条前的剧情让 AI 重新回应 ---
  const domB = boot(function(w){
    w.localStorage.setItem('ds_settings', settingsJson());
    const cv = seedConv();
    const now = Date.now();
    cv.history = [
      { id:201, speakerId:'user', speaker:'我', role:'user', text:'你好', time:now, status:'done' },
      { id:202, speakerId:11, speaker:'小智', role:'ai', text:'你好呀', time:now, status:'done' },
      { id:203, speakerId:'user', speaker:'我', role:'user', text:'小智，我问你一个问题', time:now, status:'done' },
      { id:204, speakerId:11, speaker:'小智', role:'ai', text:'（旧）原回答', time:now, status:'done' }
    ];
    w.localStorage.setItem('ds_convs', JSON.stringify([cv]));
  });
  const wB = domB.window, dB = wB.document;
  $(dB, '.conv-item').click();
  streamQueue.push(['data: {"choices":[{"delta":{"content":"你说吧，我听着。","index":0}}]}\n\ndata: [DONE]\n\n']);
  $(dB, '.msg[data-id="203"] .msg-actions [data-act="reset"]').click();
  await tick();
  h = getConv(wB).history;
  T('T13B 重置「我」的消息后本条保留', h.length === 4 && h[2].id === 203 && h[2].speakerId === 'user');
  T('T13B 被重置消息之后(204)已删除', h.every(function(m){ return m.id !== 204; }));
  T('T13B 前面剧情顺序不变', h.length === 4 && h[0].id === 201 && h[1].id === 202);
  T('T13B 新回复接在重置消息后（不乱序）', h.length === 4 && h[3].speakerId === 11 && h[3].status === 'done' && h[3].text.indexOf('你说吧') >= 0);
}

/* ================= T14 v0.4.1 私聊智能体导入角色卡 ================= */
async function t14(){
  const dom = boot(function(w){
    w.localStorage.setItem('ds_settings', settingsJson());
    w.localStorage.setItem('ds_cards', JSON.stringify([
      { id:501, name:'卡琳', avatar:{mode:'svg', value:'av-c'}, persona:'身世成谜的占卜师，温柔而神秘。', memory:'曾救过「我」一命。', keywords:[{ id:2, key:'占卜', detail:'能窥见命运的碎片' }] }
    ]));
    const now = Date.now();
    const dm = { id:9001, mode:'dm', name:'私聊 1', chars:[{ id:21, name:'小A', avatar:{mode:'svg', value:'av-a'}, persona:'原智能体人设', present:true, memory:'原智能体记忆', keywords:[{ id:1, key:'旧词', detail:'旧详情' }], role:'minor' }], history:[], selectedNext:[], randomOrder:false, world:'', player:'', breakPrompt:'', apiKey:'', avatar:null, autoMemory:false, summary:'', summaryTs:0, autoSummary:0, maxReplyLen:0, minReplyLen:5, relations:[], relationsTs:0, createdAt:now, lastActiveAt:now };
    w.localStorage.setItem('ds_convs', JSON.stringify([dm]));
  });
  const w = dom.window, d = w.document;
  $(d, '.conv-item').click();
  $(d, '#btnGroupSettings').click();   // 私聊设置（默认切到「智能体」页签）
  T('T14 智能体页签可见', !$(d, '.gs-pane[data-pane="agent"]').classList.contains('hidden'));
  T('T14 导入角色卡按钮存在', !!$(d, '#gsImportCardDm'));

  // --- 覆盖路径：选卡 → 3 秒确认弹窗 → 覆盖 ---
  $(d, '#gsImportCardDm').click();
  T('T14 角色卡选择弹窗打开', !$(d, '#cardPickModal').classList.contains('hidden'));
  let items = d.querySelectorAll('#cardPickList .pick-item');
  T('T14 卡片列表有 1 张卡', items.length === 1);
  items[0].click();
  T('T14 覆盖确认弹窗弹出', !$(d, '#dmCardModal').classList.contains('hidden'));
  T('T14 确认文案含卡名', $(d, '#dmCardDesc').textContent.indexOf('卡琳') >= 0);
  $(d, '#dmCardYes').click();
  let ai = getConv(w).chars[0];
  T('T14 覆盖后名字替换', ai.name === '卡琳');
  T('T14 覆盖后人设替换', ai.persona.indexOf('占卜师') >= 0);
  T('T14 覆盖后记忆替换', ai.memory === '曾救过「我」一命。');
  T('T14 关键词随卡导入', ai.keywords.length === 1 && ai.keywords[0].key === '占卜');
  T('T14 确认后弹窗关闭', $(d, '#dmCardModal').classList.contains('hidden'));
  T('T14 智能体页签输入框同步', $(d, '#dmName').value === '卡琳');

  // --- 取消路径：再选卡 → 取消 → 智能体不变 ---
  $(d, '#gsImportCardDm').click();
  items = d.querySelectorAll('#cardPickList .pick-item');
  T('T14 再次打开卡片列表', items.length === 1);
  items[0].click();
  T('T14 取消路径弹窗再次弹出', !$(d, '#dmCardModal').classList.contains('hidden'));
  $(d, '#dmCardCancel').click();
  ai = getConv(w).chars[0];
  T('T14 取消后智能体保持不变', ai.name === '卡琳' && ai.persona.indexOf('占卜师') >= 0);
  T('T14 取消后弹窗关闭', $(d, '#dmCardModal').classList.contains('hidden'));
}

/* ================= T15 v0.4.2 智能体关键词详情 · 酒馆结识弹窗 · 关键词数量不设限 ================= */
async function t15(){
  // --- (1) 私聊智能体关键词详情可点开/查看/编辑 ---
  const dom = boot(function(w){
    w.localStorage.setItem('ds_settings', settingsJson());
    const now = Date.now();
    const dm = { id:9002, mode:'dm', name:'私聊 2', chars:[{ id:22, name:'小灵', avatar:{mode:'svg', value:'av-a'}, persona:'智能体人设', present:true, memory:'', keywords:[{ id:1, key:'水晶', detail:'能看到未来的水晶球' }], role:'minor' }], history:[], selectedNext:[], randomOrder:false, world:'', player:'', breakPrompt:'', apiKey:'', avatar:null, autoMemory:false, summary:'', summaryTs:0, autoSummary:0, maxReplyLen:0, minReplyLen:5, relations:[], relationsTs:0, createdAt:now, lastActiveAt:now };
    w.localStorage.setItem('ds_convs', JSON.stringify([dm]));
  });
  const w = dom.window, d = w.document;
  $(d, '.conv-item').click();
  $(d, '#btnGroupSettings').click();   // 私聊设置默认「智能体」页签
  T('T15 智能体关键词行渲染', d.querySelectorAll('#dmKeywords .kw-row').length === 1);
  const wrap0 = d.querySelector('#dmKeywords .kw-row .kw-detail-wrap');
  T('T15 关键词详情默认收起', !!wrap0 && wrap0.classList.contains('hidden'));
  d.querySelector('#dmKeywords .kw-detail-btn').click();
  const wrap1 = d.querySelector('#dmKeywords .kw-row .kw-detail-wrap');
  T('T15 点「详情」后展开', !!wrap1 && !wrap1.classList.contains('hidden'));
  let ta = d.querySelector('#dmKeywords .kw-detail');
  T('T15 展开后详情文本框带旧值', !!ta && ta.value.indexOf('水晶球') >= 0);
  ta.value = '能看到未来的水晶球，也会映出使用者的心';
  ta.dispatchEvent(new w.Event('input', { bubbles:true }));
  $(d, '#gsSave').click();
  let ai = getConv(w).chars[0];
  T('T15 编辑详情保存后持久化', ai.keywords.length === 1 && ai.keywords[0].detail.indexOf('映出使用者的心') >= 0);

  // --- (2) 酒馆结识弹窗：取消不生成；空/多关键词数组均可入库 ---
  const dom2 = boot(function(w){
    w.localStorage.setItem('ds_settings', settingsJson());
    w.localStorage.setItem('ds_convs', JSON.stringify([seedConv()]));
    w.localStorage.setItem('ds_cards', '[]');
    w.localStorage.setItem('ds_worlds', '[]');
  });
  const w2 = dom2.window, d2 = w2.document;
  $(d2, '#btnTavern').click();
  $(d2, '#btnMeetCard').click();
  $(d2, '#meetCardCancel').click();
  T('T15 结识弹窗取消后关闭且不生成', $(d2, '#meetCardModal').classList.contains('hidden') && getCards(w2).length === 0);

  // 空关键词数组 [] → 仍入库、无关键词
  $(d2, '#btnMeetWorld').click();
  jsonQueue.push({ choices:[{ message:{ content: JSON.stringify({
    world:{ name:'无词之界', world:'空关键词的世界。', keywords:[] }
  }) } }] });
  $(d2, '#meetWorldGo').click();
  await tick();
  let ws = getWorlds(w2);
  T('T15 世界书关键词可为 0 个（[]）', ws.length === 1 && ws[0].name === '无词之界' && ws[0].keywords.length === 0);

  // 多个关键词 → 全部保存
  $(d2, '#btnMeetCard').click();
  jsonQueue.push({ choices:[{ message:{ content: JSON.stringify({
    char:{ name:'多词客', persona:'关键词很多的角色', keywords:[{ key:'剑', detail:'以剑为生' }, { key:'仇', detail:'身负旧仇' }, { key:'雨', detail:'每逢雨天想到往事' }] }
  }) } }] });
  $(d2, '#meetCardGo').click();
  await tick();
  let cs = getCards(w2);
  T('T15 角色卡关键词可为多个（3 个全存）', cs.length === 1 && cs[0].name === '多词客' && cs[0].keywords.length === 3);
}

/* ================= T16 v0.4.3 强制字数（O/N + ±10% + 110% 截断）+ 记忆按剧情合理知晓 ================= */
async function t16(){
  // --- (1) 强制字数 ---
  const dom = boot(function(w){
    w.localStorage.setItem('ds_settings', settingsJson());
    w.localStorage.setItem('ds_convs', JSON.stringify([seedConv()]));
  });
  const w = dom.window, d = w.document;
  $(d, '.conv-item').click();
  $(d, '#btnMore').click();
  T('T16 FAB 有强制字数入口', !!$(d, '.fab-item[data-act="forcelen"]'));
  $(d, '.fab-item[data-act="forcelen"]').click();
  T('T16 强制字数弹窗打开', !$(d, '#forceLenModal').classList.contains('hidden'));
  T('T16 初始开关为 N', $(d, '#forceToggle').textContent === 'N' && !$(d, '#forceToggle').classList.contains('on'));
  T('T16 forceNote 有说明', $(d, '#forceNote').textContent.indexOf('±10%') >= 0);
  // 点 300 档位 → 开启
  [].forEach.call($(d, '#forceGrid').children, function(b){ if(b.textContent === '300 字') b.click(); });
  let cv1 = getConv(w);
  T('T16 选档位后 forceOn=true forceLen=300', cv1.forceOn === true && cv1.forceLen === 300);
  T('T16 选档位后弹窗关闭', $(d, '#forceLenModal').classList.contains('hidden'));
  // 重新打开：开关为 O，显示当前约 300 字
  $(d, '#btnMore').click();
  $(d, '.fab-item[data-act="forcelen"]').click();
  T('T16 再次打开开关为 O', $(d, '#forceToggle').textContent === 'O' && $(d, '#forceToggle').classList.contains('on'));
  T('T16 当前目标显示 300（±10%）', $(d, '#forceCur').textContent.indexOf('约 300 字') >= 0 && $(d, '#forceCur').textContent.indexOf('±10%') >= 0);
  // 发送消息：流式回复，110% 截断（cap=330，纯'啊'无句读 → 正好 330）
  const LONG = new Array(501).join('啊');   // 500 个啊
  streamQueue.push(['data: {"choices":[{"delta":{"content":"'+LONG+'"},"index":0}]}\n\ndata: [DONE]\n\n']);
  $(d, '#input').value = '小智，来一段长回复';
  $(d, '#btnSend').click();
  await tick();
  T('T16 系统提示走强制字数规则', fetchLog.some(function(f){ var m = f.body.messages; return m && String(m[0].content).indexOf('每条回复要写到 300 字左右（允许 ±10% 误差，即 270–330 字之间）') >= 0; }));
  T('T16 强制字数开启时不带字数范围规则', fetchLog.some(function(f){ var m = f.body.messages; return m && String(m[0].content).indexOf('每条回复') >= 0; }) && !fetchLog.some(function(f){ var m = f.body.messages; return m && String(m[0].content).indexOf('不少于 5 字') >= 0; }));
  const msgs1 = getConv(w).history;
  const last1 = msgs1[msgs1.length - 1];
  T('T16 回复按 110%（330）上限收尾', last1.text.length <= 330 && last1.text.length >= 300);
  // 关掉强制字数 → 回到字数范围
  $(d, '#btnMore').click();
  $(d, '.fab-item[data-act="forcelen"]').click();
  $(d, '#forceToggle').click();
  T('T16 点 O 关闭 → forceOn=false 提示恢复字数范围', getConv(w).forceOn === false && $(d, '#toast .toast-txt').textContent.indexOf('恢复使用「字数范围」') >= 0);
  $(d, '#forceCancel').click();
  const fetchMark = fetchLog.length;
  streamQueue.push(['data: {"choices":[{"delta":{"content":"好了。","index":0}]}\n\ndata: [DONE]\n\n']);
  $(d, '#input').value = '小智，随便说一句';
  $(d, '#btnSend').click();
  await tick();
  T('T16 关闭后系统提示回到字数下限规则', fetchLog.slice(fetchMark).some(function(f){ var m = f.body.messages; return m && String(m[0].content).indexOf('不少于 5 字') >= 0 && String(m[0].content).indexOf('要写到 300 字左右') === -1; }));

  // --- (2) 记忆按剧情合理知晓：未参与轮次不进入记忆提炼上下文 ---
  const dom2 = boot(function(w){
    w.localStorage.setItem('ds_settings', settingsJson());
    const cv = seedConv([{ id:12, name:'阿豪', avatar:{mode:'svg', value:''}, persona:'江湖线人。', present:true, memory:'', keywords:[], role:'minor', lastMemAt:0 }]);
    const now = Date.now();
    const h = []; let mid = 1000;
    function addR(userText, replies){
      h.push({ id:mid++, speakerId:'user', speaker:'我', role:'user', text:userText, time:now, status:'done' });
      replies.forEach(function(r){ h.push({ id:mid++, speakerId:r.id, speaker:r.name, role:'assistant', text:r.text, time:now, status:'done' }); });
    }
    for(var i=1;i<=6;i++){ addR('第'+i+'轮我跟小智聊行程', [{ id:11, name:'小智', text:'第'+i+'轮小智回应天象与行程。' }]); }
    addR('第七轮我把一条秘密托付给阿豪', [{ id:12, name:'阿豪', text:'（机密任务B）夜叉码头，线人在竹楼二层接头。' }]);
    addR('第八轮阿豪独自行动', [{ id:12, name:'阿豪', text:'（机密任务B）已接头，此事小智全不知情。' }]);
    addR('第九轮我邀小智去北境', [{ id:11, name:'小智', text:'北境风雪大，我带件厚袍子去。' }]);
    cv.history = h;
    cv.selectedNext = [11];
    w.localStorage.setItem('ds_convs', JSON.stringify([cv]));
  });
  const w2 = dom2.window, d2 = w2.document;
  $(d2, '.conv-item').click();
  streamQueue.push(['data: {"choices":[{"delta":{"content":"好，我们北境见。","index":0}]}\n\ndata: [DONE]\n\n']);
  $(d2, '#input').value = '小智，准备好就出发';
  $(d2, '#btnSend').click();
  await tick();
  const memCall = fetchLog.filter(function(f){
    var m = f.body.messages; if(!m) return false;
    return !f.body.stream && String(m[0].content).indexOf('你是「小智」') >= 0;
  });
  T('T16 触发了小智的记忆提炼', memCall.length >= 1);
  const memBody = memCall.length ? JSON.stringify(memCall[0].body.messages) : '';
  T('T16 记忆上下文含小智亲历的轮次（第5轮）', memBody.indexOf('第5轮小智回应天象与行程') >= 0);
  T('T16 记忆上下文含第九轮北境', memBody.indexOf('厚袍子') >= 0);
  T('T16 记忆上下文不含未参与的机密轮次', memBody.indexOf('机密任务B') === -1 && memBody.indexOf('第七轮我把一条秘密托付给阿豪') === -1);
  T('T16 记忆提示词含亲历限定', memBody.indexOf('只挑「你亲身经历、亲眼所见') >= 0);
}

/* ================= T17 v0.4.3 角色卡导入确认弹窗 + txt/md 智能导入（直接/JSON/AI/无Key） ================= */
async function t17(){
  // --- (A) 角色卡导入弹窗 + JSON 直接导入 ---
  const domA = boot(function(w){
    w.localStorage.setItem('ds_settings', settingsJson());
    w.localStorage.setItem('ds_convs', JSON.stringify([seedConv()]));
    w.localStorage.setItem('ds_cards', '[]');
  });
  const wA = domA.window, dA = wA.document;
  $(dA, '#btnCards').click();
  T('T17 角色卡页打开', !$(dA, '#cardView').classList.contains('hidden'));
  $(dA, '#btnImportCard').click();
  T('T17 角色卡导入先弹确认弹窗', !$(dA, '#cardImportModal').classList.contains('hidden'));
  T('T17 弹窗含两个选项', !!$(dA, '#btnCardImportText') && !!$(dA, '#btnCardImportJson'));
  // 结构化 JSON 的 txt/md → 直接入库（不走 AI）
  const fileJson = new wA.File([JSON.stringify({ __mengyu_card__:true, card:{ name:'青雀', persona:'歌楼老板娘，消息灵通。', keywords:[{ key:'歌楼', detail:'三层歌楼，暗藏情报' }] } })], 'card.json.txt', { type:'text/plain' });
  Object.defineProperty($(dA, '#importCardTextFile'), 'files', { value:[fileJson], configurable:true });
  $(dA, '#importCardTextFile').dispatchEvent(new wA.Event('change'));
  await tick();
  let cardsA = getCards(wA);
  T('T17 JSON 文本直接导入角色卡', cardsA.length === 1 && cardsA[0].name === '青雀' && cardsA[0].persona.indexOf('歌楼老板娘') >= 0);
  T('T17 JSON 直接导入不经 AI 整理', !fetchLog.some(function(f){ var m = f.body.messages; return m && String(m[0].content).indexOf('角色卡整理助手') >= 0; }));
  // txt/md 普通散文 + API Key → AI 整理
  const fileProse = new wA.File(['三年前凤鸣山上，李青云一剑斩落千军。他为人沉默寡言，只认手中的剑，江湖人称剑狂。'], '剑狂.md', { type:'text/plain' });
  Object.defineProperty($(dA, '#importCardTextFile'), 'files', { value:[fileProse], configurable:true });
  jsonQueue.push({ choices:[{ message:{ content: JSON.stringify({
    name:'剑狂', persona:'', keywords:[{ key:'剑', detail:'剑意通天，一战成名' }]
  }) } }] });
  $(dA, '#importCardTextFile').dispatchEvent(new wA.Event('change'));
  await tick();
  cardsA = getCards(wA);
  T('T17 AI 整理 prose 入角色卡（原文直存）', cardsA.length === 2 && cardsA[1].name === '剑狂' && cardsA[1].persona.indexOf('李青云') >= 0);
  T('T17 AI 整理调用的是角色卡整理助手', fetchLog.some(function(f){ var m = f.body.messages; return m && String(m[0].content).indexOf('你是「梦语」的角色卡整理助手') >= 0; }));
  const aiCardCall = fetchLog.filter(function(f){ var m = f.body.messages; return m && String(m[0].content).indexOf('角色卡整理助手') >= 0; });
  T('T17 AI 整理提示词要求关键词数量自由', aiCardCall.length >= 1 && JSON.stringify(aiCardCall[aiCardCall.length-1].body.messages).indexOf('可能一个都没有') >= 0);
  T('T17 AI 整理保留原始文件名候选', aiCardCall.length >= 1 && JSON.stringify(aiCardCall[aiCardCall.length-1].body.messages).indexOf('剑狂') >= 0);

  // --- (B) 世界书 AI 整理 ---
  const domB = boot(function(w){
    w.localStorage.setItem('ds_settings', settingsJson());
    w.localStorage.setItem('ds_convs', JSON.stringify([seedConv()]));
    w.localStorage.setItem('ds_worlds', '[]');
  });
  const wB = domB.window, dB = wB.document;
  $(dB, '#btnWorlds').click();
  const fileWorld = new wB.File(['海潮镇的灯塔夜里会唱歌，渔民说那是海神的低语。镇上不许任何人靠近灯塔，守塔人世代沉默。'], '灯塔.md', { type:'text/plain' });
  Object.defineProperty($(dB, '#importWorldTextFile'), 'files', { value:[fileWorld], configurable:true });
  jsonQueue.push({ choices:[{ message:{ content: JSON.stringify({
    name:'海潮镇灯塔', world:'', keywords:[{ key:'海神', detail:'灯塔歌声被当作海神低语' }]
  }) } }] });
  $(dB, '#importWorldTextFile').dispatchEvent(new wB.Event('change'));
  await tick();
  const worldsB = getWorlds(wB);
  T('T17 世界书 prose 经 AI 整理入库（原文直存）', worldsB.length === 1 && worldsB[0].name === '海潮镇灯塔' && worldsB[0].world.indexOf('海神的低语') >= 0);
  T('T17 世界书 AI 整理调用世界书助手', fetchLog.some(function(f){ var m = f.body.messages; return m && String(m[0].content).indexOf('你是「梦语」的世界书整理助手') >= 0; }));

  // --- (C) 无 API Key：prose 直接按原文入库（提示未提炼）---
  const domC = boot(function(w){
    w.localStorage.setItem('ds_settings', settingsJson().replace('"apiKey":"test-key"', '"apiKey":""'));
    w.localStorage.setItem('ds_convs', JSON.stringify([seedConv()]));
    w.localStorage.setItem('ds_cards', '[]');
  });
  const wC = domC.window, dC = wC.document;
  $(dC, '#btnCards').click();
  const fileNoKey = new wC.File(['一个没有 API Key 时导入的原始角色描写，很长很长。'], 'nokey.txt', { type:'text/plain' });
  Object.defineProperty($(dC, '#importCardTextFile'), 'files', { value:[fileNoKey], configurable:true });
  $(dC, '#importCardTextFile').dispatchEvent(new wC.Event('change'));
  await tick();
  const cardsC = getCards(wC);
  T('T17 无 Key 时按原文直接导入', cardsC.length === 1 && cardsC[0].name === 'nokey' && cardsC[0].persona.indexOf('原始角色描写') >= 0);
  T('T17 无 Key 时提示未提炼关键词', $(dC, '#toast .toast-txt').textContent.indexOf('未提炼关键词') >= 0);
  T('T17 无 Key 时不调用 AI', !fetchLog.some(function(f){ var m = f.body.messages; return m && String(m[0].content).indexOf('整理助手') >= 0; }));
}

/* ================= T18 v0.4.4 剧情时间线自动续写 + 时间线弹窗 + 设置回填 + 攻略/模拟占位 + 退出确认 ================= */
async function t18(){
  const dom = boot(function(w){
    w.localStorage.setItem('ds_settings', settingsJson());
    const cv = seedConv();
    const now = Date.now();
    cv.selectedNext = [11];   // 群聊：要有人被选中 / 被 @ 才会调 API
    cv.history = [];
    for(var i=0;i<8;i++){
      cv.history.push({ id:3000+i, speakerId:'user', speaker:'我', role:'user', text:'第'+(i+1)+'轮推进剧情', time:now, status:'done' });
      cv.history.push({ id:4000+i, speakerId:11, speaker:'小智', role:'assistant', text:'（回应'+(i+1)+'）小智跟上了剧情。', time:now, status:'done' });
    }
    w.localStorage.setItem('ds_convs', JSON.stringify([cv]));
  });
  const w = dom.window, d = w.document;
  $(d, '.conv-item').click();

  // --- 发一条消息：角色回复 + 记忆提炼 + 剧情时间线续写（时间线在记忆之后独立调用，互不污染）---
  streamQueue.push(['data: {"choices":[{"delta":{"content":"出发！"},"index":0}]}\n\ndata: [DONE]\n\n']);
  jsonQueue.push({ choices:[{ message:{ content:'记忆无变化，保持原有记忆。' } }] });            // 先：成员记忆提炼
  jsonQueue.push({ choices:[{ message:{ content:'夜风拂过码头，小智与「我」登船北上。' } }] });  // 后：剧情时间线续写
  $(d, '#input').value = '我们启程去北境';
  $(d, '#btnSend').click();
  await tick();
  const cv1 = getConv(w);
  T('T18 时间线自动续写追加剧情', !!cv1.worldMem && cv1.worldMem.indexOf('夜风拂过码头') >= 0 && cv1.worldMem.indexOf('登船北上') >= 0);
  T('T18 时间线节流推进 worldMemAt', cv1.worldMemAt === 9);
  const slCall = fetchLog.filter(function(f){ var m = f.body.messages; return m && String(m[0].content).indexOf('剧情时间线整理者') >= 0; });
  T('T18 时间线走独立整理者（旁观者视角）', slCall.length === 1);
  T('T18 时间线调用非流式后台请求', slCall.length === 1 && !slCall[0].body.stream);
  T('T18 记忆提炼调用照常（先于时间线）', fetchLog.some(function(f){ var m = f.body.messages; return m && !f.body.stream && String(m[0].content).indexOf('你的关键词') >= 0; }));
  T('T18 角色看不到世界线（时间线未混入角色记忆）', firstReal(cv1).memory.indexOf('码头') === -1 && firstReal(cv1).memory.indexOf('登船') === -1);

  // --- FAB「时间线」小工具弹窗 ---
  $(d, '#btnMore').click();
  const tlItem = $(d, '.fab-item[data-act="timeline"]');
  T('T18 FAB 有「时间线」入口', !!tlItem);
  tlItem.click();
  T('T18 时间线弹窗打开', !$(d, '#timelineModal').classList.contains('hidden'));
  T('T18 弹窗正文含时间线内容', $(d, '#timelineBody').textContent.indexOf('夜风拂过码头') >= 0);
  T('T18 弹窗说明仅作者可见', $(d, '#timelineModal').textContent.indexOf('只给你') >= 0 && $(d, '#timelineModal').textContent.indexOf('角色看不到') >= 0);
  $(d, '#timelineClose').click();
  T('T18 时间线弹窗关闭', $(d, '#timelineModal').classList.contains('hidden'));

  // --- 设置弹窗「世界观」页签世界线文本区回填 ---
  $(d, '#btnGroupSettings').click();
  T('T18 设置回填剧情时间线', $(d, '#gsWorldMem').value.indexOf('夜风拂过码头') >= 0);
  $(d, '#gsClose').click();

  // --- 主页 ＋菜单：新建攻略 / 新建模拟 占位 ---
  $(d, '#btnNewConv').click();
  const acts = [].map.call($(d, '#newConvMenu').querySelectorAll('.menu-item'), function(b){ return b.getAttribute('data-act'); });
  T('T18 菜单顺序 新建故事→攻略→模拟→续写剧情→导入记忆', acts.indexOf('story') >= 0 && acts.indexOf('guide') === acts.indexOf('story') + 1 && acts.indexOf('sim') === acts.indexOf('guide') + 1 && acts.indexOf('continue') === acts.indexOf('sim') + 1 && acts.indexOf('import') === acts.indexOf('continue') + 1);
  $(d, '#newConvMenu [data-act="guide"]').click();
  T('T18 点「新建攻略」提示开发中', $(d, '#toast .toast-txt').textContent.indexOf('攻略模式开发中') >= 0);
  $(d, '#btnNewConv').click();
  $(d, '#newConvMenu [data-act="sim"]').click();
  T('T18 点「新建模拟」提示开发中', $(d, '#toast .toast-txt').textContent.indexOf('模拟模式开发中') >= 0);

  // --- 退出确认弹窗（挂原生 exitApp 桩：jsdom 里 window.close() 会销毁文档，改验原生退出路径）---
  const exMod = $(d, '#exitModal');
  T('T18 退出弹窗默认隐藏', exMod.classList.contains('hidden'));
  exMod.classList.remove('hidden');
  $(d, '#exitNo').click();
  T('T18 点「取消」退出弹窗关闭', exMod.classList.contains('hidden'));
  const exitMock = { called: false };
  w.Capacitor = { Plugins: { App: { exitApp: function(){ exitMock.called = true; } } }, isNativePlatform: function(){ return false; } };
  exMod.classList.remove('hidden');
  $(d, '#exitYes').click();
  T('T18 确认退出走原生 exitApp', exitMock.called === true);
  T('T18 确认退出弹窗关闭', exMod.classList.contains('hidden'));
}

/* ================= T19 v0.4.5 垃圾桶恢复 + 导出选格式 + 头像裁剪 + 关系名两行 + 链接确认 + 时间线 ================= */
async function t19(){
  const dom = boot(function(w){
    w.localStorage.setItem('ds_settings', settingsJson());
    w.localStorage.setItem('ds_convs', JSON.stringify([seedConv()]));
    w.localStorage.setItem('ds_cards', JSON.stringify([
      { id:21, name:'阿离', avatar:{mode:'svg', value:''}, persona:'人设一', memory:'', keywords:[{id:1, key:'旧友', detail:'童年玩伴'}] },
      { id:22, name:'小满', avatar:{mode:'svg', value:''}, persona:'人设二', memory:'', keywords:[] }
    ]));
    w.localStorage.setItem('ds_worlds', JSON.stringify([
      { id:31, name:'苍梧界', avatar:{mode:'svg', value:''}, world:'一个修仙世界', keywords:[] }
    ]));
  });
  const w = dom.window, d = w.document;
  w.confirm = function(){ return true; };   // 删除确认一律通过

  // ---- 1. 导出弹窗：三种格式 ----
  const dl = [];
  w.URL.createObjectURL = function(b){ dl.push(b); return 'blob:mock'; };
  $(d, '#btnCards').click();
  d.querySelector('#cardGrid .lib-card [data-act="export"]').click();
  T('T19 导出弹窗打开', !$(d, '#exportModal').classList.contains('hidden'));
  T('T19 导出弹窗标题为角色卡', $(d, '#exportKind').textContent === '角色卡');
  T('T19 导出弹窗显示名字', $(d, '#exportName').textContent.indexOf('阿离') >= 0);
  T('T19 导出弹窗四个格式按钮可见', ['#btnExportMd','#btnExportTxt','#btnExportJson','#btnExportPng'].every(function(s){ return $(d, s); }));
  $(d, '#btnExportCancel').click();
  T('T19 点「取消」关闭导出弹窗', $(d, '#exportModal').classList.contains('hidden'));
  T('T19 取消不产生下载', dl.length === 0);

  d.querySelector('#cardGrid .lib-card [data-act="export"]').click();
  $(d, '#btnExportMd').click();
  T('T19 选 md 后弹窗关闭', $(d, '#exportModal').classList.contains('hidden'));
  T('T19 选 md 生成下载', dl.length === 1);
  T('T19 md 导出为纯文本（text/plain）', dl[0].type === 'text/plain;charset=utf-8');
  T('T19 选 md 提示已导出', $(d, '#toast .toast-txt').textContent.indexOf('md') >= 0);

  d.querySelector('#cardGrid .lib-card [data-act="export"]').click();
  $(d, '#btnExportTxt').click();
  T('T19 选 txt 生成下载', dl.length === 2);
  T('T19 txt 导出也是纯文本', dl[1].type === 'text/plain;charset=utf-8');
  T('T19 选 txt 提示已导出', $(d, '#toast .toast-txt').textContent.indexOf('txt') >= 0);

  // json 分支走原备份导出（application/json 完整备份，含头像）
  d.querySelector('#cardGrid .lib-card [data-act="export"]').click();
  $(d, '#btnExportJson').click();
  T('T19 选梦语 json 后弹窗关闭', $(d, '#exportModal').classList.contains('hidden'));
  T('T19 选梦语 json 提示已导出', $(d, '#toast .toast-txt').textContent.indexOf('json') >= 0);
  T('T19 梦语 json 走完整备份（application/json）', dl.length === 3 && dl[2].type === 'application/json');

  // 世界书导出同样弹窗
  $(d, '#btnWorlds').click();
  d.querySelector('#worldGrid .lib-card [data-act="export"]').click();
  T('T19 世界书导出弹窗标题', $(d, '#exportKind').textContent === '世界书');
  T('T19 世界书导出弹窗显示名字', $(d, '#exportName').textContent.indexOf('苍梧界') >= 0);
  $(d, '#btnExportCancel').click();

  // ---- 2. 垃圾桶：删角色卡 / 世界书 / 聊天后都能恢复 ----
  $(d, '#btnTrash').click();
  T('T19 垃圾桶初始为空', $(d, '#trashList').textContent.indexOf('垃圾桶是空的') >= 0);

  $(d, '#btnCards').click();
  d.querySelector('#cardGrid .lib-card [data-act="del"]').click();
  T('T19 删角色卡弹出应用内确认窗（不是系统 confirm）', !$(d, '#confirmModal').classList.contains('hidden') && $(d, '#cmTitle').textContent.indexOf('删除角色卡') >= 0);
  T('T19 确认窗文案提到垃圾桶', $(d, '#cmDesc').textContent.indexOf('垃圾桶') >= 0);
  T('T19 轻量删除无需等倒计时', $(d, '#cmYes').disabled === false);
  $(d, '#cmYes').click();
  T('T19 删角色卡进垃圾桶', JSON.parse(w.localStorage.getItem('ds_trash')).length === 1);
  T('T19 垃圾桶记录类型为角色卡', JSON.parse(w.localStorage.getItem('ds_trash'))[0].kind === 'card');
  T('T19 垃圾桶记录名字', JSON.parse(w.localStorage.getItem('ds_trash'))[0].name === '阿离');
  T('T19 角色卡已从库中移除', getCards(w).length === 1);

  $(d, '#btnWorlds').click();
  d.querySelector('#worldGrid .lib-card [data-act="del"]').click();
  $(d, '#cmYes').click();
  T('T19 删世界书进垃圾桶', JSON.parse(w.localStorage.getItem('ds_trash')).length === 2);
  T('T19 世界书已从库中移除', getWorlds(w).length === 0);

  $(d, '#btnTrash').click();
  T('T19 垃圾桶两条记录', d.querySelectorAll('#trashList .trash-row').length === 2);
  const rowNames = [].map.call(d.querySelectorAll('#trashList .trash-name'), function(x){ return x.textContent; });
  T('T19 垃圾桶按最近删除排序', rowNames[0] === '苍梧界' && rowNames[1] === '阿离');
  T('T19 垃圾桶显示类型标签', d.querySelector('#trashList .trash-kind').textContent === '世界书');

  // 恢复世界书
  d.querySelector('#trashList .trash-row [data-act="restore"]').click();
  T('T19 恢复世界书回到库', getWorlds(w).length === 1 && getWorlds(w)[0].name === '苍梧界');
  T('T19 恢复后从垃圾桶移除', JSON.parse(w.localStorage.getItem('ds_trash')).length === 1);
  T('T19 恢复提示 toast', $(d, '#toast .toast-txt').textContent.indexOf('已恢复世界书「苍梧界」') >= 0);
  // 恢复角色卡（不带记忆）
  d.querySelector('#trashList .trash-row [data-act="restore"]').click();
  T('T19 恢复角色卡回到库', getCards(w).length === 2);
  T('T19 恢复的角色卡不带记忆', getCards(w)[1].memory === '');
  T('T19 恢复后垃圾桶为空', JSON.parse(w.localStorage.getItem('ds_trash')).length === 0);
  T('T19 恢复后新 id 不与原 id 冲突', getWorlds(w)[0].id !== 31 && getCards(w)[1].id !== 21);

  // 删聊天 → 垃圾桶 → 恢复（聊天按原样恢复）
  const cvBefore = getConv(w);
  cvBefore.history = [{ id:1, speakerId:'user', speaker:'我', role:'user', text:'记住这句话', time:Date.now(), status:'done' }];
  cvBefore.worldMem = '第一件事\n第二件事';
  w.localStorage.setItem('ds_convs', JSON.stringify([cvBefore]));
  const dom2 = boot(function(w2){
    w2.localStorage.setItem('ds_settings', settingsJson());
    w2.localStorage.setItem('ds_convs', JSON.stringify([cvBefore]));
  });
  const w2 = dom2.window, d2 = w2.document;
  $(d2, '.conv-item').click();
  $(d2, '#btnGroupSettings').click();   // 打开群设置
  $(d2, '#gsDelConv').click();
  T('T19 删除聊天先弹确认', !$(d2, '#confirmModal').classList.contains('hidden'));
  T('T19 删除确认说明可在垃圾桶恢复', $(d2, '#cmDesc').textContent.indexOf('垃圾桶') >= 0);
  $(d2, '#cmYes').disabled = false;   // 跳过 5 秒冷静倒计时（倒计时本身不在本用例范围）
  $(d2, '#cmYes').click();
  T('T19 删聊天进垃圾桶', JSON.parse(w2.localStorage.getItem('ds_trash')).length === 1);
  T('T19 垃圾桶记录类型为聊天', JSON.parse(w2.localStorage.getItem('ds_trash'))[0].kind === 'conv');
  T('T19 删聊天后会话列表空', JSON.parse(w2.localStorage.getItem('ds_convs')).length === 0);
  $(d2, '#btnTrash').click();
  T('T19 垃圾桶显示聊天记录', d2.querySelector('#trashList .trash-kind').textContent === '聊天');
  d2.querySelector('#trashList .trash-row [data-act="restore"]').click();
  const restored = JSON.parse(w2.localStorage.getItem('ds_convs'));
  T('T19 恢复聊天回到列表', restored.length === 1 && restored[0].name === '测试群');
  T('T19 恢复聊天保留成员', realChars(restored[0]).length === 1 && firstReal(restored[0]).name === '小智' && hasTrans(restored[0]));
  T('T19 恢复聊天保留消息', restored[0].history.length === 1 && restored[0].history[0].text === '记住这句话');
  T('T19 恢复聊天保留世界观时间线', restored[0].worldMem === '第一件事\n第二件事');
  T('T19 恢复聊天换了新 id', restored[0].id !== cvBefore.id);
  T('T19 恢复聊天后垃圾桶清空', JSON.parse(w2.localStorage.getItem('ds_trash')).length === 0);

  // 垃圾桶上限 30：塞 35 条只留最近 30
  const dom3 = boot(function(w3){
    w3.localStorage.setItem('ds_settings', settingsJson());
    w3.localStorage.setItem('ds_convs', JSON.stringify([seedConv()]));
    const many = [];
    for(let i=0;i<35;i++) many.push({ id:9000+i, kind:'card', name:'卡'+i, at:Date.now(), data:{ id:i, name:'卡'+i, persona:'', memory:'', keywords:[] } });
    w3.localStorage.setItem('ds_trash', JSON.stringify(many));
  });
  const w3 = dom3.window, d3 = w3.document;
  $(d3, '#btnTrash').click();
  const rows3 = d3.querySelectorAll('#trashList .trash-row');
  T('T19 载入时垃圾桶截断到 30', rows3.length === 30);
  T('T19 截断保留最近的（卡0 在最前）', rows3[0].querySelector('.trash-name').textContent === '卡0');
  T('T19 截断丢弃最旧的（卡34 不在）', [].every.call(rows3, function(r){ return r.querySelector('.trash-name').textContent !== '卡34'; }));

  // ---- 3. 头像裁剪 ----
  const dom4 = boot(function(w4){
    w4.localStorage.setItem('ds_settings', settingsJson());
    w4.localStorage.setItem('ds_convs', JSON.stringify([seedConv()]));
  });
  const w4 = dom4.window, d4 = w4.document;
  T('T19 裁剪弹窗默认隐藏', $(d4, '#avCropModal').classList.contains('hidden'));
  T('T19 原图预览默认收起', $(d4, '#avCropOriginBox').classList.contains('hidden'));
  T('T19 缩放滑块默认 100%', $(d4, '#avCropZoom').value === '100');
  $(d4, '#avCropModal').classList.remove('hidden');
  $(d4, '#btnAvCropOrigin').click();
  T('T19 点「查看原图」展开原图', !$(d4, '#avCropOriginBox').classList.contains('hidden'));
  T('T19 展开后按钮变「收起原图」', $(d4, '#btnAvCropOrigin').textContent === '收起原图');
  $(d4, '#btnAvCropOrigin').click();
  T('T19 再点收起原图', $(d4, '#avCropOriginBox').classList.contains('hidden') && $(d4, '#btnAvCropOrigin').textContent === '查看原图');
  $(d4, '#btnAvCropOrigin').click();
  $(d4, '#btnAvCropCancel').click();
  T('T19 点「取消」关闭裁剪弹窗', $(d4, '#avCropModal').classList.contains('hidden'));
  T('T19 关闭时一并收起原图', $(d4, '#avCropOriginBox').classList.contains('hidden'));
  // 头像入口仍走同一套上传控件（fileToAvatar 由裁剪弹窗统一接管）
  $(d4, '.conv-item').click();
  $(d4, '#btnGroupSettings').click();
  T('T19 群设置头像上传控件仍在', !!$(d4, '#gsAvFile'));
  $(d4, '#gsClose').click();

  // ---- 3b. 关系名折行（直接跑应用里的 relLabelLines 源码，纯函数无依赖）----
  const relFnSrc = APP_SCRIPT.match(/function relLabelLines\(rel\)\{[\s\S]*?\n\}/)[0];
  const relLabelLines = new Function('return (' + relFnSrc + ')')();
  T('T19 短关系名不折行', JSON.stringify(relLabelLines('旧友')) === '["旧友"]');
  T('T19 6 字以内不折行', JSON.stringify(relLabelLines('同门师兄弟')) === '["同门师兄弟"]');
  T('T19 长关系名折成两行', relLabelLines('杀父之仇不共戴天').length === 2);
  T('T19 折行不丢字', relLabelLines('杀父之仇不共戴天').join('') === '杀父之仇不共戴天');
  T('T19 优先在标点处折行', JSON.stringify(relLabelLines('同门师兄，亦是挚友')) === JSON.stringify(['同门师兄，', '亦是挚友']));
  T('T19 无标点时按中间折', JSON.stringify(relLabelLines('青梅竹马两小无猜')) === JSON.stringify(['青梅竹马', '两小无猜']));

  // ---- 4. 关于：链接确认弹窗 ----
  const nav = [];
  w4.open = function(u){ nav.push(u); };
  $(d4, '#btnAbout').click();
  $(d4, '#aboutGithub').click();
  T('T19 点 GitHub 先弹确认弹窗', !$(d4, '#linkModal').classList.contains('hidden'));
  T('T19 确认弹窗不再显示网址', $(d4, '#linkUrl') === null && $(d4, '#linkDesc').textContent.indexOf('github.com') === -1);
  T('T19 未确认前不跳转', nav.length === 0);
  $(d4, '#linkCancel').click();
  T('T19 点「取消」关闭确认弹窗', $(d4, '#linkModal').classList.contains('hidden'));
  T('T19 点「取消」不跳转', nav.length === 0);
  $(d4, '#aboutGithub').click();
  $(d4, '#linkGo').click();
  T('T19 点「打开」才跳转', nav.length === 1 && nav[0].indexOf('github.com') >= 0);
  T('T19 跳转后弹窗关闭', $(d4, '#linkModal').classList.contains('hidden'));
  $(d4, '#aboutBili').click();
  T('T19 哔哩哔哩也走确认弹窗', !$(d4, '#linkModal').classList.contains('hidden'));
  $(d4, '#linkCancel').click();
  $(d4, '#aboutQQ').click();
  T('T19 QQ 群弹确认弹窗', !$(d4, '#linkModal').classList.contains('hidden'));
  T('T19 QQ 群确认不显示群号与新链接', $(d4, '#linkUrl') === null && $(d4, '#linkDesc').textContent.indexOf('598382490') === -1 && $(d4, '#linkDesc').textContent.indexOf('qq.com') === -1);
  T('T19 QQ 群确认文案不含群号', $(d4, '#linkDesc').textContent.indexOf('598382490') === -1 && $(d4, '#linkDesc').textContent.indexOf('QQ 群') >= 0);
  T('T19 关于页 QQ 按钮不显示群号', $(d4, '#aboutQQ').textContent.indexOf('598382490') === -1);
  $(d4, '#linkCancel').click();
  $(d4, '#aboutSite').click();
  T('T19 官网仍为占位 toast 不弹窗', $(d4, '#linkModal').classList.contains('hidden') && $(d4, '#toast .toast-txt').textContent.indexOf('官方网站暂未开放') >= 0);
}

/* ================= T20 v0.4.5 记忆与时间顺序注入（三模式统一） ================= */
async function t20(){
  const dom = boot(function(w){
    w.localStorage.setItem('ds_settings', settingsJson());
    const cv = seedConv();
    cv.selectedNext = [11];   // 群聊：要有人被选中 / 被 @ 才会调 API
    w.localStorage.setItem('ds_convs', JSON.stringify([cv]));
  });
  const w = dom.window, d = w.document;
  $(d, '.conv-item').click();
  streamQueue.push(['data: {"choices":[{"delta":{"content":"出发！"},"index":0}]}\n\ndata: [DONE]\n\n']);
  jsonQueue.push({ choices:[{ message:{ content:'无新记忆。' } }] });
  jsonQueue.push({ choices:[{ message:{ content:'无更新。' } }] });
  $(d, '#input').value = '继续';
  $(d, '#btnSend').click();
  await tick();
  T('T20 群聊系统提示含【记忆与时间顺序】', fetchLog.some(function(f){
    var m = f.body.messages; return m && String(m[0].content).indexOf('【记忆与时间顺序】') >= 0;
  }));
  T('T20 群聊规则含「越靠前的事发生得越早」', fetchLog.some(function(f){
    var m = f.body.messages; return m && String(m[0].content).indexOf('越靠前的事发生得越早') >= 0;
  }));
  T('T20 群聊规则含「不知情的事不要提起」', fetchLog.some(function(f){
    var m = f.body.messages; return m && String(m[0].content).indexOf('你并不知情——不要凭空知道这些事，也不要提起它们') >= 0;
  }));
  T('T20 时间顺序规则排在关键词规则之前', fetchLog.some(function(f){
    var m = f.body.messages; if(!m) return false;
    var c = String(m[0].content);
    return c.indexOf('【记忆与时间顺序】') >= 0 && (c.indexOf('【关键词】') < 0 || c.indexOf('【记忆与时间顺序】') < c.indexOf('【关键词】'));
  }));
  T('T20 时间线（世界线）仍不注入角色', fetchLog.every(function(f){
    var m = f.body.messages; return !m || String(m[0].content).indexOf('剧情时间线') < 0;
  }));

  // 私聊模式同样注入
  $(d, '#btnNewConv').click();
  $(d, '#newConvMenu [data-act="dm"]').click();
  fetchLog.length = 0;
  streamQueue.push(['data: {"choices":[{"delta":{"content":"在的。"},"index":0}]}\n\ndata: [DONE]\n\n']);
  jsonQueue.push({ choices:[{ message:{ content:'无新记忆。' } }] });
  jsonQueue.push({ choices:[{ message:{ content:'无更新。' } }] });
  $(d, '#input').value = '在吗';
  $(d, '#btnSend').click();
  await tick();
  T('T20 私聊系统提示含【记忆与时间顺序】', fetchLog.some(function(f){
    var m = f.body.messages; return m && String(m[0].content).indexOf('【记忆与时间顺序】') >= 0;
  }));
}

/* ================= T21 v0.4.6 对话温度 / 思考等级 / 生成温度 ================= */
async function t21(){
  const dom = boot(function(w){
    w.localStorage.setItem('ds_settings', settingsJson());   // 全局深度思考＝关 → 新会话默认 off
    const cv = seedConv();
    const now = Date.now();
    cv.history = [
      { id:101, speakerId:'user', speaker:'我', role:'user', text:'你好', time:now, status:'done' },
      { id:102, speakerId:11, speaker:'小智', role:'assistant', text:'你好呀', time:now, status:'done' }
    ];
    cv.selectedNext = [11];
    w.localStorage.setItem('ds_convs', JSON.stringify([cv]));
  });
  const w = dom.window, d = w.document;
  $(d, '.conv-item').click();

  // ---- 迁移：老会话按全局开关落到 off，温度回落到默认值 ----
  T('T21 全局关闭时老会话思考等级迁移为 off', getConv(w).thinkLevel === 'off');
  T('T21 老会话温度迁移为默认 0.9', getConv(w).temperature === 0.9);
  T('T21 老会话生成温度迁移为默认 0.7', getConv(w).contTemp === 0.7);

  // ---- 群设置回填 ----
  $(d, '#btnGroupSettings').click();
  const lv = d.querySelectorAll('#gsThinkLevel button');
  T('T21 思考等级三档按钮 Medium/High/Max', lv.length === 3 && lv[0].textContent === 'Medium' && lv[1].textContent === 'High' && lv[2].textContent === 'Max');
  T('T21 off 时无档位高亮', [].every.call(lv, function(b){ return !b.classList.contains('on'); }));
  T('T21 提示语说明当前已关闭思考', $(d, '#gsThinkHint').textContent.indexOf('关闭思考') >= 0);
  T('T21 对话温度滑杆回填 0.9', $(d, '#gsTemp').value === '0.9' && $(d, '#gsTempVal').textContent === '0.9');
  T('T21 智能体滑杆同步 0.9', $(d, '#dmTemp').value === '0.9' && $(d, '#dmTempVal').textContent === '0.9');
  T('T21 生成温度滑杆回填 0.7', $(d, '#contTemp').value === '0.7' && $(d, '#contTempVal').textContent === '0.7');

  // ---- 选择 High + 拖动温度 ----
  lv[1].click();
  T('T21 选 High 后高亮且 Medium 熄灭', lv[1].classList.contains('on') && !lv[0].classList.contains('on'));
  T('T21 选 High 后提示语显示 High', $(d, '#gsThinkHint').textContent.indexOf('High') >= 0);
  lv[1].click();
  T('T21 再点已选档位＝关闭思考', [].every.call(lv, function(b){ return !b.classList.contains('on'); }) && $(d, '#gsThinkHint').textContent.indexOf('关闭思考') >= 0);
  lv[1].click();
  const gsTemp = $(d, '#gsTemp');
  gsTemp.value = '1.4';
  gsTemp.dispatchEvent(new w.Event('input', { bubbles:true }));
  T('T21 拖动温度后两个页签滑杆同步', $(d, '#dmTemp').value === '1.4' && $(d, '#dmTempVal').textContent === '1.4' && $(d, '#gsTempVal').textContent === '1.4');
  const contTemp = $(d, '#contTemp');
  contTemp.value = '1.2';
  contTemp.dispatchEvent(new w.Event('input', { bubbles:true }));
  T('T21 生成温度数值实时更新', $(d, '#contTempVal').textContent === '1.2');
  $(d, '#gsSave').click();
  T('T21 保存后 temperature=1.4', getConv(w).temperature === 1.4);
  T('T21 生成温度存进全局设置（不再是每个会话）', JSON.parse(w.localStorage.getItem('ds_settings')).contTemp === 1.2);
  T('T21 保存后 thinkLevel=high', getConv(w).thinkLevel === 'high');
  T('T21 保存后弹窗关闭', $(d, '#groupSettingsModal').classList.contains('hidden'));

  // ---- 真发一条消息：思考开启时必须带 reasoning_effort，且不发送 temperature ----
  fetchLog.length = 0;
  streamQueue.push(['data: {"choices":[{"delta":{"content":"在的"}}]}\n\ndata: [DONE]\n\n']);
  jsonQueue.push({ choices:[{ message:{ content:'{}' } }] });
  $(d, '#input').value = '在吗';
  $(d, '#btnSend').click();
  await tick(30);
  const replyCall = fetchLog.filter(function(f){ return f.body.stream === true; })[0];
  T('T21 回复请求带 thinking enabled', !!replyCall && replyCall.body.thinking && replyCall.body.thinking.type === 'enabled');
  T('T21 回复请求带 reasoning_effort=high（真实生效）', !!replyCall && replyCall.body.reasoning_effort === 'high');
  T('T21 思考模式下不发送 temperature', !!replyCall && typeof replyCall.body.temperature === 'undefined');

  // ---- 关掉思考后再发：temperature 生效、不带 reasoning_effort ----
  $(d, '#btnGroupSettings').click();
  d.querySelectorAll('#gsThinkLevel button')[1].click();   // 高亮中 → 关闭
  $(d, '#gsSave').click();
  T('T21 关闭思考后 thinkLevel=off', getConv(w).thinkLevel === 'off');
  fetchLog.length = 0;
  streamQueue.push(['data: {"choices":[{"delta":{"content":"嗯"}}]}\n\ndata: [DONE]\n\n']);
  jsonQueue.push({ choices:[{ message:{ content:'{}' } }] });
  $(d, '#input').value = '再说一句';
  $(d, '#btnSend').click();
  await tick(30);
  const replyCall2 = fetchLog.filter(function(f){ return f.body.stream === true; })[0];
  T('T21 关闭思考后带 thinking disabled', !!replyCall2 && replyCall2.body.thinking && replyCall2.body.thinking.type === 'disabled');
  T('T21 关闭思考后 temperature 生效为 1.4', !!replyCall2 && replyCall2.body.temperature === 1.4);
  T('T21 关闭思考后不带 reasoning_effort', !!replyCall2 && typeof replyCall2.body.reasoning_effort === 'undefined');

  // ---- 续写剧情页签的生成温度滑杆参数 ----
  $(d, '#btnGroupSettings').click();
  const ct = $(d, '#contTemp');
  T('T21 续写弹窗有生成温度滑杆（0-2 步进 0.1）', !!ct && ct.getAttribute('min') === '0' && ct.getAttribute('max') === '2' && ct.getAttribute('step') === '0.1');
}

/* ================= T22 续写生成温度（全局设置，真实下发） ================= */
async function t22(){
  const dom = boot(function(w){
    w.localStorage.setItem('ds_settings', settingsJson());
    w.localStorage.setItem('ds_convs', JSON.stringify([seedConv()]));
  });
  const w = dom.window, d = w.document;
  $(d, '#btnNewConv').click();
  d.querySelector('#newConvMenu [data-act="continue"]').click();
  T('T22 生成温度默认 0.7', $(d, '#contTemp').value === '0.7');
  const sl = $(d, '#contTemp');
  sl.value = '1.6';
  sl.dispatchEvent(new w.Event('input', { bubbles:true }));
  T('T22 拖动后存进全局设置', JSON.parse(w.localStorage.getItem('ds_settings')).contTemp === 1.6);
  T('T22 数值标签同步', $(d, '#contTempVal').textContent === '1.6');
  putContFile(d, w, '第一件事。第二件事。');
  await tick(20);
  jsonQueue.push({ choices:[{ message:{ content: JSON.stringify({ members:[{ name:'甲', role:'main', persona:'人设', memory:'', keywords:[] }], world:{ world:'世界', keywords:[] }, player:'', summary:'总结', timeline:'一\n二' }) } }] });
  fetchLog.length = 0;
  $(d, '#btnContGo').click();
  await tick(30);
  const call = fetchLog.filter(function(f){ var m = f.body.messages; return m && String(m[0].content).indexOf('续写剧情助手') >= 0; })[0];
  T('T22 续写请求 temperature=1.6', !!call && call.body.temperature === 1.6);
  T('T22 续写请求不带 reasoning_effort', !!call && typeof call.body.reasoning_effort === 'undefined');
  const newest = allConvs(w).pop();
  T('T22 续写成功写入新会话的成员', realChars(newest).length === 1 && firstReal(newest).name === '甲');
}

/* ================= T23 v0.4.7 人物详情 · 图片 · 上下文百分比 · 日期注入 ================= */
async function t23(){
  const dom = boot(function(w){
    w.localStorage.setItem('ds_settings', settingsJson());
    const cv = seedConv();
    cv.calDate = '';          // 未定日期 → 首次发送时按角色卡 / 世界书推导
    cv.ctxLen = 1000;         // 上下文长度设小一点，方便验证百分比
    const now = Date.now();
    cv.history = [
      { id:101, speakerId:'user', speaker:'我', role:'user', text:'看这张图', images:[{ name:'pic.png', url:'data:image/png;base64,iVBORw0KGgo=' }], time:now, status:'done' },
      { id:102, speakerId:11, speaker:'小智', role:'ai', text:'我看到了', time:now, status:'done' }
    ];
    cv.selectedNext = [11];
    w.localStorage.setItem('ds_convs', JSON.stringify([cv]));
  });
  const w = dom.window, d = w.document;
  $(d, '.conv-item').click();

  // ---- 图片：气泡渲染 + 点开放大 ----
  const im = $(d, '.msg[data-id="101"] .msg-imgs img');
  T('T23 历史图片渲染在气泡里', !!im && im.getAttribute('src').indexOf('data:image/png') === 0);
  if(im){
    im.click();
    T('T23 点图片打开大图查看', !$(d, '#imgView').classList.contains('hidden'));
    $(d, '#imgViewClose').click();
    T('T23 关闭大图查看', $(d, '#imgView').classList.contains('hidden'));
  }

  // ---- 人物详情（只读）----
  const av = $(d, '.msg[data-id="102"] .avatar');
  T('T23 AI 消息有头像可点', !!av);
  if(av) av.click();
  T('T23 点 AI 头像打开人物详情', !$(d, '#charViewModal').classList.contains('hidden'));
  T('T23 详情显示名字', $(d, '#cvmName').textContent === '小智');
  T('T23 详情显示人设', $(d, '#cvmPersona').textContent.indexOf('好奇') >= 0);
  T('T23 详情显示类型与在场标签', $(d, '#cvmTags').textContent.indexOf('次要角色') >= 0 && $(d, '#cvmTags').textContent.indexOf('在场') >= 0);
  T('T23 详情显示关键词', $(d, '#cvmKeywords').textContent.indexOf('杀父之仇') >= 0);
  T('T23 详情是只读的（没有输入框）', $(d, '#charViewModal').querySelectorAll('input,textarea').length === 0);
  $(d, '#cvmClose').click();
  T('T23 关闭人物详情', $(d, '#charViewModal').classList.contains('hidden'));
  $(d, '.msg[data-id="101"] .avatar').click();
  T('T23 点自己的头像不打开详情', $(d, '#charViewModal').classList.contains('hidden'));

  // ---- 弹窗底部按钮固定 ----
  T('T23 弹窗已套用 flexed 布局', $(d, '#summaryModal .modal').classList.contains('flexed') && !!$(d, '#summaryModal .modal > .modal-body'));
  T('T23 底部按钮是弹窗直接子元素（不会被滚走）', $(d, '#summaryModal .modal').querySelector(':scope > .modal-actions') !== null);
  T('T23 标题也留在顶部', $(d, '#summaryModal .modal').querySelector(':scope > h3') !== null);

  // ---- 上下文百分比 ----
  $(d, '#btnSummary').click();
  T('T23 总结弹窗打开并显示上下文百分比', !$(d, '#summaryModal').classList.contains('hidden') && /^上下文 [\d.]+%$/.test($(d, '#sumCtxPct').textContent.trim()));
  $(d, '#sumClose').click();

  // ---- 回到底部箭头元素存在 ----
  T('T23 回到底部箭头挂在输入区上方', $(d, '.input-area > #scrollDown') !== null);

  // ---- 首次发送：推导日期 + 图片按多模态发送 ----
  fetchLog.length = 0;
  jsonQueue.push({ choices:[{ message:{ content:'1987-06-14' } }] });   // ensureCalDate 的返回
  streamQueue.push(['data: {"choices":[{"delta":{"content":"好的"}}]}\n\ndata: [DONE]\n\n']);
  jsonQueue.push({ choices:[{ message:{ content:'{}' } }] });
  $(d, '#input').value = '再发一次';
  $(d, '#btnSend').click();
  await tick(40);
  T('T23 首次发消息按角色卡推导出剧情日期', getConv(w).calDate === '1987-06-14');
  const imgCall = fetchLog.filter(function(f){
    var m = f.body.messages; if(!m) return false;
    return m.some(function(x){ return Array.isArray(x.content) && x.content.some(function(p){ return p.type === 'image_url'; }); });
  });
  T('T23 发图按 OpenAI 多模态数组发送', imgCall.length >= 1);
  const sysCall = fetchLog.filter(function(f){ return f.body.messages && String(f.body.messages[0].content).indexOf('【时间与日期】') >= 0; });
  T('T23 角色提示词注入【时间与日期】', sysCall.length >= 1);
  T('T23 提示词含具体日期与星期', sysCall.length >= 1 && String(sysCall[0].body.messages[0].content).indexOf('1987年6月14日') >= 0 && String(sysCall[0].body.messages[0].content).indexOf('星期日') >= 0);
  T('T23 提示词要求按日期行事', sysCall.length >= 1 && String(sysCall[0].body.messages[0].content).indexOf('周末和假期就不该在上学') >= 0);
}

/* ================= T24 v0.4.7 剧情日历 ================= */
async function t24(){
  const dom = boot(function(w){
    w.localStorage.setItem('ds_settings', settingsJson());
    const cv = seedConv();
    cv.calDate = '2026-09-10';   // 星期四
    w.localStorage.setItem('ds_convs', JSON.stringify([cv]));
  });
  const w = dom.window, d = w.document;
  $(d, '.conv-item').click();
  $(d, '#btnMore').click();
  const tl = d.querySelector('#fabMenu [data-act="timeline"]');
  T('T24 「+」里有时间线工具', !!tl);
  tl.click();
  T('T24 时间线弹窗打开', !$(d, '#timelineModal').classList.contains('hidden'));
  T('T24 时间线副标题显示当前日期与星期', $(d, '#timelineSub').textContent.indexOf('2026年9月10日') >= 0 && $(d, '#timelineSub').textContent.indexOf('星期四') >= 0);
  $(d, '#timelineCal').click();
  T('T24 点右上角日历打开日历并收起时间线', !$(d, '#calModal').classList.contains('hidden') && $(d, '#timelineModal').classList.contains('hidden'));
  T('T24 日历标题显示年月', $(d, '#calTitle').textContent === '2026 年 9 月');
  T('T24 星期表头为日一二三四五六', d.querySelector('.cal-week').textContent.replace(/\s/g, '') === '日一二三四五六');
  T('T24 按当月天数生成格子', d.querySelectorAll('#calGrid .cal-cell').length >= 30);
  T('T24 当前日期被高亮', !!d.querySelector('#calGrid .cal-cell.today[data-date="2026-09-10"]'));
  T('T24 首日按星期留出空格', d.querySelectorAll('#calGrid .cal-cell.pad').length === new Date(2026, 8, 1).getDay());
  d.querySelector('#calGrid .cal-cell[data-date="2026-09-20"]').click();
  T('T24 点某天即可改剧情日期', getConv(w).calDate === '2026-09-20');
  T('T24 改完高亮跟着走', !!d.querySelector('#calGrid .cal-cell.today[data-date="2026-09-20"]'));
  $(d, '#calNext').click();
  T('T24 切到下个月', $(d, '#calTitle').textContent === '2026 年 10 月');
  $(d, '#calPrev').click();
  $(d, '#calPrev').click();
  T('T24 切到上个月', $(d, '#calTitle').textContent === '2026 年 8 月');
  $(d, '#calToday').click();
  const t = new Date();
  const td = t.getFullYear() + '-' + ('0' + (t.getMonth() + 1)).slice(-2) + '-' + ('0' + t.getDate()).slice(-2);
  T('T24 设为今天', getConv(w).calDate === td);
  $(d, '#calClose').click();
  T('T24 关闭日历', $(d, '#calModal').classList.contains('hidden'));
}

/* ================= T25 v0.4.7 日期推进（时间词 / 后台校正） ================= */
async function t25(){
  const dom = boot(function(w){
    w.localStorage.setItem('ds_settings', settingsJson());
    const cv = seedConv();
    cv.calDate = '2026-09-10';
    cv.selectedNext = [11];
    w.localStorage.setItem('ds_convs', JSON.stringify([cv]));
  });
  const w = dom.window, d = w.document;
  $(d, '.conv-item').click();
  // 用户说「三天后」→ 本地先推进
  streamQueue.push(['data: {"choices":[{"delta":{"content":"好"}}]}\n\ndata: [DONE]\n\n']);
  jsonQueue.push({ choices:[{ message:{ content:'{}' } }] });
  $(d, '#input').value = '三天后我们再见';
  $(d, '#btnSend').click();
  await tick(30);
  T('T25 「三天后」本地推进三天', getConv(w).calDate === '2026-09-13');
  // 「翌日」推进一天
  streamQueue.push(['data: {"choices":[{"delta":{"content":"嗯"}}]}\n\ndata: [DONE]\n\n']);
  jsonQueue.push({ choices:[{ message:{ content:'{}' } }] });
  $(d, '#input').value = '翌日清晨，我们出发';
  $(d, '#btnSend').click();
  await tick(30);
  T('T25 「翌日」推进一天', getConv(w).calDate === '2026-09-14');
  // 普通对话不动日期
  streamQueue.push(['data: {"choices":[{"delta":{"content":"在"}}]}\n\ndata: [DONE]\n\n']);
  jsonQueue.push({ choices:[{ message:{ content:'{}' } }] });
  $(d, '#input').value = '你在做什么';
  $(d, '#btnSend').click();
  await tick(30);
  T('T25 普通对话不改日期', getConv(w).calDate === '2026-09-14');
}

/* ================= T26 v0.4.7 追加：上下文长度单位 k/m + 自动总结百分比 ================= */
async function t26(){
  const dom = boot(function(w){
    w.localStorage.setItem('ds_settings', settingsJson());
    const cv = seedConv();
    const now = Date.now();
    cv.history = [{ id:101, speakerId:'user', speaker:'我', role:'user', text:'你好', time:now, status:'done' }];
    w.localStorage.setItem('ds_convs', JSON.stringify([cv]));
  });
  const w = dom.window, d = w.document;
  $(d, '.conv-item').click();

  // 全局设置：填 1m
  $(d, '#btnSettings').click();
  $(d, '#stCtxLen').value = '1m';
  $(d, '#stSave').click();
  const gset = JSON.parse(w.localStorage.getItem('ds_settings'));
  T('T26 全局上下文长度 1m = 1000000', gset.ctxLen === 1000000);
  $(d, '#btnSettings').click();
  $(d, '#stCtxLen').value = '128K';       // 大写 K 也要认
  $(d, '#stSave').click();
  T('T26 大写 K 也认', JSON.parse(w.localStorage.getItem('ds_settings')).ctxLen === 128000);
  $(d, '#btnSettings').click();
  $(d, '#stCtxLen').value = '1,000';       // 逗号也认
  $(d, '#stSave').click();
  T('T26 带逗号的写法也认', JSON.parse(w.localStorage.getItem('ds_settings')).ctxLen === 1000);
  $(d, '#btnSettings').click();
  $(d, '#stCtxLen').value = 'abc';
  $(d, '#stSave').click();
  T('T26 乱填不报错、回落 0（用默认值）', JSON.parse(w.localStorage.getItem('ds_settings')).ctxLen === 0);

  // 每个聊天：填 500k
  $(d, '#btnGroupSettings').click();
  $(d, '#gsCtxLen').value = '500k';
  $(d, '#gsSave').click();
  T('T26 每个聊天上下文长度 500k = 500000', getConv(w).ctxLen === 500000);

  // 自动总结改成百分比
  $(d, '#btnSummary').click();
  const opts = d.querySelectorAll('#sumAutoArea .sum-opt');
  T('T26 自动总结三个档是 50% / 75% / 100%', opts.length === 3 && opts[0].textContent === '50%' && opts[1].textContent === '75%' && opts[2].textContent === '100%');
  $(d, '#btnSumAuto').click();
  opts[1].click();
  T('T26 选 75% 写入 autoSummary=75', getConv(w).autoSummary === 75);
  T('T26 文案说明是「上下文长度的 75%」并算出大约字数', $(d, '#sumModeText').textContent.indexOf('「上下文长度」的 75%') >= 0 && $(d, '#sumModeText').textContent.indexOf('375k') >= 0);
  T('T26 百分比按本聊天的上下文长度算', $(d, '#sumCtxPct').textContent.indexOf('%') >= 0);
  $(d, '#btnSumAutoOff').click();
  T('T26 关闭自动总结回到手动', getConv(w).autoSummary === 0 && $(d, '#sumModeText').textContent.indexOf('手动模式') >= 0);
  $(d, '#sumClose').click();

  // 老版本存的绝对字数会被换算成百分比
  const dom2 = boot(function(w){
    w.localStorage.setItem('ds_settings', settingsJson());
    const cv = seedConv();
    cv.autoSummary = 30000;    // 老值是绝对字数
    w.localStorage.setItem('ds_convs', JSON.stringify([cv]));
  });
  const w2 = dom2.window;
  const cv2 = JSON.parse(w2.localStorage.getItem('ds_convs'))[0];
  T('T26 老版绝对字数换算成百分比（30000 / 128000 ≈ 23% → 50）', cv2.autoSummary === 50);
}


/* ================= T27 v0.4.8 剧情转场角色 ================= */
async function t27(){
  const dom = boot(function(w){
    w.localStorage.setItem('ds_settings', settingsJson());
    const cv = seedConv([{ id:12, name:'阿豪', avatar:{mode:'svg', value:''}, persona:'运动达人。', present:true, memory:'', keywords:[], role:'minor', lastMemAt:0 }]);
    w.localStorage.setItem('ds_convs', JSON.stringify([cv]));
  });
  const w = dom.window, d = w.document;
  $(d, '.conv-item').click();
  const cv0 = getConv(w);
  T('T27 群聊自带一个「转场」角色', hasTrans(cv0) && cv0.chars[0].name === '转场');
  T('T27 转场排在最前面', cv0.chars[0].isTrans === true);
  T('T27 转场不计入成员数', $(d, '#headerSub').textContent === '成员 2');
  const chips = d.querySelectorAll('#chipBox .chip');
  T('T27 下轮对话里有「转场」按钮', [].some.call(chips, function(c){ return c.textContent.indexOf('转场') >= 0; }));

  // 成员列表：没有删除按钮、没有在场开关
  $(d, '#btnGroupSettings').click();
  const rows = d.querySelectorAll('#gsMemberList .member-row');
  T('T27 成员列表第一个是转场', rows[0].querySelector('.char-name').textContent === '转场');
  T('T27 转场标记为「剧情转场」', rows[0].querySelector('.char-role').textContent === '剧情转场');
  T('T27 转场没有删除按钮', !rows[0].querySelector('[data-act="del"]'));
  T('T27 转场没有在场开关', !rows[0].querySelector('[data-act="presence"]'));

  // 专属编辑弹窗：只有转场风格与发言格式
  rows[0].querySelector('[data-act="edit"]').click();
  T('T27 点转场打开专属弹窗', !$(d, '#transModal').classList.contains('hidden'));
  T('T27 专属弹窗只有两个输入', $(d, '#transModal').querySelectorAll('textarea').length === 2 && !!$(d, '#transStyle') && !!$(d, '#transFormat'));
  T('T27 转场弹窗没有名字 / 人设 / 记忆 / 关键词', !$(d, '#transModal').querySelector('#dmName') && !$(d, '#transModal').querySelector('.kw-box'));
  $(d, '#transStyle').value = '用一句环境描写带过时间流逝';
  $(d, '#transFormat').value = '旁白：……';
  $(d, '#transSave').click();
  T('T27 转场设置保存', getConv(w).chars[0].transStyle === '用一句环境描写带过时间流逝');
  T('T27 保存后弹窗关闭', $(d, '#transModal').classList.contains('hidden'));
  $(d, '#gsClose').click();

  // 选中「小智」再选中「转场」→ 转场应该仍然排在第一个回复
  d.querySelector('#chipBox .chip[data-id="11"]').click();
  const chips2 = [].slice.call(d.querySelectorAll('#chipBox .chip'));
  const transChip = chips2.filter(function(c){ return c.textContent.indexOf('转场') >= 0; })[0];
  T('T27 能找到「转场」按钮', !!transChip);
  transChip.click();
  T('T27 两个角色都被选中', d.querySelectorAll('#chipBox .chip.on').length === 2);
  streamQueue.push(['data: {"choices":[{"delta":{"content":"夜风穿过街巷。"}}]}\n\ndata: [DONE]\n\n']);
  streamQueue.push(['data: {"choices":[{"delta":{"content":"我在这儿。"}}]}\n\ndata: [DONE]\n\n']);
  jsonQueue.push({ choices:[{ message:{ content:'{}' } }] });
  jsonQueue.push({ choices:[{ message:{ content:'{}' } }] });
  fetchLog.length = 0;
  $(d, '#input').value = '我们走吧';
  $(d, '#btnSend').click();
  await new Promise(function(r){ setTimeout(r, 2200); });   // 多人轮流回复之间有 1.5s 间隔
  const order = fetchLog.filter(function(f){ return f.body.stream; }).map(function(f){ return String(f.body.messages[0].content); });
  T('T27 第一轮回复是「转场」（就算它是后点的）', order.length >= 1 && order[0] && order[0].indexOf('剧情转场') >= 0);
  T('T27 转场提示词带转场风格与发言格式', order.length >= 1 && !!order[0] && order[0].indexOf('用一句环境描写带过时间流逝') >= 0 && order[0].indexOf('旁白：……') >= 0);
  T('T27 转场提示词声明不扮演角色', order.length >= 1 && !!order[0] && order[0].indexOf('你不是故事里的角色') >= 0);
  T('T27 第二轮才是真正的角色', order.length >= 2 && order[1].indexOf('剧情转场') === -1);
  const msgs = getConv(w).history.filter(function(m){ return m.role === 'ai' && m.text; });
  T('T27 转场的回复排在角色之前', msgs.length >= 2 && msgs[0].speaker === '转场');
}

/* ================= T28 v0.4.8 费用按接口真实用量 ================= */
async function t28(){
  const dom = boot(function(w){
    w.localStorage.setItem('ds_settings', settingsJson());
    const cv = seedConv();
    cv.selectedNext = [11];
    w.localStorage.setItem('ds_convs', JSON.stringify([cv]));
  });
  const w = dom.window, d = w.document;
  $(d, '.conv-item').click();
  streamQueue.push([
    'data: {"choices":[{"delta":{"content":"好的"}}]}\n\n',
    'data: {"choices":[],"usage":{"prompt_tokens":1200,"completion_tokens":300,"total_tokens":1500}}\n\n',
    'data: [DONE]\n\n'
  ]);
  jsonQueue.push({ choices:[{ message:{ content:'{}' } }] });
  $(d, '#input').value = '在吗';
  $(d, '#btnSend').click();
  await tick(40);
  const cv = getConv(w);
  T('T28 记录真实输入 tokens', cv.usageIn === 1200);
  T('T28 记录真实输出 tokens', cv.usageOut === 300);
  T('T28 记录调用次数', cv.usageCalls === 1);
  const msg = cv.history.filter(function(m){ return m.speakerId === 11 && m.text; })[0];
  T('T28 本条消息也记下用量', !!msg && msg.usage && msg.usage.in === 1200 && msg.usage.out === 300);

  // 费用面板优先显示真实用量
  $(d, '#btnMore').click();
  d.querySelector('#fabMenu [data-act="cost"]').click();
  const txt = $(d, '#costBody').textContent;
  T('T28 费用面板显示实际 tokens', txt.indexOf('实际输入 tokens') >= 0 && txt.indexOf('1,200') >= 0);
  T('T28 费用面板显示调用次数', txt.indexOf('接口调用次数') >= 0);
  T('T28 费用按真实用量折算', txt.indexOf('实际费用') >= 0);
  $(d, '#costCancel').click();
}

/* ================= T29 v0.4.8 垃圾桶清理 ================= */
async function t29(){
  const dom = boot(function(w){
    w.localStorage.setItem('ds_settings', settingsJson());
    w.localStorage.setItem('ds_convs', JSON.stringify([seedConv()]));
    w.localStorage.setItem('ds_trash', JSON.stringify([
      { id:9001, kind:'card', name:'阿离', at:Date.now(), data:{ id:9001, name:'阿离', avatar:{mode:'svg',value:''}, persona:'', memory:'', keywords:[] } },
      { id:9002, kind:'world', name:'苍梧界', at:Date.now(), data:{ id:9002, name:'苍梧界', avatar:{mode:'svg',value:''}, world:'', keywords:[] } }
    ]));
  });
  const w = dom.window, d = w.document;
  $(d, '#btnTrash').click();
  T('T29 垃圾桶两条记录', d.querySelectorAll('#trashList .trash-row').length === 2);
  T('T29 有全部清理按钮', !!$(d, '#btnTrashClear'));
  T('T29 每条都有单独删除按钮', d.querySelectorAll('#trashList [data-act="purge"]').length === 2);

  d.querySelectorAll('#trashList [data-act="purge"]')[0].click();
  T('T29 单个删除弹应用内确认窗', !$(d, '#confirmModal').classList.contains('hidden') && $(d, '#cmTitle').textContent.indexOf('彻底删除') >= 0);
  $(d, '#cmCancel').click();
  T('T29 取消后记录还在', d.querySelectorAll('#trashList .trash-row').length === 2);

  d.querySelectorAll('#trashList [data-act="purge"]')[0].click();
  $(d, '#cmYes').click();
  T('T29 单个删除后只剩一条', d.querySelectorAll('#trashList .trash-row').length === 1);
  T('T29 单个删除已落盘', JSON.parse(w.localStorage.getItem('ds_trash')).length === 1);

  $(d, '#btnTrashClear').click();
  T('T29 全部清理需二次确认', !$(d, '#confirmModal').classList.contains('hidden') && $(d, '#cmDesc').textContent.indexOf('1 项') >= 0);
  T('T29 全部清理要等倒计时（更重的操作）', $(d, '#cmYes').disabled === true);
  $(d, '#cmYes').disabled = false;
  $(d, '#cmYes').click();
  T('T29 全部清理后垃圾桶为空', JSON.parse(w.localStorage.getItem('ds_trash')).length === 0 && $(d, '#trashList').textContent.indexOf('垃圾桶是空的') >= 0);
}

/* ================= T30 v0.4.8 私聊开场白 ================= */
async function t30(){
  const dom = boot(function(w){
    w.localStorage.setItem('ds_settings', settingsJson());
    const now = Date.now();
    const ai = { id:11, name:'小智', avatar:{mode:'svg', value:''}, persona:'科学家。', present:true, memory:'', keywords:[], role:'minor', firstMes:'嗨，今天想聊点什么？' };
    w.localStorage.setItem('ds_convs', JSON.stringify([{ id:1001, mode:'dm', name:'私聊 1', chars:[ai], history:[], selectedNext:[], randomOrder:false,
      world:'', player:'', apiKey:'', avatar:null, autoMemory:true, summary:'', summaryTs:0, autoSummary:0, maxReplyLen:0,
      relations:[], relationsTs:0, createdAt:now, lastActiveAt:now }]));
  });
  const w = dom.window, d = w.document;
  T('T30 私聊没有「转场」角色', !hasTrans(getConv(w)));
  $(d, '.conv-item').click();
  $(d, '#btnGroupSettings').click();
  T('T30 智能体页签有开场白框', !!$(d, '#dmFirstMes'));
  T('T30 开场白回填', $(d, '#dmFirstMes').value === '嗨，今天想聊点什么？');
  T('T30 有重发开场白按钮', !!$(d, '#btnDmFirstMes'));
  $(d, '#dmFirstMes').value = '（我打了个哈欠）早上好呀。';
  $(d, '#btnDmFirstMes').click();
  await tick();
  const cv = getConv(w);
  T('T30 重发开场白写入一条 AI 消息', cv.history.length === 1 && cv.history[0].speakerId === 11 && cv.history[0].text.indexOf('早上好') >= 0);
  T('T30 重发后设置弹窗关闭', $(d, '#groupSettingsModal').classList.contains('hidden'));
}

/* ================= T31 v0.4.8 返回键先关图片查看 ================= */
async function t31(){
  const dom = boot(function(w){
    w.__backCb = null;
    w.Capacitor = {
      getPlatform: function(){ return 'android'; },
      isNativePlatform: function(){ return true; },
      Plugins: { App: { addListener: function(ev, cb){ if(ev === 'backButton') w.__backCb = cb; } } }
    };
    w.localStorage.setItem('ds_settings', settingsJson());
    const cv = seedConv();
    const now = Date.now();
    cv.history = [{ id:101, speakerId:'user', speaker:'我', role:'user', text:'看图', images:[{ name:'a.png', url:'data:image/png;base64,iVBORw0KGgo=' }], time:now, status:'done' }];
    w.localStorage.setItem('ds_convs', JSON.stringify([cv]));
  });
  const w = dom.window, d = w.document;
  T('T31 原生壳挂了返回键监听', typeof w.__backCb === 'function');
  T('T31 原生壳标记 html.native', d.documentElement.classList.contains('native'));
  $(d, '.conv-item').click();
  $(d, '.msg[data-id="101"] .msg-imgs img').click();
  T('T31 图片查看打开', !$(d, '#imgView').classList.contains('hidden'));
  w.__backCb();
  T('T31 返回键先关图片查看', $(d, '#imgView').classList.contains('hidden'));
  T('T31 返回键没有把聊天退掉', !!$(d, '.msg[data-id="101"]'));
}

/* ================= T32 v0.4.8 酒馆 png 编解码（纯函数往返） ================= */
async function t32(){
  const names = ['crcTable','crc32','adler32','deflateStore','pngChunk','latin1Bytes','latin1Str','utf8Bytes','utf8Str','bytesToBase64','base64ToBytes','pngEncode','pngReadChunks','pngEmbeddedJson','cardToST','stToCard','worldToST','stToWorld'];
  let src = 'var _crcTab = null;\n';
  const missing = [];
  names.forEach(function(n){
    const m = APP_SCRIPT.match(new RegExp('function ' + n + '\\([\\s\\S]*?\\n\\}'));
    if(!m){ missing.push(n); return; }
    src += m[0] + '\n';
  });
  T('T32 全部 png 函数都能取到源码', missing.length === 0);
  if(missing.length) return;
  src += 'return { pngEncode:pngEncode, pngReadChunks:pngReadChunks, pngEmbeddedJson:pngEmbeddedJson, cardToST:cardToST, stToCard:stToCard, worldToST:worldToST, stToWorld:stToWorld, crc32:crc32, deflateStore:deflateStore, utf8Bytes:utf8Bytes, bytesToBase64:bytesToBase64 };';
  const M = new Function(src)();

  // --- PNG 编解码往返 ---
  const W = 3, H = 2;
  const rgba = new Uint8Array(W * H * 4);
  for(let i = 0; i < W * H; i++){ rgba[i*4] = 10 * i; rgba[i*4+1] = 20; rgba[i*4+2] = 30; rgba[i*4+3] = 255; }
  const card = { name:'阿离', persona:'冷面剑客', firstMes:'……你来了。', keywords:[{ key:'暗器', detail:'一手好暗器' }] };
  const b64 = M.bytesToBase64(M.utf8Bytes(JSON.stringify(M.cardToST(card))));
  const png = M.pngEncode(W, H, rgba, [{ keyword:'chara', text:b64 }]);
  T('T32 产出的是合法 PNG（八字节签名）', png[0] === 137 && png[1] === 80 && png[2] === 78 && png[3] === 71);
  const info = M.pngReadChunks(png);
  T('T32 能读回宽高', info && info.width === W && info.height === H);
  const back = M.pngEmbeddedJson(info);
  T('T32 能读回嵌入的卡片数据', !!back && back.data && back.data.name === '阿离');

  // --- 卡片映射往返 ---
  const st = M.cardToST(card);
  T('T32 导出用酒馆 v2 规格', st.spec === 'chara_card_v2' && !!st.data);
  T('T32 人设进 description、开场白进 first_mes', st.data.description === '冷面剑客' && st.data.first_mes === '……你来了。');
  T('T32 关键词进 tags', st.data.tags[0] === '暗器');
  const rt = M.stToCard(st);
  T('T32 卡片往返：名字 / 人设 / 开场白都在', rt.name === '阿离' && rt.persona === '冷面剑客' && rt.firstMes === '……你来了。');
  T('T32 卡片往返：关键词详情也保留', rt.keywords.length === 1 && rt.keywords[0].key === '暗器' && rt.keywords[0].detail === '一手好暗器');
  const alien = M.stToCard({ spec:'chara_card_v2', data:{ name:'外来角色', description:'描述', personality:'性格', scenario:'场景', first_mes:'你好', tags:['标签A'] } });
  T('T32 认得别家酒馆卡的字段', alien.name === '外来角色' && alien.persona.indexOf('描述') >= 0 && alien.persona.indexOf('性格：性格') >= 0 && alien.persona.indexOf('场景：场景') >= 0 && alien.firstMes === '你好');

  // --- 世界书往返 + 酒馆原生世界书 ---
  const wld = { name:'苍梧界', world:'灵气稀薄的大陆。', keywords:[{ key:'苍梧', detail:'主大陆' }] };
  T('T32 世界书往返', M.stToWorld(M.worldToST(wld)).world === '灵气稀薄的大陆。');
  const native = M.stToWorld({ entries: { '0': { keys:['苍梧','大陆'], content:'此地灵气稀薄。' }, '1': { keys:[], content:'另有隐世宗门。' } } });
  T('T32 认得酒馆原生世界书 entries', !!native && native.world.indexOf('【苍梧 / 大陆】') >= 0 && native.world.indexOf('另有隐世宗门。') >= 0);
  T('T32 原生世界书关键词也带出来', native.keywords.length === 2 && native.keywords[0].key === '苍梧');
  T('T32 缺时间戳的 usage 不会算错（结构体完好）', M.deflateStore(new Uint8Array([1,2,3]))[0] === 0x78);
}

(async function main(){
  await t1();
  await t2();
  await t3();
  await t4();
  await t5();
  await t6();
  await t7();
  await t8();
  await t9();
  await t10();
  await t11();
  await t12();
  await t13();
  await t14();
  await t15();
  await t16();
  await t17();
  await t18();
  await t19();
  await t20();
  await t21();
  await t22();
  await t23();
  await t24();
  await t25();
  await t26();
  await t27();
  await t28();
  await t29();
  await t30();
  await t31();
  await t32();
  console.log('\ntest18: ' + pass + ' pass / ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
})();
