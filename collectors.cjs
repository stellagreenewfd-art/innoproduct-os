/**
 * 服务端真实数据采集器 — 创品智造 Pro
 * 在服务端直接请求各平台公开接口，不经过浏览器 CORS 代理，成功率大幅提升。
 * 已实测可用的数据源：
 *   - 淘宝搜索联想词（真实搜索需求词 + 热度）
 *   - 抖音热榜（全站热词 + 热度值）
 *   - 百度热搜（实时热点）
 *   - B站热搜（年轻人群内容风向）
 *   - 今日头条热榜
 *   - 京东桌面搜索（尽力而为，反爬严格，成功时提供真实价格/品牌/评论数）
 * 每个数据源都记录成功/失败状态，前端透明展示。
 */
const https = require('https')
const http = require('http')

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
const TIMEOUT = 12000

function fetchText(url, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    let parsed
    try { parsed = new URL(url) } catch { return reject(new Error('bad url')) }
    const lib = parsed.protocol === 'http:' ? http : https
    const req = lib.get(url, {
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/json,*/*',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        ...extraHeaders
      },
      timeout: TIMEOUT
    }, res => {
      // follow one redirect
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        res.resume()
        const next = res.headers.location.startsWith('http')
          ? res.headers.location
          : parsed.origin + res.headers.location
        return fetchText(next, extraHeaders).then(resolve, reject)
      }
      if (res.statusCode !== 200) {
        res.resume()
        return reject(new Error('HTTP ' + res.statusCode))
      }
      let body = ''
      res.setEncoding('utf-8')
      res.on('data', c => { body += c; if (body.length > 2_000_000) req.destroy() })
      res.on('end', () => resolve(body))
      res.on('error', reject)
    })
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')) })
    req.on('error', reject)
  })
}

/** 淘宝搜索联想 — 真实搜索需求词，含热度权重 */
async function collectTaobaoSuggest(keyword) {
  const url = `https://suggest.taobao.com/sug?code=utf-8&q=${encodeURIComponent(keyword)}&callback=cb`
  const text = await fetchText(url, { Referer: 'https://www.taobao.com/' })
  const m = text.match(/cb\((.*)\)\s*$/s)
  if (!m) throw new Error('返回格式异常')
  const data = JSON.parse(m[1])
  const list = (data.result || []).map(([word, heat]) => ({ word, heat: Number(heat) || 0 }))
  if (!list.length) throw new Error('无联想词')
  return { suggests: list.slice(0, 20), total: list.length }
}

/** 抖音热榜 — 全站实时热词 */
async function collectDouyinHot() {
  const url = 'https://www.iesdouyin.com/web/api/v2/hotsearch/billboard/word/'
  const text = await fetchText(url)
  const data = JSON.parse(text)
  const list = (data.word_list || []).map(w => ({ word: w.word, hotValue: w.hot_value || 0 }))
  if (!list.length) throw new Error('无热榜数据')
  return { hotWords: list.slice(0, 40), total: list.length, activeTime: data.active_time }
}

/** 百度热搜 — 实时热点（页面内嵌 JSON，正则提取） */
async function collectBaiduHot() {
  const url = 'https://top.baidu.com/board?tab=realtime'
  const html = await fetchText(url)
  const words = []
  const re = /"word":"((?:[^"\\]|\\.)*)"/g
  let m
  while ((m = re.exec(html)) && words.length < 40) {
    try {
      const w = JSON.parse(`"${m[1]}"`)
      if (w && !words.includes(w)) words.push(w)
    } catch { /* skip */ }
  }
  if (!words.length) throw new Error('未解析到热搜词')
  return { hotWords: words.map(w => ({ word: w })), total: words.length }
}

/** B站热搜 — 年轻人群内容风向 */
async function collectBilibiliHot() {
  const url = 'https://api.bilibili.com/x/web-interface/wbi/search/square?limit=20'
  const text = await fetchText(url, { Referer: 'https://www.bilibili.com/' })
  const data = JSON.parse(text)
  const list = (data?.data?.trending?.list || []).map(i => ({ word: i.keyword || i.show_name, heat: i.heat_score || 0 }))
  if (!list.length) throw new Error('无热搜数据')
  return { hotWords: list.slice(0, 20), total: list.length }
}

/** 今日头条热榜 */
async function collectToutiaoHot() {
  const url = 'https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc'
  const text = await fetchText(url)
  const data = JSON.parse(text)
  const list = (data.data || []).map(i => ({ word: i.Title, heat: i.HotValue || 0 }))
  if (!list.length) throw new Error('无热榜数据')
  return { hotWords: list.slice(0, 30), total: list.length }
}

/** 京东桌面搜索 — 尽力而为（反爬严格，间歇性可用）。成功时返回真实商品/价格带/品牌 */
async function collectJD(keyword) {
  const url = `https://search.jd.com/Search?keyword=${encodeURIComponent(keyword)}&enc=utf-8&wq=${encodeURIComponent(keyword)}`
  const html = await fetchText(url, { Cookie: 'areaId=1; ipLoc-djd=1-72-2799-0' })
  if (html.length < 20000) throw new Error('被反爬拦截（页面过短）')

  const products = []
  // 匹配商品块：data-sku + 名称 + 价格
  const itemRe = /data-sku="(\d+)"[\s\S]{0,3000}?p-name[^>]*>[\s\S]{0,200}?<em>([\s\S]{0,300}?)<\/em>[\s\S]{0,2000}?p-price[\s\S]{0,400}?<i>([\d.]+)<\/i>/g
  let m
  while ((m = itemRe.exec(html)) && products.length < 40) {
    const name = m[2].replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ').trim()
    const price = parseFloat(m[3])
    if (name && price > 0) products.push({ sku: m[1], name: name.slice(0, 60), price })
  }
  if (!products.length) throw new Error('页面无商品数据（需JS渲染）')

  const prices = products.map(p => p.price)
  const min = Math.min(...prices), max = Math.max(...prices)
  const avg = (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(1)
  const bandSize = (max - min) / 5 || 1
  const priceDistribution = []
  for (let i = 0; i < 5; i++) {
    const lo = Math.round(min + bandSize * i)
    const hi = i === 4 ? Math.round(max) + 1 : Math.round(min + bandSize * (i + 1))
    const count = prices.filter(p => p >= lo && p < hi).length
    priceDistribution.push({ range: `${lo}-${hi}元`, count, percentage: ((count / products.length) * 100).toFixed(1) })
  }
  return { products: products.slice(0, 30), priceDistribution, avgPrice: avg, minPrice: min, maxPrice: max, total: products.length }
}

/** 京东评论 — 尽力而为，依赖 collectJD 提供的 SKU */
async function collectJDComments(skus) {
  const comments = []
  for (const sku of skus.slice(0, 3)) {
    try {
      const url = `https://club.jd.com/comment/productPageComments.action?productId=${sku}&score=0&sortType=5&page=0&pageSize=10&isShadowSku=0&fold=1`
      const text = await fetchText(url, { Referer: `https://item.jd.com/${sku}.html` })
      const data = JSON.parse(text)
      for (const c of (data.comments || []).slice(0, 8)) {
        comments.push({ content: String(c.content || '').slice(0, 200), score: c.score || 0, sku })
      }
    } catch { /* 单SKU失败不影响整体 */ }
    await new Promise(r => setTimeout(r, 400))
  }
  if (!comments.length) throw new Error('未获取到评论')
  return { comments, total: comments.length }
}

/**
 * 主采集函数：并行采集全部数据源
 */
async function collectAll(category) {
  const t0 = Date.now()
  const result = { category, timestamp: new Date().toISOString(), sources: [] }

  const [taobao, douyin, baidu, bilibili, toutiao, jd] = await Promise.allSettled([
    collectTaobaoSuggest(category),
    collectDouyinHot(),
    collectBaiduHot(),
    collectBilibiliHot(),
    collectToutiaoHot(),
    collectJD(category),
  ])

  const wrap = (name, settled, key, describe) => {
    if (settled.status === 'fulfilled' && settled.value) {
      if (key) result[key] = settled.value
      result.sources.push({ name, status: 'success', count: settled.value.total || 0, detail: describe(settled.value) })
    } else {
      result.sources.push({ name, status: 'failed', count: 0, detail: settled.reason?.message || '获取失败' })
    }
  }

  wrap('淘宝搜索联想', taobao, 'taobao', v => `${v.total}个真实搜索词（含热度）`)
  wrap('抖音热榜', douyin, 'douyin', v => `${v.total}个全站热词（${v.activeTime || ''}）`)
  wrap('百度热搜', baidu, 'baidu', v => `${v.total}个实时热搜`)
  wrap('B站热搜', bilibili, 'bilibili', v => `${v.total}个热搜词`)
  wrap('头条热榜', toutiao, 'toutiao', v => `${v.total}个热点事件`)
  wrap('京东商品搜索', jd, 'jd', v => `${v.total}个商品，价格¥${v.minPrice}-¥${v.maxPrice}，均价¥${v.avgPrice}`)

  // 京东评论依赖京东搜索结果
  if (result.jd?.products?.length) {
    try {
      const c = await collectJDComments(result.jd.products.map(p => p.sku).filter(Boolean))
      result.jdComments = c
      result.sources.push({ name: '京东真实评论', status: 'success', count: c.total, detail: `${c.total}条真实用户评论` })
    } catch (e) {
      result.sources.push({ name: '京东真实评论', status: 'failed', count: 0, detail: e.message })
    }
  } else {
    result.sources.push({ name: '京东真实评论', status: 'failed', count: 0, detail: '无可用商品SKU' })
  }

  result.successCount = result.sources.filter(s => s.status === 'success').length
  result.elapsedMs = Date.now() - t0
  return result
}

/** 将采集结果格式化为 Prompt 上下文 */
function formatForPrompt(data) {
  if (!data) return ''
  const parts = []
  if (data.taobao?.suggests?.length) {
    parts.push(`## 淘宝真实搜索联想词（用户真实搜索需求，按热度排序）`)
    data.taobao.suggests.forEach((s, i) => parts.push(`  ${i + 1}. ${s.word}`))
  }
  if (data.jd?.products?.length) {
    parts.push(`\n## 京东真实商品数据（${data.jd.total}个在售商品）`)
    parts.push(`- 均价 ¥${data.jd.avgPrice}，价格区间 ¥${data.jd.minPrice}-¥${data.jd.maxPrice}`)
    if (data.jd.priceDistribution?.length) {
      parts.push(`- 价格带分布：${data.jd.priceDistribution.map(p => `${p.range}(${p.percentage}%)`).join('、')}`)
    }
    parts.push(`- 在售商品示例：`)
    data.jd.products.slice(0, 12).forEach((p, i) => parts.push(`  ${i + 1}. ${p.name} — ¥${p.price}`))
  }
  if (data.jdComments?.comments?.length) {
    parts.push(`\n## 京东真实用户评论（${data.jdComments.total}条）`)
    data.jdComments.comments.slice(0, 20).forEach((c, i) => parts.push(`  ${i + 1}. [${c.score}星] "${c.content}"`))
  }
  if (data.douyin?.hotWords?.length) {
    parts.push(`\n## 抖音全站热榜 TOP20（内容消费风向标，提取与品类相关的消费情绪）`)
    data.douyin.hotWords.slice(0, 20).forEach((w, i) => parts.push(`  ${i + 1}. ${w.word}（热度${w.hotValue}）`))
  }
  if (data.bilibili?.hotWords?.length) {
    parts.push(`\n## B站热搜 TOP15（年轻人群内容风向）`)
    data.bilibili.hotWords.slice(0, 15).forEach((w, i) => parts.push(`  ${i + 1}. ${w.word}`))
  }
  if (data.baidu?.hotWords?.length) {
    parts.push(`\n## 百度实时热搜 TOP15（大众关注焦点）`)
    data.baidu.hotWords.slice(0, 15).forEach((w, i) => parts.push(`  ${i + 1}. ${w.word}`))
  }
  if (data.toutiao?.hotWords?.length) {
    parts.push(`\n## 今日头条热榜 TOP10`)
    data.toutiao.hotWords.slice(0, 10).forEach((w, i) => parts.push(`  ${i + 1}. ${w.word}`))
  }
  parts.push(`\n## 采集状态`)
  data.sources.forEach(s => parts.push(`  ${s.status === 'success' ? '✓' : '✗'} ${s.name}: ${s.detail}`))
  return parts.join('\n')
}

module.exports = { collectAll, formatForPrompt }
