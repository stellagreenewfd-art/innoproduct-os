# 创品智造 Pro v2.0 部署指南

## 本地开发
```bash
npm install
npm run dev        # 同时启动 API(3457) 与前端(5173)，/api 自动代理
```

## 生产运行
```bash
npm run build      # 构建前端到 dist/
npm start          # Express 托管 dist + API，端口由 PORT 环境变量决定
```

## 部署到 Render（替换旧版 innoproduct-os）
1. 把本项目推送到 GitHub 仓库（建议新仓库，或原仓库新分支）
2. Render → New Web Service → 连接仓库
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
3. 配置环境变量：

| 变量 | 必填 | 说明 |
|---|---|---|
| `DEEPSEEK_API_KEY` | ✅ | DeepSeek 密钥（**旧 key 已泄露在前端源码中，请先到 platform.deepseek.com 重置**） |
| `GITHUB_TOKEN` | 建议 | 用于把 database.json 同步回 GitHub（Render 磁盘是临时的，不同步会丢数据） |
| `GITHUB_REPO` | 建议 | 如 `你的用户名/innoproduct-pro` |
| `GITHUB_BRANCH` | 建议 | 如 `main` |
| `ADMIN_PASSWORD` | 可选 | 管理员 qaq 的初始密码（不设置则为 qaq2026，请登录后尽快更换） |

4. 旧账号兼容：旧系统数据库（render 分支 data/database.json）里的账号可直接登录——
   服务端会自动把旧的 SHA-256 密码升级为 scrypt 加盐哈希。
   若想继承旧用户，把 `GITHUB_REPO`/`GITHUB_BRANCH` 指向旧仓库分支即可。

## 相对旧版的关键变化
- AI 密钥只存服务端环境变量，不再下发浏览器
- 真实数据由服务端直采（淘宝联想/抖音/百度/B站/头条热榜稳定可用；京东尽力而为）
- 密码 scrypt 加盐存储；令牌 30 天过期
- 用户数据（项目/灵感/分析报告）云端保存，换设备不丢
- 新增：竞品分析、缺口矩阵热力图、人群画像、渠道洞察、财务测算、上市计划、规格书导出
