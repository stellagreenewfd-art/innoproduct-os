import { useApp } from '../contexts/AppContext'
import { dataApi } from '../utils/api'

export default function Dashboard() {
  const { user, setActiveModule, devProjects, inspirations, analyses, setCategory, setTrendData, setError } = useApp()

  const inProgress = devProjects.filter(p => p.stages?.some(s => s.status === 'in_progress')).length
  const completed = devProjects.filter(p => p.stages?.every(s => s.status === 'completed')).length

  const openAnalysis = async (a) => {
    try {
      const d = await dataApi.getAnalysis(a.id)
      setCategory(d.data.category)
      setTrendData(d.data.data)
      setActiveModule('trend')
    } catch (e) {
      setError('打开历史分析失败: ' + e.message)
    }
  }

  const projectProgress = (p) => {
    const all = p.stages?.flatMap(s => s.tasks) || []
    return all.length ? Math.round(all.filter(t => t.done).length / all.length * 100) : 0
  }

  return (
    <div className="space-y-6 ip-fade-in">
      {/* 欢迎区 */}
      <div className="rounded-2xl p-8 text-white" style={{ background: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)' }}>
        <h2 className="text-2xl font-bold mb-1">你好，{user?.username} 👋</h2>
        <p className="text-white/80 text-sm mb-5">从一个品类词开始，让真实数据 + AI 帮你完成：趋势洞察 → 竞品分析 → 产品概念 → 规格书 → 开发落地</p>
        <button onClick={() => setActiveModule('input')} className="bg-white text-ip-primary font-semibold px-6 py-2.5 rounded-lg text-sm hover:shadow-lg transition-all">
          + 开始新的品类分析
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: '在研产品', value: devProjects.length, sub: `${inProgress} 个进行中`, color: 'text-ip-primary' },
          { label: '已上市/完成', value: completed, sub: '全流程走完', color: 'text-green-600' },
          { label: '历史分析报告', value: analyses.length, sub: '云端已保存', color: 'text-ip-accent' },
          { label: '灵感收藏', value: inspirations.length, sub: '竞品/趋势/洞察', color: 'text-ip-warning' },
        ].map((s, i) => (
          <div key={i} className="ip-card p-4">
            <p className="text-xs text-ip-text-tertiary mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-ip-text-tertiary mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 在研项目 */}
        <div className="ip-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-ip-text">在研项目</h3>
            <button onClick={() => setActiveModule('dev')} className="text-xs text-ip-primary hover:underline">全部 →</button>
          </div>
          {devProjects.length === 0 ? (
            <p className="text-sm text-ip-text-tertiary py-6 text-center">还没有开发项目。分析品类 → 生成概念 → 加入开发追踪</p>
          ) : (
            <div className="space-y-2">
              {devProjects.slice(0, 4).map(p => {
                const pct = projectProgress(p)
                return (
                  <div key={p.id} onClick={() => setActiveModule('dev')} className="flex items-center gap-3 p-2.5 rounded-lg border border-ip-border hover:border-ip-primary cursor-pointer transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ip-text truncate">{p.productName}</p>
                      <p className="text-xs text-ip-text-tertiary truncate">{p.tagline}</p>
                    </div>
                    <div className="w-24 shrink-0">
                      <div className="h-1.5 bg-ip-bg rounded-full overflow-hidden">
                        <div className="h-full bg-ip-primary rounded-full" style={{ width: `${pct}%` }}></div>
                      </div>
                      <p className="text-[11px] text-ip-text-tertiary text-right mt-0.5">{pct}%</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 历史分析 */}
        <div className="ip-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-ip-text">历史分析报告</h3>
            <span className="text-xs text-ip-text-tertiary">最多保留20份</span>
          </div>
          {analyses.length === 0 ? (
            <p className="text-sm text-ip-text-tertiary py-6 text-center">还没有分析报告，开始你的第一次品类扫描吧</p>
          ) : (
            <div className="space-y-2">
              {analyses.slice(0, 5).map(a => (
                <div key={a.id} onClick={() => openAnalysis(a)} className="flex items-center justify-between p-2.5 rounded-lg border border-ip-border hover:border-ip-primary cursor-pointer transition-colors">
                  <div>
                    <p className="text-sm font-medium text-ip-text">{a.category} · 趋势分析</p>
                    <p className="text-xs text-ip-text-tertiary">扫描日期 {a.scanDate || '-'}</p>
                  </div>
                  <span className="text-xs text-ip-primary">打开 →</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 流程引导 */}
      <div className="ip-card p-5">
        <h3 className="text-sm font-semibold text-ip-text mb-4">创新产品开发全流程</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {[
            { n: '01', t: '品类输入', d: '输入品类词' },
            { n: '02', t: '趋势雷达', d: '真实数据+AI分析' },
            { n: '03', t: '竞品分析', d: '格局与弱点' },
            { n: '04', t: '创新工坊', d: '5个产品概念' },
            { n: '05', t: '产品规格书', d: '配方+财务+上市' },
            { n: '06', t: '开发追踪', d: '6阶段落地' },
          ].map(s => (
            <div key={s.n} className="text-center p-3 rounded-lg bg-ip-bg">
              <p className="text-xs text-ip-primary font-bold">{s.n}</p>
              <p className="text-sm font-medium text-ip-text mt-0.5">{s.t}</p>
              <p className="text-[11px] text-ip-text-tertiary mt-0.5">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
