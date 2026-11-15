/* test17.js — 梦语 静态断言（正则检查 index.html 源码） */
const fs = require('fs');
const path = require('path');
const { HTML_PATH, ROOT, readParts } = require('./resolve-index');
const parts = readParts();
const html = parts.html, script = parts.script, cssBlock = parts.cssBlock;
let pass = 0, fail = 0;
function T(name, cond){ if(cond){ pass++; } else { fail++; console.log('  ✗ FAIL: '+name); } }

// ---- 版本 / CHANGELOG ----
T('APP_VERSION 0.4.9', /APP_VERSION = '0\.4\.9'/.test(script));
T('CHANGELOG head v0.4.9', /\{ v:'0\.4\.9', date:'\d{4}-\d{2}-\d{2}'/.test(script));
T('v0.4.9 标题', /title:'存档更可靠 · 图片占用保护 · 更新日志分类'/.test(script));
T('CHANGELOG v0.4.8 仍保留', /\{ v:'0\.4\.8', date:'2026-09-10'/.test(script));
T('CHANGELOG v0.4.8 标题仍保留', /title:'剧情转场角色 · 私聊开场白 · 续写剧情搬家 · 酒馆 png 导入导出 · 费用真实统计 · 垃圾桶清理'/.test(script));
T('CHANGELOG v0.4.7 仍保留', /\{ v:'0\.4\.7', date:'2026-09-10'/.test(script));
T('CHANGELOG v0.4.7 标题仍保留', /title:'发图片 · 剧情日历 · 人物详情 · 上下文长度 · 回到底部 · 手机状态栏适配 · 动效'/.test(script));
T('CHANGELOG v0.4.6 仍保留', /\{ v:'0.4.6', date:'2026-09-10'/.test(script));
T('CHANGELOG v0.4.6 标题仍保留', /title:'对话温度 · 思考等级 · 续写生成温度 · 酒馆措辞 · 故事头像 · QQ 群链接'/.test(script));
T('CHANGELOG v0.4.5 仍保留', /\{ v:'0.4.5', date:'2026-09-10'/.test(script));
T('CHANGELOG v0.4.5 标题仍保留', /title:'垃圾桶恢复 · 导出选格式 · 续写剧情带时间线 · 头像裁剪 · 关系图关系名 · 关于链接确认'/.test(script));
T('CHANGELOG v0.4.4 仍保留', /\{ v:'0.4.4', date:'2026-09-07'/.test(script));
T('CHANGELOG v0.4.4 标题仍保留', /title:'剧情时间线（世界观记忆）· 关键词自主成长 · 总结仅作者可见 · 安卓返回键'/.test(script));
T('CHANGELOG v0.4.3 仍保留', /\{ v:'0.4.3', date:'2026-09-03'/.test(script));
T('CHANGELOG v0.4.3 标题仍保留', /title:'字数拆成范围 \+ 强制字数 · 记忆按剧情合理知晓 · 下轮对话布局与滑动 · 卡\/书智能导入'/.test(script));
T('CHANGELOG v0.4.2 仍保留', /\{ v:'0.4.2', date:'2026-09-03'/.test(script));
T('CHANGELOG v0.4.1 仍保留', /\{ v:'0.4.1', date:'2026-09-03'/.test(script));
T('CHANGELOG v0.4.0 仍保留', /\{ v:'0.4.0', date:'2026-09-01'/.test(script));
T('CHANGELOG v0.3.9 仍保留', /\{ v:'0.3.9', date:'2026-09-01'/.test(script));
T('CHANGELOG v0.3.8 仍保留', /\{ v:'0.3.8', date:'2026-08-31'/.test(script));
T('BOARD_TUT_VERSION = 25', /var BOARD_TUT_VERSION = 25;/.test(script));

// ---- Req1 编辑框保持原文大小 ----
T('enterEdit 记录原文高度', /var h = textEl \? textEl\.offsetHeight : 0/.test(script));
T('enterEdit 设 minHeight 为原文高度', /if\(h > 0\) ta\.style\.minHeight = h \+ 'px'/.test(script));

// ---- Req2 操作栏不再均匀拉开 ----
T('.msg-actions 无 justify-content:space-between', !/\.msg-actions\{[^}]*justify-content:space-between/.test(cssBlock));
T('.msg-actions 仍为 flex', /\.msg-actions\{[^}]*display:flex/.test(cssBlock));
T('.msg-count margin-left:auto', /\.msg-count\{[^}]*margin-left:auto/.test(cssBlock));
T('user 消息操作栏仍右对齐', /\.msg\.user \.msg-actions\{justify-content:flex-end/.test(cssBlock));
T('手机端 .msg-count 样式仍在', /\.msg-count\{font-size:12px/.test(html));

// ---- Req3 关系图 ----
T('analyzeRelations max_tokens:1200', /max_tokens:1200/.test(script));
T('analyzeRelations 提示词鼓励完整连线', /只要记录里两人有过任何交集/.test(script));
T('applyRelations 记录 relationsAt', /cv\.relationsAt = \(cv\.history \|\| \[\]\)\.length/.test(script));
T('openRel 剧情推进自动重析 grew<30', /grew < 30/.test(script));

// ---- Req4 关键词演化 ----
T('updateMemory system 含关键词', /\\n\\n你的关键词：/.test(script));
T('updateMemory 提示词含【关键词更新】', /【关键词更新】/.test(script));
T('updateMemory 解析标记块', /content\.indexOf\('【关键词更新】'\)/.test(script));
T('updateMemory max_tokens 上浮 +320', /max_tokens:roleTok\(c\) \+ 320/.test(script));
T('关键词匹配用 key 字段', /k && k\.key === kk/.test(script));

// ---- Req5 酒馆 ----
T('btnTavern 存在（酒馆图标）', /id="btnTavern"[^>]*title="酒馆（结识）"/.test(html));
T('tavernView 面板存在', /id="tavernView"/.test(html));
T('btnMeetCard / btnMeetWorld 两个生成按钮', /id="btnMeetCard"/.test(html) && /id="btnMeetWorld"/.test(html));
T('btnDeriveWorld / btnDeriveCard 配套生成按钮', /id="btnDeriveWorld"/.test(html) && /id="btnDeriveCard"/.test(html));
T('tavernCardPick / tavernWorldPick 下拉', /id="tavernCardPick"/.test(html) && /id="tavernWorldPick"/.test(html));
T('showPanelView 处理 tavern', /tavernView'\)\.classList\.toggle\('hidden', v!=='tavern'/.test(script));
T('runTavern 四模式函数存在', /function runTavern\(mode, base, info\)/.test(script));
T('runTavern 支持客人构想 info', /客人想结识这样一位角色/.test(script) && /客人想收集这样一部世界书/.test(script));
T('填了姓名必须沿用', /填了姓名就必须沿用这个名字/.test(script) && /填了世界名就必须沿用这个名字/.test(script));
T('meetCardModal / meetWorldModal 弹窗', /id="meetCardModal"/.test(html) && /id="meetWorldModal"/.test(html));
T('结识角色卡三字段', /id="mcName"/.test(html) && /id="mcGender"/.test(html) && /id="mcPersona"/.test(html));
T('结识世界书三字段', /id="mwName"/.test(html) && /id="mwType"/.test(html) && /id="mwDesc"/.test(html));
T('btnMeetCard 改为开弹窗', /\$\('btnMeetCard'\)\.addEventListener\('click', function\(\)\{ openMeetModal\('card'\); \}\)/.test(script));
T('btnMeetWorld 改为开弹窗', /\$\('btnMeetWorld'\)\.addEventListener\('click', function\(\)\{ openMeetModal\('world'\); \}\)/.test(script));
T('meetCardGo 携带信息调用 runTavern', /meetCardGo'\)\.addEventListener\('click', function\(\)\{[\s\S]{0,300}runTavern\('card', null, info\)/.test(script));
T('meetWorldGo 携带信息调用 runTavern', /meetWorldGo'\)\.addEventListener\('click', function\(\)\{[\s\S]{0,300}runTavern\('world', null, info\)/.test(script));
T('runTavern 沿用客人姓名（卡/书）', /if\(info && \(info\.name \|\| ''\)\.trim\(\)\) card\.name = info\.name\.trim\(\)\.slice\(0,20\)/.test(script) && /if\(info && \(info\.name \|\| ''\)\.trim\(\)\) world\.name = info\.name\.trim\(\)\.slice\(0,20\)/.test(script));
T('derive 仍两参数调用（配套生成保持不变）', /\$\('btnDeriveWorld'\)\.addEventListener\('click', function\(\)\{[\s\S]{0,200}runTavern\('deriveWorld', c\);/.test(script) && /\$\('btnDeriveCard'\)\.addEventListener\('click', function\(\)\{[\s\S]{0,200}runTavern\('deriveCard', w\);/.test(script));
T('酒馆关键词沿用 1-3 个说明（未在本次范围）', /给出 1-3 个与该角色相关、容易随剧情发展而变化的关键词/.test(script) && /给出 1-3 个与该世界相关、容易随剧情发展而变化的关键词/.test(script));
T('renderTavernPicks 存在', /function renderTavernPicks\(\)/.test(script));
T('结识保存到 cards 与 worlds', /cards\.push\(card\);[\s\S]{0,300}worlds\.push\(world\)/.test(script));
T('世界书解析关键词', /world = \{ id:seq\+\+, name:obj\.name\.trim\(\)\.slice\(0,20\), avatar:defaultAvatar\(\), world:[\s\S]{0,220}keywords:kw \}/.test(script));
T('deriveWorld 注入已有角色卡', /参考的已有角色卡/.test(script));
T('deriveCard 注入已有世界书', /参考的已有世界书/.test(script));
T('renderTavernResult 支持单侧 null', /if\(card\)\{[\s\S]{0,800}if\(world\)\{[\s\S]{0,800}box\.innerHTML = html;/.test(script));
T('tavern-derive 选择行样式', /\.tavern-derive-row select\{/.test(cssBlock));

// ---- Req5 世界书导入弹窗 ----
T('worldImportModal 存在', /id="worldImportModal"/.test(html));
T('导入两项选择按钮', /id="btnWorldImportText"/.test(html) && /id="btnWorldImportJson"/.test(html));
T('btnImportWorld 改为开弹窗', /\$\('btnImportWorld'\)\.addEventListener\('click', function\(\)\{ \$\('worldImportModal'\)\.classList\.remove\('hidden'\); \}\)/.test(script));
T('txt 导入输入框 accept 三类型', /id="importWorldTextFile" accept="\.txt,\.md,\.markdown"/.test(html));
T('importWorldText 函数存在（接线智能导入）', /function importWorldText\(file\)\{[\s\S]{0,40}readLibText\(file, 'world'\)/.test(script));
T('文本导入 10 万字上限（readLibText）', /txt\.length > 100000/.test(script));
T('原文退化路径按文件名入库（pushRawLib world）', /worlds\.push\(\{ id:seq\+\+, name:base, avatar:defaultAvatar\(\), world:txt\.trim\(\), keywords:\[\] \}\);/.test(script));

// ---- Req5 提取 / 模仿 ----
T('世界书四按钮 2×2 网格（创建/导入/提取/模仿）', /<div class="panel-actions grid2">\s*<button[\s\S]*?id="btnAddWorld"[\s\S]*?id="btnImportWorld"[\s\S]*?id="btnExtractWorld"[\s\S]*?id="btnMimicWorld"[\s\S]*?<\/div>/.test(html));
T('.panel-actions.grid2 CSS', /\.panel-actions\.grid2\{display:grid; grid-template-columns:1fr 1fr; gap:8px;\}/.test(cssBlock));
T('无 .panel-actions-sub（提取/模仿不再另起一行）', !/panel-actions-sub/.test(html));
T('.import-opts CSS', /\.import-opts\{display:flex; flex-direction:column; gap:8px;\}/.test(cssBlock));
T('worldAiModal 存在', /id="worldAiModal"/.test(html));
T('提取方式单选 完整/简单', /name="worldAiMode" value="full"/.test(html) && /name="worldAiMode" value="simple"/.test(html));
T('模仿要求输入框', /id="worldAiReq"/.test(html));
T('精炼度输入 worldAiLen', /id="worldAiLen" value="200" min="50" max="2000"/.test(html));
T('gs-num CSS', /\.gs-num\{width:100%/.test(cssBlock));
T('openWorldAi 切换标题', /worldAiTitle'\)\.textContent = mode === 'mimic' \? '模仿世界书' : '提取世界书'/.test(script));
T('runWorldAi 存在', /function runWorldAi\(\)/.test(script));
T('runWorldAi 读精炼度', /\$\('worldAiLen'\)\.value/.test(script));
T('runWorldAi 简单提取截断 2 万字', /worldAiText\.slice\(0, 20000\)/.test(script));
T('runWorldAi 走全局 Key', /missingKey\(\{\}\)/.test(script));
T('提取提示词注入约 N 字 + 忠于原著', /世界观描述请写约 ' \+ want \+ ' 字，必须忠于原著内容，不要编造原文没有的设定/.test(script));
T('模仿提示词注入约 N 字 + 风格相似原创', /新世界观描述请写约 ' \+ want \+ ' 字，风格与原著相似，但设定与人物必须原创/.test(script));
T('runWorldAi max_tokens 按精炼度上浮', /max_tokens:Math\.min\(4000, want \+ 300\)/.test(script));
T('runWorldAi 支持 JSON 围栏剥离', /JSON\.parse\(fenced \? fenced\[1\] : content\)/.test(script));
T('runWorldAi 保存到 worlds', /worlds\.push\(world\)/.test(script));
T('runWorldAi 结果文本上限 2000', /world:\(typeof data\.world === 'string' \? data\.world : ''\)\.trim\(\)\.slice\(0,2000\)/.test(script));

// ---- Req6 世界观随剧情演化 ----
T('updateMemory 指令含【世界观更新】', /【世界观更新】/.test(script));
T('updateMemory 解析世界观段', /var wi = content\.indexOf\('【世界观更新】'\)/.test(script));
T('updateMemory 世界观写 cv.world', /cv\.world = wt\.slice\(0, 2000\)/.test(script));
T('updateMemory 先剥世界观再解析关键词', /content = content\.slice\(0, wi\)/.test(script));

// ---- Req 续写剧情 ----
T('群设置里已没有「续写剧情」页签', !/data-tab="continue"/.test(html) && !/data-pane="continue"/.test(html));
T('主页「＋」菜单有「续写剧情」，排在「导入记忆」上面', /data-act="sim">新建模拟<\/button>\s*<button class="menu-item" data-act="continue">续写剧情<\/button>\s*<button class="menu-item" data-act="import">导入记忆<\/button>/.test(html));
T('文件选择与生成按钮', /id="btnContPick"/.test(html) && /id="btnContGo"/.test(html));
T('三个精炼度输入默认值', /id="contCharLen" value="200" min="50" max="1000"/.test(html) && /id="contWorldLen" value="300" min="50" max="2000"/.test(html) && /id="contPlayerLen" value="150" min="30" max="500"/.test(html));
T('runContinue 存在', /function runContinue\(\)/.test(script));
T('续写剧情走本会话群级设置', /missingKey\(cv\)/.test(script));
T('续写剧情替换成员', /cv\.chars = chars/.test(script));
T('续写剧情清空 selectedNext', /cv\.selectedNext = \[\]/.test(script));
T('续写剧情 JSON 围栏剥离 + 校验 members', /JSON\.parse\(fenced \? fenced\[1\] : content\)[\s\S]{0,250}Array\.isArray\(data\.members\)/.test(script));
T('续写剧情写世界观', /cv\.world = \(typeof wd\.world === 'string' \? wd\.world : ''\)\.trim\(\)/.test(script));
T('续写剧情写玩家设定（第三人称置空）', /cv\.player = per === 'third' \? '' : \(typeof data\.player === 'string' \? data\.player : ''\)\.trim\(\)/.test(script));
T('续写剧情 max_tokens 按范围分档', /var maxTok = scopeAll[\s\S]{0,140}Math\.min\(32000, 8000 \+ charLen\*6 \+ worldLen \+ playerLen \+ summaryLen \+ 1200\)[\s\S]{0,140}Math\.min\(8000, 2000 \+ charLen\*6 \+ worldLen \+ playerLen \+ summaryLen \+ 1200\)[\s\S]{0,160}max_tokens:maxTok/.test(script));
T('续写剧情生成后新建会话并进入', /convs\.push\(cv\);\s*activeId = cv\.id;/.test(script) && /function newContinueConv\(mode\)\{/.test(script));
T('续写剧情上限 3 万字', /contText\.length > 30000 \? contText\.slice\(0, 30000\)/.test(script));

// ---- Req3 续写剧情 人称视角 + 总结精炼度 ----
T('续写剧情 pane 人称单选（第一/第三人称）', /name="contPer" value="first" checked/.test(html) && /name="contPer" value="third"/.test(html));
T('续写剧情读人称', /document\.querySelector\('input\[name="contPer"\]:checked'\)/.test(script));
T('续写剧情默认第一人称', /var per = perEl && perEl\.value === 'third' \? 'third' : 'first'/.test(script));
T('总结精炼度输入 contSummaryLen', /id="contSummaryLen" value="200" min="50" max="1000"/.test(html));
T('第一人称提示词不含主角 AI 卡', /不生成主角的 AI 成员角色卡/.test(script));
T('第三人称提示词主角作 AI 成员 + 玩家留空', /主角作为 AI 成员生成/.test(script) && /「玩家设定」输出为空字符串/.test(script));
T('续写剧情写 summary', /cv\.summary = data\.summary\.trim\(\)/.test(script));
T('续写剧情输出 summary 字段', /"summary":"剧情总结/.test(script));

// ---- Req 世界书提取/模仿 带关键词 ----
T('世界书提取提示词要求关键词 JSON', /"keywords":\[\{"key":"关键词","detail":"详情"\}\]/.test(script));
T('世界书提取提示词带关键词说明（数量不定）', /再给世界观关键词[\s\S]{0,120}数量不设固定值，按这个世界观要素在剧情里的重要程度自由决定/.test(script));
T('世界书模仿提示词带关键词说明（数量不定）', /再给出世界观关键词[\s\S]{0,260}关键词数量不设固定值：按这个新世界观里值得长期关注的核心设定自由决定/.test(script));
T('runWorldAi 解析关键词 wkw', /var wkw = \[\];\s*\(Array\.isArray\(data\.keywords\)/.test(script));
T('runWorldAi 世界书存关键词', /keywords:wkw/.test(script));

// ---- Req5 角色卡 提取 / 模仿 ----
T('角色卡四按钮 2×2 网格（创建/导入/提取/模仿）', /<div class="panel-actions grid2">\s*<button[\s\S]*?id="btnAddCard"[\s\S]*?id="btnImportCard"[\s\S]*?id="btnExtractCard"[\s\S]*?id="btnMimicCard"[\s\S]*?<\/div>/.test(html));
T('cardAiModal 存在', /id="cardAiModal"/.test(html));
T('角色名输入框 cardAiName', /id="cardAiName" placeholder="例如：林晚"/.test(html));
T('角色卡精炼度输入 cardAiLen', /id="cardAiLen" value="200" min="50" max="2000"/.test(html));
T('btnExtractCard 监听 openCardAi', /\$\('btnExtractCard'\)\.addEventListener\('click', function\(\)\{ openCardAi\('extract'\); \}\)/.test(script));
T('btnMimicCard 监听 openCardAi', /\$\('btnMimicCard'\)\.addEventListener\('click', function\(\)\{ openCardAi\('mimic'\); \}\)/.test(script));
T('runCardAi 存在', /function runCardAi\(\)/.test(script));
T('runCardAi 缺角色名拦截', /请先填写要/.test(script));
T('runCardAi 文本无角色输出 found:false', /"found":false/.test(script));
T('runCardAi 无该角色提示', /data\.found === false\)\{ showToast\('该文本没有该角色'\); return; \}/.test(script));
T('runCardAi 提取忠于原著', /必须忠于原著内容，不要编造原文没有的设定/.test(script));
T('runCardAi 模仿原创新角色', /风格与原著角色相似，但姓名与设定必须原创/.test(script));
T('runCardAi 生成角色卡存 cards', /var card = \{ id:seq\+\+, name:data\.name\.trim\(\)\.slice\(0,20\), avatar:defaultAvatar\(\), persona/.test(script) && /cards\.push\(card\)/.test(script));
T('runCardAi 角色卡带关键词', /keywords:kw/.test(script));

// ---- Req v0.3.8 私聊模式 ----
T('doNewDm 函数存在', /function doNewDm\(\)/.test(script));
T('主页菜单有新建私聊', /data-act="dm">新建私聊/.test(html));
T('主页菜单改名（新建群聊/新建故事）', /data-act="new">新建群聊/.test(html) && /data-act="story">新建故事/.test(html));
T('kindLabel 区分私聊', /cv\.mode === 'dm' \? '私聊' : '群聊'/.test(script));
T('settingsLabel 私聊设置', /cv\.mode === 'dm' \? '私聊设置' : '群设置'/.test(script));
T('load 归一化保留 dm', /if\(cv\.mode !== 'story' && cv\.mode !== 'dm'\) cv\.mode = 'chat'/.test(script));
T('applyModeUI body.dm 切换', /document\.body\.classList\.toggle\('dm', dm\)/.test(script));
T('body.dm .chip-row 隐藏 CSS', /body\.dm \.chip-row\{display:none;/.test(cssBlock));
T('replyTargets dm 单 AI 分支', /if\(cv\.mode === 'dm'\)\{[\s\S]{0,260}targets: me \? \[me\] : \[\]/.test(script));
T('buildMessages dm 分支', /else if\(cv\.mode === 'dm'\)\{[\s\S]{0,160}一对一私聊/.test(script));

// ---- Req v0.3.8 下轮对话展开 ----
T('btnChipExpand 按钮存在', /id="btnChipExpand"[^>]*title="展开所有在场角色/.test(html));
T('chipExpandBox 面板存在', /id="chipExpandBox" class="chip-expand-box hidden"/.test(html));
T('.chip-expand-box CSS', /\.chip-expand-box\{position:absolute; bottom:calc\(100% \+ 8px\)/.test(cssBlock));
T('手机端展开面板限宽', /\.chip-expand-box\{max-width:86vw; min-width:200px;\}/.test(html));
T('renderChipExpand 按重要程度排序', /function renderChipExpand\(\)[\s\S]{0,500}var order = \{ main:0, minor:1, extra:2 \}/.test(script));
T('inputHint 可切换提示文字', /id="inputHint"/.test(html));

// ---- Req v0.3.8 续写剧情生成范围 ----
T('生成范围单选存在', /name="contScope" value="important" checked/.test(html) && /name="contScope" value="all"/.test(html));
T('runContinue 读生成范围', /var scopeAll = scopeEl && scopeEl\.value === 'all'/.test(script));
T('所有角色不限人数指令', /人数不限、不要遗漏/.test(script) && /路人角色 1-2 句话简述即可/.test(script));
T('所有角色 max_tokens 32000', /Math\.min\(32000, 8000 \+ charLen\*6 \+ worldLen \+ playerLen \+ summaryLen \+ 1200\)/.test(script));

// ---- Req v0.3.8 私聊设置智能体页签 ----
T('智能体页签按钮', /<button data-tab="agent" style="display:none;">智能体<\/button>/.test(html));
T('智能体 pane 存在', /data-pane="agent"/.test(html));
T('dmName 输入框', /id="dmName" maxlength="12"/.test(html));
T('dmPersona/dmMemory/dmKeywords/dmKwAdd/dmAutoMem', /id="dmPersona"/.test(html) && /id="dmMemory"/.test(html) && /id="dmKeywords"/.test(html) && /id="dmKwAdd"/.test(html) && /id="dmAutoMem"/.test(html));
T('dm 头像编辑器 id 族', /id="dmAvTabs"/.test(html) && /id="dmEmojiGrid"/.test(html) && /id="dmAvFile"/.test(html) && /id="dmAvPreview"/.test(html));
T('openGroupSettings 默认切智能体', /isDm \? 'agent' : 'members'/.test(script));
T('saveGroupSettings dm 写回唯一 AI', /ai\.name = dmNm\.slice\(0,12\)/.test(script) && /ai\.avatar = \{ mode:dmAvatarDraft\.mode, value:dmAvatarDraft\.value \}/.test(script));
T('dmKeywords 绑定 bindKwEditor（详情可点开/编辑）', /bindKwEditor\(\$\('dmKeywords'\), function\(\)\{ return dmKwDraft; \}, \$\('dmKwAdd'\)\);/.test(script));
T('dmKwDraft 从 AI 关键词初始化', /dmKwDraft = kwDraftFrom\(ai \? ai\.keywords : \[\]\);[\s\S]{0,40}renderKwBox\(\$\('dmKeywords'\), dmKwDraft\)/.test(script));
T('dm 保存提交 dmKwDraft 关键词', /ai\.keywords = kwDraftCommit\(dmKwDraft\);/.test(script));

// ---- Req v0.3.8 私聊附件 ----
T('FAB 附件菜单项', /data-act="attach"/.test(html));
T('attachBar 存在', /id="attachBar"/.test(html));
T('attachX 移除按钮', /id="attachX" class="attach-x">移除<\/span>/.test(html));
T('attachFile 隐藏文件输入', /id="attachFile" accept="\.txt,\.md/.test(html));
T('dmAttach 状态存在', /var dmAttach = null;/.test(script));
T('send 允许只发附件 / 只发图片', /if\(!text && !\(cv\.mode === 'dm' && dmAttach\) && !pendingImgs\.length\) return;/.test(script));
T('doSend 附带附件内容', /attach:attach/.test(script));
T('buildMessages 附件注入上下文', /m\.attach && m\.attach\.name\) uc \+= '\\n\\n【附件「'/.test(script));
T('appendMsgEl 附件标记渲染', /\.msg-attach/.test(cssBlock) && /m\.attach && m\.attach\.name\) \?/.test(script));
T('续写剧情弹窗可选三种模式', /name="contMode" value="chat"/.test(html) && /name="contMode" value="dm"/.test(html) && /name="contMode" value="story"/.test(html));
T('私聊模式只保留主角一位 AI', /if\(cv\.mode === 'dm'\)\{[\s\S]{0,320}cv\.chars = \[ pick \|\| chars\[0\] \];/.test(script));

// ---- Req v0.3.9 删除提示 ----
T('「点击选择」提示仅剩 CHANGELOG 提及', (html.match(/点击选择/g) || []).length === 1);
T('chip-hint 类完全移除', !/chip-hint/.test(html));

// ---- Req v0.3.9 展开按钮修复 ----
T('chip-scroll 嵌套滚动容器', /\.chip-scroll\{display:flex; align-items:center; gap:8px; overflow-x:auto; scrollbar-width:none; flex:1 1 auto; min-width:0; padding:2px; cursor:grab; user-select:none; overscroll-behavior-x:contain;\}/.test(cssBlock));
T('.chip-scroll 隐藏滚动条', /\.chip-scroll::-webkit-scrollbar\{display:none;\}/.test(cssBlock));
T('#chipBox flex-shrink:0（横排不被压垮，真正能滚）', /#chipBox\{flex-shrink:0; min-width:max-content;\}/.test(cssBlock));
T('.chip-scroll.dragging 拖拽光标', /\.chip-scroll\.dragging\{cursor:grabbing;\}/.test(cssBlock));
T('#btnChipExpand 不被压缩', /#btnChipExpand\{flex-shrink:0;\}/.test(cssBlock));
T('chip-row 无 overflow:hidden（展开面板不被裁剪）', !/\.chip-row\{[^}]*overflow:hidden/.test(cssBlock));
T('chip-row 完整样式', /\.chip-row\{display:flex; align-items:center; gap:8px; margin-bottom:8px; padding:2px 0 4px; position:relative;\}/.test(cssBlock));
T('「下轮对话」label 后紧跟 btnRandom（不被挤出）', /class="chip-row">\s*<span class="chip-label">下轮对话<\/span>\s*<button id="btnRandom" class="chip"/.test(html));
T('chip-scroll 只包 chipBox（角色横排）', /<button id="btnRandom"[\s\S]{0,260}<div class="chip-scroll" id="chipScroll">\s*<div id="chipBox"/.test(html));
T('chipExpandBox 仍为 chip-row 直接子元素', /<button id="btnChipExpand"[\s\S]{0,120}<div id="chipExpandBox" class="chip-expand-box hidden"><\/div>/.test(html));

// ---- Req v0.3.9 私聊附件无上限 ----
T('移除 ATTACH_MAXLEN 常量', !/ATTACH_MAXLEN/.test(script));
T('附件不再截断 3 万字', !/content\.slice\(0,\s*30000\)/.test(script));
T('附件全文保存', /dmAttach = \{ name:f\.name, content: content \};/.test(script));

// ---- Req v0.3.9 字数下限 ----
T('DEFAULT_MINLEN = 5', /var DEFAULT_MINLEN = 5;/.test(script));
T('MIN_LEN_TIERS 六档', /var MIN_LEN_TIERS = \[5,30,50,100,150,200\];/.test(script));
T('字数下限弹窗区块', /id="lenMinCur"/.test(html) && /id="lenMinGrid"/.test(html) && /id="lenMinCustom"/.test(html) && /id="lenMinInput" min="1" max="9999"/.test(html) && /id="lenMinApply"/.test(html));
T('newConv 默认 minReplyLen', /minReplyLen:DEFAULT_MINLEN/.test(script));
T('load 归一化 minReplyLen', /if\(typeof cv\.minReplyLen !== 'number' \|\| isNaN\(cv\.minReplyLen\) \|\| cv\.minReplyLen < 0\) cv\.minReplyLen = DEFAULT_MINLEN;/.test(script));
T('importBackup 归一化 minReplyLen', /if\(typeof conv\.minReplyLen !== 'number' \|\| isNaN\(conv\.minReplyLen\) \|\| conv\.minReplyLen < 0\) conv\.minReplyLen = DEFAULT_MINLEN;/.test(script));
T('minLenLabel 函数存在', /function minLenLabel\(cv\)/.test(script));
T('setMinLen 上限拦截', /字数下限不能超过字数上限/.test(script));
T('setMaxLen 下限拦截', /字数上限不能小于字数下限/.test(script));
T('setMinLen 保存并提示', /cv\.minReplyLen = v;[\s\S]{0,160}showToast\('字数下限已设为 ' \+ v \+ ' 字'\)/.test(script));
T('replyLenRule 函数存在', /function replyLenRule\(cv, story\)/.test(script));
T('replyLenRule 默认兜底 5 字', /typeof cv\.minReplyLen === 'number' && cv\.minReplyLen > 0\) \? cv\.minReplyLen : DEFAULT_MINLEN/.test(script));
T('replyLenRule 上限+下限拼接', /parts\.join\('，'\) \+ '：内容要完整，用「。」等标点收尾，宁精炼不要写超、不要被截断。'/.test(script));
T('故事分支注入下限规则', /if\(isStory\)\{[\s\S]{0,1600}replyLenRule\(cv, true\)/.test(script));
T('群聊/私聊分支注入下限规则', /else if\(cv\.mode === 'dm'\)\{[\s\S]{0,2000}replyLenRule\(cv, false\)/.test(script) && /\} else \{[\s\S]{0,2000}replyLenRule\(cv, false\)/.test(script));

// ---- Req v0.4.0 破甲/提示 ----
T('破甲/提示 页签', /data-tab="break">破甲\/提示<\/button>/.test(html));
T('破甲/提示 pane', /data-pane="break"/.test(html));
T('gsBreakPrompt 文本框', /<textarea id="gsBreakPrompt" rows="6"/.test(html));
T('gsBreakPrompt 在 world 与 player pane 之间', /data-pane="world"[\s\S]{0,2500}id="gsBreakPrompt"[\s\S]{0,2500}data-pane="player"/.test(html));
T('newConv 含 breakPrompt 默认空', /breakPrompt:''/.test(script));
T('load 归一化 breakPrompt', /if\(typeof cv\.breakPrompt !== 'string'\) cv\.breakPrompt = '';/.test(script));
T('importBackup 归一化 breakPrompt', /if\(typeof conv\.breakPrompt !== 'string'\) conv\.breakPrompt = '';/.test(script));
T('openGroupSettings 回填 breakPrompt', /\$\('gsBreakPrompt'\)\.value = cv\.breakPrompt \|\| '';/.test(script));
T('saveGroupSettings 写回 breakPrompt', /cv\.breakPrompt = \$\('gsBreakPrompt'\)\.value\.trim\(\);/.test(script));
T('breakPromptBlock 函数存在', /function breakPromptBlock\(cv\)/.test(script));
T('空 breakPrompt 不注入', /if\(!p \|\| !p\.trim\(\)\) return '';/.test(script));
T('四个分支都注入 breakPromptBlock（含「转场」）', (script.match(/breakPromptBlock\(cv\) \+/g) || []).length === 4);
T('破甲块标记最高优先级', /【破甲词和提示词 —— 最高优先级/.test(script));

// ---- Req v0.4.1 消息重置重做 ----
T('resetMsg 存在', /function resetMsg\(mid\)\{/.test(script));
T('重置前停止生成', /function resetMsg\(mid\)\{[\s\S]{0,400}stopAll\(\);/ && /生成中的消息不能重置/.test(script));
T('重置定位 idx 且判 <0', /var idx = cv\.history\.indexOf\(m\);[\s\S]{0,90}if\(idx < 0\) return;/.test(script));
T('我的消息重置保留本条、删其后(splice idx+1)', /if\(m\.speakerId === 'user'\)\{[\s\S]{0,200}cv\.history\.splice\(idx \+ 1\);/.test(script));
T('我的消息重置后 runSequence 重新回应本条', /cv\.history\.splice\(idx \+ 1\);[\s\S]{0,700}runSequence\(sel\.targets, cv\);/.test(script));
T('我的消息重置后保存并渲染', /cv\.history\.splice\(idx \+ 1\);[\s\S]{0,120}save\(\); renderMsgs\(\); renderConvList\(\);/.test(script));
T('AI 消息重置删本条及其后(splice idx)', /AI 消息：把这条回复连同它之后的消息一并删除[\s\S]{0,80}cv\.history\.splice\(idx\);/.test(script));
T('AI 消息重置后 generateReply 按此前剧情重说', /cv\.history\.splice\(idx\);[\s\S]{0,220}generateReply\(c, cv\)/.test(script));
T('AI 分支注释说明乱序原因', /否则新回复会被排到旧消息后面，造成消息乱序/.test(script));

// ---- Req v0.4.1 私聊智能体导入角色卡 ----
T('cardPickAction 定义（add/dm）', /var cardPickAction = 'add';[\s\S]{0,120}'dm' 私聊覆盖智能体/.test(script));
T('gsImportCard 开成员加卡 pick', /\$\('gsImportCard'\)\.addEventListener\('click', function\(\)\{ openCardPick\('add'\); \}\)/.test(script));
T('gsImportCardDm 开智能体覆盖 pick', /\$\('gsImportCardDm'\)\.addEventListener\('click', function\(\)\{ openCardPick\('dm'\); \}\)/.test(script));
T('智能体页导入按钮', /id="gsImportCardDm" class="btn-ghost" style="width:100%; margin-top:14px;">从已有角色卡导入<\/button>/.test(html));
T('导入按钮旁说明文字', /从角色卡库挑一张卡，3 秒内确认后即可直接覆盖/.test(html));
T('选卡动作分发到 dmImportCard', /cardPickAction === 'dm'\)\{ dmImportCard\(card\); return; \}/.test(script));
T('dmImportCard 存在', /function dmImportCard\(card\)/.test(script));
T('dmImportCard 弹描述文本', /是否用角色卡「'\+card\.name\+'」覆盖当前智能体/.test(script));
T('3 秒超时自动取消倒计时', /var left = 3;[\s\S]{0,80}dmCardTimer = setInterval\(function\(\)\{[\s\S]{0,160}left <= 0\)\{ dmCardReset\(\); addNote\('已取消导入，智能体未改变。'\); \}/.test(script));
T('dmApplyCard 存在', /function dmApplyCard\(card\)/.test(script));
T('dmApplyCard 名字截 12 字', /ai\.name = String\(card\.name \|\| ''\)\.slice\(0, 12\);/.test(script));
T('dmApplyCard 写入人设/记忆/关键词', /ai\.persona = String\(card\.persona \|\| ''\);[\s\S]{0,60}ai\.memory = String\(card\.memory \|\| ''\);[\s\S]{0,60}ai\.keywords = kwDraftFrom\(card\.keywords\);/.test(script));
T('dmApplyCard 头像空 url/upload 兜底', /if\(\(av\.mode === 'url' \|\| av\.mode === 'upload'\) && !av\.value\) av = defaultAvatar\(\);/.test(script));
T('dmApplyCard 同步智能体页签输入框', /\$\('dmName'\)\.value = ai\.name;[\s\S]{0,90}\$\('dmPersona'\)\.value = ai\.persona;[\s\S]{0,90}\$\('dmMemory'\)\.value = ai\.memory;[\s\S]{0,90}renderKwBox\(\$\('dmKeywords'\), dmKwDraft\);/.test(script));
T('dmCardYes 确认覆盖', /\$\('dmCardYes'\)\.addEventListener\('click', function\(\)\{[\s\S]{0,80}dmApplyCard\(card\);/.test(script));
T('dmCardCancel 取消不改', /\$\('dmCardCancel'\)\.addEventListener\('click', function\(\)\{[\s\S]{0,80}addNote\('已取消导入，智能体未改变。'\);/.test(script));
T('遮罩点击关闭 dmCardModal', /else if\(ov\.id === 'dmCardModal'\) dmCardReset\(\);/.test(script));
T('dmCardModal 覆盖确认弹窗', /id="dmCardModal" class="modal-overlay hidden">[\s\S]{0,400}用角色卡覆盖智能体？[\s\S]{0,400}id="dmCardYes">覆盖智能体<\/button>/.test(html));
T('CHANGELOG 提及私聊导入角色卡', /私聊「智能体」支持「从已有角色卡导入」/.test(script));

// ---- Req1/2 v0.4.3 字数拆成 字数范围 + 强制字数 ----
T('FAB 字数项改名「字数范围」', />字数范围<\/button>/.test(html));
T('FAB 新增强制字数项', /data-act="forcelen"[\s\S]{0,400}>强制字数<\/button>/.test(html));
T('FAB 分发 forcelen → openForceLen', /else if\(act === 'forcelen'\) openForceLen\(\);/.test(script));
T('lenModal 标题改「字数范围」', /<h3>字数范围（上限 \/ 下限）<\/h3>/.test(html));
T('forceLenModal 存在', /id="forceLenModal" class="modal-overlay hidden"/.test(html));
T('O/N 开关按钮 forceToggle', /id="forceToggle" class="force-pill"/.test(html));
T('强制字数目标显示 forceCur', /id="forceCur"/.test(html));
T('档位网格 + 自定义 + 输入', /id="forceGrid"/.test(html) && /id="forceCustom"/.test(html) && /id="forceInput" min="1" max="9999"/.test(html) && /id="forceApply"/.test(html));
T('forceNote 说明 + 关闭按钮', /id="forceNote"/.test(html) && /id="forceCancel"/.test(html));
T('forceNote 提示写入 openForceLen', /\$\('forceNote'\)\.textContent = '开启强制字数后/.test(script));
T('.force-pill.on 高亮', /\.force-pill\.on\{background:var\(--accent\); border-color:var\(--accent\); color:#fff;\}/.test(cssBlock));
T('FORCE_LEN_TIERS 六档', /var FORCE_LEN_TIERS = \[100,200,300,500,800,1000\];/.test(script));
T('newConv 默认 forceLen/forceOn', /forceLen:0, forceOn:false/.test(script));
T('load 归一化 forceLen', /if\(typeof cv\.forceLen !== 'number' \|\| isNaN\(cv\.forceLen\) \|\| cv\.forceLen < 0\) cv\.forceLen = 0;/.test(script));
T('load 归一化 forceOn', /if\(typeof cv\.forceOn !== 'boolean'\) cv\.forceOn = false;/.test(script));
T('importBackup 归一化 forceLen/forceOn', /if\(typeof conv\.forceLen !== 'number'[\s\S]{0,160}if\(typeof conv\.forceOn !== 'boolean'\) conv\.forceOn = false;/.test(script));
T('forceLenActive 函数存在', /function forceLenActive\(cv\)/.test(script));
T('forceLenRuleText ±10% 区间', /允许 ±10% 误差，即 ' \+ lo \+ '–' \+ hi/.test(script));
T('replyLenRule 强制优先（替代字数范围）', /if\(forceLenActive\(cv\)\) return pre \+ forceLenRuleText\(cv\);/.test(script));
T('streaming 截断上限 = 110% 目标字数', /var cap = forceLenActive\(cv\) \? Math\.ceil\(cv\.forceLen \* 1\.1\) : \(cv\.maxReplyLen\|\|0\)/.test(script));
T('setForceLen 开启 + 保存 + 提示', /cv\.forceLen = v;[\s\S]{0,60}cv\.forceOn = true;[\s\S]{0,200}showToast\('强制字数已开启：约 ' \+ v \+ ' 字（±10%）。'\)/.test(script));
T('开关首次开启默认 200', /cv\.forceLen < 1\) cv\.forceLen = 200;[\s\S]{0,40}cv\.forceOn = true;/.test(script));
T('开关关闭恢复字数范围', /已关闭强制字数，恢复使用「字数范围」。/.test(script));
T('force 输入 Enter 提交', /\$\('forceInput'\)\.addEventListener\('keydown', function\(e\)\{[\s\S]{0,120}if\(e\.key === 'Enter'\)\{ e\.preventDefault\(\); \$\('forceApply'\)\.click\(\); \}/.test(script));

// ---- Req3 v0.4.3 记忆按剧情合理知晓才写入 ----
T('memoryCtxFor 函数存在', /function memoryCtxFor\(c, cv\)/.test(script));
T('memoryCtxFor 按用户发言切成一轮轮', /if\(m\.speakerId === 'user' && cur\.length\)\{ rounds\.push\(cur\); cur = \[\]; \}/.test(script));
T('memoryCtxFor 只保留角色参与过的轮次', /if\(r\[j\]\.speakerId === c\.id\)\{ out = out\.concat\(r\); break; \}/.test(script));
T('memoryCtxFor 滤掉 streaming', /cv\.history\.filter\(function\(m\)\{ return m\.status !== 'streaming'; \}\)\.slice\(-24\)/.test(script));
T('updateMemory 改用 memoryCtxFor 取上下文', /var ctx = memoryCtxFor\(c, cv\);/.test(script));
T('记忆提示词限定亲身经历', /只挑「你亲身经历、亲眼所见，或别人直接告诉你」的事；这段对话里发生在你没参与、你并不知晓的时刻的情节，不要当成你自己的记忆写进去/.test(script));

// ---- Req4/5 v0.4.3 随机顺序固定 + 横排滑动 ----
T('随机顺序按钮紧跟「下轮对话」label', /class="chip-row">\s*<span class="chip-label">下轮对话<\/span>\s*<button id="btnRandom" class="chip"/.test(html));
T('chip-scroll 设 grab/不可选中（可拖拽）', /cursor:grab; user-select:none; overscroll-behavior-x:contain;/.test(cssBlock));
T('滚轮仅在溢出时横向滚动（不吞页面滚动）', /if\(sc\.scrollWidth <= sc\.clientWidth \+ 2\) return;[\s\S]{0,60}sc\.scrollLeft \+= \(e\.deltaY \|\| e\.deltaX \|\| 0\)/.test(script));
T('左键按住拖动仅桌面鼠标', /if\(e\.pointerType !== 'mouse' \|\| e\.button !== 0\) return;/.test(script));
T('拖动结束吞掉一次误触点击', /window\.addEventListener\('click', stop, true\);[\s\S]{0,30}setTimeout\(function\(\)\{ window\.removeEventListener\('click', stop, true\); \}, 60\)/.test(script));
T('手机端交给原生触摸滑动', /手机端用原生触摸滑动/.test(script));

// ---- Req6/7 v0.4.3 导入确认弹窗 + 智能导入 ----
T('cardImportModal 存在', /id="cardImportModal" class="modal-overlay hidden">[\s\S]{0,200}<h3>导入角色卡<\/h3>/.test(html));
T('btnImportCard 改为先开弹窗', /\$\('btnImportCard'\)\.addEventListener\('click', function\(\)\{ \$\('cardImportModal'\)\.classList\.remove\('hidden'\); \}\)/.test(script));
T('角色卡导入两个选项按钮', /id="btnCardImportText"/.test(html) && /id="btnCardImportJson"/.test(html));
T('角色卡 txt 输入框 accept 三类型', /id="importCardTextFile" accept="\.txt,\.md,\.markdown"/.test(html));
T('btnCardImportText → 文本文件', /\$\('btnCardImportText'\)\.addEventListener\('click', function\(\)\{ \$\('cardImportModal'\)\.classList\.add\('hidden'\); \$\('importCardTextFile'\)\.click\(\); \}\)/.test(script));
T('btnCardImportJson → 梦语 json', /\$\('btnCardImportJson'\)\.addEventListener\('click', function\(\)\{ \$\('cardImportModal'\)\.classList\.add\('hidden'\); \$\('importCardFile'\)\.click\(\); \}\)/.test(script));
T('importCardText 函数存在（接线到智能导入）', /function importCardText\(file\)\{[\s\S]{0,40}readLibText\(file, 'card'\)/.test(script));
T('importWorldText 改为接线到智能导入', /function importWorldText\(file\)\{[\s\S]{0,40}readLibText\(file, 'world'\)/.test(script));
T('readLibText 空文件提示', /if\(!txt\.trim\(\)\)\{ alert\('导入失败：文件内容为空。'\); return; \}/.test(script));
T('readLibText 10 万字上限', /txt\.length > 100000/.test(script));
T('adoptOrConvert 格式校验总入口', /function adoptOrConvert\(kind, txt, base\)/.test(script));
T('libJsonFromText 符合格式直接入库', /function libJsonFromText\(txt, kind\)/.test(script) && /if\(raw\.charAt\(0\) !== '\{'\) return false;/.test(script));
T('结构化 JSON 直接导入角色卡', /__mengyu_card__ === true\) \? data\.card : data/.test(script) && /cards\.push\(c\)/.test(script));
T('结构化 JSON 直接导入世界书', /__mengyu_world__ === true\) \? data\.world : data/.test(script) && /worlds\.push\(w\)/.test(script));
T('无 Key 退化直接原文导入（不提炼）', /未配置 API Key，已按原文直接导入/.test(script));
T('pushRawLib 原文入库函数', /function pushRawLib\(kind, txt, base\)/.test(script));
T('libAiBusy 防重入声明 + 守卫', /var libAiBusy = false;[\s\S]{0,120}function aiConvertLibText\(kind, txt, base\)\{[\s\S]{0,80}if\(libAiBusy\) return;/.test(script));
T('AI 整理系统提示：角色卡助手', /你是「梦语」的角色卡整理助手/.test(script));
T('AI 整理系统提示：世界书助手', /你是「梦语」的世界书整理助手/.test(script));
T('原文可直接当人设/世界观 → 保留一字不改', /persona 设为空字符串 ""（表示「原文已可直接使用」/.test(script) && /world 设为空字符串 ""（表示「原文已可直接使用」/.test(script));
T('人设/世界观内容不改只提炼关键词', /必须忠于原文，不得新增原文没有的设定/.test(script));
T('关键词数量随剧情与重要程度自由决定', /可能一个都没有（那时 keywords 给空数组 \[\]），也可能有多个/.test(script));
T('AI 整理入库卡片（原文直存或人设≤2000）', /persona:\(personaRaw \? personaRaw\.slice\(0,2000\) : txt\.trim\(\)\)/.test(script));
T('AI 整理入库世界书（原文直存或描述≤2000）', /world:\(worldRaw \? worldRaw\.slice\(0,2000\) : txt\.trim\(\)\)/.test(script));

// ---- 教程 ----
T('主页教程含酒馆结识弹窗四能力', /「酒馆」里点「结识角色卡 \/ 收集世界书」会先弹窗填写意向/.test(script) && /从已有角色卡生成配套的世界书/.test(script));
T('主页教程含精炼度控制字数', /「精炼度」控制生成字数/.test(script));
T('主页教程世界书带关键词', /生成的世界书会按剧情自动带上「关键词」/.test(script));
T('主页教程角色卡提取/模仿', /角色卡也能用 AI「提取 \/ 模仿」/.test(script) && /该文本没有该角色/.test(script));
T('群聊教程含续写剧情', /「群设置 → 续写剧情」/.test(script));
T('群聊教程含视角与总结', /第一人称.*主角由你扮演/.test(script) && /总结精炼度.*剧情流程写进会话「总结」/.test(script));
T('故事教程含续写剧情', /「故事设置 → 续写剧情」/.test(script));
T('故事教程含世界观自动更新', /「世界观」会随剧情自动更新/.test(script));
T('主页教程无集市', !/主页教程[^}]*集市/.test(script));
T('群聊教程含重置删其后重新生成', /重置消息会删掉它之后的内容、按之前的剧情重新生成/.test(script));
T('私聊教程含从已有角色卡导入', /也可以点「从已有角色卡导入」，把角色卡库里的角色一键覆盖成当前智能体/.test(script));

// ---- 教程 v0.4.3 更新 ----
T('主页教程含导入确认弹窗 + AI 整理', /点「角色卡 \/ 世界书」页的「导入」会先弹窗确认文件类型/.test(script) && /不符合（小说 \/ 散文 \/ 零散设定）就调用 AI 整理成规范格式/.test(script));
T('主页教程保留提取/模仿带关键词句', /提取 \/ 模仿生成的世界书会按剧情自动带上「关键词」/.test(script));
T('群聊教程含字数范围 + 强制字数', /「＋」里的「字数」分成「字数范围」与「强制字数」[\s\S]{0,120}AI 回复会强制写到约 N 字（±10%）/.test(script));
T('群聊教程含记忆按剧情知晓', /记住自己亲身经历、剧情里合理知晓的事——没在场、不知情的情节不会被写进记忆/.test(script));
T('群聊教程含随机顺序固定 + 横滑', /「随机顺序」按钮固定在「下轮对话」右侧/.test(script) && /桌面鼠标滚轮或按住左键拖动、手机手指滑动/.test(script));
T('故事教程含字数范围 + 强制字数', /「字数」可设「字数范围」（上限 \/ 下限），也能开「强制字数」让 AI 写到约 N 字（±10%）/.test(script));
T('私聊教程含字数范围 + 强制字数', /字数（字数范围上限 \/ 下限，或强制字数）/.test(script));

// ---- v0.4.4 剧情时间线（世界观记忆）----
T('世界线字段 newConv 默认空', /worldMem:'', worldMemAt:0/.test(script));
T('load 归一化 worldMem', /if\(typeof cv\.worldMem !== 'string'\) cv\.worldMem = '';/.test(script));
T('importBackup 归一化 worldMem', /if\(typeof conv\.worldMem !== 'string'\) conv\.worldMem = '';/.test(script));
T('设置页世界线文本区 gsWorldMem', /id="gsWorldMem" rows="4"/.test(html));
T('世界线仅作者可见说明（设置页）', /它只给你（作者 \/ 玩家）看，角色不会看到它——角色只知道他们亲身经历或听说的剧情/.test(html));
T('世界线随记忆转移一起备份', /剧情时间线、成员关键词、玩家设定、群名头像、总结内容/.test(html));
T('FAB「时间线」菜单项', /data-act="timeline"[\s\S]{0,260}>时间线<\/button>/.test(html));
T('时间线弹窗 + 内容/复制/关闭', /id="timelineModal" class="modal-overlay hidden"/.test(html) && /id="timelineBody"/.test(html) && /id="timelineCopy"/.test(html) && /id="timelineClose"/.test(html));
T('#timelineBody CSS', /#timelineBody\{white-space:pre-wrap/.test(cssBlock));
T('时间线弹窗按模式给副标题', /cv\.mode === 'story' \? '「'\+name\+'」的故事发展线'/.test(script));
T('openGroupSettings 回填世界线', /\$\('gsWorldMem'\)\.value = cv\.worldMem \|\| '';/.test(script));
T('saveGroupSettings 写回世界线', /cv\.worldMem = \$\('gsWorldMem'\)\.value\.trim\(\);/.test(script));
T('updateStoryline 函数存在', /function updateStoryline\(cv\)\{/.test(script));
T('世界线自动续写受 autoMemory 门控', /function updateStoryline\(cv\)\{[\s\S]{0,120}if\(!cv\.autoMemory\) return;/.test(script));
T('世界线续写节流约 8 条用户发言', /if\(uc - \(cv\.worldMemAt\|\|0\) < 8\) return;/.test(script));
T('世界线续写 8000 字上限', /if\(cur\.length >= 8000\) return;/.test(script));
T('世界线整理者系统角色（旁观者）', /剧情时间线整理者[\s\S]{0,120}只给作者看[\s\S]{0,60}你不是故事里的角色/.test(script));
T('worldMem 不注入角色（buildMessages 无引用）', !/function buildMessages[\s\S]{0,5200}worldMem/.test(script));

// ---- v0.4.4 总结仅作者可见 ----
T('总结按钮提示仅作者可见', /只给你（作者\/玩家）看，供回顾剧情并防止故事剧情发生错乱（角色看不到总结）/.test(html));
T('总结文本区占位提示仅作者可见', /这份总结只给你（作者 \/ 玩家）看，供回顾剧情、防止故事剧情发生错乱——角色不会看到它/.test(html));
T('buildMessages 不再注入 cv.summary', !/function buildMessages[\s\S]{0,5200}cv\.summary/.test(script));
T('compressMemories 只压缩角色记忆（重要剧情保留）', /function compressMemories\(cv\)\{[\s\S]{0,1200}请把上面这段「你的记忆」压缩精炼[\s\S]{0,500}重要的剧情、关系、关键信息一律保留，只精简措辞、合并同类项[\s\S]{0,400}直接输出要点式内容，不要任何说明/.test(script));

// ---- v0.4.4 关键词自主成长 + 语义放宽 ----
T('记忆指令要求新词标注「新增」', /新增关键词：新关键词——一句话详情（新增的关键词）/.test(script));
T('记忆指令：接近 40 个只更新不新增', /若你的关键词已接近 40 个，就只更新、不要再新增/.test(script));
T('解析 40 个上限 + 新词 key 截 40 字', /if\(c\.keywords\.length >= 40\) return;[\s\S]{0,80}key:kk\.slice\(0,40\)/.test(script));
T('kw-key 长度上限放宽到 40', /class="kw-key" maxlength="40"/.test(html));
T('记忆指令关键词语义放宽（不限于性格·词长不限）', /关键词不限于性格：也可以是某个时间、地点、物品、人物、事件、身份、目标、关系等，词长不限，不必是四个字/.test(script));
T('设置页关键词提示语语义放宽', /关键词可以是性格、身份、目标，也可以是某个时间、地点、物品、人物、事件、关系等，词长不限/.test(html));
T('酒馆关键词语义放宽且维持 1-3 个', /给出 1-3 个与该角色相关、容易随剧情发展而变化的关键词（关键词不限于性格：可以是身份、目标，也可以是某个时间、地点、物品、人物、事件、关系等，词长不限，不必是四个字）/.test(script));

// ---- v0.4.4 安卓系统返回键 + 退出确认 ----
T('退出确认弹窗 exitModal', /id="exitModal" class="modal-overlay hidden">[\s\S]{0,200}<h3>退出梦语<\/h3>/.test(html));
T('退出取消/确认按钮', /id="exitNo">取消<\/button>[\s\S]{0,40}id="exitYes">退出<\/button>/.test(html));
T('exitYes 调用原生 exitApp', /cap\.exitApp\(\);/.test(script));
T('exitYes 无原生环境走 window.close + toast', /try\{ window\.close\(\); \}catch\(e\)\{\} showToast\('已退出。'\)/.test(script));
T('nativeCapApp 取 Capacitor App 插件', /function nativeCapApp\(\)\{ return window\.Capacitor && window\.Capacitor\.Plugins && window\.Capacitor\.Plugins\.App; \}/.test(script));
T('closeOverlayById 特判确认弹窗/智能体覆盖', /if\(id === 'confirmModal'\)\{ resetConfirm\(\); return; \}[\s\S]{0,80}if\(id === 'dmCardModal'\)\{ dmCardReset\(\); return; \}/.test(script));
T('closeOverlayById 返回时还原设置主题', /if\(id === 'settingsModal'\) applyTheme\(settings\.theme\)/.test(script));
T('nativeBack 有弹层先关最上层', /if\(top\)\{ closeOverlayById\(top\); return; \}/.test(script));
T('nativeBack 其次关关系图', /if\(relState\.open\)\{ closeRel\(\); return; \}/.test(script));
T('nativeBack 再收起 FAB', /if\(fm && !fm\.classList\.contains\('hidden'\)\)\{ closeFabMenu\(\); return; \}/.test(script));
T('nativeBack 再关主页＋菜单', /if\(nm && !nm\.classList\.contains\('hidden'\)\)\{ nm\.classList\.add\('hidden'\); return; \}/.test(script));
T('nativeBack 聊天内返回主页列表', /if\(document\.body\.classList\.contains\('chat-open'\)\)\{ document\.body\.classList\.remove\('chat-open'\); return; \}/.test(script));
T('nativeBack 子页退回会话列表', /if\(panelView === 'log'\)\{ showPanelView\('about'\); return; \}[\s\S]{0,80}if\(panelView !== 'conv'\)\{ showPanelView\('conv'\); return; \}/.test(script));
T('nativeBack 主页根层弹退出确认', /\$\('exitModal'\)\.classList\.remove\('hidden'\);\s*\/\/ 主页根层：问是否退出软件/.test(script));
T('仅原生平台注册 backButton', /if\(_capApp && window\.Capacitor\.isNativePlatform && window\.Capacitor\.isNativePlatform\(\)\)\{[\s\S]{0,80}_capApp\.addListener\('backButton', function\(\)\{ nativeBack\(\); \}\)/.test(script));

// ---- v0.4.4 主页「＋」新建攻略 / 新建模拟 占位 ----
T('菜单顺序：新建故事→新建攻略→新建模拟→导入记忆', /data-act="story">新建故事<\/button>[\s\S]{0,120}data-act="guide">新建攻略<\/button>[\s\S]{0,80}data-act="sim">新建模拟<\/button>[\s\S]{0,120}data-act="import">导入记忆<\/button>/.test(html));
T('新建攻略占位提示开发中', /act === 'guide'\) showToast\('攻略模式开发中，敬请期待'/.test(script));
T('新建模拟占位提示开发中', /act === 'sim'\) showToast\('模拟模式开发中，敬请期待'/.test(script));

// ---- v0.4.4 教程原地更新 ----
T('群聊教程含世界线 + 总结仅作者可见', /剧情时间线（世界观记忆）」会自动记录剧情发展、也可手动编辑；时间线与「总结」都只给作者（玩家）看，角色不会看到/.test(script));
T('群聊教程含关键词自主成长', /经历影响自身塑造的重大剧情后，TA 还会在记忆提炼时自主新增「关键词」——关键词不限于性格，也可以是某个时间 \/ 地点 \/ 物品 \/ 人物 \/ 事件 \/ 身份 \/ 关系等，词长不限/.test(script));
T('群聊教程 FAB 含时间线小工具', /搜索 \/ 骰子 \/ 费用 \/ 字数 \/ 关系图 \/ 时间线 \/ 图片小工具/.test(script));
T('故事教程含世界线 + 总结作者可见', /「世界观」页签的「剧情时间线（世界观记忆）」会自动记录故事发展线、也可手动编辑；「总结」可压缩上下文、勾选也能同时压缩角色记忆——时间线与总结都只给作者（玩家）看/.test(script));
T('故事教程含角色关键词自主成长', /经历影响自身的重大剧情后，角色会自主给「关键词」成长（不限于性格，时间 \/ 地点 \/ 物品 \/ 人物 \/ 事件等皆可，词长不限）/.test(script));
T('主页教程含新建攻略/新建模拟占位', /另有「新建攻略」「新建模拟」两个占位入口，对应后面将推出的攻略 \/ 模拟模式/.test(script));
T('私聊教程含世界线 + 总结作者可见', /「世界观」页签里的「剧情时间线（世界观记忆）」会随你们的对话自动记录推进线、也可手动编辑，「＋」里也有「时间线」小工具；时间线与「总结」都只给作者看/.test(script));
T('私聊教程含关键词自主成长', /重大经历后也会在记忆提炼时自主成长「关键词」/.test(script));

// ---- v0.4.5 导出角色卡 / 世界书：先选格式 ----
T('导出弹窗 + 四个格式按钮（md / txt / json / 酒馆 png）', /id="exportModal"/.test(html) && /id="btnExportMd"/.test(html) && /id="btnExportTxt"/.test(html) && /id="btnExportJson"/.test(html) && /id="btnExportPng"/.test(html) && /id="btnExportCancel"/.test(html) && !/id="btnExportMarkdown"/.test(html));
T('导出弹窗说明四种格式', /md \/ txt<\/b> 是纯文本，方便阅读、编辑与分享[\s\S]{0,120}梦语 json<\/b> 是本软件的完整备份[\s\S]{0,160}酒馆 png<\/b> 是 SillyTavern 通用的角色卡格式/.test(html));
T('openExportModal / doExport / libMarkdown 函数', /function openExportModal\(kind, item\)\{/.test(script) && /function doExport\(ext\)\{/.test(script) && /function libMarkdown\(kind, item\)\{/.test(script));
T('doExport json 走原备份导出', /if\(ext === 'json'\)\{[\s\S]{0,80}if\(kind === 'card'\) exportCard\(item\); else exportWorld\(item\);/.test(script));
T('doExport md/markdown 走纯文本', /downloadText\(base \+ '\.' \+ ext, libMarkdown\(kind, item\)\);/.test(script));
T('角色卡面板导出改为弹窗', /var exItem = kind==='card' \? getCard\(itemId\) : getWorld\(itemId\);[\s\S]{0,80}if\(exItem\) openExportModal\(kind, exItem\);/.test(script));
T('libMarkdown 角色卡含人设/关键词', /'## 人设\\n' \+ \(safeText\(item\.persona\)/.test(script));
T('libMarkdown 世界书含世界观/关键词', /'## 世界观\\n' \+ \(safeText\(item\.world\)/.test(script));
T('safeFileName 过滤非法字符', /function safeFileName\(name\)\{ return String\(name\|\|'未命名'\)\.replace\([\s\S]{0,20},'_'\); \}/.test(script));

// ---- v0.4.5 续写剧情生成时间线 + 角色记忆顺序 ----
T('续写剧情 JSON 规格含 timeline 字段', /"summary":"剧情总结","timeline":"第一件事\\\\n第二件事\\\\n第三件事"/.test(script));
T('续写剧情提示词第 5 条时间线（6-20 条·旁观者视角）', /5\. 剧情时间线：把整段文本里发生过的剧情，按时间先后拆成一条条简短条目（一件重要的事一条，一行一条，6-20 条；越早发生的排在越前面，用旁观者视角叙述）/.test(script));
T('续写剧情提示词要求与原文一致', /这条时间线是后续续写时的事件先后依据，务必与原文一致/.test(script));
T('续写剧情解析写入 cv.worldMem', /cv\.worldMem = data\.timeline\.trim\(\)\.slice\(0, 8000\);/.test(script));
T('续写剧情解析重置 worldMemAt', /cv\.worldMemAt = 0;/.test(script));
T('续写剧情记忆规格按时间顺序且只记亲身经历', /按事件发生的时间顺序、要点式记录 TA 亲身经历过或别人当面告诉过 TA 的关键事件与人物关系，越早发生的写在越前面；TA 没有参与、并不知情的事不要写进 TA 的记忆/.test(script));
T('续写剧情 max_tokens 留出时间线余量', /\+ 1200\)/.test(script));
T('updateMemory 要求记忆按先后顺序排列', /记忆要按事件发生的先后顺序排列——越早发生的写在越前面，合并新内容后也要保持这个顺序，不要打乱已有记忆的先后。/.test(script));
T('buildMessages 追加【记忆与时间顺序】', /sys \+= '\\n\\n【记忆与时间顺序】\\n'/.test(script));
T('时间顺序规则第 1 条：记忆越靠前越早', /上面「你的记忆」是按时间先后记的，越靠前的事发生得越早；提到过去的事时，先后顺序要与之一致，不要颠倒。/.test(script));
T('时间顺序规则第 2 条：不知情的事不提', /你没参与、也没人告诉过你的事，你并不知情——不要凭空知道这些事，也不要提起它们。/.test(script));

// ---- v0.4.5 关系图关系名画在头像之上 + 长名折两行 ----
T('新增 .rel-lab-layer 独立图层 CSS', /\.rel-lab-layer\{pointer-events:none;\}/.test(cssBlock));
T('.rel-edge-label 有描边保证可读', /\.rel-edge-label\{[^}]*paint-order:stroke/.test(cssBlock));
T('关系名图层 pointer-events:none', /\.rel-edge-label\{[^}]*pointer-events:none/.test(cssBlock));
T('relLabelLines 函数存在', /function relLabelLines\(rel\)\{/.test(script));
T('relLabelLines 短名不超过 6 字不折', /if\(s\.length <= 6\) return \[s\];/.test(script));
T('relLabelLines 优先在标点处折行', /'，、。；：· 　'\.indexOf\(s\.charAt\(i - 1\)\) >= 0/.test(script));
T('renderRelGraph 追加 labLayer 图层', /labLayer\.setAttribute\('class', 'rel-lab-layer'\);/.test(script));
T('关系名 tspan 折行用 dy 1.15em', /ts\.setAttribute\('dy', ti === 0 \? \(lab\.childNodes\.length > 1 \? '-0\.575em' : '0'\) : '1\.15em'\);/.test(script));

// ---- v0.4.5 头像裁剪 + 原图查看 ----
T('裁剪弹窗 avCropModal 元素齐全', /id="avCropModal"/.test(html) && /id="avCropBox"/.test(html) && /id="avCropImg"/.test(html) && /id="avCropZoom"/.test(html) && /id="btnAvCropOk"/.test(html) && /id="btnAvCropCancel"/.test(html));
T('查看原图按钮 + 原图容器', /id="btnAvCropOrigin"/.test(html) && /id="avCropOriginBox"/.test(html) && /id="avCropOriginImg"/.test(html));
T('导出边长提高到 320（不再模糊）', /var AV_CROP_OUT = 320;/.test(script));
T('取景框边长 240', /var AV_CROP_BOX = 240;/.test(script));
T('avCropApply 保证图片盖满取景框', /avCrop\.tx = Math\.min\(0, Math\.max\(AV_CROP_BOX - w, avCrop\.tx\)\);/.test(script));
T('avCropZoomTo 以取景框中心为锚点缩放', /var cx = \(AV_CROP_BOX \/ 2 - avCrop\.tx\) \/ old;/.test(script));
T('avCropHasAlpha 采样判透明', /function avCropHasAlpha\(img, sx, sy, sw, sh\)\{/.test(script));
T('有透明走 PNG、无透明铺白底走 JPEG', /if\(!alpha\)\{ cx\.fillStyle = '#ffffff'; cx\.fillRect\(0, 0, AV_CROP_OUT, AV_CROP_OUT\); \}/.test(script));
T('fileToAvatar 改为走裁剪弹窗', /function fileToAvatar\(file, cb\)\{[\s\S]{0,120}openAvatarCrop\(file, function\(dataUrl\)\{/.test(script));
T('所有头像上传统一走 fileToAvatar', /所有头像上传（成员 \/ 群聊 \/ 私聊 \/ 角色卡 \/ 世界书）统一走这里：先裁剪，再回填草稿/.test(script));
T('裁剪框 CSS 240×240 且 touch-action none', /\.av-crop-box\{[^}]*width:240px[^}]*touch-action:none/.test(cssBlock));

// ---- v0.4.5 垃圾桶：恢复最近删除的角色卡 / 世界书 / 聊天 ----
T('LS.trash = ds_trash', /trash:'ds_trash'/.test(script));
T('TRASH_MAX = 30', /var TRASH_MAX = 30;/.test(script));
T('垃圾桶侧边栏按钮 btnTrash', /id="btnTrash" class="rail-btn" title="垃圾桶（恢复误删）"/.test(html));
T('垃圾桶按钮在黑板之上', html.indexOf('id="btnTrash"') < html.indexOf('id="btnBoard"'));
T('btnTrash 用描线 SVG（fill:none stroke:currentColor）', /id="btnTrash"[\s\S]{0,120}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"/.test(html));
T('垃圾桶面板 trashView + trashList', /id="trashView" class="panel-view hidden"/.test(html) && /id="trashList"/.test(html));
T('TRASH_KIND 三种类型', /var TRASH_KIND = \{ card:'角色卡', world:'世界书', conv:'聊天' \};/.test(script));
T('pushTrash 深拷贝入栈', /data: JSON\.parse\(JSON\.stringify\(item\)\)/.test(script));
T('pushTrash 超过 30 截断', /if\(trash\.length > TRASH_MAX\) trash = trash\.slice\(0, TRASH_MAX\);/.test(script));
T('restoreTrash 函数存在', /function restoreTrash\(id\)\{/.test(script));
T('恢复角色卡 / 世界书 / 聊天分别入库', /if\(t\.kind === 'card'\)\{[\s\S]{0,220}\} else if\(t\.kind === 'world'\)\{[\s\S]{0,220}\} else \{/.test(script));
T('恢复聊天直接复原（成员/消息/世界观/时间线都在）', /聊天：直接复原（会话内部成员 \/ 消息的相对引用自洽，换一个新会话 id 即可）/.test(script));
T('恢复后新 id 避免冲突', /d\.id = seq\+\+;/.test(script));
T('恢复角色卡不带记忆', /d\.memory = '';   \/\/ 角色卡不带记忆（与导入规则一致）/.test(script));
T('删角色卡 / 世界书先进垃圾桶', /pushTrash\(kind, /.test(script));
T('删聊天先进垃圾桶', /pushTrash\('conv', /.test(script));
T('load 归一化垃圾桶并截断 30', /trash\.filter\(function\(t\)\{[\s\S]{0,200}(t\.kind === 'card' \|\| t\.kind === 'world' \|\| t\.kind === 'conv')[\s\S]{0,60}\}\)\.slice\(0, TRASH_MAX\);/.test(script));
// save() 现在是「按键表写入 + 跳过未变化 + 失败要提示」，垃圾桶必须在键表里
T('save 持久化垃圾桶', /var map = \{ set:settings, convs:convs, cards:cards, worlds:worlds, board:board, trash:trash \};/.test(script) && /localStorage\.setItem\(LS\[k\], str\);/.test(script));
T('save 写失败不再静默吞掉', /存档写入失败/.test(script) && /_lsWarned/.test(script) && /请到主页「垃圾桶」清理旧记录/.test(script));
T('save 跳过未变化的键', /if\(_lsCache\[k\] === str\) continue;/.test(script));
T('showPanelView 支持 trash 面板', /\$\('trashView'\)\.classList\.toggle\('hidden', v!=='trash'\);/.test(script) && /\$\('btnTrash'\)\.classList\.toggle\('on', v==='trash'\);/.test(script));

// ---- v0.4.5 关于：QQ 群 + 演绎剧情 + 链接确认 ----
T('QQ 群链接为新地址常量', /var QQ_GROUP_URL = 'https:\/\/qm\.qq\.com\/q\/JY41MrDQQy';/.test(script));
T('关于页 QQ 按钮不再显示群号', /id="aboutQQ"[\s\S]{0,1200}?QQ群<\/button>/.test(html) && !/598382490/.test(html.slice(html.indexOf('<div class="about-links">'), html.indexOf('id="aboutSite"'))));
T('简介改为「一起演绎剧情」', /class="about-intro">[\s\S]{0,300}让它们一起演绎剧情/.test(html));
T('简介不再有旧文案「一起演剧情」', !/class="about-intro">[^<]*让它们一起演剧情/.test(html));
T('链接确认弹窗 linkModal 元素齐全（不再显示网址）', /id="linkModal"/.test(html) && /id="linkDesc"/.test(html) && /id="linkCancel"/.test(html) && /id="linkGo"/.test(html) && !/id="linkUrl"/.test(html));
T('openLinkConfirm 函数存在', /function openLinkConfirm\(url, desc, after\)\{/.test(script));
T('linkGo 才真正跳转', /\$\('linkGo'\)\.addEventListener\('click', function\(\)\{[\s\S]{0,180}window\.open\(d\.url, '_blank'\);/.test(script));
T('linkCancel 只关闭不跳转', /\$\('linkCancel'\)\.addEventListener\('click', closeLinkConfirm\);/.test(script));
T('GitHub / 哔哩 / QQ 三链接都走确认弹窗', /openLinkConfirm\('https:\/\/github\.com\/mingyuezai0\/Dreamchat'/.test(script) && /openLinkConfirm\('https:\/\/space\.bilibili\.com\/498726578'/.test(script) && /openLinkConfirm\(QQ_GROUP_URL,/.test(script));

// ---- v0.4.5 教程原地更新 ----
T('主页教程含垃圾桶恢复', /「垃圾桶」保留你最近删除的角色卡、世界书与聊天（最多 30 个），点「恢复」即可复原/.test(script));
T('主页教程侧边栏含垃圾桶', /左边一列：酒馆 \/ 垃圾桶 \/ 黑板 \/ 角色卡 \/ 世界书 \/ 关于 \/ 设置，都是描线图标。/.test(script));
T('主页教程含导出四格式', /「导出」时先选格式：md \/ txt 是纯文本（方便阅读、编辑与分享），梦语 json 是完整备份（可原样导入回来，含头像），酒馆 png 会把头像画进 400×600 的图里/.test(script));
T('主页教程含头像裁剪 + 查看原图', /上传图片做头像时会先让你裁剪：拖动图片调整位置、滑动缩放，还能「查看原图」/.test(script));
T('主页教程含关于链接确认', /「关于」页的 GitHub \/ 哔哩哔哩 \/ QQ 群链接，点一下会先弹窗确认，点「取消」就不会跳转；页面上不显示具体网址。/.test(script));
T('群聊教程含续写剧情时间线', /同时还会把原文剧情按发生顺序整理成「剧情时间线（世界观记忆）」，接着往下续写时事件先后有据可依/.test(script));
T('群聊教程含关系名画在头像之上', /连线上的「关系名」画在角色头像之上（不会被头像挡住），名字较长时会自动折成两行。/.test(script));
T('故事教程含续写剧情时间线', /还会把原文剧情按发生顺序整理成「剧情时间线（世界观记忆）」，角色记忆也按时间顺序记录、只记 TA 亲身经历或被告知的事（不知情的情节不会被提起）。/.test(script));

// ================= v0.4.6 =================

// ---- Req1 对话温度滑杆（AI成员 / 智能体页签最下方）----
T('DEFAULT_TEMP 0.9 / DEFAULT_CONT_TEMP 0.7', /var DEFAULT_TEMP = 0\.9;/.test(script) && /var DEFAULT_CONT_TEMP = 0\.7;/.test(script));
T('温度范围常量 0-2', /var TEMP_MIN = 0, TEMP_MAX = 2;/.test(script));
T('成员页签有温度滑杆', /data-pane="members"[\s\S]{0,1400}id="gsTemp" min="0" max="2" step="0\.1" value="0\.9"/.test(html));
T('智能体页签有温度滑杆', /data-pane="agent"[\s\S]{0,4000}id="dmTemp" min="0" max="2" step="0\.1" value="0\.9"/.test(html));
T('温度滑杆带数值显示与两端标签', /id="gsTempVal">0\.9</.test(html) && /id="dmTempVal">0\.9</.test(html) && /class="temp-ends"><span>更稳定<\/span><span>更有创意<\/span>/.test(html));
T('温度滑杆样式三主题可用（accent-color 紫色）', /\.temp-range\{[^}]*accent-color:#7a5cf0/.test(cssBlock));
T('convTemp / curContTemp 取值助手', /function convTemp\(cv\)\{/.test(script) && /function curContTemp\(\)\{/.test(script));
T('setTempInputs / syncTempInputs 两个滑杆同步', /function setTempInputs\(cv\)\{/.test(script) && /function syncTempInputs\(src\)\{/.test(script));
T('两个滑杆 input 事件都同步', /\$\('gsTemp'\)\.addEventListener\('input', function\(\)\{ syncTempInputs\(this\); \}\);/.test(script) && /\$\('dmTemp'\)\.addEventListener\('input', function\(\)\{ syncTempInputs\(this\); \}\);/.test(script));
T('newConv 带 temperature / contTemp / thinkLevel', /temperature:DEFAULT_TEMP, contTemp:DEFAULT_CONT_TEMP, thinkLevel:newChatThinkLevel\(\)/.test(script));
T('load 归一化 temperature', /if\(typeof cv\.temperature !== 'number'[\s\S]{0,120}cv\.temperature = DEFAULT_TEMP;/.test(script));
T('load 归一化 contTemp', /if\(typeof cv\.contTemp !== 'number'[\s\S]{0,120}cv\.contTemp = DEFAULT_CONT_TEMP;/.test(script));
T('importBackup 归一化 temperature / contTemp', /if\(typeof conv\.temperature !== 'number'[\s\S]{0,130}conv\.temperature = DEFAULT_TEMP;/.test(script) && /if\(typeof conv\.contTemp !== 'number'[\s\S]{0,130}conv\.contTemp = DEFAULT_CONT_TEMP;/.test(script));
T('openGroupSettings 回填滑杆与思考等级', /setTempInputs\(cv\);/.test(script) && /gsThinkDraft = thinkLevelOf\(cv\);/.test(script));
T('saveGroupSettings 按模式写回温度', /cv\.temperature = Number\(\$\('dmTemp'\)\.value\);/.test(script) && /cv\.temperature = Number\(\$\('gsTemp'\)\.value\);/.test(script) && /cv\.thinkLevel = gsThinkDraft;/.test(script) && !/cv\.contTemp = Number/.test(script));
T('回复温度不再写死 0.9（改用 convTemp）', !/body\.temperature = 0\.9;/.test(script) && /body\.temperature = convTemp\(cv\);/.test(script));

// ---- Req2 续写剧情「生成温度」默认 0.7 ----
T('续写剧情弹窗有生成温度滑杆（默认 0.7）', /id="contModal"[\s\S]{0,4000}id="contTemp" min="0" max="2" step="0\.1" value="0\.7"/.test(html));
T('生成温度存全局 settings.contTemp', /settings\.contTemp = Number\(this\.value\);/.test(script) && /settings\.contTemp = DEFAULT_CONT_TEMP/.test(script));
T('生成温度数值显示 0.7', /id="contTempVal">0\.7</.test(html));
T('runContinue 即时读生成温度', /var contT = Number\(\$\('contTemp'\)\.value\);/.test(script));
T('runContinue 不再写死 temperature:0.4', !/stream:false, temperature:0\.4, max_tokens:maxTok/.test(script) && /stream:false, temperature:contT, max_tokens:maxTok/.test(script));
T('生成温度滑杆 input 更新数值并存盘', /\$\('contTemp'\)\.addEventListener\('input', function\(\)\{[\s\S]{0,200}\$\('contTempVal'\)\.textContent = Number\(this\.value\)\.toFixed\(1\);/.test(script));

// ---- Req3 API 页思考等级 ----
T('API 页签有思考等级三档', /data-pane="api"[\s\S]{0,1400}id="gsThinkLevel"[\s\S]{0,200}data-lv="medium"[\s\S]{0,120}data-lv="high"[\s\S]{0,120}data-lv="max"/.test(html));
T('思考等级按钮用 style-opts 样式（三主题适配）', /id="gsThinkLevel"[\s\S]{0,20}|<div class="style-opts" id="gsThinkLevel">/.test(html) || /<div class="style-opts" id="gsThinkLevel">/.test(html));
T('thinkLevelOf 只认三档否则 off', /function thinkLevelOf\(cv\)\{ var l = cv && cv\.thinkLevel; return \(l === 'medium' \|\| l === 'high' \|\| l === 'max'\) \? l : 'off'; \}/.test(script));
T('新聊天档位由全局深度思考决定', /function newChatThinkLevel\(\)\{ return settings\.thinking \? 'medium' : 'off'; \}/.test(script));
T('load 老会话按全局开关迁移思考等级', /if\(\['off','medium','high','max'\]\.indexOf\(cv\.thinkLevel\) === -1\) cv\.thinkLevel = newChatThinkLevel\(\);/.test(script));
T('importBackup 迁移思考等级', /if\(\['off','medium','high','max'\]\.indexOf\(conv\.thinkLevel\) === -1\) conv\.thinkLevel = newChatThinkLevel\(\);/.test(script));
T('回复请求真实发送 reasoning_effort', /body\.thinking = \{ type:'enabled' \}; body\.reasoning_effort = tLv;/.test(script));
T('思考关闭时才带 temperature', /if\(tLv === 'off'\)\{ body\.thinking = \{ type:'disabled' \}; body\.temperature = convTemp\(cv\); \}/.test(script));
T('回复不再依赖全局 settings.thinking 判定', !/if\(settings\.thinking\)\{ body\.thinking = \{ type:'enabled' \}; \}/.test(script));
T('点击已选档位＝关闭思考', /gsThinkDraft = \(gsThinkDraft === b\.dataset\.lv\) \? 'off' : b\.dataset\.lv;/.test(script));
T('renderThinkLevel 高亮当前档位', /function renderThinkLevel\(\)\{/.test(script) && /if\(b\.dataset\.lv === gsThinkDraft\) b\.classList\.add\('on'\);/.test(script));
T('全局深度思考提示改为「新建聊天的默认档位」', /这里决定<b>新建聊天<\/b>的默认档位（开启＝Medium）/.test(html) && /以各自设置为准/.test(html));

// ---- Req4 酒馆「收集世界书」----
T('酒馆按钮改为「收集世界书」', /id="btnMeetWorld"[\s\S]{0,400}收集世界书<\/button>/.test(html));
T('界面各处「结识世界书」字样已清除（CHANGELOG 历史除外）', !/结识世界书<\/button>/.test(html) && !/<h3>结识世界书<\/h3>/.test(html) && !/先「结识世界书」/.test(html) && !/想结识怎样的世界/.test(html));
T('收集世界书弹窗标题', /id="meetWorldModal"[\s\S]{0,120}<h3>收集世界书<\/h3>/.test(html));
T('收集世界书弹窗文案', /想收集怎样的世界？可只填一部分/.test(html));
T('酒馆下拉占位改为收集世界书', /（暂无世界书，先「收集世界书」）/.test(script));
T('酒馆生成提示语改为收集', /客人想收集这样一部世界书：/.test(script));
T('生成世界书成功 toast 改为收集成功', /showToast\(isCard \? '结识成功：「'\+card\.name\+'」' : '收集成功：世界书《'\+world\.name\+'》'\);/.test(script));

// ---- Req5 故事默认头像只留书本 ----
T('AV_STORY 只剩书本两条 path', /var AV_STORY = '<svg[\s\S]{0,400}?<\/svg>';/.test(script) && /var AV_STORY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8v13"\/><path d="M3 18a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"\/><\/svg>';/.test(script));
T('AV_STORY 不再有笔的两条 path', !/M17\.5 3\.5l3\.5 3\.5/.test(script) && !/M14\.5 6\.5l3 3/.test(script));
T('群聊 / 私聊默认头像未受影响', /var AV_CHAT = '<svg[\s\S]{0,400}?<\/svg>';/.test(script) && /var AV_DM = '<svg[\s\S]{0,400}?<\/svg>';/.test(script));

// ---- v0.4.6 教程原地更新 ----
T('群聊教程含对话温度 / 思考等级', /「AI成员」页签最下方可调「对话温度」（0\.0–2\.0，默认 0\.9，越低越稳定保守、越高越有创意）/.test(script) && /「API」页签最下方可设「思考等级」（Medium \/ High \/ Max，会真实作用在请求上/.test(script));
T('群聊教程续写剧情含生成温度', /「生成温度」（默认 0\.7）控制生成设定时的随机性/.test(script));
T('故事教程含温度与思考等级', /「故事设置 → AI成员」页签最下方可调「对话温度」/.test(script));
T('故事教程头像措辞改为书本', /故事默认是「书本」头像、暖色方形头像框/.test(script));
T('私聊教程含温度与思考等级', /「智能体」页签最下方可调「对话温度」（0\.0–2\.0，默认 0\.9），「API」页签最下方可设「思考等级」/.test(script));
T('主页教程故事头像措辞改为书本图标', /暖色方形是「故事」（书本图标）/.test(script));

// ================= v0.4.7 =================

// ---- 1 点击蓝色高亮 ----
T('全局 -webkit-tap-highlight-color 透明', /\*\{box-sizing:border-box; margin:0; padding:0; -webkit-tap-highlight-color:transparent;\}/.test(cssBlock));
T('html,body 与 button 也去高亮', /html,body\{height:100%; -webkit-tap-highlight-color:transparent;\}/.test(cssBlock) && /button\{[^}]*-webkit-tap-highlight-color:transparent;/.test(cssBlock));

// ---- 2 发送图片 ----
T('「+」菜单有「图片」项', /class="fab-item" data-act="image"[\s\S]{0,400}图片<\/button>/.test(html));
T('图片项用 lucide image 图标（描线）', /data-act="image"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"[\s\S]{0,300}<rect x="3" y="3" width="18" height="18" rx="2"/.test(html));
T('fab 菜单点击走 imgFile', /else if\(act === 'image'\) \$\('imgFile'\)\.click\(\);/.test(script));
T('有图片预览条与隐藏 file input（可多选）', /id="imgBar"/.test(html) && /id="imgFile" accept="image\/\*" multiple/.test(html));
T('图片压到 1024 边长 + JPEG 0.85', /var IMG_MAX_SIDE = 1024;/.test(script) && /toDataURL\('image\/jpeg', 0\.85\)/.test(script));
T('图片入库到消息 images 字段', /images:imgsMeta/.test(script));
T('气泡渲染 msg-imgs', /class="msg-imgs"/.test(script) && /\.msg-imgs img\{/.test(cssBlock));
T('请求按 OpenAI 多模态 content 数组发送', /type:'image_url', image_url:\{ url: im\.url \}/.test(script));
T('只发图片也能发出去', /!pendingImgs\.length\) return;/.test(script));
T('图片最多 5 张', /var IMG_MAX = 5;/.test(script));
T('多选超量只取前几张', /if\(fs\.length > room\) showToast\('最多一次发 '\+IMG_MAX\+' 张图片，只加入前 '\+room\+' 张'\);/.test(script));
T('每张缩略图右上角有小 ✕', /class="img-x" data-i="/.test(script) && /\.img-x\{position:absolute; top:3px; right:3px;[\s\S]{0,160}background:rgba\(0,0,0,\.45\)/.test(cssBlock));
T('点 ✕ 单独删除某张', /\$\('imgBar'\)\.addEventListener\('click', function\(e\)\{[\s\S]{0,160}pendingImgs\.splice\(Number\(b\.dataset\.i\), 1\);/.test(script));
T('不再有「移除」文字与图片文件名提示', !/id="imgX"/.test(html) && !/id="imgName"/.test(html) && !/id="imgThumb"/.test(html) && !/发送时会随消息一起交给 AI/.test(html));
T('发送后清空待发图片', /if\(pendingImgs\.length\)\{ pendingImgs = \[\]; renderImgBar\(\); \}/.test(script));
T('点图片放大查看', /function openImgView\(src, alt\)\{/.test(script) && /id="imgView"/.test(html) && /id="imgViewPic"/.test(html));

// ---- 3 点 AI 头像看人物详情（只读）----
T('人物详情弹窗元素齐全', /id="charViewModal"/.test(html) && /id="cvmAvatar"/.test(html) && /id="cvmName"/.test(html) && /id="cvmTags"/.test(html) && /id="cvmPersona"/.test(html) && /id="cvmMemory"/.test(html) && /id="cvmKeywords"/.test(html) && /id="cvmClose"/.test(html));
T('openCharView 支持成员与路人两种', /function openCharView\(speakerId, npcName\)\{/.test(script) && /var c = getChar\(cv, speakerId\);/.test(script));
T('点消息头像 / 名字打开详情', /\$\('msgList'\)\.addEventListener\('click', function\(e\)\{[\s\S]{0,120}e\.target\.closest\('\.msg \.avatar, \.msg \.name'\)/.test(script));
T('自己的消息不打开详情', /if\(!m \|\| m\.speakerId === 'user'\) return;   \/\/ 「我」自己的头像不打开详情/.test(script));
T('详情弹窗只读：没有保存按钮', /id="charViewModal"[\s\S]{0,2000}?id="cvmClose">关闭<\/button>/.test(html) && !/id="charViewModal"[\s\S]{0,2000}?id="cvmSave"/.test(html));

// ---- 4 手机端不抢输入法 ----
T('focusSoft 只在非触屏聚焦', /function focusSoft\(el\)\{ if\(el && !isTouchUI\(\)\)/.test(script) && /function isTouchUI\(\)\{ return \(window\.matchMedia && window\.matchMedia\('\(hover: none\)'\)\.matches\); \}/.test(script));
T('关键词「详情」展开不再抢焦点', /var ta = rows2\[i\]\.querySelector\('\.kw-detail'\); focusSoft\(ta\);/.test(script));
T('添加关键词不再抢焦点', /var k = rows\[rows\.length-1\]\.querySelector\('\.kw-key'\); focusSoft\(k\);/.test(script));

// ---- 5 去掉露出的链接 ----
T('链接确认弹窗不再显示网址元素', !/id="linkUrl"/.test(html) && /function openLinkConfirm\(url, desc, after\)\{[\s\S]{0,200}\$\('linkDesc'\)\.textContent = desc;/.test(script));
T('CHANGELOG 里不再露出 http 链接', (function(){
  var seg = script.slice(script.indexOf('var CHANGELOG'), script.indexOf('var CHANGELOG') + 40000);
  var urls = (seg.match(/https?:\/\/[^ '\"<),]*/g) || []).filter(function(u){ return u.indexOf('www.w3.org') === -1; });
  return urls.length === 0;
})());
T('链接跳转功能保留', /\$\('linkGo'\)\.addEventListener\('click', function\(\)\{[\s\S]{0,200}window\.open\(d\.url, '_blank'\);/.test(script) && /var QQ_GROUP_URL = 'https:\/\/qm\.qq\.com\/q\/JY41MrDQQy';/.test(script));

// ---- 6 取消 / 保存固定在弹窗底部 ----
T('fixModalFooters 包裹可滚动区', /function fixModalFooters\(\)\{/.test(script) && /body\.className = 'modal-body';/.test(script) && /m\.classList\.add\('flexed'\);/.test(script));
T('.modal.flexed 弹性列布局 + 底部操作栏固定', /\.modal\.flexed\{display:flex; flex-direction:column; overflow:hidden; padding:0;\}/.test(cssBlock) && /\.modal\.flexed > \.modal-actions\{flex-shrink:0; margin:0;/.test(cssBlock));
T('启动时调用 fixModalFooters', /^fixModalFooters\(\);/m.test(script));

// ---- 7 / 8 上下文百分比与上下文长度 ----
T('总结弹窗右上角有上下文角标', /id="sumCtxPct"/.test(html) && /class="ctx-badge modal-corner" id="sumCtxPct"/.test(html));
T('ctxPctOf 按上下文长度算百分比', /function ctxPctOf\(cv\)\{/.test(script) && /estimateContextTokens\(cv\) \/ lim \* 1000\) \/ 10/.test(script));
T('上下文长度：全局 + 每聊天，留空回落', /var DEFAULT_CTX_LEN = 128000;/.test(script) && /function ctxLenOf\(cv\)\{ return normalizeCtxLen\(cv && cv\.ctxLen\) \|\| globalCtxLen\(\); \}/.test(script));
T('全局设置模型配置有上下文长度输入框', /<label>上下文长度（字数）<\/label>[\s\S]{0,200}id="stCtxLen"/.test(html));
T('各模式 API 页有上下文长度输入框', /data-pane="api"[\s\S]{0,1200}id="gsCtxLen"/.test(html));
T('读写上下文长度', /settings\.ctxLen = normalizeCtxLen\(\$\('stCtxLen'\)\.value\);/.test(script) && /cv\.ctxLen = normalizeCtxLen\(\$\('gsCtxLen'\)\.value\);/.test(script));
T('openSummary 刷新百分比', /renderSumMode\(\);\s*updateSumCtxPct\(\);/.test(script));

// ---- 9 剧情日历 ----
T('时间线弹窗右上角有日历图标按钮', /id="timelineCal"/.test(html) && /class="icon-btn modal-corner" id="timelineCal"/.test(html));
T('日历弹窗：年月 + 星期表头 + 日期格', /id="calModal"/.test(html) && /id="calTitle"/.test(html) && /class="cal-week"><span>日<\/span><span>一<\/span>/.test(html) && /id="calGrid"/.test(html));
T('日历用 grid 按星期排列（7 列）', /\.cal-week\{display:grid; grid-template-columns:repeat\(7,1fr\)/.test(cssBlock) && /\.cal-grid\{display:grid; grid-template-columns:repeat\(7,1fr\)/.test(cssBlock));
T('日历支持上 / 下月与设为今天', /id="calPrev"/.test(html) && /id="calNext"/.test(html) && /id="calToday"/.test(html) && /function calStep\(n\)\{/.test(script));
T('点某天可手动改剧情日期', /\$\('calGrid'\)\.addEventListener\('click', function\(e\)\{[\s\S]{0,260}cv\.calDate = ds;/.test(script));
T('日期工具函数齐全', /function parseDate\(s\)\{/.test(script) && /function dateToStr\(y, m, d\)/.test(script) && /function addDaysStr\(s, n\)/.test(script) && /function weekdayOf\(o\)/.test(script) && /function calFullText\(s\)/.test(script));
T('dateBlock 把日期与星期注入角色提示词', /function dateBlock\(cv\)\{/.test(script) && /dateBlock\(cv\);/.test(script) && /都要符合常识/.test(script));
T('提示词要求角色按日期行事（学生周末不上学等）', /身份是学生，周末和假期就不该在上学/.test(script));
T('ensureCalDate 按角色卡 / 世界书推导首日', /function ensureCalDate\(cv\)\{/.test(script) && /如果完全没有提到时间，就用真实的今天/.test(script));
T('首日推导失败也有兜底（真实今天）', /cv\.calDate = todayStr\(\);   \/\/ 先兜底/.test(script));
T('用户消息提到「过了多久」先本地推进', /function heuristicDateShift\(cv, text\)\{/.test(script) && /\(翌日\|次日\|第二天\|隔天\|转天/.test(script));
T('后台按剧情推进日期', /function advanceCalDate\(cv\)\{/.test(script) && /function finishSequence\(cv\)\{/.test(script) && /advanceCalDate\(cv\);/.test(script));
T('每若干条消息才检查一次日期', /if\(cv\.history\.length - \(cv\.calAt \|\| 0\) < 6\) return;/.test(script));
T('日期随备份一起保存', /cv\.calDate = parseDate\(cv\.calDate\) \? cv\.calDate : '';/.test(script) && /conv\.calDate = parseDate\(conv\.calDate\) \? conv\.calDate : '';/.test(script));
T('首次发消息前会等日期确定（带 8 秒兜底）', /Promise\.race\(\[ensureCalDate\(cv\), guard\]\)/.test(script));

// ---- 10 生成时留在回复开头 + 回到底部箭头 ----
T('对话区底部有回到底部箭头', /id="scrollDown" class="scroll-down hidden"/.test(html));
T('箭头在对话区右下角（「＋」左侧）', /\.scroll-down\{position:absolute; right:66px; bottom:100%; margin-bottom:10px; transform:scale\(\.86\); z-index:41/.test(cssBlock));
T('不在底部才显示箭头', /b\.classList\.toggle\('show', !atBottom\(\)\);/.test(script) && /function initScrollWatch\(\)\{/.test(script));
T('点箭头平滑回到底部', /\$\('scrollDown'\)\.addEventListener\('click', function\(\)\{ scrollBottom\(true\); \}\);/.test(script) && /l\.scrollTo\(\{ top:l\.scrollHeight, behavior:'smooth' \}\)/.test(script));
T('留在回复开头：贴住新回复的顶部', /function stickMsgTop\(el\)\{/.test(script) && /function afterAppendScroll\(el\)\{/.test(script) && /afterAppendScroll\(msgEls\[msg\.id\]\);/.test(script));
T('留在回复开头时流式不再跟着滚', /if\(settings\.keepReplyTop !== false\) updateScrollDown\(\); else maybeScroll\(\);/.test(script));
T('全局设置可开关「留在回复开头」', /id="stKeepTop"/.test(html) && /settings\.keepReplyTop = \$\('stKeepTop'\)\.checked;/.test(script));
T('老用户默认开启留在回复开头', /if\(typeof settings\.keepReplyTop !== 'boolean'\) settings\.keepReplyTop = true;/.test(script));

// ---- 11 UI 动画 ----
T('按钮点击有缩放过渡（只过渡 transform / opacity）', /button\{transition:transform \.1s ease, opacity \.12s ease;\}/.test(cssBlock) && /button:active\{transform:scale\(\.97\);\}/.test(cssBlock));
T('动效不再过渡 background-color / box-shadow（防卡顿）', !/button\{transition:[^}]*background-color/.test(cssBlock) && !/button\{transition:[^}]*box-shadow/.test(cssBlock));
T('大行不做缩放（改用透明度）', /\.conv-item:active, \.lib-card:active\{transform:none; opacity:\.72;\}/.test(cssBlock));
T('弹窗淡入 + 轻微放大', /@keyframes myModalIn\{/.test(cssBlock) && /\.modal-overlay:not\(\.hidden\) > \.modal\{animation:myModalIn/.test(cssBlock));
T('面板切换淡入', /@keyframes myPaneIn\{/.test(cssBlock) && /\.panel-view:not\(\.hidden\), \.gs-pane:not\(\.hidden\)/.test(cssBlock));
T('滚动回调改到 rAF 里执行（防滚动卡顿）', /function queueScrollDown\(\)\{/.test(script) && /l\.addEventListener\('scroll', queueScrollDown, \{ passive:true \}\);/.test(script));
T('三主题共用同一套动画（无主题分支覆盖 transition）', !/data-theme="dark"\][^{]*\{[^}]*animation:none/.test(cssBlock));
T('系统「减少动态效果」时关掉动画', /@media \(prefers-reduced-motion: reduce\)\{/.test(cssBlock));

// ---- 12 手机状态栏 / home 条 ----
T('viewport-fit=cover', /name="viewport" content="width=device-width, initial-scale=1\.0, viewport-fit=cover"/.test(html));
T('theme-color 元标签随主题', /id="metaTheme"/.test(html) && /var THEME_CHROME = \{ default:'#eef1f6', dark:'#12141a', scroll:'#eee2c8' \};/.test(script));
T('applyTheme 同步状态栏颜色', /function applyTheme\(theme\)\{[\s\S]{0,320}syncStatusBarColor\(theme\);/.test(script) && /function syncStatusBarColor\(theme\)\{/.test(script));
T('.app 缩进安全区（刘海 / 手势条）', /\.app\{display:flex; height:100vh; height:100dvh;\s*padding-top:env\(safe-area-inset-top\);/.test(cssBlock));
T('弹窗也避开安全区', /\.modal-overlay\{position:fixed; inset:0;[\s\S]{0,200}padding-top:calc\(20px \+ env\(safe-area-inset-top\)\)/.test(cssBlock));
T('图片查看按钮避开安全区', /\.img-view-x\{position:absolute; top:calc\(14px \+ env\(safe-area-inset-top\)\)/.test(cssBlock));

// ---- v0.4.7 教程原地更新 ----
T('群聊教程含图片与日历', /「＋」有搜索 \/ 骰子 \/ 费用 \/ 字数 \/ 关系图 \/ 时间线 \/ 图片小工具/.test(script) && /右上角还有「日历」入口/.test(script));
T('群聊教程含日期推进与角色按日期行事', /角色会照着日期与星期行事（学生周末不上学、深夜会犯困等）/.test(script));
T('群聊教程含回到底部箭头', /对话区底部中间会出现「回到底部」箭头/.test(script));
T('故事教程含图片 / 日历 / 人物详情', /「＋」里还有「图片」/.test(script) && /点消息里 AI 的头像或名字，可以看 TA 的人物详情（只读/.test(script));
T('私聊教程含图片与人物详情', /「图片」一次最多 5 张，会随你写的文字一起发给 AI（需要模型支持看图）/.test(script) && /点 TA 的头像或名字可以看人物详情（只读/.test(script));
T('主页教程含设置按钮固定与不显示网址', /所有设置窗口的「取消 \/ 保存」都固定在窗口最下方/.test(script) && /页面上不显示具体网址/.test(script));
T('主页教程含上下文长度与百分比', /「全局设置 → 模型配置」可以填「上下文长度」/.test(script) && /「总结」窗口右上角会显示当前上下文占它的百分比/.test(script));

// ---- v0.4.7 追加：上下文长度单位 k/m + 自动总结百分比 ----
T('上下文长度支持 k / m 单位', /function normalizeCtxLen\(v\)\{/.test(script) && /\(\[km\]\)\?/.test(script) && /if\(m\[2\] === 'k'\) n \*= 1000;/.test(script) && /else if\(m\[2\] === 'm'\) n \*= 1000000;/.test(script));
T('上下文长度大小写与逗号都能处理', /\.trim\(\)\.toLowerCase\(\)\.replace\(\/\[,\\s，\]\/g, ''\)/.test(script));
T('自动总结改为百分比 50 / 75 / 100', /var SUM_PCTS = \[50, 75, 100\];/.test(script) && /data-t="50">50%<\/button>/.test(html) && /data-t="75">75%<\/button>/.test(html) && /data-t="100">100%<\/button>/.test(html));
T('autoSumLimit 按上下文长度换算', /function autoSumLimit\(cv\)\{ return Math\.round\(ctxLenOf\(cv\) \* \(cv && cv\.autoSummary \? cv\.autoSummary : 0\) \/ 100\); \}/.test(script));
T('触发点用 autoSumLimit', /estimateContextTokens\(cv\) >= autoSumLimit\(cv\)/.test(script));
T('老版本绝对字数自动换算成百分比', /function normalizeAutoSummary\(v, cv\)\{/.test(script) && /var pct = Math\.round\(n \/ ctxLenOf\(cv\) \* 100\);/.test(script));
T('load / importBackup 都换算', /cv\.autoSummary = normalizeAutoSummary\(cv\.autoSummary, cv\);/.test(script) && /conv\.autoSummary = normalizeAutoSummary\(conv\.autoSummary, conv\);/.test(script));
T('总结里的文案显示百分比与大约字数', /「上下文长度」的 '\+cv\.autoSummary\+'%（约 '\+fmtTokens\(autoSumLimit\(cv\)\)\+' 字）/.test(script));

// ---- v0.4.7 追加：安卓系统栏适配 ----
T('capacitor 强制让出系统条边距', /"adjustMarginsForEdgeToEdge": "force"/.test(fs.readFileSync(path.join(ROOT, 'mobile/capacitor.config.json'), 'utf8')));
T('native 与 web 的 env() 缩进分开', /html\.native \.app\{padding:0;\}/.test(cssBlock) && /html\.native \.modal-overlay\{padding:20px;\}/.test(cssBlock));
T('早期判定原生平台并打 html.native', /if\(window\.Capacitor && window\.Capacitor\.getPlatform && window\.Capacitor\.getPlatform\(\) !== 'web'\)\{\s*document\.documentElement\.classList\.add\('native'\);/.test(script));
T('isNativeApp / themeBarsPlugin 助手', /function isNativeApp\(\)\{/.test(script) && /function themeBarsPlugin\(\)\{/.test(script) && /C\.registerPlugin\('ThemeBars'\)/.test(script));
T('主题切换同步系统条配色', /function syncStatusBarColor\(theme\)\{[\s\S]{0,400}tb\.setColors\(\{ bg:c, light:\(theme !== 'dark'\) \}\)/.test(script));
T('用户消息里 mention 的原生插件已注册', /registerPlugin\(ThemeBarsPlugin\.class\);/.test(fs.readFileSync(path.join(ROOT, 'mobile/android/app/src/main/java/com/mingyuezai0/dreamchat/MainActivity.java'), 'utf8')));
T('ThemeBarsPlugin 设窗口底色 + 图标明暗', (function(){
  try{
    var j = fs.readFileSync(path.join(ROOT, 'mobile/android/app/src/main/java/com/mingyuezai0/dreamchat/ThemeBarsPlugin.java'), 'utf8');
    return /setBackgroundDrawable/.test(j) && /setAppearanceLightStatusBars/.test(j) && /setAppearanceLightNavigationBars/.test(j) && /@CapacitorPlugin\(name = "ThemeBars"\)/.test(j);
  }catch(e){ return false; }
})());
T('已移除不再使用的 @capacitor/status-bar 依赖', !/"@capacitor\/status-bar"/.test(fs.readFileSync(path.join(ROOT, 'mobile/package.json'), 'utf8')));


// ================= v0.4.8 =================

// ---- 2 角色卡 / 世界书列表可滚动 ----
T('角色卡 / 世界书列表能滚动（min-height:0 才不会被撑开）', /.lib-grid\{flex:1 1 auto; min-height:0; overflow-y:auto;/.test(cssBlock));
T('垃圾桶列表也能滚动', /.trash-list\{flex:1 1 auto; min-height:0;/.test(cssBlock));

// ---- 3 私聊开场白 ----
T('智能体页签有开场白输入框与重发按钮', /data-pane="agent"[\s\S]{0,4000}id="dmFirstMes"/.test(html) && /id="btnDmFirstMes"/.test(html));
T('sendFirstMes 把开场白作为 TA 的第一条消息', /function sendFirstMes\(cv, ai\)\{/.test(script) && /cv\.history\.push\(\{ id:seq\+\+, speakerId:ai\.id, speaker:ai\.name, role:'ai', text:t, status:'done' \}\);/.test(script));
T('新建私聊时有开场白就先开口', /if\(ai\.firstMes && ai\.firstMes\.trim\(\)\) sendFirstMes\(cv, ai\);/.test(script));
T('开场白随会话保存', /ai\.firstMes = \$\('dmFirstMes'\)\.value\.trim\(\);/.test(script) && /\$\('dmFirstMes'\)\.value = ai \? \(ai\.firstMes \|\| ''\) : '';/.test(script));

// ---- 5 删除确认改用应用内弹窗 ----
T('删除角色卡 / 世界书走应用内确认弹窗', /openConfirm\('删除' \+ \(kind==='card'\?'角色卡':'世界书'\)/.test(script));
T('编辑窗里的删除也走应用内弹窗', /function deleteLib\(\)\{[\s\S]{0,700}openConfirm\('删除' \+ label,/.test(script));
T('删除成员走应用内弹窗', /openConfirm\('删除成员', '确定删除「'\+c\.name\+'」吗？/.test(script));
T('关键词 / 便签删除走免等待确认', /openConfirm\('删除关键词', '确定删除关键词「'\+nm\+'」吗？', function\(\)\{ list\.splice\(i, 1\); renderKwBox\(box, list\); \}, true\);/.test(script) && /openConfirm\('删除便签', '确定删除这张便签吗？'/.test(script));
T('openConfirm 支持免倒计时', /function openConfirm\(title, desc, action, instant\)\{/.test(script) && /if\(instant\)\{[\s\S]{0,120}yes\.disabled = false;/.test(script));
T('代码里不再用原生 confirm 删角色卡 / 世界书', !/if\(confirm\('确定删除'\(kind==='card'/.test(script));

// ---- 6 垃圾桶清理 ----
T('垃圾桶有「全部清理」按钮', /id="btnTrashClear"/.test(html) && /\$\('btnTrashClear'\)\.addEventListener\('click'/.test(script));
T('每条垃圾桶记录有单独删除按钮', /data-act="purge"/.test(script) && /trash = trash\.filter\(function\(x\)\{ return x\.id !== id; \}\);/.test(script));
T('全部清理需二次确认', /openConfirm\('全部清理', '确定把垃圾桶里的 ' \+ n \+ ' 项全部彻底删除吗？/.test(script));
T('垃圾桶删除按钮样式（三主题）', /\.trash-del\{width:26px; height:26px;/.test(cssBlock) && /html\[data-theme="dark"\] \.trash-del:hover/.test(cssBlock));

// ---- 7 简介文案 ----
T('简介改为「完全在本地软件中运行」', /class="about-intro">[^<]*完全在本地软件中运行/.test(html));
T('简介不再出现「纯浏览器本地运行」', !/纯浏览器本地运行/.test(html));

// ---- 8 返回键先关图片查看 ----
T('返回键优先关掉图片查看浮层', /function nativeBack\(\)\{[\s\S]{0,300}if\(iv && !iv\.classList\.contains\('hidden'\)\)\{ closeImgView\(\); return; \}/.test(script));

// ---- 9 费用按接口真实用量 ----
T('回复请求带 stream_options.include_usage', /stream:true, stream_options:\{ include_usage:true \}/.test(script));
T('不认 stream_options 的接口会重试一次', /if\(res\.status === 400 && body\.stream_options\) return postReq\(false\);/.test(script) && /if\(!withUsage\) delete payload\.stream_options;/.test(script));
T('解析流末尾的 usage', /if\(j\.usage && typeof j\.usage\.prompt_tokens === 'number'\) usage = j\.usage;/.test(script));
T('用量累加到会话', /function addUsage\(cv, j\)\{/.test(script) && /cv\.usageIn = \(cv\.usageIn \|\| 0\) \+ Math\.max\(0, i\)/.test(script) && /cv\.usageCalls = \(cv\.usageCalls \|\| 0\) \+ 1;/.test(script));
T('消息上记录本条用量', /function recordUsage\(cv, msg, u\)\{/.test(script) && /msg\.usage = \{ in:i, out:o \};/.test(script));
T('后台调用（记忆 / 时间线 / 总结 / 压缩 / 日历）也计入', (script.match(/addUsage\(cv, j\);/g) || []).length >= 5);
T('费用面板优先显示真实用量', /if\(realIn > 0 \|\| realOut > 0\)\{/.test(script) && /实际输入 tokens/.test(script) && /接口调用次数/.test(script));
T('拿不到用量时回退估算并说明', /这个接口还没回报真实用量/.test(script));

// ---- 10 剧情转场角色 ----
T('转场角色常量与工厂函数', /var TRANS_NAME = '转场';/.test(script) && /function makeTransChar\(\)\{/.test(script) && /function isTransChar\(c\)\{/.test(script));
T('群聊 / 故事必定有一个转场角色（私聊没有）', /function ensureTransChar\(cv\)\{\s*if\(!cv \|\| cv\.mode === 'dm'\) return null;/.test(script));
T('转场角色不可删除', /function deleteChar\(c\)\{\s*if\(!c \|\| c\.isTrans\) return;/.test(script));
T('转场角色不提炼记忆、不进关系图', /function updateMemory\(c, cv\)\{\s*if\(isTransChar\(c\)\) return;/.test(script) && /if\(!isTransChar\(c\) && c\.name && names\.indexOf\(c\.name\) === -1\)/.test(script));
T('转场不靠 @ 触发，只能手动点选', /if\(!c\.name \|\| isTransChar\(c\)\) return;   \/\/ 「转场」不靠 @ 触发/.test(script));
T('选中转场后它排第一个回复', /var ti = -1;\s*for\(var k=0;k<targets\.length;k\+\+\)\{ if\(isTransChar\(targets\[k\]\)\)\{ ti = k; break; \} \}\s*if\(ti > 0\)\{ var tt = targets\.splice\(ti, 1\)\[0\]; targets\.unshift\(tt\); \}/.test(script));
T('转场有独立提示词（不扮演角色）', /function buildTransMessages\(cv\)\{/.test(script) && /你不是故事里的角色，不参与对话，也不属于任何一方。/.test(script));
T('转场只暴露「转场风格」与「发言格式」', /id="transModal"/.test(html) && /id="transStyle"/.test(html) && /id="transFormat"/.test(html) && /if\(isTransChar\(c\)\)\{ openTransEdit\(c\); return; \}/.test(script));
T('转场成员行没有删除按钮、也没有在场开关', /row\.classList\.add\('member-row-trans'\);/.test(script) && /data-act="edit" title="设置转场风格与发言格式"/.test(script));
T('转场默认风格与格式有兜底', /function transStyleOf\(c\)\{/.test(script) && /function transFormatOf\(c\)\{/.test(script) && /var TRANS_STYLE_DEFAULT = /.test(script));
T('成员数不把转场算进去', /var realCount = \(cv\.chars \|\| \[\]\)\.filter\(function\(c\)\{ return !isTransChar\(c\); \}\)\.length;/.test(script));
T('续写剧情换成员后会补回转场', /cv\.chars = chars;\s*ensureTransChar\(cv\);/.test(script));
T('转场样式三主题适配', /\.char-role-trans\{color:#0f8a6a/.test(cssBlock) && /html\[data-theme="dark"\] \.char-role-trans/.test(cssBlock));

// ---- 11 酒馆 png 导入 ----
T('角色卡 / 世界书导入都有「酒馆 png」入口', /id="btnCardImportPng"/.test(html) && /id="btnWorldImportPng"/.test(html) && /id="importCardPng" accept="\.png,image\/png"/.test(html) && /id="importWorldPng"/.test(html));
T('自己实现的 PNG 编解码（CRC32 / Adler32 / 存储块 deflate）', /function crc32\(u8\)\{/.test(script) && /function adler32\(u8\)\{/.test(script) && /function deflateStore\(u8\)\{/.test(script));
T('pngEncode 输出 8bit RGB + tEXt 块', /function pngEncode\(w, h, rgba, texts\)\{/.test(script) && /ihdr\[8\]=8; ihdr\[9\]=2;/.test(script) && /chunks\.push\(pngChunk\('tEXt', d\)\);/.test(script));
T('pngReadChunks 读 tEXt 与 iTXt', /function pngReadChunks\(u8\)\{/.test(script) && /type === 'tEXt'/.test(script) && /type === 'iTXt'/.test(script));
T('能认出 chara / ccv3 里的 base64 卡片数据', /function pngEmbeddedJson\(info\)\{/.test(script) && /\['ccv3', 'chara', 'Chara', 'CHARA', 'character'\]/.test(script));
T('导入后自动判断是角色卡还是世界书', /var isWorld = !!\(parsed\.world !== undefined\)/.test(script) && /var parsed = want === 'world' \? stToWorld\(json\) : stToCard\(json\)/.test(script));
T('png 自带的图会裁成头像', /function pngBytesToAvatar\(u8, cb\)\{/.test(script) && /c\.width = 320; c\.height = 320;/.test(script));
T('导入的角色卡会带上开场白', /firstMes:parsed\.firstMes \|\| '',/.test(script));

// ---- 12 导出四种格式 ----
T('导出弹窗四种格式齐备', /id="btnExportMd"/.test(html) && /id="btnExportTxt"/.test(html) && /id="btnExportJson"/.test(html) && /id="btnExportPng"/.test(html));
T('doExport 处理 txt 与 png', /if\(ext === 'png'\)\{ exportLibPng\(kind, item\); return; \}/.test(script) && script.indexOf("downloadText(base + '.' + ext, libMarkdown(kind, item))") >= 0);
T('导出酒馆 png 用 400×600 并把头像画进去', /function exportLibPng\(kind, item\)\{/.test(script) && /var W = 400, H = 600;/.test(script) && /function drawCover\(g, img, W, H\)\{/.test(script));
T('导出酒馆 png 会把卡片数据嵌进图片', script.indexOf('bytesToBase64(utf8Bytes(JSON.stringify(json)))') >= 0 && /\{ keyword:'chara', text:b64 \}/.test(script));
T('卡片映射到酒馆 v2 字段', /spec:'chara_card_v2', spec_version:'2.0'/.test(script) && /first_mes: card\.firstMes \|\| ''/.test(script));
T('也能读写酒馆原生世界书（entries）', /if\(j\.entries && typeof j\.entries === 'object'\)\{/.test(script));
T('取不到像素时给出明确提示', /这张头像来自外部地址，浏览器不允许读取像素/.test(script));

// ---- v0.4.8 教程原地更新 ----
T('群聊教程含转场角色', /成员列表最上面有一个固定角色「转场」/.test(script) && /只能设「转场风格」和「发言格式」/.test(script));
T('群聊教程含费用真实统计', /「＋」里的「费用」现在按接口回报的真实 token 用量统计/.test(script));
T('故事教程含转场角色', /它会第一个回复，用一段场景过渡把剧情接到下一段/.test(script));
T('私聊教程含开场白', /「智能体」页签里还能写「开场白」/.test(script));
T('主页教程含续写剧情入口', /「＋」里还有「续写剧情」（在「导入记忆」上面）/.test(script));
T('主页教程含垃圾桶清理', /顶部的「全部清理」是一次清空整个垃圾桶/.test(script));
T('主页教程含酒馆 png 导入', /酒馆 png 会自动读出图里嵌的卡片数据/.test(script));
T('主页教程含导出四格式', /酒馆 png 会把头像画进 400×600 的图里/.test(script));

// ================= v0.4.9 =================
// ---- 存档可靠性（save 不再静默吞异常）----
T('存档按「内容是否变化」跳过重复写入', /if\(_lsCache\[k\] === str\) continue;/.test(script) && /var _lsCache = \{\};/.test(script));
T('存档支持只写指定键', /function save\(keys\)\{/.test(script) && /var list = \(keys && keys\.length\) \? keys :/.test(script));
T('写入失败会提示用户并给对策', /存档写入失败/.test(script) && /本机存储空间已满/.test(script) && /清空旧记录|清理旧记录/.test(script) && /if\(!_lsWarned\)/.test(script));

// ---- 图片占用预算（localStorage 5MB 的现实约束）----
T('图片按会话累计占用做预算拦截', /var IMG_STORE_BUDGET = 2400000;/.test(script) && /function convImageChars\(cv\)\{/.test(script) && /function pendingImgChars\(\)\{/.test(script));
T('超预算时明确提示而不是静默丢图', /这个聊天的图片已接近本机存储上限/.test(script) && /convImageChars\(cvNow\) \+ pendingImgChars\(\) \+ out\.length > IMG_STORE_BUDGET/.test(script));

// ---- 上下文 token 估算校准 ----
T('上下文估算拆出纯字数函数', /function contextChars\(cv\)\{/.test(script) && /function estimateContextTokens\(cv\)\{\s*return Math\.max\(1, Math\.round\(contextChars\(cv\) \* tokRatioOf\(cv\)\)\);/.test(script));
T('用接口回报的真实用量校准字数→token 比例', /function calibrateTokRatio\(cv, chars, pt\)\{/.test(script) && /var r = pt \/ chars;/.test(script) && /cv\.tokRatio = Math\.round\(\(old \* 0\.7 \+ r \* 0\.3\) \* 1000\) \/ 1000;/.test(script));
T('生成回复时记录本次上下文字数并校准', /var promptChars = contextChars\(cv\);/.test(script) && /calibrateTokRatio\(cv, promptChars, Number\(usage\.prompt_tokens\) \|\| 0\);/.test(script));
T('tokRatio 在 load 与 importBackup 都归一化', (script.match(/cv\.tokRatio = 0;/g) || []).length === 1 && (script.match(/conv\.tokRatio = 0;/g) || []).length === 1);

// ---- 更新日志按「新增 / 修复 / 优化」分类 ----
T('更新日志支持分类小标题渲染', /if\(it\.charAt\(0\) === '#'\) return '<li class="cl-cat">' \+ it\.slice\(1\) \+ '<\/li>';/.test(script));
T('分类小标题有样式（三主题走 --accent）', /\.cl-item ul \.cl-cat\{list-style:none;/.test(cssBlock) && /color:var\(--accent\)/.test(cssBlock));
T('v0.4.9 更新日志按三类书写', /'#新增'/.test(script) && /'#修复'/.test(script) && /'#优化'/.test(script));

// ---- 打包脚本 / 工具链（不再写死旧路径；bat 必须纯 ASCII + CRLF）----
(function(){
  const rd = p => fs.readFileSync(path.join(ROOT, p));
  // electron 工程在仓库外面（仓库同级），CI 的干净克隆里没有它 —— 有才查
  const copyHtmlPath = path.join(ROOT, '..', 'electron', 'scripts', 'copy-html.js');
  if(fs.existsSync(copyHtmlPath)){
    const copyHtml = fs.readFileSync(copyHtmlPath, 'utf8');
    T('electron copy-html 不再写死旧项目路径', copyHtml.indexOf('claude project') === -1 && /DREAMCHAT_INDEX/.test(copyHtml) && /build\.config\.json/.test(copyHtml));
  }
  const copyWww = rd('mobile/scripts/copy-www.js').toString('utf8');
  T('copy-www 会先建 www/ 目录（新克隆没有这个目录）', /fs\.mkdirSync\(path\.dirname\(DST\), \{ recursive: true \}\)/.test(copyWww));
  ['tools/build-apk.bat', 'tests/run-tests.bat'].forEach(function(rel){
    const buf = rd(rel);
    const txt = buf.toString('utf8');
    const nonAscii = buf.some(function(b){ return b > 127; });
    const loneLf = /\n/.test(txt.replace(/\r\n/g, ''));   // 去掉 CRLF 后还剩下 \n 就是裸 LF
    T(rel + ' 是纯 ASCII + CRLF（中文 Windows 下 bat 才不静默失败）', !nonAscii && !loneLf);
    T(rel + ' 不写死旧项目路径', txt.indexOf('claude project') === -1);
  });
  const apkBat = rd('tools/build-apk.bat').toString('utf8');
  T('build-apk.bat 用 %~dp0 自定位仓库根', /set "REPO=%~dp0\.\."/.test(apkBat));
})();

(function(){
  const appVer = (script.match(/var APP_VERSION = '([\d.]+)'/) || [])[1];
  const gradle = fs.readFileSync(path.join(ROOT, 'mobile/android/app/build.gradle'), 'utf8');
  const gradleName = (gradle.match(/versionName\s+"([\d.]+)"/) || [])[1];
  const gradleApk = (gradle.match(/outputFileName\s*=\s*"梦语-([\d.]+)\.apk"/) || [])[1];
  const mobPkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'mobile/package.json'), 'utf8')).version;
  const mobLock = JSON.parse(fs.readFileSync(path.join(ROOT, 'mobile/package-lock.json'), 'utf8')).version;
  T('版本号：build.gradle versionName 与 APP_VERSION 一致', gradleName === appVer);
  T('版本号：build.gradle APK 名与 APP_VERSION 一致', gradleApk === appVer);
  T('版本号：mobile package.json 与 APP_VERSION 一致', mobPkg === appVer);
  T('版本号：mobile package-lock.json 与 APP_VERSION 一致', mobLock === appVer);
  const head = (script.match(/var CHANGELOG = \[[^\n]*\n\s*\{ v:'([\d.]+)'/) || [])[1];
  T('CHANGELOG 头部版本 = APP_VERSION', head === appVer);
})();


console.log('\ntest17: ' + pass + ' pass / ' + fail + ' fail');
process.exit(fail ? 1 : 0);
