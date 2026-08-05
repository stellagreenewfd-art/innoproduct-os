import { useApp } from '../contexts/AppContext'
import { defaultTrendData } from '../utils/defaultData'
import { HBar } from './Charts'

/** 竞品分析模块 — 竞争格局、品牌弱点、价格定位 */
export default function CompetitorAnalysis() {
  const { category, trendData, setActiveModule } = useApp()
  const data = trendData || defaultTrendData
  const competitors = data.competitors || []
  const jdProducts = data._jdProducts || []

  if (!trendData) {
    return (
      <div className="text-center py-20">
        <p className="text-ip-text-secondary mb-4">请先在趋势雷达完成一次品类分析</p>
        <button onClick={() => setActiveModule('input')} className="ip-btn-primary">开始分析品类</button>
      </div>
    )
  }

  const totalShare = competitors.reduce((s, c) => s + (Number(c.share) || 0), 0)

  return (
    <div className="space-y-6 ip-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ip-text">竞品分析 — {data.category || category}</h2>
          <p className="text-sm text-ip-text-tertiary">竞争格局 · 品牌弱点 · 价格定位 · 差异化切入点</p>
        </div>
        <button onClick={() => setActiveModule('trend')} className="ip-btn-ghost text-sm no-print">← 返回趋势雷达</button>
      </div>

      {/* 市场份额 */}
      <div className="ip-card p-5">
        <h3 className="text-sm font-semibold text-ip-text mb-4">品牌竞争格局（份额估算）</h3>
        <HBar
          items={competitors.map(c => ({ label: c.brand, value: Number(c.share) || 0 }))}
          valueLabel={(v) => `${v}%`}
        />
        <p className="text-[11px] text-ip-text-tertiary mt-2">
          标注品牌合计约 {totalShare}%，其余为长尾/白牌。份额为 AI 基于公开数据的估算值，供格局判断参考。
        </p>
      </div>

      {/* 竞品卡片矩阵 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {competitors.map((c, i) => (
          <div key={i} className="ip-card p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-ip-text">{c.brand}</h4>
              <span className="ip-tag bg-ip-bg text-ip-text-secondary">{c.priceBand}</span>
            </div>
            <p className="text-xs text-ip-text-secondary mb-3">{c.positioning}</p>
            <div className="space-y-2 text-xs">
              <div className="p-2 rounded bg-ip-success-light">
                <span className="font-medium text-ip-success">优势：</span>
                <span className="text-ip-text-secondary">{c.strength}</span>
              </div>
              <div className="p-2 rounded bg-ip-danger-light">
                <span className="font-medium text-ip-danger">弱点：</span>
                <span className="text-ip-text-secondary">{c.weakness}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 真实在售竞品（京东采集成功时展示） */}
      {jdProducts.length > 0 && (
        <div className="ip-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-ip-text">京东真实在售商品样本</h3>
            <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700">真实采集</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[520px]">
              <thead>
                <tr className="border-b border-ip-border text-left">
                  <th className="p-2 text-ip-text-tertiary font-medium">#</th>
                  <th className="p-2 text-ip-text-tertiary font-medium">商品</th>
                  <th className="p-2 text-ip-text-tertiary font-medium text-right">价格</th>
                </tr>
              </thead>
              <tbody>
                {jdProducts.map((p, i) => (
                  <tr key={i} className="border-b border-ip-border last:border-0">
                    <td className="p-2 text-ip-text-tertiary">{i + 1}</td>
                    <td className="p-2 text-ip-text">{p.name}</td>
                    <td className="p-2 text-right font-medium text-green-700">¥{p.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 差异化切入建议 */}
      <div className="ip-card p-5 bg-ip-primary-light/50">
        <h3 className="text-sm font-semibold text-ip-text mb-2">💡 如何使用这份竞品分析</h3>
        <ul className="text-xs text-ip-text-secondary space-y-1">
          <li>• 找"高份额但弱点明显"的品牌 — 它的用户就是你可以抢的用户</li>
          <li>• 避开"低价白牌"的价格带 — 新品牌在 10 元以下没有任何胜算</li>
          <li>• 把竞品弱点直接翻译成你的 USP，进入创新工坊生成对应概念</li>
        </ul>
        <button onClick={() => setActiveModule('innolab')} className="ip-btn-primary text-sm mt-3 no-print">去创新工坊生成概念 →</button>
      </div>
    </div>
  )
}
