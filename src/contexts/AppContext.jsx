import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { auth, dataApi } from '../utils/api'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  // 认证
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)

  // 工作流状态
  const [category, setCategory] = useState('')
  const [activeModule, setActiveModule] = useState('dashboard')
  const [trendData, setTrendData] = useState(null)
  const [concepts, setConcepts] = useState(null)
  const [selectedConcept, setSelectedConcept] = useState(null)
  const [specData, setSpecData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [progressText, setProgressText] = useState('')
  const [error, setError] = useState(null)

  // 云端持久化数据
  const [devProjects, setDevProjects] = useState([])
  const [inspirations, setInspirations] = useState([])
  const [analyses, setAnalyses] = useState([]) // 历史分析报告（摘要列表）

  const saveTimer = useRef({})

  // 启动时校验登录态
  useEffect(() => {
    const token = localStorage.getItem('inno_token')
    if (!token) { setAuthChecked(true); return }
    auth.verify()
      .then(async (d) => {
        setUser(d.user)
        try {
          const mine = await dataApi.me()
          setDevProjects(mine.data.projects || [])
          setInspirations(mine.data.inspirations || [])
          setAnalyses(mine.data.analyses || [])
        } catch { /* 忽略 */ }
      })
      .catch(() => localStorage.removeItem('inno_token'))
      .finally(() => setAuthChecked(true))
  }, [])

  const loginSuccess = useCallback((token, u) => {
    localStorage.setItem('inno_token', token)
    setUser(u)
    setDevProjects([]); setInspirations([]); setAnalyses([])
    dataApi.me().then(mine => {
      setDevProjects(mine.data.projects || [])
      setInspirations(mine.data.inspirations || [])
      setAnalyses(mine.data.analyses || [])
    }).catch(() => {})
  }, [])

  const logout = useCallback(() => {
    auth.logout()
    localStorage.removeItem('inno_token')
    setUser(null)
    setCategory(''); setTrendData(null); setConcepts(null)
    setSelectedConcept(null); setSpecData(null)
    setDevProjects([]); setInspirations([]); setAnalyses([])
    setActiveModule('dashboard')
  }, [])

  // 防抖保存到云端
  const debounceSave = useCallback((key, fn, payload) => {
    clearTimeout(saveTimer.current[key])
    saveTimer.current[key] = setTimeout(() => fn(payload).catch(() => {}), 600)
  }, [])

  const updateDevProjects = useCallback((projects) => {
    setDevProjects(projects)
    debounceSave('projects', dataApi.saveProjects, projects)
  }, [debounceSave])

  const updateInspirations = useCallback((items) => {
    setInspirations(items)
    debounceSave('inspirations', dataApi.saveInspirations, items)
  }, [debounceSave])

  const value = {
    user, authChecked, loginSuccess, logout,
    category, setCategory,
    activeModule, setActiveModule,
    trendData, setTrendData,
    concepts, setConcepts,
    selectedConcept, setSelectedConcept,
    specData, setSpecData,
    loading, setLoading,
    progressText, setProgressText,
    error, setError,
    devProjects, updateDevProjects,
    inspirations, updateInspirations,
    analyses, setAnalyses,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
