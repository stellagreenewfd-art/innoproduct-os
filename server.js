/**
 * 创品智造 Pro — 服务端
 * 职责：
 *  1. 用户认证（scrypt 加盐哈希，兼容旧版 SHA-256 账号自动升级）
 *  2. DeepSeek AI 服务端代理（API Key 不再下发浏览器）
 *  3. 服务端真实数据采集（collectors.cjs）
 *  4. 用户数据持久化（开发项目 / 灵感库 / 分析报告，按账号云端同步）
 *  5. 管理后台 API
 *  6. 生产模式下托管 dist/ 前端
 */
const express = require('express')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const https = require('https')
const { collectAll, formatForPrompt } = require('./collectors.cjs')

const app = express()
const PORT = process.env.PORT || 3457

app.use(express.json({ limit: '2mb' }))
app.use(express.static(path.join(__dirname, 'dist')))

// ========== 配置 ==========
function loadLocalConfig() {
  try {
    const p = path.join(__dirname, 'server.config.local.json')
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf-8'))
  } catch { /* ignore */ }
  return {}
}
const LOCAL_CFG = loadLocalConfig()
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || LOCAL_CFG.DEEPSEEK_API_KEY || ''
const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions'
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || LOCAL_CFG.GITHUB_TOKEN || ''
const GITHUB_REPO = process.env.GITHUB_REPO || 'stellagreenewfd-art/innoproduct-os'
// 数据同步到独立分支：推代码分支会触发 Render 重新部署，数据分支不会
const GITHUB_DATA_BRANCH = process.env.GITHUB_DATA_BRANCH || 'data-backup'
const GITHUB_RAW = process.env.GITHUB_RAW || `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_DATA_BRANCH}/data/database.json`

// ========== 数据库（JSON 文件 + GitHub 持久化同步，适配 Render 临时磁盘） ==========
const DATA_DIR = path.join(__dirname, 'data')
const DB_PATH = path.join(DATA_DIR, 'database.json')
let _cachedDB = null
let _noSync = false

function emptyDB() { return { users: [], records: [], userData: {} } }

function normalizeDB(d) {
  if (!d || typeof d !== 'object') return emptyDB()
  if (!Array.isArray(d.users)) d.users = []
  if (!Array.isArray(d.records)) d.records = []
  if (!d.userData || typeof d.userData !== 'object') d.userData = {}
  return d
}

function readDB() {
  try {
    if (_cachedDB) return normalizeDB(_cachedDB)
    if (!fs.existsSync(DB_PATH)) {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
      fs.writeFileSync(DB_PATH, JSON.stringify(emptyDB(), null, 2))
    }
    _cachedDB = normalizeDB(JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')))
    return _cachedDB
  } catch (e) {
    console.error('[DB] read error:', e.message)
    return emptyDB()
  }
}

function writeDBSync(data) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
  _cachedDB = data
}

async function writeDB(data) {
  writeDBSync(data)
  if (!_noSync) await syncToGitHub(data)
}

function httpsJSON(options, body) {
  return new Promise((resolve) => {
    const req = https.request(options, res => {
      let d = ''
      res.on('data', c => d += c)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }) }
        catch { resolve({ status: res.statusCode, body: d }) }
      })
    })
    req.on('error', () => resolve({ status: 0, body: null }))
    req.setTimeout(10000, () => { req.destroy(); resolve({ status: 0, body: null }) })
    if (body) req.write(body)
    req.end()
  })
}

// 合并本地与远程数据库：以「用户名」去重，绝不丢弃任一侧存在的用户/记录。
// 这是修复「注册用户冷启动被冲掉、必须重新注册」的核心：即便远程因任何原因
// 比本地旧（缺人），本地独有的用户依然保留，避免整体替换导致数据回滚。
function mergeDB(local, remote) {
  const localUsers = local && Array.isArray(local.users) ? local.users : []
  const localRecords = local && Array.isArray(local.records) ? local.records : []
  const remoteUsers = remote && Array.isArray(remote.users) ? remote.users : []
  const remoteRecords = remote && Array.isArray(remote.records) ? remote.records : []

  // 用户：远程优先（含最新密码哈希），本地独有的保留
  const byName = new Map()
  for (const u of remoteUsers) if (u && u.username) byName.set(u.username, u)
  for (const u of localUsers) if (u && u.username && !byName.has(u.username)) byName.set(u.username, u)
  const users = [...byName.values()]

  // 记录：按 id 去重，合并两侧
  const byId = new Map()
  for (const r of remoteRecords) if (r && r.id) byId.set(r.id, r)
  for (const r of localRecords) if (r && r.id && !byId.has(r.id)) byId.set(r.id, r)
  const records = [...byId.values()]

  const userData = Object.assign({}, (remote && remote.userData) || {}, (local && local.userData) || {})
  return { users, records, userData }
}

async function pullFromGitHub() {
  // 仅走 GitHub Contents API（实时、无 CDN 缓存延迟）。
  // 不再回退 raw.githubusercontent.com —— 其 CDN 可能返回陈旧快照，
  // 一旦用陈旧快照整体替换内存库，刚注册的用户会被永久冲掉。
  if (!GITHUB_TOKEN) return null
  const r = await httpsJSON({
    hostname: 'api.github.com',
    path: `/repos/${GITHUB_REPO}/contents/data/database.json?ref=${GITHUB_DATA_BRANCH}`,
    headers: {
      'Authorization': 'Bearer ' + GITHUB_TOKEN,
      'User-Agent': 'innoproduct-pro',
      'Accept': 'application/vnd.github.v3+json'
    }
  })
  if (r.status === 200 && r.body?.content) {
    try {
      const data = JSON.parse(Buffer.from(String(r.body.content).replace(/\n/g, ''), 'base64').toString('utf-8'))
      if (data && Array.isArray(data.users)) return data
    } catch (e) {
      console.error('[DB] GitHub API 解析失败:', e.message)
    }
  }
  console.error('[DB] GitHub API 拉取失败 HTTP ' + r.status + '，将保留本地数据（不回退陈旧快照）')
  return null
}

async function syncToGitHub(data) {
  if (!GITHUB_TOKEN) return false
  const apiPath = `/repos/${GITHUB_REPO}/contents/data/database.json?ref=${GITHUB_DATA_BRANCH}`
  const headers = {
    'Authorization': 'Bearer ' + GITHUB_TOKEN,
    'User-Agent': 'innoproduct-pro',
    'Accept': 'application/vnd.github.v3+json'
  }
  const cur = await httpsJSON({ hostname: 'api.github.com', path: apiPath, headers })
  const putBody = {
    message: 'Auto-sync database',
    content: Buffer.from(JSON.stringify(data, null, 2)).toString('base64'),
    branch: GITHUB_DATA_BRANCH
  }
  if (cur.status === 200 && cur.body?.sha) putBody.sha = cur.body.sha
  const put = await httpsJSON({
    hostname: 'api.github.com', path: apiPath, method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' }
  }, JSON.stringify(putBody))
  const ok = put.status === 200 || put.status === 201
  console.log(ok ? `[DB] ✅ GitHub 同步成功（${data.users.length} 用户）` : `[DB] ❌ GitHub 同步失败 HTTP ${put.status}`)
  return ok
}

// ========== 密码与令牌 ==========
// 新格式: scrypt$N$r$p$salt(b64)$hash(b64)
function hashPassword(plain) {
  const salt = crypto.randomBytes(16)
  const N = 16384, r = 8, p = 1
  const key = crypto.scryptSync(plain, salt, 64, { N, r, p })
  return `scrypt$${N}$${r}$${p}$${salt.toString('base64')}$${key.toString('base64')}`
}

function verifyPassword(plain, stored) {
  if (!stored) return { ok: false, legacy: false }
  if (stored.startsWith('scrypt$')) {
    try {
      const [, N, r, p, saltB64, hashB64] = stored.split('$')
      const key = crypto.scryptSync(plain, Buffer.from(saltB64, 'base64'), 64, { N: +N, r: +r, p: +p })
      return { ok: crypto.timingSafeEqual(key, Buffer.from(hashB64, 'base64')), legacy: false }
    } catch { return { ok: false, legacy: false } }
  }
  // 旧版兼容：客户端 sha256(明文) 直接入库
  const sha256 = crypto.createHash('sha256').update(plain).digest('hex')
  if (stored === sha256 || stored === plain) return { ok: true, legacy: true }
  return { ok: false, legacy: false }
}

function generateToken() { return crypto.randomBytes(32).toString('hex') }
const TOKEN_TTL = 30 * 24 * 3600 * 1000

function issueToken(user) {
  const token = generateToken()
  user._tokens = (user._tokens || []).filter(t => Date.now() - new Date(t.createdAt).getTime() < TOKEN_TTL)
  user._tokens.push({ token, createdAt: new Date().toISOString() })
  if (user._tokens.length > 5) user._tokens = user._tokens.slice(-5)
  return token
}

function authUser(req) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return null
  const db = readDB()
  for (const u of db.users) {
    const hit = (u._tokens || []).find(t => t.token === token && Date.now() - new Date(t.createdAt).getTime() < TOKEN_TTL)
    if (hit) return u
    // 兼容旧版单 token 字段
    if (u._token === token) return u
  }
  return null
}

function publicUser(u) {
  return { id: u.id, phone: u.phone, username: u.username, company: u.company, industry: u.industry, createdAt: u.createdAt }
}

function requireAuth(req, res) {
  const u = authUser(req)
  if (!u) { res.status(401).json({ error: '未登录或登录已过期' }); return null }
  return u
}

// ========== AI 调用 ==========
function callDeepSeek({ system, user, temperature = 0.7, maxTokens = 32000, jsonMode = true }) {
  return new Promise((resolve, reject) => {
    if (!DEEPSEEK_API_KEY) return reject(new Error('服务端未配置 DEEPSEEK_API_KEY'))
    const body = JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      max_tokens: maxTokens,
      temperature,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {})
    })
    const req = https.request(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + DEEPSEEK_API_KEY,
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 180000
    }, res => {
      let d = ''
      res.on('data', c => d += c)
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error('DeepSeek HTTP ' + res.statusCode))
        try {
          const data = JSON.parse(d)
          resolve(data.choices[0].message.content)
        } catch (e) { reject(new Error('AI 响应解析失败')) }
      })
    })
    req.on('timeout', () => { req.destroy(); reject(new Error('AI 请求超时')) })
    req.on('error', e => reject(e))
    req.write(body)
    req.end()
  })
}

function parseAIJson(content) {
  try { return JSON.parse(content) } catch { /* fallthrough */ }
  const m = content.match(/\{[\s\S]*\}/)
  if (m) return JSON.parse(m[0])
  throw new Error('AI 返回非 JSON 内容')
}

function dateCtx() {
  const now = new Date()
  return `当前日期：${now.getFullYear()}年${now.getMonth() + 1}月。所有趋势与同比数据锚定${now.getFullYear()}年，同比对比${now.getFullYear() - 1}→${now.getFullYear()}。`
}

// 简单限流：每 IP 每小时 40 次 AI 调用
const aiRateMap = new Map()
function aiRateLimit(req, res) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown'
  const now = Date.now()
  const rec = aiRateMap.get(ip) || { count: 0, resetAt: now + 3600000 }
  if (now > rec.resetAt) { rec.count = 0; rec.resetAt = now + 3600000 }
  rec.count++
  aiRateMap.set(ip, rec)
  if (rec.count > 40) {
    res.status(429).json({ error: 'AI 调用过于频繁，请稍后再试' })
    return false
  }
  return true
}

// ========== Prompt 构建 ==========
function buildTrendPrompt(category, collected) {
  const realText = formatForPrompt(collected)
  const hasReal = collected && collected.successCount > 0
  const srcSummary = (collected?.sources || []).map(s => `${s.status === 'success' ? '✓' : '✗'}${s.name}`).join(' ')

  return `你是顶级电商品类趋势分析师，为产品创新决策提供深度分析。${dateCtx}

${hasReal ? `以下是服务端实时采集到的「${category}」相关真实数据。请优先基于真实数据分析，推断部分必须标注推测依据：

${realText}` : `本次真实数据采集全部失败（${srcSummary}），所有内容基于你的行业知识推理，每个数据点标注推测依据。`}

请输出「${category}」品类的完整趋势分析 JSON，Schema：
{
  "category": "${category}",
  "scanDate": "${new Date().toISOString().slice(0, 10)}",
  "metrics": {
    "totalGMV": "品类年GMV（亿）", "totalGMV_source": "来源标注",
    "gmvGrowth": "GMV同比增幅", "gmvGrowth_source": "来源标注",
    "brandCount": "活跃品牌数", "brandCount_source": "来源标注",
    "topBrandShare": "头部品牌集中度CR10", "topBrandShare_source": "来源标注"
  },
  "trends": [
    { "rank": 1, "keyword": "趋势关键词", "share": 搜索占比数字, "yoy": 同比增幅数字, "verbatim": "用户原声", "summary": "趋势解读", "platform": "主要平台", "dataFromReal": true, "sourcePlatform": "淘宝搜索联想|京东真实数据|抖音热榜|百度热搜|B站热搜|头条热榜|AI推测·品类常识", "inferenceBasis": "推测依据" }
  ],
  "painPoints": [
    { "rank": 1, "pain": "痛点", "intensity": 1-100数字, "satisfaction": 1-100数字, "gap": 1-100数字, "userVoice": "用户原声", "currentSolutions": ["现有方案"], "opportunity": "创新机会", "dataFromReal": true, "sourcePlatform": "来源", "inferenceBasis": "推测依据" }
  ],
  "gapMatrix": {
    "priceRanges": ["价格带1-5，参考真实价格数据"],
    "functions": ["功效方向1-5"],
    "cells": [ { "priceIndex": 0, "funcIndex": 0, "share": 数字, "growth": 数字, "competition": "低|中|高", "isEmpty": true, "opportunityScore": 1-100数字 } ]
  },
  "competitors": [
    { "brand": "品牌名", "positioning": "定位", "priceBand": "价格带", "share": 份额数字, "strength": "核心优势", "weakness": "可被攻击的弱点" }
  ],
  "personas": [
    { "name": "人群名称（如：成分党妈妈）", "age": "年龄段", "gender": "性别", "scenario": "核心使用场景", "spendingPower": "消费力", "coreNeeds": ["核心需求1", "核心需求2"], "quote": "典型一句话" }
  ],
  "channelInsights": [
    { "platform": "抖音", "contentAngle": "内容切入角度", "playStyle": "打法建议", "difficulty": "低|中|高", "note": "备注" }
  ],
  "opportunities": [
    { "rank": 1, "title": "机会标题", "trendSignal": "趋势信号", "demandGap": "需求缺口", "feasibility": "可行性", "score": 1-100数字, "rationale": "评分依据", "sourcePlatform": "来源", "inferenceBasis": "推测依据" }
  ]
}

硬性规则：
- trends ≥ 7 条（真实采集到搜索词时必须引用真实词），painPoints ≥ 5 条，competitors ≥ 6 个，personas 3 个，channelInsights 覆盖 抖音/小红书/天猫/京东/拼多多 5 个平台，opportunities ≥ 5 条
- gapMatrix：priceRanges 与 functions 各 5 个，cells 恰好 25 个（priceIndex/funcIndex 0-4）
- 所有数值字段必须是数字类型；单位用中文（亿/元/万）
- sourcePlatform 与 inferenceBasis 每条必填，禁止空字符串和 null`
}

function buildConceptPrompt(category, trendData) {
  const summary = trendData ? JSON.stringify({
    trends: (trendData.trends || []).slice(0, 7).map(t => ({ keyword: t.keyword, yoy: t.yoy })),
    painPoints: (trendData.painPoints || []).slice(0, 5).map(p => ({ pain: p.pain, gap: p.gap })),
    opportunities: (trendData.opportunities || []).slice(0, 5).map(o => ({ title: o.title, score: o.score })),
    competitors: (trendData.competitors || []).slice(0, 6).map(c => ({ brand: c.brand, weakness: c.weakness }))
  }) : '无趋势数据，请自行分析'

  return `你是资深产品创新设计师，15年消费品研发经验。${dateCtx}

基于「${category}」品类趋势分析摘要：
${summary}

生成 5 个有实质差异的创新产品概念，JSON Schema：
{
  "category": "${category}",
  "generatedAt": "${new Date().toISOString().slice(0, 10)}",
  "concepts": [
    {
      "id": "concept-1",
      "name": "产品名称",
      "tagline": "一句话定位",
      "targetAudience": { "age": "年龄", "gender": "性别", "scenario": "场景", "spendingPower": "消费力" },
      "corePainPoint": "核心痛点",
      "usp": "差异化独特卖点（具体可验证）",
      "formulationDirection": { "coreIngredients": ["成分1", "成分2", "成分3"], "techRoute": "技术路线", "keyBenefit": "功效机制" },
      "packagingDirection": { "material": "材质", "style": "风格", "spec": "规格", "unboxingExperience": "开箱体验" },
      "priceRange": "价格区间",
      "priceStrategy": "定价策略",
      "marketSize": { "tam": "总市场", "sam": "可服务市场", "som": "可获得市场" },
      "channelStrategy": "首选渠道与打法",
      "feasibilityScore": 1-5整数,
      "devCycleEstimate": "研发周期",
      "innovationLevel": "微创新|差异创新|颠覆创新",
      "competitorGap": "与最近竞品的本质区别",
      "riskFactors": ["风险1", "风险2"],
      "successMetrics": ["指标1", "指标2"]
    }
  ]
}

硬性规则：concepts 恰好 5 个，覆盖至少 3 个人群与 3 个价格带；usp 禁止空话；coreIngredients 必须真实存在；全部中文；禁止空字符串与 null`
}

function buildSpecPrompt(category, concept) {
  return `你是资深产品规格书撰写专家与新品上市操盘手。${dateCtx}

基于品类「${category}」与创新概念「${concept.name}」，生成可落地执行的产品规格书+上市方案。

概念信息：
- 定位：${concept.tagline}
- 人群：${concept.targetAudience?.age} ${concept.targetAudience?.gender} ${concept.targetAudience?.scenario}
- 痛点：${concept.corePainPoint}
- USP：${concept.usp}
- 成分方向：${(concept.formulationDirection?.coreIngredients || []).join('、')}
- 包装方向：${concept.packagingDirection?.material} ${concept.packagingDirection?.style}
- 建议价格：${concept.priceRange}

JSON Schema：
{
  "productName": "${concept.name}",
  "category": "${category}",
  "specDate": "${new Date().toISOString().slice(0, 10)}",
  "formulation": {
    "coreFormula": [ { "ingredient": "成分名", "percentage": "比例范围", "function": "功效" } ],
    "auxiliaryFormula": [ { "ingredient": "辅助成分", "function": "作用" } ],
    "totalActiveContent": "活性物总含量", "preservativeSystem": "防腐体系", "phRange": "pH范围"
  },
  "efficacy": {
    "primaryClaims": ["主宣称1", "主宣称2"], "secondaryClaims": ["次宣称"],
    "supportingData": "功效支撑", "complianceNote": "合规注意"
  },
  "packaging": {
    "primaryPack": { "material": "内包材", "spec": "规格", "designStyle": "风格" },
    "secondaryPack": { "material": "外包材", "spec": "规格" },
    "labelRequirements": ["标签要求"], "unboxingDesign": "开箱体验"
  },
  "qualityStandard": {
    "keyIndicators": [ { "indicator": "指标", "standard": "标准值", "testMethod": "检测方法" } ],
    "shelfLife": "保质期", "storageCondition": "储存条件"
  },
  "costEstimate": {
    "rawMaterial": "原料成本范围", "packaging": "包装成本范围", "processing": "加工费范围",
    "totalCost": "总成本范围", "costLevel": "低|中|高"
  },
  "pricingStrategy": {
    "costMultiplier": "成本倍率", "anchorPrice": "竞品锚点", "suggestedPrice": "建议售价",
    "premiumRatio": "溢价比例", "premiumBasis": "溢价依据"
  },
  "unitEconomics": {
    "assumptions": "测算假设（如：月销X万件）",
    "unitCostMid": 单位成本中位数数字,
    "retailPriceMid": 零售价中位数数字,
    "grossMarginPct": 毛利率数字,
    "channelFeePct": 渠道费用占比数字,
    "marketingFeePct": "营销费用占比建议",
    "breakevenMonthlyVolume": "月盈亏平衡销量（如：8000件）",
    "yearOneRevenueRange": "首年营收区间",
    "note": "测算说明"
  },
  "launchPlan": {
    "phases": [
      { "name": "阶段名（如：冷启动）", "duration": "周期", "actions": ["动作1", "动作2"], "kpi": "阶段KPI" }
    ],
    "channels": ["首发渠道1", "渠道2"],
    "contentSeeding": "种草内容策略",
    "budgetSplit": "预算分配建议"
  },
  "compliance": {
    "registrationRequired": true, "registrationType": "备案/注册类型",
    "testingRequired": ["检测项目"], "labelingRules": ["标签要点"], "restrictedIngredients": ["限用提醒"]
  },
  "supplierDirection": {
    "supplierType": "供应商类型", "sourcingKeywords": ["寻源关键词"], "moqEstimate": "起订量", "leadTime": "交期"
  }
}

硬性规则：coreFormula ≥ 5、auxiliaryFormula ≥ 3、keyIndicators ≥ 4、testingRequired ≥ 3、phases 恰好 3 个；成本用区间；数值字段必须是数字；全部中文；禁止空字符串`
}

// ========== 路由：认证 ==========
app.post('/api/auth', async (req, res) => {
  const { phone, username, company, industry, password } = req.body || {}
  if (!username || !password) return res.status(400).json({ error: '用户名和密码为必填项' })

  const db = readDB()
  let user = db.users.find(u => u.username === username)

  if (user) {
    const v = verifyPassword(password, user.password)
    if (!v.ok) return res.status(401).json({ error: '密码错误' })
    if (v.legacy) user.password = hashPassword(password) // 自动升级旧哈希
    user.lastLogin = new Date().toISOString()
  } else {
    if (!phone || !/^\d{5,15}$/.test(phone)) {
      return res.status(400).json({ error: '注册需要填写手机号。如已有账号，请切换到"登录"。' })
    }
    user = {
      id: crypto.randomUUID(), phone, username,
      company: company || '', industry: industry || '',
      password: hashPassword(password),
      createdAt: new Date().toISOString(), lastLogin: new Date().toISOString(), recordCount: 0
    }
    db.users.push(user)
    console.log('[AUTH] 新用户注册:', username)
  }

  const token = issueToken(user)
  await writeDB(db)
  res.json({ success: true, token, user: publicUser(user) })
})

app.post('/api/logout', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const u = authUser(req)
  if (u && token) {
    u._tokens = (u._tokens || []).filter(t => t.token !== token)
    if (u._token === token) delete u._token
    await writeDB(readDB())
  }
  res.json({ success: true })
})

app.get('/api/verify', (req, res) => {
  const u = authUser(req)
  if (!u) return res.status(401).json({ error: '未登录或登录已过期' })
  res.json({ success: true, user: publicUser(u) })
})

// ========== 路由：AI ==========
app.post('/api/ai/trends', async (req, res) => {
  const user = requireAuth(req, res); if (!user) return
  if (!aiRateLimit(req, res)) return
  const category = String(req.body?.category || '').trim()
  if (!category) return res.status(400).json({ error: '缺少品类' })

  try {
    const collected = await collectAll(category)
    const content = await callDeepSeek({
      system: `你是顶级电商品类趋势分析AI。${dateCtx()} 始终返回有效JSON，不要输出JSON以外的任何文字。平台名用中文，单位用中文。`,
      user: buildTrendPrompt(category, collected)
    })
    const parsed = parseAIJson(content)
    parsed._collection = {
      successCount: collected.successCount,
      sources: collected.sources,
      timestamp: collected.timestamp,
      elapsedMs: collected.elapsedMs
    }
    if (collected.jd) {
      parsed._jdProducts = (collected.jd.products || []).slice(0, 20)
      parsed._jdPriceDist = collected.jd.priceDistribution || []
    }
    if (collected.jdComments) parsed._realComments = collected.jdComments.comments.slice(0, 15).map(c => c.content)
    if (collected.taobao) parsed._taobaoSuggests = collected.taobao.suggests.slice(0, 15)

    // 保存分析记录
    const db = readDB()
    db.records.push({ id: crypto.randomUUID(), userId: user.id, category, result: `趋势分析（真实源${collected.successCount}/7）`, createdAt: new Date().toISOString() })
    user.recordCount = (user.recordCount || 0) + 1
    const ud = db.userData[user.id] || (db.userData[user.id] = { projects: [], inspirations: [], analyses: [] })
    ud.analyses = ud.analyses || []
    ud.analyses.unshift({ id: crypto.randomUUID(), category, scanDate: parsed.scanDate, savedAt: new Date().toISOString(), data: parsed })
    if (ud.analyses.length > 20) ud.analyses = ud.analyses.slice(0, 20)
    await writeDB(db)

    res.json({ success: true, data: parsed })
  } catch (e) {
    console.error('[AI] trends 失败:', e.message)
    res.status(500).json({ error: '分析失败: ' + e.message })
  }
})

app.post('/api/ai/concepts', async (req, res) => {
  const user = requireAuth(req, res); if (!user) return
  if (!aiRateLimit(req, res)) return
  const { category, trendData } = req.body || {}
  if (!category) return res.status(400).json({ error: '缺少品类' })
  try {
    const content = await callDeepSeek({
      system: `你是资深产品创新设计师。${dateCtx()} 始终返回有效JSON。全部中文，禁止空字符串与null。`,
      user: buildConceptPrompt(category, trendData),
      temperature: 0.8
    })
    res.json({ success: true, data: parseAIJson(content) })
  } catch (e) {
    res.status(500).json({ error: '概念生成失败: ' + e.message })
  }
})

app.post('/api/ai/spec', async (req, res) => {
  const user = requireAuth(req, res); if (!user) return
  if (!aiRateLimit(req, res)) return
  const { category, concept } = req.body || {}
  if (!category || !concept) return res.status(400).json({ error: '缺少品类或概念' })
  try {
    const content = await callDeepSeek({
      system: `你是资深产品规格书撰写专家。${dateCtx()} 始终返回有效JSON。全部中文，单位用中文。`,
      user: buildSpecPrompt(category, concept)
    })
    res.json({ success: true, data: parseAIJson(content) })
  } catch (e) {
    res.status(500).json({ error: '规格书生成失败: ' + e.message })
  }
})

// AI 对话（SSE 流式转发）
app.post('/api/ai/chat', async (req, res) => {
  const user = requireAuth(req, res); if (!user) return
  if (!aiRateLimit(req, res)) return
  const { messages, category, stage } = req.body || {}
  if (!Array.isArray(messages)) return res.status(400).json({ error: '消息格式错误' })

  const system = `你是创新产品开发AI助手，精通消费品研发全流程（趋势分析/概念设计/配方包装/开发管理/供应链/上市策略）。${dateCtx()} 当前上下文：品类=${category || '未指定'}，阶段=${stage || '未指定'}。用中文回答，专业、简洁、可落地。如问题与产品开发无关，礼貌引导回主题。`

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const body = JSON.stringify({
    model: 'deepseek-chat',
    messages: [{ role: 'system', content: system }, ...messages.slice(-20)],
    max_tokens: 4096,
    temperature: 0.7,
    stream: true
  })

  const apiReq = https.request(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + DEEPSEEK_API_KEY,
      'Content-Length': Buffer.byteLength(body)
    },
    timeout: 120000
  }, apiRes => {
    if (apiRes.statusCode !== 200) {
      res.write(`data: ${JSON.stringify({ error: 'AI 服务异常 HTTP ' + apiRes.statusCode })}\n\n`)
      return res.end()
    }
    apiRes.on('data', chunk => res.write(chunk))
    apiRes.on('end', () => res.end())
  })
  apiReq.on('error', () => {
    res.write(`data: ${JSON.stringify({ error: 'AI 连接失败' })}\n\n`)
    res.end()
  })
  apiReq.on('timeout', () => { apiReq.destroy(); res.end() })
  apiReq.write(body)
  apiReq.end()
})

// 原始采集数据（透明化调试用）
app.get('/api/collect/:category', async (req, res) => {
  const user = requireAuth(req, res); if (!user) return
  try {
    const data = await collectAll(req.params.category)
    res.json({ success: true, data })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ========== 路由：用户数据（云端持久化） ==========
app.get('/api/me/data', (req, res) => {
  const user = requireAuth(req, res); if (!user) return
  const db = readDB()
  const ud = db.userData[user.id] || { projects: [], inspirations: [], analyses: [] }
  res.json({ success: true, data: { projects: ud.projects || [], inspirations: ud.inspirations || [], analyses: (ud.analyses || []).map(a => ({ id: a.id, category: a.category, scanDate: a.scanDate, savedAt: a.savedAt })) } })
})

app.put('/api/me/projects', async (req, res) => {
  const user = requireAuth(req, res); if (!user) return
  const projects = Array.isArray(req.body?.projects) ? req.body.projects.slice(0, 50) : []
  const db = readDB()
  const ud = db.userData[user.id] || (db.userData[user.id] = { projects: [], inspirations: [], analyses: [] })
  ud.projects = projects
  await writeDB(db)
  res.json({ success: true })
})

app.put('/api/me/inspirations', async (req, res) => {
  const user = requireAuth(req, res); if (!user) return
  const inspirations = Array.isArray(req.body?.inspirations) ? req.body.inspirations.slice(0, 200) : []
  const db = readDB()
  const ud = db.userData[user.id] || (db.userData[user.id] = { projects: [], inspirations: [], analyses: [] })
  ud.inspirations = inspirations
  await writeDB(db)
  res.json({ success: true })
})

app.get('/api/me/analyses/:id', (req, res) => {
  const user = requireAuth(req, res); if (!user) return
  const db = readDB()
  const ud = db.userData[user.id]
  const a = (ud?.analyses || []).find(x => x.id === req.params.id)
  if (!a) return res.status(404).json({ error: '分析记录不存在' })
  res.json({ success: true, data: a })
})

// ========== 路由：管理后台 ==========
function requireAdmin(req, res) {
  const u = requireAuth(req, res); if (!u) return null
  if (u.username !== 'qaq') { res.status(403).json({ error: '无管理员权限' }); return null }
  return u
}

app.get('/api/admin/users', (req, res) => {
  if (!requireAdmin(req, res)) return
  const db = readDB()
  res.json({
    success: true,
    users: db.users.map(u => ({
      id: u.id, phone: u.phone, username: u.username, company: u.company,
      industry: u.industry, createdAt: u.createdAt, lastLogin: u.lastLogin,
      recordCount: u.recordCount || 0,
      projectCount: (db.userData[u.id]?.projects || []).length,
      analysisCount: (db.userData[u.id]?.analyses || []).length
    }))
  })
})

app.get('/api/admin/all-records', (req, res) => {
  if (!requireAdmin(req, res)) return
  const db = readDB()
  const records = db.records
    .slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(r => {
      const u = db.users.find(x => x.id === r.userId)
      return { ...r, username: u?.username || '未知', company: u?.company || '', phone: u?.phone || '' }
    })
  res.json({ success: true, records })
})

// 健康检查
app.get('/api/health', (req, res) => {
  const db = readDB()
  res.json({
    status: 'ok', version: '2.0.0',
    users: db.users.length, records: db.records.length,
    aiConfigured: !!DEEPSEEK_API_KEY,
    githubSync: !!GITHUB_TOKEN,
    uptime: process.uptime()
  })
})

// SPA 兜底
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' })
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

// ========== 启动 ==========
app.listen(PORT, async () => {
  console.log('=== 创品智造 Pro v2.0 ===')
  console.log('AI Key: ' + (DEEPSEEK_API_KEY ? '✅ 已配置' : '⚠️ 未配置（设置 DEEPSEEK_API_KEY 环境变量）'))
  console.log('GitHub 同步: ' + (GITHUB_TOKEN ? '✅ 启用' : '⚠️ 未启用（仅本地存储）'))

  // 启动恢复：仅当远程数据比本地更新（用户数更多或本地为空）时才采用远程，避免回滚本地新数据
  const remote = await pullFromGitHub()
  const localDB = readDB()
  if (remote && remote.users?.length) {
    const merged = mergeDB(localDB, remote)
    _noSync = true
    writeDBSync(merged)
    _noSync = false
    console.log(`[DB] 合并恢复完成: ${merged.users.length} 用户（本地 ${localDB.users.length} + 远程 ${remote.users.length}）`)
  } else {
    console.log(`[DB] 无远程数据，保留本地 ${localDB.users.length} 用户`)
  }

  const db = readDB()
  // 管理员密码强制为 qaq881205，且与前端 sha256(明文) 提交方式一致：
  // 前端登录时发送 sha256('qaq881205')，服务端按 scrypt(sha256('qaq881205')) 校验。
  // 启动时无论如何都校准，避免 GitHub 数据被覆盖导致管理员登录失败。
  const adminPw = hashPassword(crypto.createHash('sha256').update('qaq881205').digest('hex'))
  let admin = db.users.find(u => u.username === 'qaq')
  if (!admin) {
    admin = {
      id: crypto.randomUUID(), phone: 'qaq', username: 'qaq',
      company: '创品智造', industry: '电商',
      password: adminPw,
      createdAt: new Date().toISOString(), lastLogin: new Date().toISOString(), recordCount: 0
    }
    db.users.push(admin)
    console.log('[DB] 管理员账号已创建: qaq / qaq881205')
  } else {
    admin.password = adminPw
    console.log('[DB] 管理员密码已校准为 qaq881205')
  }
  _noSync = true
  writeDBSync(db)
  _noSync = false

  console.log(`🚀 服务启动: http://localhost:${PORT}`)
})
