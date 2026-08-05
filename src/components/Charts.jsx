/** 轻量图表组件（零依赖，SVG/DIV 手绘） */

/** 水平条形图 */
export function HBar({ items, maxValue, color = '#4f46e5', valueLabel }) {
  const max = maxValue || Math.max(...items.map(i => i.value), 1)
  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-24 sm:w-28 text-xs text-ip-text-secondary truncate text-right shrink-0" title={item.label}>{item.label}</div>
          <div className="flex-1 h-4 bg-ip-bg rounded overflow-hidden">
            <div className="h-full rounded transition-all duration-500" style={{ width: `${Math.max(2, (item.value / max) * 100)}%`, background: item.color || color }}></div>
          </div>
          <div className="w-12 text-xs text-ip-text-tertiary shrink-0">{valueLabel ? valueLabel(item.value) : item.value}</div>
        </div>
      ))}
    </div>
  )
}

/** 缺口矩阵热力图（5×5：价格带 × 功效） */
export function GapHeatmap({ gapMatrix }) {
  if (!gapMatrix?.cells?.length) return null
  const { priceRanges = [], functions: funcs = [], cells = [] } = gapMatrix
  const getCell = (pi, fi) => cells.find(c => c.priceIndex === pi && c.funcIndex === fi) || {}

  const cellBg = (score, isEmpty) => {
    if (isEmpty && score >= 80) return 'bg-emerald-500 text-white'
    if (score >= 80) return 'bg-emerald-200 text-emerald-900'
    if (score >= 60) return 'bg-emerald-100 text-emerald-800'
    if (score >= 40) return 'bg-amber-100 text-amber-800'
    if (score >= 20) return 'bg-orange-100 text-orange-800'
    return 'bg-gray-100 text-gray-500'
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse min-w-[560px]">
        <thead>
          <tr>
            <th className="p-1.5 text-left text-ip-text-tertiary font-medium">价格带 \ 功效</th>
            {funcs.map((f, i) => <th key={i} className="p-1.5 text-ip-text-secondary font-medium text-center">{f}</th>)}
          </tr>
        </thead>
        <tbody>
          {priceRanges.map((pr, pi) => (
            <tr key={pi}>
              <td className="p-1.5 text-ip-text-secondary font-medium whitespace-nowrap">{pr}</td>
              {funcs.map((_, fi) => {
                const c = getCell(pi, fi)
                return (
                  <td key={fi} className="p-0.5">
                    <div
                      className={`rounded-md p-1.5 text-center cursor-default transition-transform hover:scale-105 ${cellBg(c.opportunityScore || 0, c.isEmpty)}`}
                      title={`份额${c.share ?? '-'}% · 增速${c.growth ?? '-'}% · 竞争${c.competition || '-'}${c.isEmpty ? ' · 空白格' : ''}`}
                    >
                      <div className="font-bold text-sm">{c.opportunityScore ?? '-'}</div>
                      <div className="text-[10px] opacity-80">{c.isEmpty ? '空白机会' : `份额${c.share ?? '-'}%`}</div>
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center gap-3 mt-2 text-[11px] text-ip-text-tertiary">
        <span>格子数字=机会评分</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span>高潜空白</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-100 inline-block"></span>中等机会</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100 inline-block"></span>低机会/红海</span>
      </div>
    </div>
  )
}

/** 需求-满足散点（痛点定位图） */
export function PainScatter({ painPoints }) {
  if (!painPoints?.length) return null
  return (
    <div className="relative w-full border border-ip-border rounded-lg bg-gradient-to-tr from-ip-bg to-white" style={{ height: 260 }}>
      {/* 象限标注 */}
      <span className="absolute top-2 right-3 text-[11px] text-emerald-600 font-medium">高强度·低满足 = 黄金缺口</span>
      <span className="absolute bottom-2 left-3 text-[11px] text-ip-text-tertiary">低强度·高满足 = 已解决</span>
      <span className="absolute left-1/2 top-0 bottom-0 w-px bg-ip-border/70"></span>
      <span className="absolute top-1/2 left-0 right-0 h-px bg-ip-border/70"></span>
      {painPoints.map((p, i) => {
        const x = Math.min(96, Math.max(4, p.satisfaction ?? 50)) // 满足程度 → x
        const y = Math.min(96, Math.max(4, 100 - (p.intensity ?? 50))) // 需求强度 → y（反向）
        const size = 10 + ((p.gap ?? 50) / 100) * 18
        return (
          <div
            key={i}
            className="absolute rounded-full bg-ip-primary/80 border-2 border-white shadow cursor-default hover:bg-ip-primary transition-colors group"
            style={{ left: `${x}%`, top: `${y}%`, width: size, height: size, transform: 'translate(-50%,-50%)' }}
          >
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-ip-text text-white text-[11px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {p.pain}（缺口{p.gap}）
            </div>
          </div>
        )
      })}
      <span className="absolute bottom-1 right-3 text-[11px] text-ip-text-tertiary">满足程度 →</span>
      <span className="absolute top-1 left-2 text-[11px] text-ip-text-tertiary">需求强度 ↑</span>
    </div>
  )
}

/** 数据来源面板 */
export function SourcePanel({ collection }) {
  if (!collection?.sources?.length) return null
  const ok = collection.sources.filter(s => s.status === 'success')
  return (
    <div className="ip-card p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-ip-text">数据来源透明面板</h3>
        <span className={`text-xs px-2 py-0.5 rounded ${ok.length > 0 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
          {ok.length > 0 ? `${ok.length} 个真实数据源成功` : '本次为 AI 推理模式'}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
        {collection.sources.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs py-0.5">
            <span className={s.status === 'success' ? 'text-green-600' : 'text-red-400'}>{s.status === 'success' ? '✓' : '✗'}</span>
            <span className="text-ip-text font-medium shrink-0">{s.name}</span>
            <span className="text-ip-text-tertiary truncate">{s.detail}</span>
          </div>
        ))}
      </div>
      {collection.elapsedMs > 0 && (
        <p className="text-[11px] text-ip-text-tertiary mt-2">采集耗时 {(collection.elapsedMs / 1000).toFixed(1)}s · {collection.timestamp?.slice(0, 19).replace('T', ' ')}</p>
      )}
    </div>
  )
}
