import { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { analyzeTrends, generateConcepts, submitRecord } from '../utils/api'
import { defaultTrendData, defaultConcepts } from '../utils/defaultData'

export default function CategoryInput() {
  const { category, setCategory, setActiveModule, setTrendData, setConcepts, setLoading, loading, setError } = useApp()
  const [inputValue, setInputValue] = useState('')
  const [progressText, setProgressText] = useState('')

  const handleAnalyze = async () => {
    const cat = inputValue.trim() || category
    if (!cat) return

    setCategory(cat)
    setLoading(true)
    setError(null)
    setProgressText('正在启动分析...')
    setActiveModule('trend')

    try {
      const data = await analyzeTrends(cat, (progress) => {
        setProgressText(progress)
      })
      setTrendData(data)
      submitRecord(cat, data)
    } catch (err) {
      console.error('趋势分析失败:', err)
      setError('AI分析失败，已加载示例数据。请检查API Key配置。')
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
    <div className="max-w-2xl mx-auto pt-12">
      {/* Login reminder: show only when no token saved */}
      {!localStorage.getItem('inno_token') && (
        <div className="mb-4 p-2 rounded-lg bg-ip-warning-light text-center">
          <span className="text-xs text-ip-warning">查询记录需要登录才能保存 — </span>
          <a href="/login" className="text-xs text-ip-primary font-semibold underline">去登录/注册</a>
        </div>
      )}

      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-ip-primary-light mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="1.5">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-ip-text mb-2">从品类到创新产品</h2>
        <p className="text-ip-text-secondary">输入一个品类词，AI自动洞察趋势、生成创新产品方案、管理开发全流程</p>
      </div>

      <div className="ip-card p-6">
        <label className="block text-sm font-medium text-ip-text mb-2">品类名称</label>
        <div className="flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="如：面膜、咖啡、洗发水、牙膏..."
            className="ip-input flex-1"
            autoFocus
          />
          <button
            onClick={handleAnalyze}
            disabled={loading || (!inputValue.trim() && !category)}
            className="ip-btn-primary whitespace-nowrap"
          >
            {loading ? <span className="ip-loading"></span> : '开始分析'}
          </button>
        </div>

        {/* 采集进度提示 */}
        {loading && progressText && (
          <div className="mt-3 p-2 rounded-lg bg-ip-primary-light text-xs text-ip-primary flex items-center gap-2">
            <span className="ip-loading" style={{ width: 12, height: 12 }}></span>
            <span>{progressText}</span>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-xs text-ip-text-tertiary mr-1">热门品类：</span>
          {['面膜', '咖啡', '洗发水', '牙膏', '面霜', '精华液', '防晒霜'].map(cat => (
            <button
              key={cat}
              onClick={() => setInputValue(cat)}
              className="ip-tag bg-ip-bg text-ip-text-secondary hover:bg-ip-primary-light hover:text-ip-primary transition-colors cursor-pointer"
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 text-center">
        <button onClick={loadDemo} className="ip-btn-ghost text-sm">
          加载示例数据（面膜品类）
        </button>
      </div>

      {/* 数据源说明 */}
      <div className="mt-6 ip-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium text-ip-text">V3 升级：7大平台数据源 + 推测依据透明化</span>
        </div>
        <p className="text-xs text-ip-text-secondary mb-2">系统会并行采集7个平台真实数据，再让AI分析。即使采集失败也会标注推测依据。</p>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs px-2 py-1 rounded bg-green-50 text-green-700 border border-green-200">京东商品+评论</span>
          <span className="text-xs px-2 py-1 rounded bg-green-50 text-green-700 border border-green-200">天猫商品搜索</span>
          <span className="text-xs px-2 py-1 rounded bg-green-50 text-green-700 border border-green-200">拼多多商品搜索</span>
          <span className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200">抖音趋势</span>
          <span className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200">小红书趋势</span>
          <span className="text-xs px-2 py-1 rounded bg-green-50 text-green-700 border border-green-200">Google Trends</span>
          <span className="text-xs px-2 py-1 rounded bg-green-50 text-green-700 border border-green-200">百度搜索</span>
        </div>
        <p className="text-xs text-ip-text-tertiary mt-2">注：抖音/小红书因JS渲染+登录墙，采集成功率较低。所有AI推测数据均会标注推测依据。</p>
      </div>

      {/* Feature highlights */}
      <div className="mt-12 grid grid-cols-3 gap-4">
        {[
          { icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', title: '趋势雷达', desc: '真实数据+AI分析' },
          { icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707', title: '创新工坊', desc: 'AI生成产品概念' },
          { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2', title: '开发追踪', desc: '6阶段进度管理' },
        ].map((f, i) => (
          <div key={i} className="ip-card p-4 text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-ip-primary-light mb-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="1.5">
                <path d={f.icon} />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-ip-text">{f.title}</h3>
            <p className="text-xs text-ip-text-tertiary mt-1">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
