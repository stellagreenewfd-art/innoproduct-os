/**
 * 真实数据采集模块 V3 — 多平台数据源
 * 平台：京东/天猫/拼多多/抖音/小红书 + Google Trends/百度搜索
 * 通过 CORS 代理绕过跨域限制
 * 采集到的真实数据将注入 DeepSeek prompt，从"AI编数据"变为"AI分析真实数据"
 * 即使采集失败也记录状态，供数据来源面板展示
 */

// CORS 代理列表（按优先级尝试）
const CORS_PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url) => `https://thingproxy.freeboard.io/fetch/${url}`,
]

// 请求超时
const FETCH_TIMEOUT = 15000

/**
 * 通过 CORS 代理请求 URL，自动降级
 */
async function fetchWithProxy(url, asJson = false) {
  let lastError = null

  for (const proxy of CORS_PROXIES) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT)

      const response = await fetch(proxy(url), {
        signal: controller.signal,
        headers: { 'Accept': 'text/html,application/json' }
      })

      clearTimeout(timer)

      if (!response.ok) {
        lastError = new Error(`HTTP ${response.status}`)
        continue
      }

      const text = await response.text()

      // 检查是否被反爬拦截
      if (text.includes('验证码') || text.includes('captcha') || text.length < 500) {
        lastError = new Error('被反爬拦截')
        continue
      }

      if (asJson) {
        // 清理 JSONP 包裹
        const cleaned = text.replace(/^\)\]\}',?\n?/, '').trim()
        return JSON.parse(cleaned)
      }

      return text
    } catch (err) {
      lastError = err
      continue
    }
  }

  throw lastError || new Error('所有代理均失败')
}

/**
 * 京东商品搜索爬虫
 * 获取真实商品价格、品牌、店铺、评论数
 */
async function scrapeJD(keyword) {
  const searchUrl = `https://search.jd.com/Search?keyword=${encodeURIComponent(keyword)}&enc=utf-8&wq=${encodeURIComponent(keyword)}&page=1`
  const html = await fetchWithProxy(searchUrl)

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  const products = []

  // 桌面版京东搜索结果结构
  doc.querySelectorAll('.gl-item, li.gl-item').forEach(item => {
    const sku = item.getAttribute('data-sku') || ''
    const nameEl = item.querySelector('.p-name em, .p-name a em, .p-name-type-2 a em')
    const priceEl = item.querySelector('.p-price em[data-price], .p-price i')
    const shopEl = item.querySelector('.p-shop a, .p-shop span a')
    const commentEl = item.querySelector('.p-commit a, .p-commit strong a')
    const imgEl = item.querySelector('.p-img img')

    if (nameEl) {
      const name = nameEl.textContent.trim()
      const priceText = priceEl?.getAttribute('data-price') || priceEl?.textContent?.trim() || '0'
      const price = parseFloat(priceText) || 0
      const shop = shopEl?.textContent?.trim() || ''
      const commentText = commentEl?.textContent?.trim() || ''
      // 解析评论数：如 "5万+评价" → 50000
      let commentCount = 0
      const match = commentText.match(/(\d+\.?\d*)(万|千)?/)
      if (match) {
        commentCount = parseFloat(match[1])
        if (match[2] === '万') commentCount *= 10000
        if (match[2] === '千') commentCount *= 1000
      }

      if (name && price > 0) {
        products.push({ sku, name, price, shop, commentCount, commentText, imgUrl: imgEl?.getAttribute('data-lazy-img') || '' })
      }
    }
  })

  // 如果桌面版没有抓到，尝试移动版
  if (products.length === 0) {
    return await scrapeJDMobile(keyword)
  }

  return analyzeJDProducts(products, keyword)
}

/**
 * 京东移动版搜索（降级方案）
 */
async function scrapeJDMobile(keyword) {
  const searchUrl = `https://so.m.jd.com/ware/search.action?keyword=${encodeURIComponent(keyword)}&page=1&pagesize=20`
  const html = await fetchWithProxy(searchUrl)

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  const products = []

  doc.querySelectorAll('.search_p_item, .gl-item').forEach(item => {
    const nameEl = item.querySelector('.p-name em, .search_p_name, a[href*="item.m.jd.com"]')
    const priceEl = item.querySelector('.p-price i, .search_p_price')
    const shopEl = item.querySelector('.p-shop a, .search_p_shop')

    const name = nameEl?.textContent?.trim() || ''
    const priceText = priceEl?.textContent?.replace(/[^0-9.]/g, '') || '0'
    const price = parseFloat(priceText) || 0

    if (name && price > 0) {
      products.push({
        sku: '',
        name,
        price,
        shop: shopEl?.textContent?.trim() || '',
        commentCount: 0,
        commentText: '',
        imgUrl: ''
      })
    }
  })

  return analyzeJDProducts(products, keyword)
}

/**
 * 分析京东商品数据：价格分布、品牌排名
 */
function analyzeJDProducts(products, keyword) {
  if (products.length === 0) {
    return { products: [], priceDistribution: [], brandRanking: [], avgPrice: 0, total: 0 }
  }

  const prices = products.map(p => p.price).filter(p => p > 0)
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)

  // 价格带分布
  const priceBands = generatePriceBands(minPrice, maxPrice)
  const priceDistribution = priceBands.map(band => {
    const count = prices.filter(p => p >= band.min && p < band.max).length
    return {
      range: `${band.min}-${band.max}元`,
      count,
      percentage: ((count / products.length) * 100).toFixed(1)
    }
  })

  // 品牌排名（从店铺名提取）
  const brandCounts = {}
  products.forEach(p => {
    const brand = extractBrand(p.shop || p.name)
    if (brand) {
      brandCounts[brand] = (brandCounts[brand] || 0) + 1
    }
  })

  const brandRanking = Object.entries(brandCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([brand, count]) => ({
      brand,
      count,
      percentage: ((count / products.length) * 100).toFixed(1)
    }))

  // 按销量（评论数）排序
  const topSellers = [...products]
    .sort((a, b) => b.commentCount - a.commentCount)
    .slice(0, 10)
    .map(p => ({
      name: p.name.length > 50 ? p.name.substring(0, 50) + '...' : p.name,
      price: p.price,
      shop: p.shop,
      commentCount: p.commentCount
    }))

  return {
    products: products.slice(0, 30).map(p => ({
      name: p.name.length > 60 ? p.name.substring(0, 60) + '...' : p.name,
      price: p.price,
      shop: p.shop,
      commentCount: p.commentCount
    })),
    priceDistribution,
    brandRanking,
    topSellers,
    avgPrice: avgPrice.toFixed(1),
    minPrice,
    maxPrice,
    total: products.length,
    keyword
  }
}

/**
 * 生成价格带
 */
function generatePriceBands(min, max) {
  const range = max - min
  const bandSize = range / 5
  const bands = []
  for (let i = 0; i < 5; i++) {
    bands.push({
      min: Math.round(min + bandSize * i),
      max: i === 4 ? Math.round(max) + 1 : Math.round(min + bandSize * (i + 1))
    })
  }
  return bands
}

/**
 * 从店铺名或商品名中提取品牌
 */
function extractBrand(text) {
  if (!text) return ''
  // 京东自营/旗舰店品牌提取
  const patterns = [
    /(.+?)官方旗舰店/,
    /(.+?)旗舰店/,
    /(.+?)自营/,
    /(.+?)专卖店/,
    /(.+?)专营店/,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[1].trim()
  }
  // 取前2-4个字符作为品牌
  return text.substring(0, Math.min(text.length, 6)).trim()
}

/**
 * 京东评论爬虫
 * 获取真实用户评论用于痛点分析
 */
async function scrapeJDComments(skuIds) {
  const comments = []

  for (const sku of skuIds.slice(0, 5)) {
    if (!sku) continue
    try {
      const url = `https://club.jd.com/comment/productPageComments.action?productId=${sku}&score=0&sortType=5&page=0&pageSize=10&isShadowSku=0&fold=1`
      const data = await fetchWithProxy(url, true)

      if (data && data.comments) {
        data.comments.forEach(c => {
          comments.push({
            content: (c.content || '').substring(0, 200),
            score: c.score || 0,
            product: sku,
            platform: '京东',
            nickname: c.nickname || '匿名用户',
            date: c.creationTime || ''
          })
        })
      }
    } catch (err) {
      console.warn(`评论获取失败 ${sku}:`, err.message)
    }

    // 避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  return comments
}

/**
 * Google Trends 每日热搜（中国区）
 */
async function getGoogleDailyTrends() {
  try {
    const url = 'https://trends.google.com/trends/api/dailytrends?hl=zh-CN&geo=CN'
    const data = await fetchWithProxy(url, true)

    if (!data || !data.default || !data.default.trendingSearchesDays) return []

    const allTrends = []
    data.default.trendingSearchesDays.slice(0, 2).forEach(day => {
      day.trendingSearches?.forEach(t => {
        allTrends.push({
          title: t.title?.query || '',
          traffic: t.formattedTraffic || '',
          relatedQueries: (t.relatedQueries || []).slice(0, 3).map(q => q.query),
          articles: (t.articles || []).slice(0, 2).map(a => ({
            title: a.title || '',
            source: a.articleTitle || ''
          }))
        })
      })
    })

    return allTrends
  } catch (err) {
    console.warn('Google Trends 获取失败:', err.message)
    return []
  }
}

/**
 * 天猫商品搜索爬虫
 * 采集商品价格、店铺、销量信息
 */
async function scrapeTmall(keyword) {
  try {
    const searchUrl = `https://list.tmall.com/search_product.htm?q=${encodeURIComponent(keyword)}&sort=s&style=w`
    const html = await fetchWithProxy(searchUrl)
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    const products = []
    doc.querySelectorAll('.product, .product-item, [class*="product"]').forEach(item => {
      const nameEl = item.querySelector('.productTitle, .product-title, [class*="title"] a, img[alt]')
      const priceEl = item.querySelector('.productPrice, .product-price, [class*="price"]')
      const shopEl = item.querySelector('.productShop, .product-shop, [class*="shop"]')
      const salesEl = item.querySelector('.productStatus, [class*="sale"]')

      const name = nameEl?.getAttribute('alt') || nameEl?.textContent?.trim() || ''
      const priceText = priceEl?.textContent?.replace(/[^0-9.-]/g, '') || '0'
      const price = parseFloat(priceText) || 0

      if (name && price > 0) {
        products.push({
          name: name.length > 60 ? name.substring(0, 60) + '...' : name,
          price,
          shop: shopEl?.textContent?.trim() || '',
          sales: salesEl?.textContent?.trim() || '',
          platform: '天猫'
        })
      }
    })

    if (products.length > 0) {
      return analyzeJDProducts(products, keyword)
    }
    return { products: [], priceDistribution: [], brandRanking: [], avgPrice: 0, total: 0 }
  } catch (err) {
    throw err
  }
}

/**
 * 拼多多商品搜索爬虫
 */
async function scrapePinduoduo(keyword) {
  try {
    const searchUrl = `https://mobile.yangkeduo.com/search_result.html?search_key=${encodeURIComponent(keyword)}`
    const html = await fetchWithProxy(searchUrl)
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    const products = []
    doc.querySelectorAll('.goods-item, [class*="goods"]').forEach(item => {
      const nameEl = item.querySelector('.goods-name, [class*="title"], [class*="name"]')
      const priceEl = item.querySelector('.goods-price, [class*="price"]')
      const salesEl = item.querySelector('.goods-sales, [class*="sales"], [class*="sold"]')

      const name = nameEl?.textContent?.trim() || ''
      const priceText = priceEl?.textContent?.replace(/[^0-9.]/g, '') || '0'
      const price = parseFloat(priceText) / 100 // 拼多多价格通常以分为单位
      const adjustedPrice = price < 1 ? parseFloat(priceText) : price

      if (name && adjustedPrice > 0) {
        products.push({
          name: name.length > 60 ? name.substring(0, 60) + '...' : name,
          price: adjustedPrice,
          shop: '',
          sales: salesEl?.textContent?.trim() || '',
          platform: '拼多多'
        })
      }
    })

    if (products.length > 0) {
      return analyzeJDProducts(products, keyword)
    }
    return { products: [], priceDistribution: [], brandRanking: [], avgPrice: 0, total: 0 }
  } catch (err) {
    throw err
  }
}

/**
 * 抖音商品/话题搜索（尽力而为，以HTML文本提取为主）
 * 抖音搜索高度依赖JS渲染，大概率采集失败
 */
async function scrapeDouyin(keyword) {
  try {
    const searchUrl = `https://www.douyin.com/search/${encodeURIComponent(keyword)}?type=general`
    const html = await fetchWithProxy(searchUrl)

    // 抖音页面重度依赖JS，尝试从HTML中提取结构化数据
    // 查找 window._ROUTER_DATA 或 __NEXT_DATA__ 等SSR数据
    const jsonMatch = html.match(/<script id="RENDER_DATA" type="application\/json">([^<]+)<\/script>/)
    if (jsonMatch) {
      const decoded = decodeURIComponent(jsonMatch[1])
      const data = JSON.parse(decoded)
      // 尝试提取搜索结果
      const items = data?.app?.searchResult?.items || []
      const searches = items.slice(0, 20).map(item => ({
        title: item?.word_record?.word || item?.aweme_info?.desc || '',
        hotValue: item?.word_record?.hot_value || 0
      })).filter(i => i.title)

      if (searches.length > 0) {
        return { searches, total: searches.length, source: '抖音搜索' }
      }
    }

    // 降级：尝试提取页面文本摘要
    const textContent = html.replace(/<[^>]+>/g, ' ').substring(0, 5000)
    const keywords = extractKeywords(textContent, keyword)
    return { searches: keywords.slice(0, 15).map(k => ({ title: k, hotValue: 0 })), total: keywords.length, source: '抖音搜索(文本提取)' }
  } catch (err) {
    throw err
  }
}

/**
 * 小红书笔记搜索（尽力而为）
 * 小红书强反爬+登录墙，大概率采集失败
 */
async function scrapeXiaohongshu(keyword) {
  try {
    const searchUrl = `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}&source=web_search_result_notes`
    const html = await fetchWithProxy(searchUrl)

    // 尝试提取 __INITIAL_STATE__ SSR数据
    const stateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({.+?})\s*<\/script>/s)
    if (stateMatch) {
      try {
        const stateData = JSON.parse(stateMatch[1].replace(/undefined/g, 'null'))
        const notes = stateData?.search?.notes || stateData?.note?.noteList || []
        const searches = notes.slice(0, 20).map(n => ({
          title: n.title || n.displayTitle || n.desc || '',
          likes: n.likedCount || n.likes || 0,
          type: n.type || '笔记'
        }))
        if (searches.length > 0) {
          return { searches, total: searches.length, source: '小红书搜索' }
        }
      } catch (e) { /* SSR parse failed */ }
    }

    // 降级：提取页面文本
    const textContent = html.replace(/<[^>]+>/g, ' ').substring(0, 5000)
    const keywords = extractKeywords(textContent, keyword)
    return { searches: keywords.slice(0, 15).map(k => ({ title: k, likes: 0, type: '文本提取' })), total: keywords.length, source: '小红书搜索(文本提取)' }
  } catch (err) {
    throw err
  }
}

/**
 * 从文本中提取品类相关关键词（降级方案）
 */
function extractKeywords(text, keyword) {
  const words = text.split(/[\s,，。！？、；：""''【】（）\(\)\[\]]+/)
    .filter(w => w.length >= 2 && w.length <= 20)
    .filter(w => !['的', '了', '是', '在', '和', '与', '或', '不', '都', '也', '很', '就', '要', '会', '能'].includes(w))
  const unique = [...new Set(words)]
  return unique
}

/**
 * 百度热搜（通过百度搜索页面提取）
 */
async function getBaiduHotSearch(keyword) {
  try {
    const url = `https://www.baidu.com/s?wd=${encodeURIComponent(keyword)}&rn=20`
    const html = await fetchWithProxy(url)

    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    const results = []
    doc.querySelectorAll('.result, .c-container').forEach(item => {
      const titleEl = item.querySelector('h3 a, .t a')
      const abstractEl = item.querySelector('.c-abstract, [class*="content-right"]')

      if (titleEl) {
        results.push({
          title: titleEl.textContent.trim().substring(0, 100),
          abstract: abstractEl?.textContent?.trim()?.substring(0, 200) || ''
        })
      }
    })

    return results.slice(0, 15)
  } catch (err) {
    console.warn('百度搜索获取失败:', err.message)
    return []
  }
}

/**
 * 主采集函数 — 并行采集所有平台数据源
 * 京东/天猫/拼多多/抖音/小红书 + Google Trends + 百度
 */
export async function collectRealData(category) {
  const sources = []
  const realData = {
    category,
    timestamp: new Date().toISOString()
  }

  // 并行采集：电商平台 + 趋势数据
  const [jdResult, tmallResult, pddResult, dyResult, xhsResult, trendsResult, baiduResult] = await Promise.allSettled([
    scrapeJD(category),
    scrapeTmall(category),
    scrapePinduoduo(category),
    scrapeDouyin(category),
    scrapeXiaohongshu(category),
    getGoogleDailyTrends(),
    getBaiduHotSearch(category)
  ])

  // 处理京东
  processProductSource('京东搜索', jdResult, realData, sources, category)

  // 处理天猫
  processProductSource('天猫搜索', tmallResult, realData, sources, category, 'tmall')

  // 处理拼多多
  processProductSource('拼多多搜索', pddResult, realData, sources, category, 'pdd')

  // 处理抖音（非商品数据，是趋势/话题数据）
  processTrendSource('抖音趋势', dyResult, realData, sources, 'dyTrends')

  // 处理小红书（非商品数据）
  processTrendSource('小红书趋势', xhsResult, realData, sources, 'xhsTrends')

  // 处理 Google Trends
  processTrendSource('Google Trends', trendsResult, realData, sources, 'googleTrends')

  // 处理百度搜索
  processSearchSource('百度搜索', baiduResult, realData, sources, 'baiduSearch')

  realData.sources = sources
  realData.successCount = sources.filter(s => s.status === 'success').length

  // 如果京东有数据，获取评论
  if (realData.jd && realData.jd.total > 0) {
    const topSkus = realData.jd.products
      .slice(0, 5)
      .map(p => p.sku)
      .filter(Boolean)

    if (topSkus.length > 0) {
      try {
        const comments = await scrapeJDComments(topSkus)
        if (comments.length > 0) {
          realData.comments = comments
          sources.push({
            name: '京东评论',
            status: 'success',
            count: comments.length,
            detail: `${comments.length}条真实用户评论`
          })
        }
      } catch (err) {
        sources.push({ name: '京东评论', status: 'failed', detail: err.message })
      }
    }
  }

  return realData
}

/**
 * 处理商品类数据源（京东/天猫/拼多多）
 */
function processProductSource(name, result, realData, sources, category, key) {
  if (result.status === 'fulfilled' && result.value && result.value.total > 0) {
    const data = result.value
    const dataKey = key || (name.includes('京东') ? 'jd' : name.includes('天猫') ? 'tmall' : 'pdd')
    realData[dataKey] = data
    sources.push({
      name,
      status: 'success',
      count: data.total,
      detail: `${data.total}个商品，价格¥${data.minPrice}-¥${data.maxPrice}`
    })
  } else {
    sources.push({
      name,
      status: 'failed',
      detail: result.reason?.message || '未采集到商品数据'
    })
  }
}

/**
 * 处理趋势类数据源（Google Trends/抖音/小红书）
 */
function processTrendSource(name, result, realData, sources, key) {
  if (result.status === 'fulfilled' && result.value && result.value.total > 0) {
    realData[key] = result.value
    sources.push({
      name,
      status: 'success',
      count: result.value.total,
      detail: `${result.value.total}条趋势数据`
    })
  } else {
    sources.push({
      name,
      status: 'failed',
      detail: result.reason?.message || '获取失败'
    })
  }
}

/**
 * 处理搜索类数据源（百度）
 */
function processSearchSource(name, result, realData, sources, key) {
  if (result.status === 'fulfilled' && result.value && result.value.length > 0) {
    realData[key] = result.value
    sources.push({
      name,
      status: 'success',
      count: result.value.length,
      detail: `${result.value.length}条搜索结果`
    })
  } else {
    sources.push({
      name,
      status: 'failed',
      detail: result.reason?.message || '获取失败'
    })
  }
}

/**
 * 将真实数据格式化为 prompt 上下文（多平台版本）
 */
export function formatRealDataForPrompt(realData) {
  if (!realData) return ''

  const parts = []

  // 京东商品数据
  if (realData.jd && realData.jd.total > 0) {
    appendProductData(parts, '京东', realData.jd)
  }

  // 天猫商品数据
  if (realData.tmall && realData.tmall.total > 0) {
    appendProductData(parts, '天猫', realData.tmall)
  }

  // 拼多多商品数据
  if (realData.pdd && realData.pdd.total > 0) {
    appendProductData(parts, '拼多多', realData.pdd)
  }

  // 京东评论
  if (realData.comments && realData.comments.length > 0) {
    parts.push(`\n## 京东真实用户评论（${realData.comments.length}条）`)
    realData.comments.slice(0, 30).forEach((c, i) => {
      parts.push(`  ${i + 1}. [评分${c.score}/5] "${c.content}"`)
    })
  }

  // 抖音趋势
  if (realData.dyTrends && realData.dyTrends.total > 0) {
    parts.push(`\n## 抖音趋势数据（${realData.dyTrends.total}条）`)
    realData.dyTrends.searches?.slice(0, 15).forEach((s, i) => {
      parts.push(`  ${i + 1}. ${s.title}${s.hotValue ? ` (热度:${s.hotValue})` : ''}`)
    })
  }

  // 小红书趋势
  if (realData.xhsTrends && realData.xhsTrends.total > 0) {
    parts.push(`\n## 小红书趋势数据（${realData.xhsTrends.total}条）`)
    realData.xhsTrends.searches?.slice(0, 15).forEach((s, i) => {
      parts.push(`  ${i + 1}. ${s.title}${s.likes ? ` (点赞:${s.likes})` : ''}`)
    })
  }

  // Google Trends
  if (realData.googleTrends && realData.googleTrends.length > 0) {
    parts.push(`\n## Google Trends 中国区热搜趋势`)
    realData.googleTrends.slice(0, 15).forEach((t, i) => {
      parts.push(`  ${i + 1}. ${t.title} (热度:${t.traffic})`)
    })
  }

  // 百度搜索结果
  if (realData.baiduSearch && realData.baiduSearch.length > 0) {
    parts.push(`\n## 百度搜索结果摘要`)
    realData.baiduSearch.slice(0, 10).forEach((r, i) => {
      parts.push(`  ${i + 1}. ${r.title}`)
    })
  }

  // 数据采集状态总览
  if (realData.sources) {
    parts.push(`\n## 数据采集状态总览`)
    realData.sources.forEach(s => {
      parts.push(`  ${s.status === 'success' ? '✓' : '✗'} ${s.name}: ${s.detail || s.status}`)
    })
  }

  return parts.join('\n')
}

function appendProductData(parts, platform, data) {
  parts.push(`\n## ${platform}真实商品数据（抓取${data.total}个商品）`)
  parts.push(`- 平均价格: ${data.avgPrice}元`)
  parts.push(`- 价格区间: ${data.minPrice}-${data.maxPrice}元`)
  if (data.priceDistribution?.length > 0) {
    parts.push(`\n### 价格带分布`)
    data.priceDistribution.forEach(p => {
      parts.push(`  - ${p.range}: ${p.count}个商品 (${p.percentage}%)`)
    })
  }
  if (data.brandRanking?.length > 0) {
    parts.push(`\n### 品牌排名`)
    data.brandRanking.slice(0, 10).forEach((b, i) => {
      parts.push(`  ${i + 1}. ${b.brand}: ${b.count}个 (${b.percentage}%)`)
    })
  }
  if (data.topSellers?.length > 0) {
    parts.push(`\n### 热销商品TOP5`)
    data.topSellers.slice(0, 5).forEach((p, i) => {
      parts.push(`  ${i + 1}. ${p.name} | 价格:${p.price}元 | 评论:${p.commentCount > 0 ? p.commentCount : 'N/A'} | 店铺:${p.shop}`)
    })
  }
}

/**
 * 检查是否有真实数据
 */
export function hasRealData(realData) {
  return realData && realData.successCount > 0
}
