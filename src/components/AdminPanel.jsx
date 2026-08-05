import { useState, useEffect } from 'react'
import { adminApi } from '../utils/api'

export default function AdminPanel() {
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState([])
  const [records, setRecords] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([adminApi.users(), adminApi.allRecords()])
      .then(([u, r]) => { setUsers(u.users || []); setRecords(r.records || []) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><div className="ip-loading" style={{ width: 28, height: 28 }}></div></div>
  if (error) return <div className="p-4 rounded-lg bg-ip-danger-light text-ip-danger text-sm">{error}</div>

  const totalAnalyses = users.reduce((s, u) => s + (u.analysisCount || 0), 0)
  const totalProjects = users.reduce((s, u) => s + (u.projectCount || 0), 0)

  return (
    <div className="space-y-6 ip-fade-in">
      <div>
        <h2 className="text-lg font-semibold text-ip-text">管理后台</h2>
        <p className="text-sm text-ip-text-tertiary">用户与使用数据总览</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: '注册用户', value: users.length, color: 'text-ip-primary' },
          { label: '分析记录', value: records.length, color: 'text-ip-accent' },
          { label: '云端分析报告', value: totalAnalyses, color: 'text-ip-success' },
          { label: '开发项目', value: totalProjects, color: 'text-ip-warning' },
        ].map((s, i) => (
          <div key={i} className="bg-ip-surface border border-ip-border rounded-lg p-3 text-center">
            <p className="text-xs text-ip-text-tertiary mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-b border-ip-border">
        {[['users', `用户 (${users.length})`], ['records', `使用记录 (${records.length})`]].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === k ? 'border-ip-primary text-ip-primary' : 'border-transparent text-ip-text-secondary'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'users' ? (
        <div className="ip-card p-5 overflow-x-auto">
          <table className="w-full text-xs min-w-[720px]">
            <thead>
              <tr className="border-b border-ip-border text-left">
                <th className="p-2 text-ip-text-tertiary font-medium">用户名</th>
                <th className="p-2 text-ip-text-tertiary font-medium">手机号</th>
                <th className="p-2 text-ip-text-tertiary font-medium">公司</th>
                <th className="p-2 text-ip-text-tertiary font-medium">品类方向</th>
                <th className="p-2 text-ip-text-tertiary font-medium">注册时间</th>
                <th className="p-2 text-ip-text-tertiary font-medium">最近登录</th>
                <th className="p-2 text-ip-text-tertiary font-medium text-right">分析/报告/项目</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-ip-border last:border-0">
                  <td className="p-2 font-medium text-ip-text">{u.username}{u.username === 'qaq' && <span className="ml-1 ip-tag bg-ip-warning-light text-ip-warning">管理员</span>}</td>
                  <td className="p-2 text-ip-text-secondary">{u.phone || '-'}</td>
                  <td className="p-2 text-ip-text-secondary">{u.company || '-'}</td>
                  <td className="p-2 text-ip-text-secondary">{u.industry || '-'}</td>
                  <td className="p-2 text-ip-text-tertiary">{u.createdAt?.slice(0, 10)}</td>
                  <td className="p-2 text-ip-text-tertiary">{u.lastLogin?.slice(0, 10)}</td>
                  <td className="p-2 text-right text-ip-text-secondary">{u.recordCount} / {u.analysisCount} / {u.projectCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="ip-card p-5 overflow-x-auto">
          <table className="w-full text-xs min-w-[560px]">
            <thead>
              <tr className="border-b border-ip-border text-left">
                <th className="p-2 text-ip-text-tertiary font-medium">时间</th>
                <th className="p-2 text-ip-text-tertiary font-medium">用户</th>
                <th className="p-2 text-ip-text-tertiary font-medium">公司</th>
                <th className="p-2 text-ip-text-tertiary font-medium">品类</th>
                <th className="p-2 text-ip-text-tertiary font-medium">结果</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id} className="border-b border-ip-border last:border-0">
                  <td className="p-2 text-ip-text-tertiary whitespace-nowrap">{r.createdAt?.slice(0, 16).replace('T', ' ')}</td>
                  <td className="p-2 font-medium text-ip-text">{r.username}</td>
                  <td className="p-2 text-ip-text-secondary">{r.company || '-'}</td>
                  <td className="p-2 text-ip-text">{r.category}</td>
                  <td className="p-2 text-ip-text-secondary truncate max-w-[200px]">{r.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
