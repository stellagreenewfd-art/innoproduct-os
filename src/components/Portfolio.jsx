import { useApp } from '../contexts/AppContext'

const STATUS_LABELS = {
  concept: { label: '概念中', color: 'bg-blue-50 text-blue-600' },
  dev: { label: '研发中', color: 'bg-amber-50 text-amber-600' },
  launched: { label: '已上线', color: 'bg-green-50 text-green-600' },
}

export default function Portfolio() {
  const { devProjects, setActiveModule } = useApp()

  if (devProjects.length === 0) {
    return (
      <div className="text-center py-20">
        <h3 className="text-lg font-semibold text-ip-text mb-2">产品矩阵为空</h3>
        <p className="text-sm text-ip-text-secondary mb-4">开始分析品类并生成产品概念后，这里会展示你的产品组合</p>
        <button onClick={() => setActiveModule('input')} className="ip-btn-primary">开始分析品类</button>
      </div>
    )
  }

  return (
    <div className="space-y-6 ip-fade-in">
      <div>
        <h2 className="text-lg font-semibold text-ip-text">产品矩阵</h2>
        <p className="text-sm text-ip-text-tertiary">全部产品组合一览，按创新程度 × 可行性分布</p>
      </div>

      {/* 象限图（基于真实的创新等级与可行性评分） */}
      <div className="ip-card p-5">
        <h3 className="text-sm font-semibold text-ip-text mb-4">创新 × 可行性象限</h3>
        <div className="relative w-full" style={{ paddingBottom: '50%' }}>
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-1">
            <div className="bg-amber-50 rounded-tl-lg p-3"><p className="text-xs font-medium text-amber-600">高创新 · 低可行</p><p className="text-xs text-amber-400">探索/孵化</p></div>
            <div className="bg-green-50 rounded-tr-lg p-3 text-right"><p className="text-xs font-medium text-green-600">高创新 · 高可行</p><p className="text-xs text-green-400">明星产品</p></div>
            <div className="bg-gray-50 rounded-bl-lg p-3 flex flex-col justify-end"><p className="text-xs font-medium text-gray-500">低创新 · 低可行</p><p className="text-xs text-gray-400">谨慎投入</p></div>
            <div className="bg-blue-50 rounded-br-lg p-3 flex flex-col justify-end text-right"><p className="text-xs font-medium text-blue-600">低创新 · 高可行</p><p className="text-xs text-blue-400">现金流产品</p></div>
          </div>
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-ip-border"></div>
          <div className="absolute top-1/2 left-0 right-0 h-px bg-ip-border"></div>
          {devProjects.map((p) => {
            const innovation = p.innovationLevel === '颠覆创新' ? 0.85 : p.innovationLevel === '差异创新' ? 0.65 : 0.25
            const feasibility = Math.min(0.95, Math.max(0.05, (p.feasibilityScore || 3) / 5))
            const x = 4 + feasibility * 92
            const y = 96 - innovation * 92
            return (
              <div key={p.id}
                className="absolute group cursor-pointer"
                style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}>
                <div className="w-3.5 h-3.5 rounded-full bg-ip-primary border-2 border-white shadow group-hover:scale-150 transition-transform"></div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-ip-text text-white text-[11px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {p.productName}
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex items-center justify-between mt-3 text-xs text-ip-text-tertiary">
          <span>← 低可行性</span><span>高可行性 →</span>
        </div>
      </div>

      {/* 产品列表 */}
      <div className="ip-card p-5">
        <h3 className="text-sm font-semibold text-ip-text mb-4">全部产品 ({devProjects.length})</h3>
        <div className="space-y-2">
          {devProjects.map((p, i) => {
            const allTasks = p.stages?.flatMap(s => s.tasks) || []
            const completedTasks = allTasks.filter(t => t.done).length
            const progress = allTasks.length > 0 ? Math.round((completedTasks / allTasks.length) * 100) : 0
            const currentStage = p.stages?.find(s => s.status === 'in_progress')
            const statusInfo = STATUS_LABELS[p.status] || STATUS_LABELS.concept
            return (
              <div key={p.id} className="flex items-center gap-4 p-3 border border-ip-border rounded-lg hover:border-ip-primary transition-colors">
                <div className="w-8 h-8 rounded-lg bg-ip-primary-light flex items-center justify-center text-sm font-semibold text-ip-primary shrink-0">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-medium text-ip-text truncate">{p.productName}</h4>
                    <span className={`ip-tag ${statusInfo.color}`}>{statusInfo.label}</span>
                    {p.priceRange && <span className="text-xs text-ip-text-tertiary">{p.priceRange}</span>}
                  </div>
                  <p className="text-xs text-ip-text-secondary truncate">{p.tagline}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-ip-bg rounded-full overflow-hidden">
                      <div className="h-full bg-ip-primary rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                    <span className="text-xs text-ip-text font-medium w-8">{progress}%</span>
                  </div>
                  <p className="text-xs text-ip-text-tertiary mt-0.5">{currentStage?.name || '已完成'}</p>
                </div>
                <button onClick={() => setActiveModule('dev')} className="ip-btn-ghost text-xs shrink-0 no-print">查看 →</button>
              </div>
            )
          })}
        </div>
      </div>

      {/* 汇总 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: '在研产品', value: devProjects.length, color: 'text-ip-primary' },
          { label: '已完成', value: devProjects.filter(p => p.stages?.every(s => s.status === 'completed')).length, color: 'text-green-600' },
          { label: '进行中', value: devProjects.filter(p => p.stages?.some(s => s.status === 'in_progress')).length, color: 'text-amber-600' },
          { label: '平均进度', value: (() => { const ps = devProjects.map(p => { const a = p.stages?.flatMap(s => s.tasks) || []; return a.length ? a.filter(t => t.done).length / a.length : 0 }); return ps.length ? Math.round(ps.reduce((x, y) => x + y, 0) / ps.length * 100) + '%' : '0%' })(), color: 'text-ip-accent' },
        ].map((s, i) => (
          <div key={i} className="bg-ip-surface border border-ip-border rounded-lg p-3 text-center">
            <p className="text-xs text-ip-text-tertiary mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
