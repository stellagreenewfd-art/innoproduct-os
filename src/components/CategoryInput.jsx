import { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { ai } from '../utils/api'
import { defaultTrendData, defaultConcepts } from '../utils/defaultData'

export default function CategoryInput() {
  const { category, setCategory, setActiveModule, setTrendData, setConcepts, setAnalyses, analyses, setLoading, loading, progressText, setProgressText, setError } = useApp()
  const [inputValue, setInputValue] = useState('')

  const handleAnalyze = async () => {
    const cat = inputValue.trim() || category
    if (!cat) return

    setCategory(cat)
    setLoading(true)
    setError(null)
    setProgressText('正在采集淘宝/抖音/百度/B站/头条/京东真实数据...')
    setActiveModule('trend')

    try {
      const d = await ai.trends(cat)
      setTrendData(d.data)
      // 更新历史分析列表
      setAnalyses([{ id: 'temp-' + Date.now(), category: cat, scanDate: d.data.scanDate, savedAt: new Date().toISOString() }, ...analyses].slice(0, 20))
    } catch (err) {
      setError('分析失败: ' + err.message + '。已加载示例数据结构。')
      setTrendData({ ...defaultTrendData, category: cat })
    } finally {
      setLoading(false)
      setProgressText('')
    }
  }

  const loadDemo = () => {
    setCategory('面膜')
    setTrendData(defaultTrendData)
    setConcepts(defaultConcepts)
    setActiveModule('trend')
  }

  return (
    <div className="max-w-2xl mx-auto pt-10">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-ip-primary-light mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="1.5">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-ip-text mb-2">从品类到创新产品</h2>
        <p className="text-ip-text-secondary">输入品类词，服务端实时采集真实数据，AI 生成深度趋势分析</p>
      </div>

      <div className="ip-card p-6">
        <label className="block text-sm font-medium text-ip-text mb-2">品类名称</label>
        <div className="flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="如：面膜、咖啡、洗发水、猫粮、筋膜枪..."
            className="ip-input flex-1"
            autoFocus
          />
          <button onClick={handleAnalyze} disabled={loading || (!inputValue.trim() && !category)} className="ip-btn-primary whitespace-nowrap">
            {loading ? <span className="ip-loading"></span> : '开始分析'}
          </button>
        </div>

        {loading && progressText && (
          <div className="mt-3 p-2 rounded-lg bg-ip-primary-light text-xs text-ip-primary flex items-center gap-2">
            <span className="ip-loading" style={{ width: 12, height: 12 }}></span>
            <span>{progressText}</span>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-xs text-ip-text-tertiary mr-1">热门品类：</span>
          {['面膜', '咖啡', '洗发水', '猫粮', '筋膜枪', '防晒霜', '益生菌'].map(cat => (
            <button key={cat} onClick={() => setInputValue(cat)}
              className="ip-tag bg-ip-bg text-ip-text-secondary hover:bg-ip-primary-light hover:text-ip-primary transition-colors cursor-pointer">
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 text-center">
        <button onClick={loadDemo} className="ip-btn-ghost text-sm">加载示例数据（面膜品类）</button>
      </div>

      {/* 数据源说明 */}
      <div className="mt-6 ip-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium text-ip-text">Pro 版：服务端直采真实数据，不再经过浏览器代理</span>
        </div>
        <p className="text-xs text-ip-text-secondary mb-2">AI 分析前，服务端会并行采集以下真实数据源，结果全部透明展示；推理内容均标注推测依据。</p>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs px-2 py-1 rounded bg-green-50 text-green-700 border border-green-200">淘宝搜索联想（真实需求词）</span>
          <span className="text-xs px-2 py-1 rounded bg-green-50 text-green-700 border border-green-200">抖音热榜</span>
          <span className="text-xs px-2 py-1 rounded bg-green-50 text-green-700 border border-green-200">百度热搜</span>
          <span className="text-xs px-2 py-1 rounded bg-green-50 text-green-700 border border-green-200">B站热搜</span>
          <span className="text-xs px-2 py-1 rounded bg-green-50 text-green-700 border border-green-200">头条热榜</span>
          <span className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200">京东商品+评论（尽力而为）</span>
        </div>
      </div>
    </div>
  )
}
