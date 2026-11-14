# SEE7 光网络情报

东南欧七国（GR / BG / CY / RO / MD / MK / AL）光传送、运营商、数据中心、海缆、DCI、Transit、企业专线的周期研究成果。

## 结构
- `docs/index.html`：网页版（可直接用 GitHub Pages 的 `/docs` 目录发布）
- `reports/YYYY-MM-DD.md`：每期变更建议包（Markdown 原文）
- `data/YYYY-MM-DD.json`：每期结构化条目（实体、国家、主题、证据等级、项目阶段、事实与推断、来源）
- `.artifact-source.html`：claude.ai 网页版的源文件

## 证据等级
A 官方 / 监管 / 招标 / 财报 · B 厂商正式发布 · C 权威行业媒体 · D 线索 / 传闻

## 项目阶段（不得跳级）
规划 → 许可 → 融资 → 采购 → 合同 → 建设 → 验收 → 商用

## 推送到 GitHub
```bash
git remote add origin git@github.com:<你的账号>/see7-research.git
git push -u origin main
```
然后在仓库 Settings → Pages 中，把发布来源设为 `main` 分支的 `/docs` 目录。
