import { useApp } from '../contexts/AppContext'
import { ai } from '../utils/api'
import { defaultTrendData, defaultConcepts } from '../utils/defaultData'
import { HBar, GapHeatmap, PainScatter, SourcePanel } from './Charts'

export default function TrendRadar() {
  const { category, trendData, loading, error, setConcepts, setActiveModule, setLoading, setError } = useApp()

  const data = trendData || defaultTrendData
  const collection = data._collection
  const taobaoSuggests = data._taobaoSuggests || []
  const jdPriceDist = data._jdPriceDist || []
  const jdProducts = data._jdProducts || []
  const realComments = data._realComments || []

  const handleGenerateConcepts = async () => {
    setLoading(true)
    setError(null)
    try {
      const d = await ai.concepts(category, data)
      setConcepts(d.data)
      setActiveModule('innolab')
    } catch (err) {
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
          <p className="text-ip-text-secondary">正在采集真实数据并进行 AI 深度分析...</p>
          <p className="text-xs text-ip-text-tertiary mt-2">数据源：淘宝 · 抖音 · 百度 · B站 · 头条 · 京东</p>
          <p className="text-xs text-ip-text-tertiary mt-1">分析约需 30-60 秒，请耐心等待</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 ip-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between no-print">
        <div>
          <h2 className="text-lg font-semibold text-ip-text">趋势雷达 — {data.category || category}</h2>
          <p className="text-sm text-ip-text-tertiary">扫描日期: {data.scanDate || '-'}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveModule('competitor')} className="ip-btn-ghost">竞品分析 →</button>
          <button onClick={handleGenerateConcepts} disabled={loading} className="ip-btn-primary">
            {loading ? <span className="ip-loading"></span> : '生成创新产品概念 →'}
          </button>
        </div>
      </div>

      {error && <div className="p-3 rounded-lg bg-ip-warning-light text-ip-warning text-sm no-print">{error}</div>}

      {/* 数据来源透明面板 */}
      <SourcePanel collection={collection} />

      {/* 核心指标 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: '品类总GMV', key: 'totalGMV' },
          { label: 'GMV增速', key: 'gmvGrowth' },
          { label: '品牌数', key: 'brandCount' },
          { label: '头部集中度', key: 'topBrandShare' },
        ].map((m, i) => (
          <div key={i} className="bg-ip-surface border border-ip-border rounded-lg p-3 text-center">
            <p className="text-xs text-ip-text-tertiary mb-1">{m.label}</p>
            <p className="text-base font-semibold text-ip-text">{data.metrics?.[m.key] || '-'}</p>
            {data.metrics?.[`${m.key}_source`] && (
              <p className="text-[11px] text-ip-text-tertiary mt-0.5 truncate" title={data.metrics[`${m.key}_source`]}>{data.metrics[`${m.key}_source`]}</p>
            )}
          </div>
        ))}
      </div>

      {/* 真实数据区：淘宝联想词 + 京东价格带 */}
      {(taobaoSuggests.length > 0 || jdPriceDist.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {taobaoSuggests.length > 0 && (
            <div className="ip-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-ip-text">淘宝真实搜索需求词</h3>
                <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700">真实采集</span>
              </div>
              <HBar
                items={taobaoSuggests.slice(0, 10).map((s, i) => ({ label: s.word, value: (taobaoSuggests.length - i) * 10 }))}
                valueLabel={() => ''}
              />
              <p className="text-[11px] text-ip-text-tertiary mt-2">来自淘宝搜索联想接口，反映用户真实搜索意图（按联想热度排序）</p>
            </div>
          )}
          {jdPriceDist.length > 0 && (
            <div className="ip-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-ip-text">京东在售商品价格带分布</h3>
                <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700">真实采集</span>
              </div>
              <HBar
                items={jdPriceDist.map(p => ({ label: p.range, value: p.count }))}
                color="#10b981"
                valueLabel={(v) => `${v}个`}
              />
            </div>
          )}
        </div>
      )}

      {/* 趋势关键词 */}
      <div className="ip-card p-5">
        <h3 className="text-sm font-semibold text-ip-text mb-4">热门趋势关键词</h3>
        <div className="space-y-2">
          {(data.trends || []).map((t, i) => (
            <div key={i} className="flex items-center gap-4 py-2 border-b border-ip-border last:border-0">
              <div className="w-6 h-6 rounded-full bg-ip-primary-light flex items-center justify-center text-xs font-semibold text-ip-primary shrink-0">{t.rank || i + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-ip-text">{t.keyword}</span>
                  <span className="ip-tag bg-ip-success-light text-ip-success">YoY +{t.yoy}%</span>
                  <span className="ip-tag bg-ip-bg text-ip-text-tertiary">{t.platform}</span>
                  {t.dataFromReal ? (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-600">真实采集</span>
                  ) : (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700" title={t.inferenceBasis || ''}>AI推测</span>
                  )}
                </div>
                <p className="text-xs text-ip-text-secondary mt-0.5">{t.summary}</p>
                <p className="text-xs text-ip-text-tertiary italic mt-0.5">{t.dataFromReal ? '✓ ' : '▲ '}{t.verbatim}</p>
                {t.inferenceBasis && !t.dataFromReal && <p className="text-xs text-amber-600 mt-0.5">推测依据：{t.inferenceBasis}</p>}
              </div>
              <div className="text-right flex-shrink-0 hidden sm:block">
                <div className="w-20 h-1.5 bg-ip-bg rounded-full overflow-hidden">
                  <div className="h-full bg-ip-primary rounded-full" style={{ width: `${Math.min(t.share || 0, 100)}%` }}></div>
                </div>
                <p className="text-xs text-ip-text-tertiary mt-1">占比{t.share}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 痛点：散点图 + 列表 */}
      <div className="ip-card p-5">
        <h3 className="text-sm font-semibold text-ip-text mb-3">用户痛点定位图（强度 × 满足度）</h3>
        <PainScatter painPoints={data.painPoints} />
      </div>

      <div className="ip-card p-5">
        <h3 className="text-sm font-semibold text-ip-text mb-4">痛点明细 — 按需求缺口排序</h3>
        <div className="grid grid-cols-1 gap-3">
          {(data.painPoints || []).map((p, i) => (
            <div key={i} className="border border-ip-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-ip-text">{p.pain}</span>
                  {p.dataFromReal
                    ? <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-600">真实评论</span>
                    : <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700" title={p.inferenceBasis || ''}>AI推测</span>}
                </div>
                <span className={`ip-tag ${p.gap >= 70 ? 'bg-ip-danger-light text-ip-danger' : p.gap >= 50 ? 'bg-ip-warning-light text-ip-warning' : 'bg-ip-bg text-ip-text-tertiary'}`}>缺口 {p.gap}</span>
              </div>
              <div className="flex gap-2 mb-2">
                <div className="flex-1">
                  <p className="text-[11px] text-ip-text-tertiary mb-0.5">需求强度 {p.intensity}</p>
                  <div className="w-full h-2 bg-ip-bg rounded-full overflow-hidden"><div className="h-full bg-ip-danger rounded-full" style={{ width: `${p.intensity}%` }}></div></div>
                </div>
                <div className="flex-1">
                  <p className="text-[11px] text-ip-text-tertiary mb-0.5">现有满足 {p.satisfaction}</p>
                  <div className="w-full h-2 bg-ip-bg rounded-full overflow-hidden"><div className="h-full bg-ip-success rounded-full" style={{ width: `${p.satisfaction}%` }}></div></div>
                </div>
              </div>
              <p className="text-xs text-ip-text-tertiary italic">"{p.userVoice}"</p>
              {p.opportunity && <div className="mt-2 p-2 rounded bg-ip-primary-light text-xs text-ip-primary"><strong>创新机会:</strong> {p.opportunity}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* 缺口矩阵热力图 */}
      <div className="ip-card p-5">
        <h3 className="text-sm font-semibold text-ip-text mb-1">价格带 × 功效 缺口矩阵</h3>
        <p className="text-xs text-ip-text-tertiary mb-3">找到"高增速 + 低竞争 + 空白"的黄金格子</p>
        <GapHeatmap gapMatrix={data.gapMatrix} />
      </div>

      {/* 人群画像 */}
      {data.personas?.length > 0 && (
        <div className="ip-card p-5">
          <h3 className="text-sm font-semibold text-ip-text mb-4">核心人群画像</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {data.personas.map((p, i) => (
              <div key={i} className="border border-ip-border rounded-lg p-4 bg-gradient-to-b from-ip-bg to-white">
                <p className="text-sm font-semibold text-ip-text mb-1">{p.name}</p>
                <p className="text-xs text-ip-text-tertiary mb-2">{p.age} · {p.gender} · 消费力{p.spendingPower}</p>
                <p className="text-xs text-ip-text-secondary mb-2">场景：{p.scenario}</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {(p.coreNeeds || []).map((n, j) => <span key={j} className="ip-tag bg-ip-primary-light text-ip-primary text-[11px]">{n}</span>)}
                </div>
                <p className="text-xs text-ip-text-tertiary italic">{p.quote}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 渠道洞察 */}
      {data.channelInsights?.length > 0 && (
        <div className="ip-card p-5">
          <h3 className="text-sm font-semibold text-ip-text mb-4">渠道打法洞察</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[640px]">
              <thead>
                <tr className="border-b border-ip-border text-left">
                  <th className="p-2 text-ip-text-tertiary font-medium">平台</th>
                  <th className="p-2 text-ip-text-tertiary font-medium">内容切入角度</th>
                  <th className="p-2 text-ip-text-tertiary font-medium">打法建议</th>
                  <th className="p-2 text-ip-text-tertiary font-medium">难度</th>
                  <th className="p-2 text-ip-text-tertiary font-medium">备注</th>
                </tr>
              </thead>
              <tbody>
                {data.channelInsights.map((c, i) => (
                  <tr key={i} className="border-b border-ip-border last:border-0">
                    <td className="p-2 font-medium text-ip-text">{c.platform}</td>
                    <td className="p-2 text-ip-text-secondary">{c.contentAngle}</td>
                    <td className="p-2 text-ip-text-secondary">{c.playStyle}</td>
                    <td className="p-2">
                      <span className={`ip-tag ${c.difficulty === '低' ? 'bg-ip-success-light text-ip-success' : c.difficulty === '高' ? 'bg-ip-danger-light text-ip-danger' : 'bg-ip-warning-light text-ip-warning'}`}>{c.difficulty}</span>
                    </td>
                    <td className="p-2 text-ip-text-tertiary">{c.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 机会评分卡 */}
      <div className="ip-card p-5">
        <h3 className="text-sm font-semibold text-ip-text mb-4">创新机会评分卡 TOP5</h3>
        <div className="space-y-3">
          {(data.opportunities || []).map((o, i) => (
            <div key={i} className="flex items-start gap-3 p-3 border border-ip-border rounded-lg">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${o.score >= 85 ? 'bg-green-100 text-green-700' : o.score >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>{o.score}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h4 className="text-sm font-medium text-ip-text">{o.title}</h4>
                  {o.sourcePlatform && <span className="text-xs px-1.5 py-0.5 rounded bg-ip-bg text-ip-text-tertiary">{o.sourcePlatform}</span>}
                </div>
                <p className="text-xs text-ip-text-secondary mt-1">{o.rationale}</p>
                <div className="flex gap-3 mt-2 text-xs text-ip-text-tertiary flex-wrap">
                  <span>趋势: {o.trendSignal}</span>
                  <span>缺口: {o.demandGap}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 真实评论/商品（折叠） */}
      {(jdProducts.length > 0 || realComments.length > 0) && (
        <details className="ip-card p-5">
          <summary className="text-sm font-semibold text-ip-text cursor-pointer">原始采集数据（京东商品 {jdProducts.length} 条 · 评论 {realComments.length} 条）</summary>
          <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {jdProducts.length > 0 && (
              <div className="space-y-1">
                {jdProducts.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-xs text-gray-600 gap-2">
                    <span className="flex-1 truncate">{p.name}</span>
                    <span className="font-medium text-green-700 shrink-0">¥{p.price}</span>
                  </div>
                ))}
              </div>
            )}
            {realComments.length > 0 && (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {realComments.map((c, i) => (
                  <p key={i} className="text-xs text-gray-600 italic border-l-2 border-green-300 pl-2">"{c}"</p>
                ))}
              </div>
            )}
          </div>
        </details>
      )}

      <div className="flex justify-center no-print">
        <button onClick={handleGenerateConcepts} disabled={loading} className="ip-btn-primary text-base px-8 py-3">
          {loading ? <span className="ip-loading"></span> : '基于趋势生成创新产品概念 →'}
        </button>
      </div>
    </div>
  )
}
