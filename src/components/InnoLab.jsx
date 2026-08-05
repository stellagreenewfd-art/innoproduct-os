import { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { defaultConcepts } from '../utils/defaultData'

const INNO_LEVEL_COLORS = {
  '微创新': { bg: 'bg-blue-50', text: 'text-blue-600' },
  '差异创新': { bg: 'bg-purple-50', text: 'text-purple-600' },
  '颠覆创新': { bg: 'bg-green-50', text: 'text-green-600' },
}

function Stars({ score }) {
  return (
    <span className="text-sm">
      {[1, 2, 3, 4, 5].map(i => <span key={i} className={i <= score ? 'text-amber-400' : 'text-gray-200'}>★</span>)}
    </span>
  )
}

function ConceptCard({ concept, onSelect, onAddToDev }) {
  const [expanded, setExpanded] = useState(false)
  const levelColor = INNO_LEVEL_COLORS[concept.innovationLevel] || INNO_LEVEL_COLORS['微创新']

  return (
    <div className="ip-card p-5 ip-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-base font-semibold text-ip-text">{concept.name}</h3>
            <span className={`ip-tag ${levelColor.bg} ${levelColor.text}`}>{concept.innovationLevel}</span>
          </div>
          <p className="text-sm text-ip-primary font-medium">{concept.tagline}</p>
        </div>
        <div className="text-right shrink-0">
          <Stars score={concept.feasibilityScore} />
          <p className="text-xs text-ip-text-tertiary mt-0.5">可行性</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-ip-bg rounded-lg p-2.5">
          <p className="text-xs text-ip-text-tertiary mb-0.5">目标人群</p>
          <p className="text-sm text-ip-text">{concept.targetAudience?.age} · {concept.targetAudience?.gender}</p>
          <p className="text-xs text-ip-text-secondary">{concept.targetAudience?.scenario}</p>
        </div>
        <div className="bg-ip-bg rounded-lg p-2.5">
          <p className="text-xs text-ip-text-tertiary mb-0.5">建议价格</p>
          <p className="text-sm font-semibold text-ip-text">{concept.priceRange}</p>
          <p className="text-xs text-ip-text-secondary">{concept.priceStrategy}</p>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex items-start gap-2 mb-2">
          <span className="ip-tag bg-ip-danger-light text-ip-danger shrink-0">核心痛点</span>
          <p className="text-sm text-ip-text">{concept.corePainPoint}</p>
        </div>
        <div className="flex items-start gap-2">
          <span className="ip-tag bg-ip-success-light text-ip-success shrink-0">差异化USP</span>
          <p className="text-sm text-ip-text">{concept.usp}</p>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-ip-border pt-3 mt-3 space-y-3">
          <div>
            <p className="text-xs font-semibold text-ip-text mb-1.5">成分/配方方向</p>
            <div className="flex flex-wrap gap-1.5 mb-1">
              {concept.formulationDirection?.coreIngredients?.map((ing, i) => (
                <span key={i} className="ip-tag bg-ip-primary-light text-ip-primary">{ing}</span>
              ))}
            </div>
            <p className="text-xs text-ip-text-secondary">{concept.formulationDirection?.techRoute}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-ip-text mb-1.5">包装设计方向</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-ip-text-tertiary">材质:</span> <span className="text-ip-text">{concept.packagingDirection?.material}</span></div>
              <div><span className="text-ip-text-tertiary">风格:</span> <span className="text-ip-text">{concept.packagingDirection?.style}</span></div>
              <div><span className="text-ip-text-tertiary">规格:</span> <span className="text-ip-text">{concept.packagingDirection?.spec}</span></div>
              <div><span className="text-ip-text-tertiary">开箱:</span> <span className="text-ip-text">{concept.packagingDirection?.unboxingExperience}</span></div>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-ip-text mb-1.5">市场规模</p>
            <div className="flex gap-4 text-xs">
              <span><span className="text-ip-text-tertiary">TAM:</span> <span className="font-medium text-ip-text">{concept.marketSize?.tam}</span></span>
              <span><span className="text-ip-text-tertiary">SAM:</span> <span className="font-medium text-ip-text">{concept.marketSize?.sam}</span></span>
              <span><span className="text-ip-text-tertiary">SOM:</span> <span className="font-medium text-ip-text">{concept.marketSize?.som}</span></span>
            </div>
          </div>
          {concept.channelStrategy && (
            <div>
              <p className="text-xs font-semibold text-ip-text mb-1">渠道策略</p>
              <p className="text-xs text-ip-text-secondary">{concept.channelStrategy}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-ip-text mb-1">与竞品本质区别</p>
            <p className="text-xs text-ip-text-secondary">{concept.competitorGap}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold text-ip-text mb-1">风险因素</p>
              <ul className="text-xs text-ip-text-secondary space-y-0.5">
                {concept.riskFactors?.map((r, i) => <li key={i}>• {r}</li>)}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-ip-text mb-1">成功指标</p>
              <ul className="text-xs text-ip-text-secondary space-y-0.5">
                {concept.successMetrics?.map((m, i) => <li key={i}>• {m}</li>)}
              </ul>
            </div>
          </div>
          <p className="text-xs text-ip-text-tertiary">研发周期: <strong className="text-ip-text">{concept.devCycleEstimate}</strong></p>
        </div>
      )}

      <div className="flex items-center gap-2 mt-4">
        <button onClick={() => setExpanded(!expanded)} className="ip-btn-ghost text-xs flex-1">{expanded ? '收起详情' : '查看详情'}</button>
        <button onClick={() => onSelect(concept)} className="ip-btn-ghost text-xs flex-1">生成规格书</button>
        <button onClick={() => onAddToDev(concept)} className="ip-btn-primary text-xs flex-1">加入开发</button>
      </div>
    </div>
  )
}

export default function InnoLab() {
  const { category, concepts, loading, setSelectedConcept, setActiveModule, setSpecData } = useApp()
  const data = concepts || defaultConcepts

  const handleSelectConcept = (concept) => {
    setSelectedConcept(concept)
    setSpecData(null)
    setActiveModule('spec')
  }

  const handleAddToDev = (concept) => {
    setSelectedConcept(concept)
    setActiveModule('dev')
  }

  if (loading && !concepts) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="ip-loading mx-auto mb-4" style={{ width: 32, height: 32 }}></div>
          <p className="text-ip-text-secondary">AI正在生成创新产品概念...</p>
          <p className="text-xs text-ip-text-tertiary mt-1">生成5个差异化产品方案，约需30秒</p>
        </div>
      </div>
    )
  }

  const conceptList = data.concepts || []

  return (
    <div className="space-y-6 ip-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ip-text">创新工坊 — {data.category || category}</h2>
          <p className="text-sm text-ip-text-tertiary">AI生成 {conceptList.length} 个差异化创新产品概念</p>
        </div>
        <button onClick={() => setActiveModule('trend')} className="ip-btn-ghost text-sm no-print">← 返回趋势雷达</button>
      </div>

      <div className="flex items-center gap-4 text-xs">
        <span className="text-ip-text-tertiary">创新程度:</span>
        <span className="ip-tag bg-blue-50 text-blue-600">微创新</span>
        <span className="ip-tag bg-purple-50 text-purple-600">差异创新</span>
        <span className="ip-tag bg-green-50 text-green-600">颠覆创新</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {conceptList.map((concept, i) => (
          <ConceptCard key={concept.id || i} concept={concept} onSelect={handleSelectConcept} onAddToDev={handleAddToDev} />
        ))}
      </div>

      <p className="text-center text-sm text-ip-text-tertiary">选择一个概念 → 生成详细产品规格书（含财务测算与上市计划），或直接加入开发追踪</p>
    </div>
  )
}
