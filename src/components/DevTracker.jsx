import { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { DEV_STAGES } from '../utils/defaultData'

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
  const totalTasks = stage.tasks.length
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="ip-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-ip-text-tertiary">阶段 {index + 1}</span>
          <h4 className="text-sm font-semibold text-ip-text">{stage.name}</h4>
        </div>
        <span className={`ip-tag ${statusInfo.color}`}>
          <span className={`ip-stage-dot ${statusInfo.dot} mr-1.5`}></span>
          {statusInfo.label}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-ip-text-tertiary">进度</span>
          <span className="text-ip-text font-medium">{progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-ip-bg rounded-full overflow-hidden">
          <div className="h-full bg-ip-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      {/* Tasks */}
      <div className="space-y-1.5 mb-3">
        {stage.tasks.map((task, ti) => (
          <label key={ti} className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={task.done}
              onChange={() => onToggleTask(index, ti)}
              className="w-4 h-4 rounded border-ip-border text-ip-primary focus:ring-ip-primary"
            />
            <span className={`text-sm ${task.done ? 'text-ip-text-tertiary line-through' : 'text-ip-text'}`}>
              {task.name}
            </span>
          </label>
        ))}
      </div>

      {/* Dates */}
      <div className="flex items-center gap-3 text-xs text-ip-text-tertiary mb-2">
        <span>{stage.startDate} → {stage.endDate}</span>
      </div>

      {/* Editable fields */}
      {editing ? (
        <div className="space-y-2 border-t border-ip-border pt-2">
          <input
            type="text"
            value={assignee}
            onChange={e => setAssignee(e.target.value)}
            placeholder="负责人"
            className="ip-input text-sm py-1.5"
          />
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="备注..."
            className="ip-input text-sm py-1.5 resize-none"
            rows={2}
          />
          <button
            onClick={() => {
              onUpdateStage(index, { assignee, notes })
              setEditing(false)
            }}
            className="ip-btn-primary text-xs w-full py-1.5"
          >
            保存
          </button>
        </div>
      ) : (
        <div className="border-t border-ip-border pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-ip-text-tertiary">
              负责人: {stage.assignee || <span className="text-ip-text-tertiary">未指派</span>}
            </span>
            <button onClick={() => setEditing(true)} className="text-ip-primary hover:underline">
              {stage.assignee ? '编辑' : '指派'}
            </button>
          </div>
          {stage.notes && <p className="text-xs text-ip-text-secondary mt-1">{stage.notes}</p>}
        </div>
      )}
    </div>
  )
}

export default function DevTracker() {
  const { devProjects, updateDevProjects, selectedConcept, category } = useApp()
  const [selectedProjectId, setSelectedProjectId] = useState(null)

  // If a concept was just selected, find or create its project
  const activeProject = selectedProjectId
    ? devProjects.find(p => p.id === selectedProjectId)
    : devProjects[devProjects.length - 1]

  const handleToggleTask = (stageIndex, taskIndex) => {
    if (!activeProject) return
    const updated = devProjects.map(p => {
      if (p.id !== activeProject.id) return p
      const stages = [...p.stages]
      stages[stageIndex].tasks[taskIndex].done = !stages[stageIndex].tasks[taskIndex].done
      // Update stage status based on tasks
      const completed = stages[stageIndex].tasks.filter(t => t.done).length
      const total = stages[stageIndex].tasks.length
      if (completed === total) {
        stages[stageIndex].status = 'completed'
        if (stageIndex < stages.length - 1) {
          stages[stageIndex + 1].status = 'in_progress'
        }
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
      const stages = [...p.stages]
      stages[stageIndex] = { ...stages[stageIndex], ...updates }
      return { ...p, stages, updatedAt: new Date().toISOString().slice(0, 10) }
    })
    updateDevProjects(updated)
  }

  if (devProjects.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-ip-bg mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-ip-text mb-2">还没有开发项目</h3>
        <p className="text-sm text-ip-text-secondary mb-4">在创新工坊选择产品概念后，可加入开发追踪</p>
        <button onClick={() => window.location.hash = '#innolab'} className="ip-btn-primary">前往创新工坊</button>
      </div>
    )
  }

  return (
    <div className="space-y-6 ip-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ip-text">开发追踪器</h2>
          <p className="text-sm text-ip-text-tertiary">共 {devProjects.length} 个产品在开发中</p>
        </div>
      </div>

      {/* Project selector */}
      {devProjects.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {devProjects.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedProjectId(p.id)}
              className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all ${
                activeProject?.id === p.id
                  ? 'bg-ip-primary text-white'
                  : 'bg-white border border-ip-border text-ip-text-secondary hover:border-ip-primary'
              }`}
            >
              {p.productName}
            </button>
          ))}
        </div>
      )}

      {/* Active project */}
      {activeProject && (
        <>
          {/* Project info */}
          <div className="ip-card p-4 bg-ip-primary-light border-ip-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-ip-text">{activeProject.productName}</h3>
                <p className="text-sm text-ip-text-secondary">{activeProject.tagline}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-ip-text-tertiary">创建日期</p>
                <p className="text-sm font-medium text-ip-text">{activeProject.createdAt}</p>
              </div>
            </div>
          </div>

          {/* Overall progress */}
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

          {/* Stage cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeProject.stages.map((stage, index) => (
              <StageCard
                key={index}
                stage={stage}
                index={index}
                onToggleTask={handleToggleTask}
                onUpdateStage={handleUpdateStage}
              />
            ))}
          </div>

          {/* Timeline view */}
          <div className="ip-card p-5">
            <h3 className="text-sm font-semibold text-ip-text mb-4">甘特图视图</h3>
            <div className="space-y-2">
              {activeProject.stages.map((stage, index) => {
                const start = new Date(stage.startDate)
                const end = new Date(stage.endDate)
                const totalDays = Math.round((end - start) / (1000 * 60 * 60 * 24))
                const projectStart = new Date(activeProject.stages[0].startDate)
                const projectEnd = new Date(activeProject.stages[activeProject.stages.length - 1].endDate)
                const projectTotalDays = Math.round((projectEnd - projectStart) / (1000 * 60 * 60 * 24))
                const offsetPercent = Math.round(((start - projectStart) / (1000 * 60 * 60 * 24)) / projectTotalDays * 100)
                const widthPercent = Math.round(totalDays / projectTotalDays * 100)
                const statusColor = stage.status === 'completed' ? 'bg-green-500' : stage.status === 'in_progress' ? 'bg-amber-500' : 'bg-gray-300'

                return (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-24 text-xs text-ip-text-secondary text-right shrink-0">{stage.name}</div>
                    <div className="flex-1 relative h-7 bg-ip-bg rounded">
                      <div
                        className={`absolute h-7 rounded ${statusColor} flex items-center px-2`}
                        style={{ left: `${offsetPercent}%`, width: `${widthPercent}%` }}
                      >
                        <span className="text-xs text-white font-medium">{totalDays}天</span>
                      </div>
                    </div>
                    <div className="w-20 text-xs text-ip-text-tertiary shrink-0">{stage.startDate}</div>
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
