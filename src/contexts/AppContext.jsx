import { createContext, useContext, useState, useCallback } from 'react'
import { loadData, saveData } from '../utils/storage'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [category, setCategory] = useState('')
  const [activeModule, setActiveModule] = useState('input')
  const [trendData, setTrendData] = useState(null)
  const [concepts, setConcepts] = useState(null)
  const [selectedConcept, setSelectedConcept] = useState(null)
  const [specData, setSpecData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [devProjects, setDevProjects] = useState(() => loadData('devProjects', []))
  const [inspirations, setInspirations] = useState(() => loadData('inspirations', []))

  const updateDevProjects = useCallback((projects) => {
    setDevProjects(projects)
    saveData('devProjects', projects)
  }, [])

  const updateInspirations = useCallback((items) => {
    setInspirations(items)
    saveData('inspirations', items)
  }, [])

  const value = {
    category, setCategory,
    activeModule, setActiveModule,
    trendData, setTrendData,
    concepts, setConcepts,
    selectedConcept, setSelectedConcept,
    specData, setSpecData,
    loading, setLoading,
    error, setError,
    devProjects, updateDevProjects,
    inspirations, updateInspirations,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
