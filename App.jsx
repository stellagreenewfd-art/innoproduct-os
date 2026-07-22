import { useState } from 'react'
import { AppProvider, useApp } from './contexts/AppContext'
import CategoryInput from './components/CategoryInput'
import TrendRadar from './components/TrendRadar'
import InnoLab from './components/InnoLab'
import ProductSpec from './components/ProductSpec'
import DevTracker from './components/DevTracker'
import Portfolio from './components/Portfolio'
import InspirationVault from './components/InspirationVault'
import AIChat from './components/AIChat'
import ApiKeyModal from './components/ApiKeyModal'

const MODULES = [
  { id: 'input', name: '品类输入', icon: 'M12 4v16m8-8H4' },
  { id: 'trend', name: '趋势雷达', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3' },
  { id: 'innolab', name: '创新工坊', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707' },
  { id: 'spec', name: '产品规格书', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: 'dev', name: '开发追踪', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { id: 'portfolio', name: '产品矩阵', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  { id: 'inspiration', name: '灵感库', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707' },
]

function MainContent() {
  const { activeModule } = useApp()

  switch (activeModule) {
    case 'input': return <CategoryInput />
    case 'trend': return <TrendRadar />
    case 'innolab': return <InnoLab />
    case 'spec': return <ProductSpec />
    case 'dev': return <DevTracker />
    case 'portfolio': return <Portfolio />
    case 'inspiration': return <InspirationVault />
    default: return <CategoryInput />
  }
}

function Shell() {
  const { activeModule, setActiveModule, category, trendData, concepts, selectedConcept } = useApp()
  const [showApiModal, setShowApiModal] = useState(false)

  const canNavigate = (modId) => {
    if (modId === 'input' || modId === 'portfolio' || modId === 'inspiration') return true
    if (modId === 'trend') return !!category
    if (modId === 'innolab') return !!trendData
    if (modId === 'spec') return !!selectedConcept
    if (modId === 'dev') return true
    return false
  }

  return (
    <div className="min-h-screen flex flex-col bg-ip-bg">
      {/* Header */}
      <header className="bg-white border-b border-ip-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-ip-primary flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-semibold text-ip-text leading-tight">创品智造</h1>
              <p className="text-xs text-ip-text-tertiary leading-tight">AI创新产品开发系统</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {category && (
              <div className="text-sm text-ip-text-secondary">
                当前品类: <span className="font-medium text-ip-primary">{category}</span>
              </div>
            )}
            <button
              onClick={() => setShowApiModal(true)}
              className="text-sm text-ip-text-tertiary hover:text-ip-primary transition-colors"
            >
              API Key
            </button>
          </div>
        </div>
        {/* Module Nav */}
        <div className="max-w-7xl mx-auto px-6 pb-0">
          <nav className="flex gap-1 -mb-px overflow-x-auto">
            {MODULES.map((mod, index) => {
              const enabled = canNavigate(mod.id)
              const active = activeModule === mod.id
              return (
                <button
                  key={mod.id}
                  onClick={() => enabled && setActiveModule(mod.id)}
                  disabled={!enabled}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                    active
                      ? 'border-ip-primary text-ip-primary'
                      : enabled
                        ? 'border-transparent text-ip-text-secondary hover:text-ip-text'
                        : 'border-transparent text-ip-text-tertiary cursor-not-allowed'
                  }`}
                >
                  <span className="mr-1.5 text-xs text-ip-text-tertiary">{String(index + 1).padStart(2, '0')}</span>
                  {mod.name}
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6">
        <MainContent />
      </main>

      {/* AI Chat */}
      <AIChat />

      {/* API Key Modal */}
      {showApiModal && <ApiKeyModal onClose={() => setShowApiModal(false)} />}
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
