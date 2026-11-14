const $ = id => document.getElementById(id);
const navItems = [
  ['overview','区域总览'],['accounts','重点客户'],['countries','国家研究'],
  ['insights','主题洞察'],['opportunities','机会假设'],['evidence','证据与来源'],
  ['method','研究方法'],['archive','历史资料']
];
const labels = {
  verified:'已核验',pending:'待核验',conflict:'存在冲突',archived:'已归档',
  fact:'事实',inference:'分析判断',hypothesis:'机会假设',history:'历史研究'
};
const state = {view:'overview',country:'all',account:'all',topic:'all',status:'all',query:'',expanded:false};
let data;

function el(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = String(content);
  return node;
}
function add(parent, ...children) { children.filter(Boolean).forEach(child => parent.append(child)); return parent; }
function link(label, href) {
  const a = el('a', '', label);
  try {
    const u = new URL(href);
    if (u.protocol !== 'https:' || u.username || u.password) throw Error('invalid URL');
    a.href = u.href; a.target = '_blank'; a.rel = 'noopener noreferrer';
  } catch { a.removeAttribute('href'); }
  return a;
}
function badge(label, className='') { return el('span', `tag ${className}`, label); }
function countryName(id) { return data.countries.find(c => c.id === id)?.name ?? id; }
function accountName(id) { return data.accounts.find(a => a.id === id)?.name ?? id; }
function topicName(id) { return data.topics.find(t => t.id === id)?.name ?? id; }
function sectionTitle(title, note) {
  const head = el('div','section-head');
  add(head,el('h2','',title),el('p','',note));
  return head;
}
function readHash() {
  const params = new URLSearchParams(location.hash.slice(1));
  const view = params.get('view');
  state.view = navItems.some(([id]) => id === view) ? view : 'overview';
  for (const key of ['country','account','topic','status']) {
    state[key] = params.get(key) || 'all';
  }
  if (state.country !== 'all' && !data.countries.some(x => x.id === state.country)) state.country='all';
  if (state.account !== 'all' && !data.accounts.some(x => x.id === state.account)) state.account='all';
  if (state.topic !== 'all' && !data.topics.some(x => x.id === state.topic)) state.topic='all';
  if (!['all','verified','pending','conflict','archived'].includes(state.status)) state.status='all';
  for (const key of ['country','account','topic','status']) $(key).value=state[key];
  render();
}
function writeHash() {
  const params = new URLSearchParams({view:state.view});
  for (const key of ['country','account','topic','status']) if (state[key] !== 'all') params.set(key,state[key]);
  location.hash=params.toString();
  render();
}
function navigate(view, filters={}) {
  Object.assign(state,{view,country:'all',account:'all',topic:'all',status:'all',query:'',expanded:false},filters);
  $('search').value='';
  for (const key of ['country','account','topic','status']) $(key).value=state[key];
  writeHash(); window.scrollTo({top:0,behavior:'instant'});
}
function matching(records=data.insights) {
  const query=state.query.toLocaleLowerCase();
  return records.filter(r =>
    (state.country==='all' || r.countries.includes(state.country)) &&
    (state.account==='all' || r.accounts.includes(state.account)) &&
    (state.topic==='all' || r.topic===state.topic) &&
    (state.status==='all' || r.status===state.status) &&
    (!query || [r.title,r.summary,r.sourceName,r.scenario,...r.accounts.map(accountName)].join(' ').toLocaleLowerCase().includes(query))
  );
}
function recordCard(r) {
  const card=el('article','card record');
  const tags=el('div','tags');
  add(tags,badge(labels[r.status],r.status),badge(labels[r.kind],r.kind),badge(topicName(r.topic)),badge(r.scenario));
  const title=el('h3','',r.title), summary=el('p','summary',r.summary);
  const meta=el('div','record-meta');
  add(meta,el('span','',r.countries.map(countryName).join(' / ')),el('span','',`来源：${r.sourceDate || '未标注'}`));
  const button=el('button','','查看证据与边界 →');button.type='button';button.addEventListener('click',()=>showDetail(r));
  add(card,tags,title,summary,meta,button);
  return card;
}
function renderRecords(records, title, note='') {
  const section=el('section','section');
  add(section,sectionTitle(title, note || `${records.length} 条研究记录`));
  if (!records.length) { add(section,el('p','empty','没有符合当前筛选条件的记录。')); return section; }
  const list=el('div','grid');
  const limit=state.expanded ? records.length : 24;
  records.slice(0,limit).forEach(r=>list.append(recordCard(r)));
  section.append(list);
  if (records.length>limit) {
    const button=el('button','secondary',`显示其余 ${records.length-limit} 条`);
    button.type='button';button.addEventListener('click',()=>{state.expanded=true;render();});
    button.style.marginTop='16px';section.append(button);
  }
  return section;
}
function byReview(a,b) { return (b.checkedAt||'').localeCompare(a.checkedAt||'') || (b.sourceDate||'').localeCompare(a.sourceDate||''); }
function accountCard(a) {
  const card=el('article','card');
  const button=el('button','account-button',a.name);
  button.type='button';button.addEventListener('click',()=>navigate('accounts',{account:a.id}));
  add(card,el('span','account-country',countryName(a.country)),button,el('p','account-summary',a.scope),el('p','',a.boundary));
  const count=data.insights.filter(r=>r.accounts.includes(a.id)).length;
  card.append(el('small','',`${count} 条关联记录 · 查看档案 →`));
  return card;
}
function overview() {
  const frag=document.createDocumentFragment();
  const accounts=el('section','section');
  add(accounts,sectionTitle('八个重点客户群','名单为研究范围，不代表机会排名'));
  const grid=el('div','grid');data.accounts.forEach(a=>grid.append(accountCard(a)));accounts.append(grid);frag.append(accounts);
  const verified=data.insights.filter(r=>r.status==='verified').sort(byReview).slice(0,6);
  frag.append(renderRecords(verified,'近期复核的公开证据','按复核日期展示；事件可能早于复核日期'));
  const lead=data.insights.filter(r=>r.kind==='hypothesis').slice(0,4);
  frag.append(renderRecords(lead,'待验证的机会路径','假设需具名端点、容量与采购责任核实'));
  return frag;
}
function accountView() {
  if (state.account==='all') {
    const s=el('section','section');s.append(sectionTitle('重点客户','八个客户群，PPF 同时覆盖 Yettel 与 CETIN'));
    const grid=el('div','grid');data.accounts.filter(a=>state.country==='all'||a.country===state.country).forEach(a=>grid.append(accountCard(a)));
    s.append(grid);return s;
  }
  const a=data.accounts.find(a=>a.id===state.account);
  const frag=document.createDocumentFragment(), panel=el('section','panel');
  add(panel,el('span','eyebrow',countryName(a.country)),el('h2','',a.name),el('p','',a.scope));
  const boundary=el('div','');boundary.style.marginTop='14px';add(boundary,el('h3','','研究边界'),el('p','',a.boundary));panel.append(boundary);
  const questions=el('div','');questions.style.marginTop='14px';questions.append(el('h3','','优先取证问题'));
  const ul=el('ul','');a.requests.forEach(q=>ul.append(el('li','',q)));questions.append(ul);panel.append(questions);frag.append(panel);
  frag.append(renderRecords(matching().sort(byReview),'关联研究记录'));
  return frag;
}
function countriesView() {
  if (state.country==='all') {
    const section=el('section','section');section.append(sectionTitle('七国研究','国家基本面、客户与商业场景分开取证'));
    const grid=el('div','grid');
    data.countries.forEach(c=>{
      const card=el('article','card country-card');
      add(card,el('strong','',c.id),el('h3','',c.name),el('p','',c.focus),el('small','',c.question));
      const button=el('button','','进入研究 →');button.type='button';button.addEventListener('click',()=>navigate('countries',{country:c.id}));card.append(button);grid.append(card);
    });section.append(grid);return section;
  }
  const c=data.countries.find(c=>c.id===state.country),frag=document.createDocumentFragment(),intro=el('section','panel');
  add(intro,el('span','eyebrow',c.en.toUpperCase()),el('h2','',c.name),el('p','',c.focus),el('p','',`研究问题：${c.question}`));frag.append(intro);
  frag.append(renderRecords(matching().sort(byReview),'国家研究记录'));return frag;
}
function methodView() {
  const frag=document.createDocumentFragment(), p=el('section','panel');
  add(p,el('h2','','证据和判断方法'),el('p','','优先使用监管、政府、运营商和项目方原文。逐条标出来源日期、原文定位、数据口径、复核方法及反证条件。官方公告只能证明公告披露的范围，不能自动证明设备订单、网络商用或未公开的采购权。'));
  const ul=el('ul','');[
    '事实：记录来源可直接支持的披露，并区分计划、许可、采购、合同、建设、验收与商用。',
    '分析判断：说明从事实推导的逻辑与不足，不能冒充客户承诺。',
    '机会假设：先核实业务端点、容量、路由、预算、合同边界与负责人，再讨论方案。',
    '来源日期、核验日期与本站导出日期分别记录；“没有检索到”不等于“没有进展”。'
  ].forEach(t=>ul.append(el('li','',t)));p.append(ul);frag.append(p);
  return frag;
}
function archiveView() {
  const p=el('section','panel');
  add(p,el('h2','','历史研究资料'),el('p','','原私有知识空间保留七份历史 PDF / XLSX 原文、客户会谈行动和个人关注依据。公开仓库只展示可追溯到公开来源的研究记录；旧报告的数字和策略不自动作为当前市场事实。'));
  const next=el('p','');next.style.marginTop='15px';next.append(link('打开原私有知识空间 ↗','https://see-optical-intelligence.zmh8901.chatgpt.site/'));p.append(next);
  return p;
}
function showDetail(r) {
  const body=$('detail-body');body.replaceChildren();
  const tags=el('div','tags');add(tags,badge(labels[r.status],r.status),badge(labels[r.kind],r.kind),badge(topicName(r.topic)),badge(r.scenario));
  const title=el('h2','',r.title);title.id='detail-title';
  add(body,tags,title,el('p','muted',r.countries.map(countryName).join(' / ')+' · '+r.accounts.map(accountName).join(' / ')));
  const summary=el('section','');add(summary,el('h3','','记录内容'),el('p','',r.summary));body.append(summary);
  const source=el('section','');source.append(el('h3','','来源与日期'));
  const dl=el('dl','');
  for (const [k,v] of [['来源',r.sourceName],['原文链接',r.sourceUrl],['来源日期',r.sourceDate||'未标注'],['数据时期 / 口径',r.period],['原文定位',r.locator],['复核日期',r.checkedAt||'未复核'],['记录更新',r.updatedAt]]) {
    dl.append(el('dt','',k)); const dd=el('dd','');
    if (k==='原文链接') dd.append(link(v,v)); else dd.textContent=v||'待补充'; dl.append(dd);
  }
  source.append(dl);body.append(source);
  for (const [heading,content] of [['分析 / 核验方法',r.method],['判断边界与反证条件',r.boundary],['下一步取证',r.nextAction]]) {
    const s=el('section','');add(s,el('h3','',heading),el('p','',content||'待补充'));body.append(s);
  }
  $('detail').showModal();
}
function render() {
  if (!data) return;
  document.querySelectorAll('#nav button').forEach(b=>{b.classList.toggle('active',b.dataset.view===state.view);b.setAttribute('aria-current',b.dataset.view===state.view?'page':'false');});
  const title=navItems.find(([id])=>id===state.view)?.[1];
  $('page-title').textContent=state.view==='overview'?'东南欧光传送':title;
  $('page-subtitle').textContent='七国 × 八个重点客户群 · 可追溯来源与明确判断边界';
  const body=$('content-body');body.replaceChildren();
  if (state.query) body.append(renderRecords(matching().sort(byReview),`搜索结果：${state.query}`));
  else if (state.view==='overview' && ['country','account','topic','status'].some(key=>state[key]!=='all')) body.append(renderRecords(matching().sort(byReview),'筛选结果'));
  else if (state.view==='overview') body.append(overview());
  else if (state.view==='accounts') body.append(accountView());
  else if (state.view==='countries') body.append(countriesView());
  else if (state.view==='method') body.append(methodView());
  else if (state.view==='archive') body.append(archiveView());
  else {
    let records=matching();
    if (state.view==='opportunities') records=records.filter(r=>r.kind==='hypothesis');
    if (state.view==='evidence') records=records.filter(r=>r.status==='verified');
    body.append(renderRecords(records.sort(byReview),title));
  }
}
function option(select,value,label) { const o=el('option','',label);o.value=value;select.append(o); }
function setup() {
  const nav=$('nav');navItems.forEach(([id,label])=>{
    const b=el('button','',label);b.type='button';b.dataset.view=id;b.addEventListener('click',()=>navigate(id));nav.append(b);
  });
  option($('country'),'all','全部国家');data.countries.forEach(x=>option($('country'),x.id,x.name));
  option($('account'),'all','全部客户');data.accounts.forEach(x=>option($('account'),x.id,x.name));
  option($('topic'),'all','全部主题');data.topics.forEach(x=>option($('topic'),x.id,x.name));
  option($('status'),'all','全部状态');['verified','pending','conflict','archived'].forEach(x=>option($('status'),x,labels[x]));
  for (const key of ['country','account','topic','status']) $(key).addEventListener('change',e=>{state[key]=e.target.value;state.expanded=false;writeHash();});
  $('search').addEventListener('input',e=>{state.query=e.target.value.trim();state.expanded=false;render();});
  $('reset').addEventListener('click',()=>navigate(state.view));
  const metrics=[['国家',data.countries.length],['重点客户群',data.accounts.length],['研究记录',data.insights.length],['已核验',data.insights.filter(r=>r.status==='verified').length]];
  metrics.forEach(([label,value])=>{const card=el('div','metric');add(card,el('b','',value),el('span','',label));$('metrics').append(card);});
  $('snapshot-note').textContent=`原私有站 v${data.source.siteVersion} 的可公开记录（原站更新 ${data.source.siteUpdated}；导出 ${data.source.exported}）。本期建议包单独审阅，尚未自动纳入证据库。`;
  window.addEventListener('hashchange',readHash);readHash();
}
try {
  const response=await fetch('./data.json');if (!response.ok) throw Error(`HTTP ${response.status}`);
  data=await response.json();
  if (!Array.isArray(data.insights) || !Array.isArray(data.accounts)) throw Error('数据格式不完整');
  setup();
} catch (error) {
  const box=el('p','empty error',`研究记录加载失败：${error.message}。请刷新页面，或查看仓库中的 docs/knowledge/data.json。`);
  $('content-body').append(box);$('snapshot-note').textContent='无法载入公开快照。';
}
