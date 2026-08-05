import { useState, useEffect } from 'react'
import { useApp } from '../contexts/AppContext'
import { ai } from '../utils/api'
import { defaultSpec, createDevProject } from '../utils/defaultData'

function getCategoryType(category) {
  if (!category) return 'general'
  const P = {
    cosmetics: ['面膜','精华','面霜','护肤','防晒','化妆','水乳','眼霜','洁面','乳液','爽肤水','粉底','口红','彩妆'],
    electronics: ['手机','耳机','眼镜','智能','电脑','电子','笔记本','平板','手表','穿戴','音箱','机器人','无人机','芯片'],
    food: ['咖啡','饮料','食品','零食','茶','果汁','奶','酒','啤酒','巧克力','饼干','面包','燕麦','益生菌'],
    apparel: ['服装','鞋','帽','服饰','衣','裤子','裙子','外套','内衣','袜子','面料','纺织','棉','丝']
  }
  for (const [type, ps] of Object.entries(P)) for (const p of ps) if (category.includes(p)) return type
  return 'general'
}

const CATEGORY_LABEL_SETS = {
  cosmetics: { sectionTitle: '配方方案', metric1: '活性物总含量', metric2: '防腐体系', metric3: 'pH值' },
  electronics: { sectionTitle: '技术方案', metric1: '关键性能指标', metric2: '防护等级', metric3: '工作环境' },
  food: { sectionTitle: '原料配方', metric1: '营养成分含量', metric2: '防腐保鲜方案', metric3: '酸碱度' },
  apparel: { sectionTitle: '材质方案', metric1: '关键成分含量', metric2: '护理方式', metric3: '安全等级' },
  general: { sectionTitle: '组成方案', metric1: '关键指标', metric2: '稳定性方案', metric3: '适用环境' }
}

export default function ProductSpec() {
  const { category, selectedConcept, specData, setSpecData, setActiveModule, devProjects, updateDevProjects } = useApp()
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState(null)

  const concept = selectedConcept
  const data = specData || (concept ? null : defaultSpec)
  const labels = CATEGORY_LABEL_SETS[getCategoryType(category || data?.category)] || CATEGORY_LABEL_SETS.general

  useEffect(() => {
    if (concept && !specData) handleGenerate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleGenerate = async () => {
    if (!concept) return
    setGenerating(true)
    setGenError(null)
    try {
      const d = await ai.spec(category, concept)
      setSpecData(d.data)
    } catch (err) {
      setGenError('规格书生成失败: ' + err.message + '，已展示示例结构')
      setSpecData({ ...defaultSpec, productName: concept.name, category })
    } finally {
      setGenerating(false)
    }
  }

  const handleAddToDev = () => {
    if (!concept) return
    if (devProjects.some(p => p.conceptId === concept.id && p.productName === concept.name)) {
      setActiveModule('dev')
      return
    }
    const project = createDevProject(concept, category)
    updateDevProjects([...devProjects, project])
    setActiveModule('dev')
  }

  const exportMarkdown = () => {
    if (!data) return
    const L = []
    L.push(`# 产品规格书：${data.productName}`, '')
    L.push(`- 品类：${data.category}　- 日期：${data.specDate}`)
    if (concept) L.push(`- 定位：${concept.tagline}　- 建议价格：${concept.priceRange}`, '')
    if (data.formulation) {
      L.push('## 配方方案', '| 成分 | 比例 | 功效 |', '|---|---|---|')
      data.formulation.coreFormula?.forEach(f => L.push(`| ${f.ingredient} | ${f.percentage} | ${f.function} |`))
      L.push('')
    }
    if (data.costEstimate) L.push('## 成本预估', `- 总成本：${data.costEstimate.totalCost}`, '')
    if (data.pricingStrategy) L.push('## 定价策略', `- 建议售价：${data.pricingStrategy.suggestedPrice}（锚点：${data.pricingStrategy.anchorPrice}）`, '')
    if (data.unitEconomics) L.push('## 财务测算', `- 假设：${data.unitEconomics.assumptions}`, `- 毛利率：${data.unitEconomics.grossMarginPct}%`, `- 盈亏平衡：${data.unitEconomics.breakevenMonthlyVolume}`, `- 首年营收：${data.unitEconomics.yearOneRevenueRange}`, '')
    if (data.launchPlan?.phases) {
      L.push('## 上市计划')
      data.launchPlan.phases.forEach(p => L.push(`### ${p.name}（${p.duration}）`, ...(p.actions || []).map(a => `- ${a}`), `**KPI**：${p.kpi}`, ''))
    }
    if (data.compliance) L.push('## 合规要点', `- 备案类型：${data.compliance.registrationType}`, `- 检测：${(data.compliance.testingRequired || []).join('、')}`, '')
    if (data.supplierDirection) L.push('## 供应商方向', `- 类型：${data.supplierDirection.supplierType}`, `- 起订量：${data.supplierDirection.moqEstimate}　- 交期：${data.supplierDirection.leadTime}`)
    const blob = new Blob([L.join('\n')], { type: 'text/markdown;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `产品规格书-${data.productName || '未命名'}.md`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  if (!concept) {
    return (
      <div className="text-center py-20">
        <p className="text-ip-text-secondary mb-4">请先在创新工坊选择一个产品概念</p>
        <button onClick={() => setActiveModule('innolab')} className="ip-btn-primary">前往创新工坊</button>
      </div>
    )
  }

  if (generating || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="ip-loading mx-auto mb-4" style={{ width: 32, height: 32 }}></div>
          <p className="text-ip-text-secondary">AI正在生成产品规格书...</p>
          <p className="text-xs text-ip-text-tertiary mt-1">配方、包装、质量标准、财务测算、上市计划，约需40秒</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 ip-fade-in">
      <div className="flex items-center justify-between no-print">
        <div>
          <h2 className="text-lg font-semibold text-ip-text">产品规格书 — {data.productName || concept.name}</h2>
          <p className="text-sm text-ip-text-tertiary">规格日期: {data.specDate || '-'}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveModule('innolab')} className="ip-btn-ghost text-sm">← 返回</button>
          <button onClick={handleGenerate} className="ip-btn-ghost text-sm">重新生成</button>
          <button onClick={exportMarkdown} className="ip-btn-ghost text-sm">导出 Markdown</button>
          <button onClick={() => window.print()} className="ip-btn-ghost text-sm">打印/PDF</button>
          <button onClick={handleAddToDev} className="ip-btn-primary text-sm">加入开发追踪 →</button>
        </div>
      </div>

      {genError && <div className="p-3 rounded-lg bg-ip-warning-light text-ip-warning text-sm no-print">{genError}</div>}

      {/* 概念摘要 */}
      <div className="ip-card p-4 bg-ip-primary-light border-ip-primary/20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><p className="text-xs text-ip-text-tertiary">产品定位</p><p className="font-medium text-ip-text">{concept.tagline}</p></div>
          <div><p className="text-xs text-ip-text-tertiary">目标人群</p><p className="font-medium text-ip-text">{concept.targetAudience?.age} {concept.targetAudience?.gender}</p></div>
          <div><p className="text-xs text-ip-text-tertiary">价格带</p><p className="font-medium text-ip-text">{concept.priceRange}</p></div>
          <div><p className="text-xs text-ip-text-tertiary">USP</p><p className="font-medium text-ip-text text-xs">{concept.usp}</p></div>
        </div>
      </div>

      {/* 配方 */}
      {data.formulation && (
        <div className="ip-card p-5">
          <h3 className="text-sm font-semibold text-ip-text mb-4">{labels.sectionTitle}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ip-border">
                  <th className="text-left py-2 px-3 text-xs text-ip-text-tertiary font-medium">核心成分</th>
                  <th className="text-left py-2 px-3 text-xs text-ip-text-tertiary font-medium">添加比例</th>
                  <th className="text-left py-2 px-3 text-xs text-ip-text-tertiary font-medium">功效作用</th>
                </tr>
              </thead>
              <tbody>
                {data.formulation.coreFormula?.map((f, i) => (
                  <tr key={i} className="border-b border-ip-border last:border-0">
                    <td className="py-2 px-3 text-ip-text font-medium">{f.ingredient || f.module || f.material || '—'}</td>
                    <td className="py-2 px-3 text-ip-text-secondary">{f.percentage || '—'}</td>
                    <td className="py-2 px-3 text-ip-text-secondary">{f.function || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.formulation.auxiliaryFormula?.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-ip-text-tertiary mb-1">辅助成分:</p>
              <div className="flex flex-wrap gap-1.5">
                {data.formulation.auxiliaryFormula.map((a, i) => (
                  <span key={i} className="ip-tag bg-ip-bg text-ip-text-secondary">{a.ingredient || a.module || a.material} ({a.function})</span>
                ))}
              </div>
            </div>
          )}
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div><span className="text-ip-text-tertiary">{labels.metric1}:</span> <span className="font-medium text-ip-text">{data.formulation.totalActiveContent}</span></div>
            <div><span className="text-ip-text-tertiary">{labels.metric2}:</span> <span className="font-medium text-ip-text">{data.formulation.preservativeSystem}</span></div>
            <div><span className="text-ip-text-tertiary">{labels.metric3}:</span> <span className="font-medium text-ip-text">{data.formulation.phRange}</span></div>
          </div>
        </div>
      )}

      {/* 功效 + 包装 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.efficacy && (
          <div className="ip-card p-5">
            <h3 className="text-sm font-semibold text-ip-text mb-3">功效宣称</h3>
            <p className="text-xs text-ip-text-tertiary mb-1">主要宣称</p>
            <div className="flex flex-wrap gap-1.5 mb-2">{data.efficacy.primaryClaims?.map((c, i) => <span key={i} className="ip-tag bg-ip-primary-light text-ip-primary">{c}</span>)}</div>
            <p className="text-xs text-ip-text-tertiary mb-1">次要宣称</p>
            <div className="flex flex-wrap gap-1.5 mb-2">{data.efficacy.secondaryClaims?.map((c, i) => <span key={i} className="ip-tag bg-ip-bg text-ip-text-secondary">{c}</span>)}</div>
            <p className="text-xs text-ip-text-secondary"><strong>支撑数据:</strong> {data.efficacy.supportingData}</p>
            <p className="text-xs text-ip-warning mt-1"><strong>合规注意:</strong> {data.efficacy.complianceNote}</p>
          </div>
        )}
        {data.packaging && (
          <div className="ip-card p-5">
            <h3 className="text-sm font-semibold text-ip-text mb-3">包装规格</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-ip-text-tertiary">内包材</span><span className="text-ip-text">{data.packaging.primaryPack?.material} · {data.packaging.primaryPack?.spec}</span></div>
              <div className="flex justify-between"><span className="text-ip-text-tertiary">设计风格</span><span className="text-ip-text">{data.packaging.primaryPack?.designStyle}</span></div>
              <div className="flex justify-between"><span className="text-ip-text-tertiary">外包材</span><span className="text-ip-text">{data.packaging.secondaryPack?.material} · {data.packaging.secondaryPack?.spec}</span></div>
              <div>
                <p className="text-xs text-ip-text-tertiary mb-1 mt-2">标签要求</p>
                <ul className="text-xs text-ip-text-secondary space-y-0.5">{data.packaging.labelRequirements?.map((l, i) => <li key={i}>• {l}</li>)}</ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 成本 + 定价 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.costEstimate && (
          <div className="ip-card p-5">
            <h3 className="text-sm font-semibold text-ip-text mb-3">成本预估</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-ip-text-tertiary">原料成本</span><span className="text-ip-text">{data.costEstimate.rawMaterial}</span></div>
              <div className="flex justify-between"><span className="text-ip-text-tertiary">包装成本</span><span className="text-ip-text">{data.costEstimate.packaging}</span></div>
              <div className="flex justify-between"><span className="text-ip-text-tertiary">加工费</span><span className="text-ip-text">{data.costEstimate.processing}</span></div>
              <div className="flex justify-between border-t border-ip-border pt-2 mt-2"><span className="font-medium text-ip-text">总成本</span><span className="font-bold text-ip-primary">{data.costEstimate.totalCost}</span></div>
            </div>
          </div>
        )}
        {data.pricingStrategy && (
          <div className="ip-card p-5">
            <h3 className="text-sm font-semibold text-ip-text mb-3">定价策略</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-ip-text-tertiary">成本倍率</span><span className="text-ip-text">{data.pricingStrategy.costMultiplier}</span></div>
              <div className="flex justify-between"><span className="text-ip-text-tertiary">竞品锚点</span><span className="text-ip-text">{data.pricingStrategy.anchorPrice}</span></div>
              <div className="flex justify-between border-t border-ip-border pt-2 mt-2"><span className="font-medium text-ip-text">建议售价</span><span className="font-bold text-ip-primary">{data.pricingStrategy.suggestedPrice}</span></div>
              <p className="text-xs text-ip-text-secondary mt-2"><strong>溢价依据:</strong> {data.pricingStrategy.premiumBasis}</p>
            </div>
          </div>
        )}
      </div>

      {/* 财务测算（新增） */}
      {data.unitEconomics && (
        <div className="ip-card p-5 border-l-4 border-l-ip-primary">
          <h3 className="text-sm font-semibold text-ip-text mb-3">💰 单位经济模型测算</h3>
          <p className="text-xs text-ip-text-tertiary mb-3">假设：{data.unitEconomics.assumptions}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-ip-bg rounded-lg p-3 text-center">
              <p className="text-xs text-ip-text-tertiary">毛利率</p>
              <p className="text-xl font-bold text-ip-primary">{data.unitEconomics.grossMarginPct}%</p>
            </div>
            <div className="bg-ip-bg rounded-lg p-3 text-center">
              <p className="text-xs text-ip-text-tertiary">渠道费用占比</p>
              <p className="text-xl font-bold text-ip-text">{data.unitEconomics.channelFeePct}%</p>
            </div>
            <div className="bg-ip-bg rounded-lg p-3 text-center">
              <p className="text-xs text-ip-text-tertiary">月盈亏平衡</p>
              <p className="text-base font-bold text-ip-text">{data.unitEconomics.breakevenMonthlyVolume}</p>
            </div>
            <div className="bg-ip-bg rounded-lg p-3 text-center">
              <p className="text-xs text-ip-text-tertiary">首年营收区间</p>
              <p className="text-base font-bold text-ip-text">{data.unitEconomics.yearOneRevenueRange}</p>
            </div>
          </div>
          <p className="text-xs text-ip-text-tertiary mt-2">营销费用建议：{data.unitEconomics.marketingFeePct} · {data.unitEconomics.note}</p>
        </div>
      )}

      {/* 上市计划（新增） */}
      {data.launchPlan?.phases?.length > 0 && (
        <div className="ip-card p-5">
          <h3 className="text-sm font-semibold text-ip-text mb-4">🚀 上市作战计划</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {data.launchPlan.phases.map((p, i) => (
              <div key={i} className="border border-ip-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-ip-primary text-white text-xs flex items-center justify-center font-bold">{i + 1}</span>
                  <div>
                    <p className="text-sm font-semibold text-ip-text">{p.name}</p>
                    <p className="text-xs text-ip-text-tertiary">{p.duration}</p>
                  </div>
                </div>
                <ul className="text-xs text-ip-text-secondary space-y-1 mb-2">
                  {(p.actions || []).map((a, j) => <li key={j}>• {a}</li>)}
                </ul>
                <p className="text-xs p-2 rounded bg-ip-success-light text-ip-success"><strong>KPI：</strong>{p.kpi}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 rounded bg-ip-bg"><span className="text-ip-text-tertiary">首发渠道：</span><span className="text-ip-text">{(data.launchPlan.channels || []).join('、')}</span></div>
            <div className="p-2.5 rounded bg-ip-bg"><span className="text-ip-text-tertiary">种草策略：</span><span className="text-ip-text">{data.launchPlan.contentSeeding}</span></div>
            <div className="p-2.5 rounded bg-ip-bg"><span className="text-ip-text-tertiary">预算分配：</span><span className="text-ip-text">{data.launchPlan.budgetSplit}</span></div>
          </div>
        </div>
      )}

      {/* 质量 + 合规 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.qualityStandard && (
          <div className="ip-card p-5">
            <h3 className="text-sm font-semibold text-ip-text mb-3">质量标准</h3>
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
              <div className="flex items-center gap-2"><span className="text-ip-text-tertiary">备案类型:</span><span className="ip-tag bg-ip-primary-light text-ip-primary">{data.compliance.registrationType}</span></div>
              <div>
                <p className="text-xs text-ip-text-tertiary mb-1">检测项目</p>
                <div className="flex flex-wrap gap-1.5">{data.compliance.testingRequired?.map((t, i) => <span key={i} className="ip-tag bg-ip-bg text-ip-text-secondary">{t}</span>)}</div>
              </div>
              <div>
                <p className="text-xs text-ip-text-tertiary mb-1">限用成分提醒</p>
                <ul className="text-xs text-ip-danger space-y-0.5">{data.compliance.restrictedIngredients?.map((r, i) => <li key={i}>• {r}</li>)}</ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 供应商 */}
      {data.supplierDirection && (
        <div className="ip-card p-5">
          <h3 className="text-sm font-semibold text-ip-text mb-3">供应商建议方向</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><p className="text-xs text-ip-text-tertiary mb-1">供应商类型</p><p className="text-ip-text">{data.supplierDirection.supplierType}</p></div>
            <div>
              <p className="text-xs text-ip-text-tertiary mb-1">寻源关键词</p>
              <div className="flex flex-wrap gap-1.5">{data.supplierDirection.sourcingKeywords?.map((k, i) => <span key={i} className="ip-tag bg-ip-accent-light text-ip-accent">{k}</span>)}</div>
            </div>
            <div><p className="text-xs text-ip-text-tertiary mb-1">起订量预估</p><p className="text-ip-text">{data.supplierDirection.moqEstimate}</p></div>
            <div><p className="text-xs text-ip-text-tertiary mb-1">交期预估</p><p className="text-ip-text">{data.supplierDirection.leadTime}</p></div>
          </div>
        </div>
      )}

      <div className="flex justify-center no-print">
        <button onClick={handleAddToDev} className="ip-btn-primary text-base px-8 py-3">将此产品加入开发追踪 →</button>
      </div>
    </div>
  )
}
