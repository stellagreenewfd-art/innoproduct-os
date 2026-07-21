import { useState } from 'react'
import { useApp } from '../contexts/AppContext'

export default function InspirationVault() {
  const { inspirations, updateInspirations, trendData, category } = useApp()
  const [showAdd, setShowAdd] = useState(false)
  const [newItem, setNewItem] = useState({ title: '', category: '', note: '', url: '' })

  const handleAdd = () => {
    if (!newItem.title.trim()) return
    const item = {
      id: `insp-${Date.now()}`,
      ...newItem,
      createdAt: new Date().toISOString().slice(0, 10),
    }
    updateInspirations([item, ...inspirations])
    setNewItem({ title: '', category: '', note: '', url: '' })
    setShowAdd(false)
  }

  const handleDelete = (id) => {
    updateInspirations(inspirations.filter(i => i.id !== id))
  }

  // Auto-collect from trend data
  const handleCollectFromTrends = () => {
    if (!trendData?.trends) return
    const collected = trendData.trends.slice(0, 3).map(t => ({
      id: `insp-${Date.now()}-${t.rank}`,
      title: t.keyword,
      category: category || '趋势收藏',
      note: `${t.summary} | YoY +${t.yoy}% | ${t.platform}`,
      url: '',
      createdAt: new Date().toISOString().slice(0, 10),
    }))
    updateInspirations([...collected, ...inspirations])
  }

  return (
    <div className="space-y-6 ip-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ip-text">灵感库</h2>
          <p className="text-sm text-ip-text-tertiary">收藏竞品案例、创新趋势、灵感来源</p>
        </div>
        <div className="flex gap-2">
          {trendData?.trends && (
            <button onClick={handleCollectFromTrends} className="ip-btn-ghost text-sm">
              从趋势收藏
            </button>
          )}
          <button onClick={() => setShowAdd(!showAdd)} className="ip-btn-primary text-sm">
            {showAdd ? '取消' : '+ 添加灵感'}
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="ip-card p-4 space-y-3 ip-fade-in">
          <input
            type="text"
            value={newItem.title}
            onChange={e => setNewItem({ ...newItem, title: e.target.value })}
            placeholder="灵感标题（如：某品牌创新案例）"
            className="ip-input"
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={newItem.category}
              onChange={e => setNewItem({ ...newItem, category: e.target.value })}
              placeholder="分类（如：竞品拆解/行业趋势/用户洞察）"
              className="ip-input"
            />
            <input
              type="text"
              value={newItem.url}
              onChange={e => setNewItem({ ...newItem, url: e.target.value })}
              placeholder="链接URL（可选）"
              className="ip-input"
            />
          </div>
          <textarea
            value={newItem.note}
            onChange={e => setNewItem({ ...newItem, note: e.target.value })}
            placeholder="灵感描述/为什么值得参考..."
            className="ip-input resize-none"
            rows={2}
          />
          <button onClick={handleAdd} className="ip-btn-primary w-full">保存灵感</button>
        </div>
      )}

      {/* Empty state */}
      {inspirations.length === 0 && !showAdd ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-ip-bg mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-ip-text mb-1">还没有收藏的灵感</h3>
          <p className="text-sm text-ip-text-secondary">添加竞品案例、行业趋势或任何给你启发的内容</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {inspirations.map((item, i) => (
            <div key={item.id} className="ip-card p-4 group">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-ip-text">{item.title}</h4>
                  {item.category && (
                    <span className="ip-tag bg-ip-primary-light text-ip-primary mt-1">{item.category}</span>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-ip-text-tertiary hover:text-ip-danger opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                >
                  删除
                </button>
              </div>
              {item.note && <p className="text-xs text-ip-text-secondary mb-2">{item.note}</p>}
              <div className="flex items-center justify-between text-xs text-ip-text-tertiary">
                <span>{item.createdAt}</span>
                {item.url && (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-ip-primary hover:underline">
                    打开链接 →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
