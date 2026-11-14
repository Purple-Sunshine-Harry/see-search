import fs from 'node:fs';
import assert from 'node:assert/strict';

const base=new URL('../',import.meta.url);
const get=p=>fs.readFileSync(new URL(p,base),'utf8');
const data=JSON.parse(get('docs/knowledge/data.json'));
assert.equal(data.countries.length,7,'七国索引');
assert.equal(data.accounts.length,8,'八个重点客户群');
assert.ok(data.insights.length>=80,'公开记录意外减少');
const ids=new Set(), accountIds=new Set(data.accounts.map(a=>a.id));
const countries=new Set(data.countries.map(c=>c.id));
const topics=new Set(data.topics.map(t=>t.id));
for(const r of data.insights){
  assert.ok(r.id && !ids.has(r.id),`记录 ID 重复: ${r.id}`);ids.add(r.id);
  assert.ok(/^https:\/\/[^\s]+$/.test(r.sourceUrl),`${r.id}: 必须是公开 HTTPS 来源`);
  assert.ok(r.countries.length && r.countries.every(c=>countries.has(c)),`${r.id}: 国家无效`);
  assert.ok(r.accounts.every(a=>accountIds.has(a)),`${r.id}: 客户无效`);
  assert.ok(topics.has(r.topic),`${r.id}: 主题无效`);
  assert.ok(r.title && r.summary && r.boundary && r.method,`${r.id}: 缺少结论边界或方法`);
  if(r.status==='verified') assert.ok(r.checkedAt && r.locator && r.sourceName && r.period,`${r.id}: 已核验条目缺少证据定位`);
}
assert.ok(get('docs/index.html').includes('<!doctype html>'),'现有首页缺失');
assert.ok(get('docs/knowledge/index.html').includes('src="./app.js"'),'研究库缺少脚本');
const publicContent=get('docs/knowledge/data.json')+get('docs/knowledge/index.html')+get('docs/knowledge/app.js');
assert.ok(!/github_pat_|ghp_[A-Za-z0-9]+|客户会谈行动账本|M520SM|55TTX/.test(publicContent),'公开内容含凭证或内部会谈线索');
console.log(`OK: ${data.countries.length} 国、${data.accounts.length} 个客户群、${data.insights.length} 条记录（${data.insights.filter(r=>r.status==='verified').length} 已核验）`);
