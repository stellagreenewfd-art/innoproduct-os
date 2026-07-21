import { useApp } from '../contexts/AppContext'

const STATUS_LABELS = {
  concept: { label: '概念中', color: 'bg-blue-50 text-blue-600' },
  spec: { label: '规格中', color: 'bg-purple-50 text-purple-600' },
  dev: { label: '研发中', color: 'bg-amber-50 text-amber-600' },
  testing: { label: '测试中', color: 'bg-cyan-50 text-cyan-600' },
  launch: { label: '待上线', color: 'bg-orange-50 text-orange-600' },
  launched: { label: '已上线', color: 'bg-green-50 text-green-600' },
}

export default function Portfolio() {
  const { devProjects, setActiveModule } = useApp()

  if (devProjects.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-ip-bg mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
            <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </div>
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
        <p className="text-sm text-ip-text-tertiary">全部产品组合一览，按创新程度 × 市场潜力分布</p>
      </div>

      {/* Matrix quadrant */}
      <div className="ip-card p-5">
        <h3 className="text-sm font-semibold text-ip-text mb-4">创新 × 潜力象限</h3>
        <div className="relative w-full" style={{ paddingBottom: '50%' }}>
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-1">
            <div className="bg-blue-50 rounded-tl-lg p-3 flex flex-col justify-start">
              <p className="text-xs font-medium text-blue-600">高创新 · 高潜力</p>
              <p className="text-xs text-blue-400">明星产品</p>
            </div>
            <div className="bg-green-50 rounded-tr-lg p-3 flex flex-col justify-start">
              <p className="text-xs font-medium text-green-600">低创新 · 高潜力</p>
              <p className="text-xs text-green-400">现金牛</p>
            </div>
            <div className="bg-amber-50 rounded-bl-lg p-3 flex flex-col justify-end">
              <p className="text-xs font-medium text-amber-600">高创新 · 低潜力</p>
              <p className="text-xs text-amber-400">探索产品</p>
            </div>
            <div className="bg-gray-50 rounded-br-lg p-3 flex flex-col justify-end">
              <p className="text-xs font-medium text-gray-500">低创新 · 低潜力</p>
              <p className="text-xs text-gray-400">常规产品</p>
            </div>
          </div>
          {/* Axis labels */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-ip-border"></div>
          <div className="absolute top-1/2 left-0 right-0 h-px bg-ip-border"></div>
          {/* Product dots */}
          {devProjects.map((p, i) => {
            const concept = p
            const innovation = concept.innovationLevel === '颠覆创新' ? 0.8 : concept.innovationLevel === '差异创新' ? 0.6 : 0.3
            const potential = Math.min(0.9, 0.3 + (i * 0.15))
            const x = 50 + (potential - 0.5) * 80
            const y = 50 - (innovation - 0.5) * 80
            return (
              <div
                key={p.id}
                className="absolute w-3 h-3 rounded-full bg-ip-primary border-2 border-white shadow-sm cursor-pointer hover:scale-150 transition-transform"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                title={p.productName}
              ></div>
            )
          })}
        </div>
        <div className="flex items-center justify-between mt-3 text-xs text-ip-text-tertiary">
          <span>← 低市场潜力</span>
          <span>高市场潜力 →</span>
        </div>
        <div className="flex items-center justify-center gap-4 mt-1 text-xs text-ip-text-tertiary">
          <span>↑ 高创新程度</span>
          <span>↓ 低创新程度</span>
        </div>
      </div>

      {/* Product list */}
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
                <div className="w-8 h-8 rounded-lg bg-ip-primary-light flex items-center justify-center text-sm font-semibold text-ip-primary shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-ip-text truncate">{p.productName}</h4>
                    <span className={`ip-tag ${statusInfo.color}`}>{statusInfo.label}</span>
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
                <button
                  onClick={() => setActiveModule('dev')}
                  className="ip-btn-ghost text-xs shrink-0"
                >
                  查看 →
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '在研产品', value: devProjects.length, color: 'text-ip-primary' },
          { label: '已完成', value: devProjects.filter(p => p.stages?.every(s => s.status === 'completed')).length, color: 'text-green-600' },
          { label: '进行中', value: devProjects.filter(p => p.stages?.some(s => s.status === 'in_progress')).length, color: 'text-amber-600' },
          { label: '概念阶段', value: devProjects.filter(p => p.stages?.[0]?.status === 'in_progress').length, color: 'text-blue-600' },
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
