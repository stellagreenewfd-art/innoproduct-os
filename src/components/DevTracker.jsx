import { useState, useEffect } from 'react'
import { useApp } from '../contexts/AppContext'
import { createDevProject } from '../utils/defaultData'

const STAGE_STATUS = {
  not_started: { label: '未开始', color: 'bg-gray-100 text-gray-500', dot: 'not_started' },
  in_progress: { label: '进行中', color: 'bg-amber-50 text-amber-600', dot: 'in_progress' },
  completed: { label: '已完成', color: 'bg-green-50 text-green-600', dot: 'completed' },
  blocked: { label: '阻塞', color: 'bg-red-50 text-red-600', dot: 'blocked' },
}

function StageCard({ stage, index, onToggleTask, onUpdateStage }) {
  const [editing, setEditing] = useState(false)
  const [assignee, setAssignee] = useState(stage.assignee || '')
  const [notes, setNotes] = useState(stage.notes || '')
  const statusInfo = STAGE_STATUS[stage.status] || STAGE_STATUS.not_started
  const completedTasks = stage.tasks.filter(t => t.done).length
  const progress = stage.tasks.length > 0 ? Math.round((completedTasks / stage.tasks.length) * 100) : 0

  return (
    <div className="ip-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-ip-text-tertiary">阶段 {index + 1}</span>
          <h4 className="text-sm font-semibold text-ip-text">{stage.name}</h4>
        </div>
        <span className={`ip-tag ${statusInfo.color}`}><span className={`ip-stage-dot ${statusInfo.dot} mr-1.5`}></span>{statusInfo.label}</span>
      </div>
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-ip-text-tertiary">进度</span>
          <span className="text-ip-text font-medium">{progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-ip-bg rounded-full overflow-hidden">
          <div className="h-full bg-ip-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
      </div>
      <div className="space-y-1.5 mb-3">
        {stage.tasks.map((task, ti) => (
          <label key={ti} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={task.done} onChange={() => onToggleTask(index, ti)}
              className="w-4 h-4 rounded border-ip-border text-ip-primary focus:ring-ip-primary" />
            <span className={`text-sm ${task.done ? 'text-ip-text-tertiary line-through' : 'text-ip-text'}`}>{task.name}</span>
          </label>
        ))}
      </div>
      <div className="flex items-center gap-3 text-xs text-ip-text-tertiary mb-2">
        <span>{stage.startDate} → {stage.endDate}</span>
      </div>
      {editing ? (
        <div className="space-y-2 border-t border-ip-border pt-2">
          <input type="text" value={assignee} onChange={e => setAssignee(e.target.value)} placeholder="负责人" className="ip-input text-sm py-1.5" />
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="备注..." className="ip-input text-sm py-1.5 resize-none" rows={2} />
          <button onClick={() => { onUpdateStage(index, { assignee, notes }); setEditing(false) }} className="ip-btn-primary text-xs w-full py-1.5">保存</button>
        </div>
      ) : (
        <div className="border-t border-ip-border pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-ip-text-tertiary">负责人: {stage.assignee || '未指派'}</span>
            <button onClick={() => setEditing(true)} className="text-ip-primary hover:underline">{stage.assignee ? '编辑' : '指派'}</button>
          </div>
          {stage.notes && <p className="text-xs text-ip-text-secondary mt-1">{stage.notes}</p>}
        </div>
      )}
    </div>
  )
}

export default function DevTracker() {
  const { devProjects, updateDevProjects, selectedConcept, category, setActiveModule } = useApp()
  const [selectedProjectId, setSelectedProjectId] = useState(null)

  // 从创新工坊"加入开发"跳入时，自动为选中概念建项目
  useEffect(() => {
    if (selectedConcept && !devProjects.some(p => p.conceptId === selectedConcept.id && p.productName === selectedConcept.name)) {
      const project = createDevProject(selectedConcept, category)
      updateDevProjects([...devProjects, project])
      setSelectedProjectId(project.id)
    } else if (selectedConcept) {
      const p = devProjects.find(p => p.conceptId === selectedConcept.id)
      if (p) setSelectedProjectId(p.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConcept])

  const activeProject = selectedProjectId
    ? devProjects.find(p => p.id === selectedProjectId)
    : devProjects[devProjects.length - 1]

  const handleToggleTask = (stageIndex, taskIndex) => {
    if (!activeProject) return
    const updated = devProjects.map(p => {
      if (p.id !== activeProject.id) return p
      const stages = p.stages.map((s, si) => si === stageIndex ? { ...s, tasks: s.tasks.map((t, ti) => ti === taskIndex ? { ...t, done: !t.done } : t) } : s)
      const completed = stages[stageIndex].tasks.filter(t => t.done).length
      const total = stages[stageIndex].tasks.length
      if (completed === total) {
        stages[stageIndex].status = 'completed'
        if (stageIndex < stages.length - 1 && stages[stageIndex + 1].status === 'not_started') stages[stageIndex + 1].status = 'in_progress'
      } else if (completed > 0) {
        stages[stageIndex].status = 'in_progress'
      }
      return { ...p, stages, updatedAt: new Date().toISOString().slice(0, 10) }
    })
    updateDevProjects(updated)
  }

  const handleUpdateStage = (stageIndex, updates) => {
    if (!activeProject) return
    const updated = devProjects.map(p => {
      if (p.id !== activeProject.id) return p
      const stages = p.stages.map((s, si) => si === stageIndex ? { ...s, ...updates } : s)
      return { ...p, stages, updatedAt: new Date().toISOString().slice(0, 10) }
    })
    updateDevProjects(updated)
  }

  const handleDelete = (id) => {
    if (!window.confirm('确定删除这个开发项目？')) return
    updateDevProjects(devProjects.filter(p => p.id !== id))
    setSelectedProjectId(null)
  }

  if (devProjects.length === 0) {
    return (
      <div className="text-center py-20">
        <h3 className="text-lg font-semibold text-ip-text mb-2">还没有开发项目</h3>
        <p className="text-sm text-ip-text-secondary mb-4">在创新工坊选择产品概念后，可加入开发追踪</p>
        <button onClick={() => setActiveModule('input')} className="ip-btn-primary">开始分析品类</button>
      </div>
    )
  }

  return (
    <div className="space-y-6 ip-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ip-text">开发追踪器</h2>
          <p className="text-sm text-ip-text-tertiary">共 {devProjects.length} 个产品在开发中 · 云端自动保存</p>
        </div>
      </div>

      {devProjects.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 no-print">
          {devProjects.map(p => (
            <button key={p.id} onClick={() => setSelectedProjectId(p.id)}
              className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all ${
                activeProject?.id === p.id ? 'bg-ip-primary text-white' : 'bg-white border border-ip-border text-ip-text-secondary hover:border-ip-primary'
              }`}>
              {p.productName}
            </button>
          ))}
        </div>
      )}

      {activeProject && (
        <>
          <div className="ip-card p-4 bg-ip-primary-light border-ip-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-ip-text">{activeProject.productName}</h3>
                <p className="text-sm text-ip-text-secondary">{activeProject.tagline}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-ip-text-tertiary">创建日期</p>
                  <p className="text-sm font-medium text-ip-text">{activeProject.createdAt}</p>
                </div>
                <button onClick={() => handleDelete(activeProject.id)} className="text-xs text-ip-text-tertiary hover:text-ip-danger no-print">删除</button>
              </div>
            </div>
          </div>

          {(() => {
            const allTasks = activeProject.stages.flatMap(s => s.tasks)
            const completedTasks = allTasks.filter(t => t.done).length
            const overallProgress = Math.round((completedTasks / allTasks.length) * 100)
            const currentStage = activeProject.stages.find(s => s.status === 'in_progress')
            return (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-ip-surface border border-ip-border rounded-lg p-3 text-center">
                  <p className="text-xs text-ip-text-tertiary mb-1">总进度</p>
                  <p className="text-2xl font-bold text-ip-primary">{overallProgress}%</p>
                </div>
                <div className="bg-ip-surface border border-ip-border rounded-lg p-3 text-center">
                  <p className="text-xs text-ip-text-tertiary mb-1">当前阶段</p>
                  <p className="text-base font-semibold text-ip-text">{currentStage?.name || '已完成'}</p>
                </div>
                <div className="bg-ip-surface border border-ip-border rounded-lg p-3 text-center">
                  <p className="text-xs text-ip-text-tertiary mb-1">完成/总任务</p>
                  <p className="text-base font-semibold text-ip-text">{completedTasks}/{allTasks.length}</p>
                </div>
              </div>
            )
          })()}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeProject.stages.map((stage, index) => (
              <StageCard key={index} stage={stage} index={index} onToggleTask={handleToggleTask} onUpdateStage={handleUpdateStage} />
            ))}
          </div>

          <div className="ip-card p-5">
            <h3 className="text-sm font-semibold text-ip-text mb-4">甘特图视图</h3>
            <div className="space-y-2">
              {activeProject.stages.map((stage, index) => {
                const start = new Date(stage.startDate)
                const end = new Date(stage.endDate)
                const totalDays = Math.round((end - start) / 86400000)
                const projectStart = new Date(activeProject.stages[0].startDate)
                const projectEnd = new Date(activeProject.stages[activeProject.stages.length - 1].endDate)
                const projectTotalDays = Math.max(1, Math.round((projectEnd - projectStart) / 86400000))
                const offsetPercent = Math.round(Math.round((start - projectStart) / 86400000) / projectTotalDays * 100)
                const widthPercent = Math.max(3, Math.round(totalDays / projectTotalDays * 100))
                const statusColor = stage.status === 'completed' ? 'bg-green-500' : stage.status === 'in_progress' ? 'bg-amber-500' : 'bg-gray-300'
                return (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-24 text-xs text-ip-text-secondary text-right shrink-0">{stage.name}</div>
                    <div className="flex-1 relative h-7 bg-ip-bg rounded">
                      <div className={`absolute h-7 rounded ${statusColor} flex items-center px-2`} style={{ left: `${offsetPercent}%`, width: `${widthPercent}%` }}>
                        <span className="text-xs text-white font-medium whitespace-nowrap">{totalDays}天</span>
                      </div>
                    </div>
                    <div className="w-20 text-xs text-ip-text-tertiary shrink-0 hidden sm:block">{stage.startDate}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
