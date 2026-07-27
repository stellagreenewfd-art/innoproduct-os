import { useState, useEffect } from 'react'
import { useApp } from '../contexts/AppContext'
import { generateSpec, getCategoryType } from '../utils/api'
import { defaultSpec, createDevProject } from '../utils/defaultData'

// Category-specific label sets for the formulation module
const CATEGORY_LABEL_SETS = {
  cosmetics: {
    sectionTitle: '配方方案',
    tableHeaders: ['核心成分', '添加比例', '功效作用'],
    colKeys: ['ingredient', 'percentage', 'function'],
    auxLabel: '辅助成分',
    metric1: '活性物总含量',
    metric2: '防腐体系',
    metric3: 'pH值'
  },
  electronics: {
    sectionTitle: '技术方案',
    tableHeaders: ['核心模块', '规格占比', '功能作用'],
    colKeys: ['ingredient', 'percentage', 'function'],
    auxLabel: '辅助组件',
    metric1: '关键性能指标',
    metric2: '防护等级',
    metric3: '工作环境'
  },
  food: {
    sectionTitle: '原料配方',
    tableHeaders: ['核心原料', '配比', '功能作用'],
    colKeys: ['ingredient', 'percentage', 'function'],
    auxLabel: '辅助原料',
    metric1: '营养成分含量',
    metric2: '防腐保鲜方案',
    metric3: '酸碱度'
  },
  apparel: {
    sectionTitle: '材质方案',
    tableHeaders: ['核心材质', '配比', '功能作用'],
    colKeys: ['ingredient', 'percentage', 'function'],
    auxLabel: '辅助材质',
    metric1: '关键成分含量',
    metric2: '护理方式',
    metric3: '安全等级'
  },
  general: {
    sectionTitle: '组成方案',
    tableHeaders: ['核心组成部分', '占比', '功能作用'],
    colKeys: ['ingredient', 'percentage', 'function'],
    auxLabel: '辅助部分',
    metric1: '关键指标',
    metric2: '稳定性方案',
    metric3: '适用环境'
  }
}

// Map data keys to display keys for row rendering
const DATA_KEY_MAP = {
  ingredient: true,
  module: 'ingredient',
  material: 'ingredient',
  item: 'ingredient'
}

export default function ProductSpec() {
  const { category, selectedConcept, specData, setSpecData, setActiveModule, setLoading, loading, devProjects, updateDevProjects } = useApp()
  const [generating, setGenerating] = useState(false)

  const concept = selectedConcept
  const data = specData || defaultSpec

  // Determine category type for dynamic labels
  const catType = data?.categoryType || getCategoryType(category || data?.category)
  const labels = CATEGORY_LABEL_SETS[catType] || CATEGORY_LABEL_SETS.general

  // Helper: get display value from a row item, handling different data keys
  const getRowVal = (row, key) => {
    if (row[key] !== undefined) return row[key]
    // Try mapped alternatives
    if (key === 'ingredient') return row.ingredient || row.module || row.material || row.item || '—'
    return '—'
  }

  useEffect(() => {
    if (concept && !specData) {
      handleGenerate()
    }
  }, [])

  const handleGenerate = async () => {
    if (!concept) return
    setGenerating(true)
    setLoading(true)
    try {
      const result = await generateSpec(category, concept)
      setSpecData(result)
    } catch (err) {
      console.error('规格书生成失败:', err)
      setSpecData(defaultSpec)
    } finally {
      setGenerating(false)
      setLoading(false)
    }
  }

  const handleAddToDev = () => {
    if (!concept) return
    const project = createDevProject(concept, category)
    updateDevProjects([...devProjects, project])
    setActiveModule('dev')
  }

  if (!concept) {
    return (
      <div className="text-center py-20">
        <p className="text-ip-text-secondary mb-4">请先在创新工坊选择一个产品概念</p>
        <button onClick={() => setActiveModule('innolab')} className="ip-btn-primary">前往创新工坊</button>
      </div>
    )
  }

  if (generating) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="ip-loading mx-auto mb-4" style={{ width: 32, height: 32 }}></div>
          <p className="text-ip-text-secondary">AI正在生成产品规格书...</p>
          <p className="text-xs text-ip-text-tertiary mt-1">配方、包装、质量标准、合规要点</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 ip-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ip-text">产品规格书 — {data.productName || concept.name}</h2>
          <p className="text-sm text-ip-text-tertiary">规格日期: {data.specDate || '2026-07-03'}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveModule('innolab')} className="ip-btn-ghost text-sm">← 返回</button>
          <button onClick={handleGenerate} className="ip-btn-ghost text-sm">重新生成</button>
          <button onClick={handleAddToDev} className="ip-btn-primary text-sm">加入开发追踪 →</button>
        </div>
      </div>

      {/* Concept summary */}
      <div className="ip-card p-4 bg-ip-primary-light border-ip-primary/20">
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-ip-text-tertiary">产品定位</p>
            <p className="font-medium text-ip-text">{concept.tagline}</p>
          </div>
          <div>
            <p className="text-xs text-ip-text-tertiary">目标人群</p>
            <p className="font-medium text-ip-text">{concept.targetAudience?.age} {concept.targetAudience?.gender}</p>
          </div>
          <div>
            <p className="text-xs text-ip-text-tertiary">价格带</p>
            <p className="font-medium text-ip-text">{concept.priceRange}</p>
          </div>
          <div>
            <p className="text-xs text-ip-text-tertiary">USP</p>
            <p className="font-medium text-ip-text text-xs">{concept.usp}</p>
          </div>
        </div>
      </div>

      {/* Formulation — adaptive to category */}
      {data.formulation && (
        <div className="ip-card p-5">
          <h3 className="text-sm font-semibold text-ip-text mb-4">{labels.sectionTitle}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ip-border">
                  <th className="text-left py-2 px-3 text-xs text-ip-text-tertiary font-medium">{labels.tableHeaders[0]}</th>
                  <th className="text-left py-2 px-3 text-xs text-ip-text-tertiary font-medium">{labels.tableHeaders[1]}</th>
                  <th className="text-left py-2 px-3 text-xs text-ip-text-tertiary font-medium">{labels.tableHeaders[2]}</th>
                </tr>
              </thead>
              <tbody>
                {data.formulation.coreFormula?.map((f, i) => (
                  <tr key={i} className="border-b border-ip-border last:border-0">
                    <td className="py-2 px-3 text-ip-text font-medium">{getRowVal(f, labels.colKeys[0])}</td>
                    <td className="py-2 px-3 text-ip-text-secondary">{getRowVal(f, labels.colKeys[1])}</td>
                    <td className="py-2 px-3 text-ip-text-secondary">{getRowVal(f, labels.colKeys[2])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.formulation.auxiliaryFormula?.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-ip-text-tertiary mb-1">{labels.auxLabel}:</p>
              <div className="flex flex-wrap gap-1.5">
                {data.formulation.auxiliaryFormula.map((a, i) => (
                  <span key={i} className="ip-tag bg-ip-bg text-ip-text-secondary">{getRowVal(a, labels.colKeys[0])} ({a.function})</span>
                ))}
              </div>
            </div>
          )}
          <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
            <div><span className="text-ip-text-tertiary">{labels.metric1}:</span> <span className="font-medium text-ip-text">{data.formulation.totalActiveContent}</span></div>
            <div><span className="text-ip-text-tertiary">{labels.metric2}:</span> <span className="font-medium text-ip-text">{data.formulation.preservativeSystem}</span></div>
            <div><span className="text-ip-text-tertiary">{labels.metric3}:</span> <span className="font-medium text-ip-text">{data.formulation.phRange}</span></div>
          </div>
        </div>
      )}

      {/* Efficacy + Packaging */}
      <div className="grid grid-cols-2 gap-4">
        {data.efficacy && (
          <div className="ip-card p-5">
            <h3 className="text-sm font-semibold text-ip-text mb-3">功效宣称</h3>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-ip-text-tertiary mb-1">主要宣称</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.efficacy.primaryClaims?.map((c, i) => (
                    <span key={i} className="ip-tag bg-ip-primary-light text-ip-primary">{c}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-ip-text-tertiary mb-1">次要宣称</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.efficacy.secondaryClaims?.map((c, i) => (
                    <span key={i} className="ip-tag bg-ip-bg text-ip-text-secondary">{c}</span>
                  ))}
                </div>
              </div>
              <p className="text-xs text-ip-text-secondary mt-2"><strong>支撑数据:</strong> {data.efficacy.supportingData}</p>
              <p className="text-xs text-ip-warning mt-1"><strong>合规注意:</strong> {data.efficacy.complianceNote}</p>
            </div>
          </div>
        )}

        {data.packaging && (
          <div className="ip-card p-5">
            <h3 className="text-sm font-semibold text-ip-text mb-3">包装规格</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ip-text-tertiary">内包材</span>
                <span className="text-ip-text">{data.packaging.primaryPack?.material} · {data.packaging.primaryPack?.spec}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ip-text-tertiary">设计风格</span>
                <span className="text-ip-text">{data.packaging.primaryPack?.designStyle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ip-text-tertiary">外包材</span>
                <span className="text-ip-text">{data.packaging.secondaryPack?.material} · {data.packaging.secondaryPack?.spec}</span>
              </div>
              <div>
                <p className="text-xs text-ip-text-tertiary mb-1 mt-2">标签要求</p>
                <ul className="text-xs text-ip-text-secondary space-y-0.5">
                  {data.packaging.labelRequirements?.map((l, i) => <li key={i}>• {l}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cost + Pricing */}
      <div className="grid grid-cols-2 gap-4">
        {data.costEstimate && (
          <div className="ip-card p-5">
            <h3 className="text-sm font-semibold text-ip-text mb-3">成本预估</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-ip-text-tertiary">原料成本</span><span className="text-ip-text">{data.costEstimate.rawMaterial}</span></div>
              <div className="flex justify-between"><span className="text-ip-text-tertiary">包装成本</span><span className="text-ip-text">{data.costEstimate.packaging}</span></div>
              <div className="flex justify-between"><span className="text-ip-text-tertiary">加工费</span><span className="text-ip-text">{data.costEstimate.processing}</span></div>
              <div className="flex justify-between border-t border-ip-border pt-2 mt-2">
                <span className="font-medium text-ip-text">总成本</span>
                <span className="font-bold text-ip-primary">{data.costEstimate.totalCost}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ip-text-tertiary">成本等级</span>
                <span className="ip-tag bg-ip-warning-light text-ip-warning">{data.costEstimate.costLevel}</span>
              </div>
            </div>
          </div>
        )}

        {data.pricingStrategy && (
          <div className="ip-card p-5">
            <h3 className="text-sm font-semibold text-ip-text mb-3">定价策略</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-ip-text-tertiary">成本倍率</span><span className="text-ip-text">{data.pricingStrategy.costMultiplier}</span></div>
              <div className="flex justify-between"><span className="text-ip-text-tertiary">竞品锚点</span><span className="text-ip-text">{data.pricingStrategy.anchorPrice}</span></div>
              <div className="flex justify-between"><span className="text-ip-text-tertiary">溢价比例</span><span className="text-ip-text">{data.pricingStrategy.premiumRatio}</span></div>
              <div className="flex justify-between border-t border-ip-border pt-2 mt-2">
                <span className="font-medium text-ip-text">建议售价</span>
                <span className="font-bold text-ip-primary">{data.pricingStrategy.suggestedPrice}</span>
              </div>
              <p className="text-xs text-ip-text-secondary mt-2"><strong>溢价依据:</strong> {data.pricingStrategy.premiumBasis}</p>
            </div>
          </div>
        )}
      </div>

      {/* Quality + Compliance */}
      <div className="grid grid-cols-2 gap-4">
        {data.qualityStandard && (
          <div className="ip-card p-5">
            <h3 className="text-sm font-semibold text-ip-text mb-3">质量标准</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-ip-border">
                    <th className="text-left py-1.5 px-2 text-ip-text-tertiary font-medium">指标</th>
                    <th className="text-left py-1.5 px-2 text-ip-text-tertiary font-medium">标准</th>
                    <th className="text-left py-1.5 px-2 text-ip-text-tertiary font-medium">检测方法</th>
                  </tr>
                </thead>
                <tbody>
                  {data.qualityStandard.keyIndicators?.map((k, i) => (
                    <tr key={i} className="border-b border-ip-border last:border-0">
                      <td className="py-1.5 px-2 text-ip-text">{k.indicator}</td>
                      <td className="py-1.5 px-2 text-ip-text-secondary">{k.standard}</td>
                      <td className="py-1.5 px-2 text-ip-text-tertiary">{k.testMethod}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-xs flex gap-4">
              <span><span className="text-ip-text-tertiary">保质期:</span> <span className="text-ip-text">{data.qualityStandard.shelfLife}</span></span>
              <span><span className="text-ip-text-tertiary">储存:</span> <span className="text-ip-text">{data.qualityStandard.storageCondition}</span></span>
            </div>
          </div>
        )}

        {data.compliance && (
          <div className="ip-card p-5">
            <h3 className="text-sm font-semibold text-ip-text mb-3">合规要点</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-ip-text-tertiary">备案类型:</span>
                <span className="ip-tag bg-ip-primary-light text-ip-primary">{data.compliance.registrationType}</span>
              </div>
              <div>
                <p className="text-xs text-ip-text-tertiary mb-1">检测项目</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.compliance.testingRequired?.map((t, i) => (
                    <span key={i} className="ip-tag bg-ip-bg text-ip-text-secondary">{t}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-ip-text-tertiary mb-1">限用成分提醒</p>
                <ul className="text-xs text-ip-danger space-y-0.5">
                  {data.compliance.restrictedIngredients?.map((r, i) => <li key={i}>• {r}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Supplier direction */}
      {data.supplierDirection && (
        <div className="ip-card p-5">
          <h3 className="text-sm font-semibold text-ip-text mb-3">供应商建议方向</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-ip-text-tertiary mb-1">供应商类型</p>
              <p className="text-ip-text">{data.supplierDirection.supplierType}</p>
            </div>
            <div>
              <p className="text-xs text-ip-text-tertiary mb-1">寻源关键词</p>
              <div className="flex flex-wrap gap-1.5">
                {data.supplierDirection.sourcingKeywords?.map((k, i) => (
                  <span key={i} className="ip-tag bg-ip-accent-light text-ip-accent">{k}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-ip-text-tertiary mb-1">起订量预估</p>
              <p className="text-ip-text">{data.supplierDirection.moqEstimate}</p>
            </div>
            <div>
              <p className="text-xs text-ip-text-tertiary mb-1">交期预估</p>
              <p className="text-ip-text">{data.supplierDirection.leadTime}</p>
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="flex justify-center">
        <button onClick={handleAddToDev} className="ip-btn-primary text-base px-8 py-3">
          将此产品加入开发追踪 →
        </button>
      </div>
    </div>
  )
}
