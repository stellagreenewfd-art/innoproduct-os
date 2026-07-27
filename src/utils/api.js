/**
 * DeepSeek API 工具 — 创品智造
 * 包含：趋势分析、创新产品概念生成、产品规格书生成、AI对话
 * V2: 先采集真实数据（京东/Google Trends/百度），再让AI分析真实数据
 */

import { collectRealData, formatRealDataForPrompt, hasRealData } from './dataCollector'

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'
const STORAGE_KEY_API = 'innoproduct:apikey'
const DEFAULT_API_KEY = 'sk-beb0ce29e1fc4e8e883f683376910936'

export function getApiKey() {
  return localStorage.getItem(STORAGE_KEY_API) || DEFAULT_API_KEY
}

export function setApiKey(key) {
  localStorage.setItem(STORAGE_KEY_API, key)
}

const CATEGORY_PATTERNS = {
  cosmetics: ['面膜','精华','面霜','护肤','防晒','化妆','水乳','眼霜','洁面','乳液','爽肤水','粉底','口红','彩妆'],
  electronics: ['手机','耳机','眼镜','智能','电脑','电子','笔记本','平板','手表','穿戴','音箱','机器人','无人机','AI','芯片'],
  food: ['咖啡','饮料','食品','零食','茶','果汁','奶','酒','啤酒','巧克力','饼干','面包','燕麦','益生菌'],
  apparel: ['服装','鞋','帽','服饰','衣','裤子','裙子','外套','内衣','袜子','面料','纺织','棉','丝']
}

export function getCategoryType(category) {
  if (!category) return 'general'
  for (const [type, patterns] of Object.entries(CATEGORY_PATTERNS))
    for (const p of patterns) if (category.includes(p)) return type
  return 'general'
}

function getDateContext() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  return `当前日期：${year}年${month}月。所有趋势数据、YoY增幅必须锚定到${year}年最新情况，同比对比${year - 1}→${year}。`
}

/**
 * 品类趋势分析 Prompt — V2: 基于真实数据分析
 * 如果有真实数据：让AI分析真实数据
 * 如果没有真实数据：AI自行推理（标注为AI推理）
 */
function buildTrendPrompt(category, realData) {
  const dateCtx = getDateContext()
  const realDataText = formatRealDataForPrompt(realData)
  const hasReal = hasRealData(realData)

  if (hasReal) {
    return `你是专业的电商品类趋势分析师。${dateCtx}

以下是通过真实数据源采集到的「${category}」品类市场数据。请基于这些真实数据进行分析，生成趋势报告。

---

${realDataText}

---

分析要求：
1. 基于上方真实电商平台商品数据（京东/天猫/拼多多），分析价格带分布、品牌竞争格局
2. 基于京东真实用户评论，提取用户痛点和高频需求
3. 结合Google Trends、百度搜索、抖音/小红书趋势，识别热门方向
4. 每个趋势关键词标注来源平台（如"京东真实数据""天猫抓取""Google Trends""AI推测·品类常识"）
5. 每个用户痛点标注 dataFromReal=true/false，如果是AI推理标注推测依据
6. 每个 metrics 指标标注 source 和 confidence（高/中/低）
7. 禁止编造没有依据的数据，缺少维度的标注"AI推测·依据：XX"

JSON Schema:
{
  "category": "${category}",
  "scanDate": "${new Date().toISOString().slice(0, 10)}",
  "dataSource": {
    "realSources": ${JSON.stringify(realData?.sources?.filter(s => s.status === 'success').map(s => s.name) || [])},
    "failedSources": ${JSON.stringify(realData?.sources?.filter(s => s.status === 'failed').map(s => s.name) || [])},
    "collectTime": "${realData?.timestamp || ''}",
    "isRealData": true,
    "platformStats": ${JSON.stringify(realData?.sources?.map(s => ({ name: s.name, status: s.status, count: s.count || 0 })) || [])}
  },
  "metrics": {
    "totalGMV": "基于行业数据估算",
    "totalGMV_source": "AI估算·依据:品牌集中度+品类规模",
    "gmvGrowth": "GMV同比增幅",
    "gmvGrowth_source": "AI估算·依据:行业趋势报告",
    "brandCount": "基于采集数据统计",
    "brandCount_source": "京东真实数据·品牌去重",
    "topBrandShare": "头部品牌集中度",
    "topBrandShare_source": "京东真实数据·TOP10占比"
  },
  "trends": [
    {
      "rank": 1,
      "keyword": "热门搜索词",
      "share": 搜索占比,
      "yoy": 同比增幅,
      "verbatim": "用户原声",
      "summary": "趋势解读",
      "platform": "主要平台",
      "dataFromReal": true/false,
      "sourcePlatform": "京东真实数据|天猫抓取|Google Trends|百度热搜|抖音趋势|小红书趋势|AI推测·品类常识|AI推测·依据京东数据",
      "inferenceBasis": "基于Google Trends热搜关联|基于京东评论高频词|基于百度搜索关联|AI行业知识推理"
    }
  ],
  "painPoints": [
    {
      "rank": 1,
      "pain": "痛点描述",
      "intensity": 需求强度1-100,
      "satisfaction": 满足程度1-100,
      "gap": 需求缺口评分,
      "userVoice": "用户原声",
      "currentSolutions": ["现有方案"],
      "opportunity": "创新机会",
      "dataFromReal": true/false,
      "sourcePlatform": "京东真实评论|天猫买家秀|AI推测·行业经验|AI推测·品类常识",
      "inferenceBasis": "引用京东真实评论原文|基于品类常见投诉模式|AI行业知识推理"
    }
  ],
  "gapMatrix": {
    "priceRanges": ["价格带1", "价格带2", "价格带3", "价格带4", "价格带5"],
    "functions": ["功效1", "功效2", "功效3", "功效4", "功效5"],
    "cells": [
      {
        "priceIndex": 0,
        "funcIndex": 0,
        "share": 市场份额,
        "growth": 增速,
        "competition": "竞争程度",
        "isEmpty": true/false,
        "opportunityScore": 1-100
      }
    ]
  },
  "opportunities": [
    {
      "rank": 1,
      "title": "创新机会标题",
      "trendSignal": "趋势信号",
      "demandGap": "需求缺口",
      "feasibility": "可行性",
      "score": 综合评分,
      "rationale": "评分依据",
      "sourcePlatform": "京东真实数据+AI分析|天猫数据推断|多平台交叉验证|AI行业推理",
      "inferenceBasis": "基于京东品牌集中度+真实评论痛点|基于多平台价格带对比|AI行业知识推理"
    }
  ]
}

CRITICAL RULES:
- trends 数组至少7个，关键词应结合Google Trends和百度搜索真实数据
- painPoints 数组至少5个，userVoice优先引用真实京东评论原文
- gapMatrix 的 priceRanges 必须基于京东真实价格数据生成，functions 各5个，cells 共25个
- opportunities 数组至少5个，rationale必须引用真实数据
- sourcePlatform 和 inferenceBasis 必须每个元素都填写，不得为空
- 所有数值字段必须是数字类型
- 所有中文平台名（天猫/京东/抖音/小红书/拼多多/快手/亚马逊）
- 所有单位用中文（亿/元/万）
- dataSource 字段必须包含真实数据来源和失败来源
- 禁止空字符串`
  } else {
    // 没有真实数据时，回退到AI推理模式（标注为AI推理+推测依据）
    return `你是专业的电商品类趋势分析AI。${dateCtx}

注意：本次尝试采集了京东/天猫/拼多多/抖音/小红书/Google Trends/百度搜索，但均未能获取到有效数据。
所有分析基于你的AI行业知识推理生成，请在每个数据点标注推测依据。

请针对品类「${category}」进行全面的趋势扫描分析，生成JSON数据。

要求：
1. 基于你的电商行业知识，推测热门搜索词、用户痛点、未被满足的需求
2. 分析价格带×功效的空白格子（创新机会）
3. ${dateCtx}
4. 每个指标必须标注来源和置信度

JSON Schema:
{
  "category": "${category}",
  "scanDate": "${new Date().toISOString().slice(0, 10)}",
  "dataSource": {
    "realSources": [],
    "failedSources": ["京东搜索", "天猫搜索", "拼多多搜索", "抖音趋势", "小红书趋势", "Google Trends", "百度搜索"],
    "collectTime": "${new Date().toISOString()}",
    "isRealData": false,
    "note": "本次分析基于AI推理，非真实平台数据。推测依据详见各字段inferenceBasis。"
  },
  "metrics": {
    "totalGMV": "品类总GMV（亿）",
    "totalGMV_source": "AI估算·依据:品类规模常识",
    "gmvGrowth": "GMV同比增幅",
    "gmvGrowth_source": "AI估算·依据:行业增长趋势",
    "brandCount": "品牌数量",
    "brandCount_source": "AI估算·依据:品类成熟度推测",
    "topBrandShare": "头部品牌集中度",
    "topBrandShare_source": "AI估算·依据:品类竞争格局常识"
  },
  "trends": [
    {
      "rank": 1,
      "keyword": "热门搜索词",
      "share": 搜索占比,
      "yoy": 同比增幅,
      "verbatim": "用户原声（AI推理）",
      "summary": "趋势解读",
      "platform": "主要平台",
      "dataFromReal": false,
      "sourcePlatform": "AI推测·品类常识",
      "inferenceBasis": "基于品类热搜模式常识|基于抖音/小红书内容趋势常识|基于行业报告记忆"
    }
  ],
  "painPoints": [
    {
      "rank": 1,
      "pain": "痛点描述",
      "intensity": 需求强度1-100,
      "satisfaction": 满足程度1-100,
      "gap": 需求缺口评分,
      "userVoice": "用户原声（AI推理）",
      "currentSolutions": ["现有解决方案及其不足"],
      "opportunity": "创新机会描述",
      "dataFromReal": false,
      "sourcePlatform": "AI推测·行业经验",
      "inferenceBasis": "基于品类常见投诉模式|基于消费者行为常识|AI行业知识推理"
    }
  ],
  "gapMatrix": {
    "priceRanges": ["价格带1", "价格带2", "价格带3", "价格带4", "价格带5"],
    "functions": ["功效1", "功效2", "功效3", "功效4", "功效5"],
    "cells": [
      {
        "priceIndex": 0,
        "funcIndex": 0,
        "share": 市场份额,
        "growth": 增速,
        "competition": "竞争程度(低/中/高)",
        "isEmpty": true/false,
        "opportunityScore": 1-100
      }
    ]
  },
  "opportunities": [
    {
      "rank": 1,
      "title": "创新机会标题",
      "trendSignal": "趋势信号",
      "demandGap": "需求缺口",
      "feasibility": "可行性描述",
      "score": 综合评分1-100,
      "rationale": "为什么这是一个好机会",
      "sourcePlatform": "AI推测·行业经验",
      "inferenceBasis": "基于品类创新规律|基于消费者趋势常识|AI行业知识推理"
    }
  ]
}

CRITICAL RULES:
- trends 数组至少7个
- painPoints 数组至少5个，gap >= 50的至少3个
- gapMatrix 的 priceRanges 和 functions 各5个，cells 共25个
- opportunities 数组至少5个
- sourcePlatform 和 inferenceBasis 必须每个元素都填写，不得为空
- 所有数值字段必须是数字类型，不是字符串
- 所有中文平台名（天猫/京东/抖音/小红书/拼多多/快手/亚马逊）
- 所有单位用中文（亿/元/万）
- 禁止空字符串`
  }
}

/**
 * 创新产品概念生成 Prompt — 创新工坊模块（核心）
 */
function buildInnoPrompt(category, trendData) {
  const dateCtx = getDateContext()
  const trendSummary = trendData ? JSON.stringify({
    trends: trendData.trends?.slice(0, 7).map(t => ({ keyword: t.keyword, yoy: t.yoy })),
    painPoints: trendData.painPoints?.slice(0, 5).map(p => ({ pain: p.pain, gap: p.gap })),
    opportunities: trendData.opportunities?.slice(0, 5).map(o => ({ title: o.title, score: o.score }))
  }) : '无趋势数据，请自行分析'

  return `你是资深产品创新设计师，拥有15年消费品研发经验。${dateCtx}

基于品类「${category}」的趋势分析结果：
${trendSummary}

请生成 5 个具有实质性差异的创新产品概念。每个概念必须是一个可以真正开发上市的产品方案。

JSON Schema:
{
  "category": "${category}",
  "generatedAt": "${new Date().toISOString().slice(0, 10)}",
  "concepts": [
    {
      "id": "concept-1",
      "name": "产品名称建议（品牌名+功效+形态）",
      "tagline": "一句话产品定位",
      "targetAudience": {
        "age": "年龄范围",
        "gender": "性别倾向",
        "scenario": "使用场景",
        "spendingPower": "消费力水平"
      },
      "corePainPoint": "用户最痛的一个点，一句话描述",
      "usp": "差异化独特卖点，必须具体可验证",
      "formulationDirection": {
        "coreIngredients": ["核心成分1", "核心成分2", "核心成分3"],
        "techRoute": "技术路线描述",
        "keyBenefit": "核心功效机制"
      },
      "packagingDirection": {
        "material": "包装材质",
        "style": "设计风格",
        "spec": "规格容量",
        "unboxingExperience": "开箱体验设计"
      },
      "priceRange": "建议零售价区间（如39-69元）",
      "priceStrategy": "定价策略说明",
      "marketSize": {
        "tam": "总市场规模",
        "sam": "可服务市场",
        "som": "可获得市场"
      },
      "feasibilityScore": 1-5的数字,
      "devCycleEstimate": "研发周期预估（如3-4个月）",
      "innovationLevel": "微创新/差异创新/颠覆创新",
      "competitorGap": "与最近竞品的本质区别",
      "riskFactors": ["风险因素1", "风险因素2"],
      "successMetrics": ["成功衡量指标1", "成功衡量指标2"]
    }
  ]
}

CRITICAL RULES:
- concepts 数组必须5个，每个必须有实质性差异（不同功效方向/不同人群/不同价格带）
- 不允许同质化换皮，5个概念必须覆盖至少3个不同人群和3个不同价格带
- usp 必须具体、可验证，禁止"品质更好""性价比更高"等空话
- coreIngredients 必须是真实存在的原料/成分名称
- priceRange 必须参考真实市场数据，给出具体区间
- feasibilityScore 必须是1-5的整数
- innovationLevel 只能是"微创新"/"差异创新"/"颠覆创新"三者之一
- 所有中文，所有单位用中文（亿/元/万）
- 禁止空字符串、禁止null值`
}

/**
 * 产品规格书生成 Prompt — 产品规格书模块
 */
function buildSpecPrompt(category, concept) {
  const dateCtx = getDateContext()
  return `你是资深产品规格书撰写专家。${dateCtx}

基于品类「${category}」和创新概念「${concept.name}」，生成详细可执行的产品规格书。

概念信息：
- 定位：${concept.tagline}
- 目标人群：${concept.targetAudience?.age} ${concept.targetAudience?.scenario}
- 核心痛点：${concept.corePainPoint}
- USP：${concept.usp}
- 成分方向：${concept.formulationDirection?.coreIngredients?.join('、')}
- 包装方向：${concept.packagingDirection?.material} ${concept.packagingDirection?.style}
- 建议价格：${concept.priceRange}

JSON Schema:
{
  "productName": "${concept.name}",
  "category": "${category}",
  "specDate": "${new Date().toISOString().slice(0, 10)}",
  "formulation": {
    "coreFormula": [
      { "ingredient": "成分名", "percentage": "添加比例范围", "function": "功效作用" }
    ],
    "auxiliaryFormula": [
      { "ingredient": "辅助成分名", "function": "作用说明" }
    ],
    "totalActiveContent": "活性物总含量",
    "preservativeSystem": "防腐体系方案",
    "phRange": "pH值范围"
  },
  "efficacy": {
    "primaryClaims": ["主要功效宣称1", "主要功效宣称2"],
    "secondaryClaims": ["次要功效宣称1"],
    "supportingData": "功效支撑数据方向",
    "complianceNote": "合规注意事项"
  },
  "packaging": {
    "primaryPack": { "material": "内包材", "spec": "规格", "designStyle": "设计风格" },
    "secondaryPack": { "material": "外包材", "spec": "规格" },
    "labelRequirements": ["标签要求1", "标签要求2"],
    "unboxingDesign": "开箱体验设计要点"
  },
  "qualityStandard": {
    "keyIndicators": [
      { "indicator": "指标名", "standard": "标准值", "testMethod": "检测方法" }
    ],
    "shelfLife": "保质期",
    "storageCondition": "储存条件"
  },
  "costEstimate": {
    "rawMaterial": "原料成本范围",
    "packaging": "包装成本范围",
    "processing": "加工费范围",
    "totalCost": "总成本范围",
    "costLevel": "低/中/高"
  },
  "pricingStrategy": {
    "costMultiplier": "成本倍率建议",
    "anchorPrice": "竞品锚点价格",
    "suggestedPrice": "建议售价",
    "premiumRatio": "溢价比例",
    "premiumBasis": "溢价依据"
  },
  "compliance": {
    "registrationRequired": true/false,
    "registrationType": "备案/注册类型",
    "testingRequired": ["检测项目1", "检测项目2"],
    "labelingRules": ["标签合规要点1"],
    "restrictedIngredients": ["限用成分提醒"]
  },
  "supplierDirection": {
    "supplierType": "需要的供应商类型",
    "sourcingKeywords": ["寻源关键词1", "寻源关键词2"],
    "moqEstimate": "起订量预估",
    "leadTime": "交期预估"
  }
}

CRITICAL RULES:
- coreFormula 至少5个成分，auxiliaryFormula 至少3个
- keyIndicators 至少4个
- testingRequired 至少3个
- 所有成本给出范围而非具体数字（如"5-8元/件"）
- 所有中文，单位用中文（元/件/克/毫升）
- 禁止空字符串`
}

/**
 * AI对话 Prompt
 */
function buildChatPrompt(category, context) {
  const dateCtx = getDateContext()
  return `你是创新产品开发AI助手，精通消费品研发全流程。${dateCtx}

当前上下文：
- 品类：${category || '未指定'}
- 当前阶段：${context?.stage || '未指定'}

你的专业领域：
1. 品类趋势分析与机会识别
2. 创新产品概念设计与差异化策略
3. 产品配方/成分/包装规格定义
4. 开发流程管理与里程碑规划
5. 供应链寻源与成本控制
6. 上市策略与定价方案

请用中文回答，保持专业、简洁、可落地。如果用户问的问题与产品开发无关，礼貌引导回主题。`
}

/**
 * 调用 DeepSeek API 分析品类趋势
 * V2: 先采集真实数据（京东/Google Trends/百度），再让AI分析
 * onProgress 回调用于实时反馈采集进度
 */
export async function analyzeTrends(category, onProgress) {
  const apiKey = getApiKey()

  // 第一步：采集真实数据
  let realData = null
  if (onProgress) onProgress('正在采集京东商品数据...')
  try {
    realData = await collectRealData(category)
    if (onProgress && realData.successCount > 0) {
      onProgress(`已采集${realData.successCount}个数据源，AI分析中...`)
    } else if (onProgress) {
      onProgress('真实数据采集失败，使用AI推理模式...')
    }
  } catch (err) {
    console.warn('真实数据采集失败:', err)
    if (onProgress) onProgress('数据采集异常，使用AI推理模式...')
  }

  // 第二步：基于真实数据构建 prompt
  const prompt = buildTrendPrompt(category, realData)

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `你是专业的电商品类趋势分析AI。${getDateContext()} 始终返回有效的JSON，不要在JSON外添加任何文字。所有平台名用中文（天猫/京东/抖音/小红书/拼多多/快手/亚马逊），所有单位用中文（亿/元/万）。${realData && realData.successCount > 0 ? '本次分析基于真实采集数据，所有结论必须引用真实数据来源。' : '本次分析基于AI推理，数据非真实平台数据。'}`
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 32768,
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })
  })

  if (!response.ok) {
    throw new Error(`API请求失败: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content

  let parsed
  try {
    parsed = JSON.parse(content)
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0])
    } else {
      throw new Error('JSON解析失败')
    }
  }

  // 将真实数据来源信息附加到返回结果
  if (realData) {
    parsed._realDataSources = realData.sources
    parsed._realDataSuccess = realData.successCount
    parsed._jdProducts = realData.jd?.products?.slice(0, 10) || []
    parsed._jdPriceDist = realData.jd?.priceDistribution || []
    parsed._jdBrands = realData.jd?.brandRanking?.slice(0, 10) || []
    parsed._realComments = (realData.comments || []).slice(0, 10).map(c => c.content)
  }

  return parsed
}

/**
 * 调用 DeepSeek API 生成创新产品概念
 */
export async function generateConcepts(category, trendData) {
  const apiKey = getApiKey()
  const prompt = buildInnoPrompt(category, trendData)

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `你是资深产品创新设计师，拥有15年消费品研发经验。${getDateContext()} 始终返回有效的JSON。所有内容用中文，禁止空字符串和null值。`
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 32768,
      temperature: 0.8,
      response_format: { type: 'json_object' }
    })
  })

  if (!response.ok) {
    throw new Error(`API请求失败: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content

  let parsed
  try {
    parsed = JSON.parse(content)
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0])
    } else {
      throw new Error('JSON解析失败')
    }
  }

  return parsed
}

/**
 * 调用 DeepSeek API 生成产品规格书
 */
export async function generateSpec(category, concept) {
  const apiKey = getApiKey()
  const prompt = buildSpecPrompt(category, concept)

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `你是资深产品规格书撰写专家。${getDateContext()} 始终返回有效的JSON。所有内容用中文，单位用中文（元/件/克/毫升）。`
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 32768,
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })
  })

  if (!response.ok) {
    throw new Error(`API请求失败: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content

  let parsed
  try {
    parsed = JSON.parse(content)
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0])
    } else {
      throw new Error('JSON解析失败')
    }
  }

  return parsed
}

/**
 * AI 对话（流式）
 */
export async function chatWithAI(category, context, messages, userMessage) {
  const apiKey = getApiKey()
  const systemPrompt = buildChatPrompt(category, context)

  const allMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({
      role: m.role,
      content: m.content
    })),
    { role: 'user', content: userMessage }
  ]

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: allMessages,
      max_tokens: 4096,
      temperature: 0.7,
      stream: true
    })
  })

  if (!response.ok) {
    throw new Error(`API请求失败: ${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let result = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value)
    const lines = chunk.split('\n')

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') continue

        try {
          const json = JSON.parse(data)
          if (json.choices?.[0]?.delta?.content) {
            result += json.choices[0].delta.content
          }
        } catch {
          // skip invalid chunks
        }
      }
    }
  }

  return result
}

/**
 * 提交查询记录到后端
 */
export async function submitRecord(category, trendData) {
  try {
    const token = localStorage.getItem('inno_token')
    if (!token) return false
    const summary = { category, trends: (trendData?.trends || []).slice(0, 3).map(t => t.keyword).join('、') }
    const res = await fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ category, result: JSON.stringify(summary) })
    })
    return res.ok
  } catch { return false }
}
