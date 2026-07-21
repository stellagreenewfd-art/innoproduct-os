import { useApp } from '../contexts/AppContext'
import { generateConcepts } from '../utils/api'
import { defaultTrendData, defaultConcepts } from '../utils/defaultData'
import { useState } from 'react'

export default function TrendRadar() {
  const { category, trendData, loading, error, setConcepts, setActiveModule, setLoading, setError } = useApp()
  const [showRealData, setShowRealData] = useState(false)

  const data = trendData || defaultTrendData

  // 判断数据来源
  const isRealData = data.dataSource?.isRealData || data._realDataSuccess > 0
  const realSources = data._realDataSources || data.dataSource?.realSources || []
  const jdProducts = data._jdProducts || []
  const jdBrands = data._jdBrands || []
  const realComments = data._realComments || []

  const handleGenerateConcepts = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await generateConcepts(category, data)
      setConcepts(result)
      setActiveModule('innolab')
    } catch (err) {
      console.error('概念生成失败:', err)
      setError('AI生成失败，已加载示例概念。')
      setConcepts(defaultConcepts)
      setActiveModule('innolab')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !trendData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="ip-loading mx-auto mb-4" style={{ width: 32, height: 32 }}></div>
          <p className="text-ip-text-secondary">正在采集真实数据并分析...</p>
          <p className="text-xs text-ip-text-tertiary mt-2">正在采集数据：京东 · 天猫 · 拼多多 · 抖音 · 小红书 · Google · 百度</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 ip-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ip-text">趋势雷达 — {data.category || category}</h2>
          <p className="text-sm text-ip-text-tertiary">扫描日期: {data.scanDate || '2026-07-03'}</p>
        </div>
        <button onClick={handleGenerateConcepts} disabled={loading} className="ip-btn-primary">
          {loading ? <span className="ip-loading"></span> : '生成创新产品概念 →'}
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-ip-warning-light text-ip-warning text-sm">{error}</div>
      )}

      {/* 多平台数据来源总览 — 仅展示成功采集的平台 */}
      {(() => {
        const allPlatforms = [
          { name: '京东搜索', key: 'jd', type: 'product' },
          { name: '京东评论', key: 'comments', type: 'comment' },
          { name: '天猫搜索', key: 'tmall', type: 'product' },
          { name: '拼多多搜索', key: 'pdd', type: 'product' },
          { name: '抖音趋势', key: 'dyTrends', type: 'trend' },
          { name: '小红书趋势', key: 'xhsTrends', type: 'trend' },
          { name: 'Google Trends', key: 'googleTrends', type: 'trend' },
          { name: '百度搜索', key: 'baiduSearch', type: 'search' },
        ]
        const platformStats = data.dataSource?.platformStats || []

        const successfulPlatforms = allPlatforms.filter(p => {
          const stat = platformStats.find(s => (typeof s === 'object' ? s.name === p.name : s === p.name))
          return stat && typeof stat === 'object' && stat.status === 'success'
        }).map(p => {
          const stat = platformStats.find(s => (typeof s === 'object' ? s.name === p.name : s === p.name))
          return { ...p, detail: stat.detail || '', count: stat.count || 0 }
        })

        if (successfulPlatforms.length === 0) return null

        return (
          <div className="ip-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-ip-text">数据来源</h3>
              <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">
                {successfulPlatforms.length} 平台采集成功
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-ip-border">
                    <th className="text-left p-2 text-ip-text-tertiary font-medium">平台</th>
                    <th className="text-left p-2 text-ip-text-tertiary font-medium">采集详情</th>
                  </tr>
                </thead>
                <tbody>
                  {successfulPlatforms.map((p, i) => (
                    <tr key={i} className="border-b border-ip-border last:border-0">
                      <td className="p-2 font-medium text-ip-text">✓ {p.name}</td>
                      <td className="p-2 text-ip-text-tertiary">{p.detail || `${p.count}条数据`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 p-2 rounded bg-ip-bg text-xs text-ip-text-tertiary">
              采集数据已注入AI分析。每条趋势/痛点均标注来源平台与推测依据。
            </div>

            {/* 原始数据展开 */}
            {showRealData && (
              <div className="mt-3 space-y-3">
                {jdProducts.length > 0 && (
                  <div className="bg-white rounded-lg p-3 border border-green-100">
                    <h4 className="text-xs font-semibold text-green-700 mb-2">京东真实商品（前{jdProducts.length}个）</h4>
                    <div className="space-y-1">
                      {jdProducts.map((p, i) => (
                        <div key={i} className="flex items-center justify-between text-xs text-gray-600">
                          <span className="flex-1 truncate">{p.name}</span>
                          <span className="ml-2 font-medium text-green-700">¥{p.price}</span>
                          {p.commentCount > 0 && <span className="ml-2 text-gray-400">{p.commentCount > 999 ? `${(p.commentCount / 1000).toFixed(0)}k` : p.commentCount}评</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {jdBrands.length > 0 && (
                  <div className="bg-white rounded-lg p-3 border border-green-100">
                    <h4 className="text-xs font-semibold text-green-700 mb-2">品牌分布（京东真实数据）</h4>
                    <div className="flex flex-wrap gap-1">
                      {jdBrands.map((b, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded bg-green-50 text-green-700">
                          {b.brand} {b.percentage}%
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {realComments.length > 0 && (
                  <div className="bg-white rounded-lg p-3 border border-green-100">
                    <h4 className="text-xs font-semibold text-green-700 mb-2">京东真实用户评论（前{realComments.length}条）</h4>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {realComments.map((c, i) => (
                        <p key={i} className="text-xs text-gray-600 italic border-l-2 border-green-300 pl-2">"{c}"</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <button onClick={() => setShowRealData(!showRealData)} className="mt-3 text-xs text-ip-primary hover:underline">
              {showRealData ? '收起原始数据' : '展开原始采集数据'}
            </button>
          </div>
        )
      })()}

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '品类总GMV', key: 'totalGMV', fallback: '382.6亿' },
          { label: 'GMV增速', key: 'gmvGrowth', fallback: '+11.2%' },
          { label: '品牌数', key: 'brandCount', fallback: '4,200+' },
          { label: '头部集中度', key: 'topBrandShare', fallback: '28.5%' },
        ].map((m, i) => (
          <div key={i} className="bg-ip-surface border border-ip-border rounded-lg p-3 text-center">
            <p className="text-xs text-ip-text-tertiary mb-1">{m.label}</p>
            <p className="text-base font-semibold text-ip-text">{data.metrics?.[m.key] || m.fallback}</p>
            {data.metrics?.[`${m.key}_source`] && (
              <p className="text-xs text-ip-text-tertiary mt-0.5 truncate">{data.metrics[`${m.key}_source`]}</p>
            )}
          </div>
        ))}
      </div>

      {/* Trends */}
      <div className="ip-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-ip-text">热门趋势关键词 TOP7</h3>
        </div>
        <div className="space-y-2">
          {(data.trends || []).map((t, i) => (
            <div key={i} className="flex items-center gap-4 py-2 border-b border-ip-border last:border-0">
              <div className="w-6 h-6 rounded-full bg-ip-primary-light flex items-center justify-center text-xs font-semibold text-ip-primary">
                {t.rank}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-ip-text">{t.keyword}</span>
                  <span className="ip-tag bg-ip-success-light text-ip-success">YoY +{t.yoy}%</span>
                  <span className="ip-tag bg-ip-bg text-ip-text-tertiary">{t.platform}</span>
                  {t.dataFromReal ? (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-600">真实采集</span>
                  ) : (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700" title={t.inferenceBasis || ''}>
                      AI推测
                    </span>
                  )}
                  {t.sourcePlatform && (
                    <span className="text-xs text-ip-text-tertiary">{t.sourcePlatform}</span>
                  )}
                </div>
                <p className="text-xs text-ip-text-secondary mt-0.5">{t.summary}</p>
                <p className="text-xs text-ip-text-tertiary italic mt-0.5">
                  {t.dataFromReal ? '✓ ' : '▲ '}{t.verbatim}
                </p>
                {t.inferenceBasis && !t.dataFromReal && (
                  <p className="text-xs text-amber-600 mt-0.5">推测依据：{t.inferenceBasis}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="w-20 h-1.5 bg-ip-bg rounded-full overflow-hidden">
                  <div className="h-full bg-ip-primary rounded-full" style={{ width: `${Math.min(t.share, 100)}%` }}></div>
                </div>
                <p className="text-xs text-ip-text-tertiary mt-1">占比{t.share}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pain Points */}
      <div className="ip-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-ip-text">用户痛点热力图 — 需求缺口排序</h3>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {(data.painPoints || []).map((p, i) => (
            <div key={i} className="border border-ip-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-ip-text-tertiary">#{p.rank}</span>
                  <span className="text-sm font-medium text-ip-text">{p.pain}</span>
                  {p.dataFromReal ? (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-600">真实评论</span>
                  ) : (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700" title={p.inferenceBasis || ''}>
                      AI推测
                    </span>
                  )}
                  {p.sourcePlatform && (
                    <span className="text-xs text-ip-text-tertiary">{p.sourcePlatform}</span>
                  )}
                </div>
                <span className={`ip-tag ${p.gap >= 70 ? 'bg-ip-danger-light text-ip-danger' : p.gap >= 50 ? 'bg-ip-warning-light text-ip-warning' : 'bg-ip-bg text-ip-text-tertiary'}`}>
                  缺口评分 {p.gap}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-ip-text-secondary mb-2">
                <span>需求强度: <strong className="text-ip-text">{p.intensity}</strong></span>
                <span>满足程度: <strong className="text-ip-text">{p.satisfaction}</strong></span>
              </div>
              <div className="flex gap-2 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-xs text-ip-text-tertiary">需求</span>
                  </div>
                  <div className="w-full h-2 bg-ip-bg rounded-full overflow-hidden">
                    <div className="h-full bg-ip-danger rounded-full" style={{ width: `${p.intensity}%` }}></div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-xs text-ip-text-tertiary">满足</span>
                  </div>
                  <div className="w-full h-2 bg-ip-bg rounded-full overflow-hidden">
                    <div className="h-full bg-ip-success rounded-full" style={{ width: `${p.satisfaction}%` }}></div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-ip-text-tertiary italic">
                {p.dataFromReal ? '✓ 真实用户原声: ' : '▲ AI推测原声: '}"{p.userVoice}"
              </p>
              {p.inferenceBasis && !p.dataFromReal && (
                <p className="text-xs text-amber-600 mt-0.5">推测依据：{p.inferenceBasis}</p>
              )}
              {p.opportunity && (
                <div className="mt-2 p-2 rounded bg-ip-primary-light text-xs text-ip-primary">
                  <strong>创新机会:</strong> {p.opportunity}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Opportunities */}
      <div className="ip-card p-5">
        <h3 className="text-sm font-semibold text-ip-text mb-4">创新机会评分卡 TOP5</h3>
        <div className="space-y-3">
          {(data.opportunities || []).map((o, i) => (
            <div key={i} className="flex items-start gap-3 p-3 border border-ip-border rounded-lg">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${o.score >= 85 ? 'bg-green-100 text-green-700' : o.score >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                {o.score}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h4 className="text-sm font-medium text-ip-text">{o.title}</h4>
                  {o.sourcePlatform && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-ip-bg text-ip-text-tertiary">
                      {o.sourcePlatform}
                    </span>
                  )}
                </div>
                <p className="text-xs text-ip-text-secondary mt-1">{o.rationale}</p>
                {o.inferenceBasis && (
                  <p className="text-xs text-amber-600 mt-0.5">推测依据：{o.inferenceBasis}</p>
                )}
                <div className="flex gap-3 mt-2 text-xs">
                  <span className="text-ip-text-tertiary">趋势: {o.trendSignal}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="flex justify-center">
        <button onClick={handleGenerateConcepts} disabled={loading} className="ip-btn-primary text-base px-8 py-3">
          {loading ? <span className="ip-loading"></span> : '基于趋势生成创新产品概念 →'}
        </button>
      </div>
    </div>
  )
}
