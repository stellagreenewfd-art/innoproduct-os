import { AppProvider, useApp } from './contexts/AppContext'
import LoginPage from './components/LoginPage'
import Dashboard from './components/Dashboard'
import CategoryInput from './components/CategoryInput'
import TrendRadar from './components/TrendRadar'
import CompetitorAnalysis from './components/CompetitorAnalysis'
import InnoLab from './components/InnoLab'
import ProductSpec from './components/ProductSpec'
import DevTracker from './components/DevTracker'
import Portfolio from './components/Portfolio'
import InspirationVault from './components/InspirationVault'
import AdminPanel from './components/AdminPanel'
import AIChat from './components/AIChat'
import { useEmbedSSO } from './embed'

const MODULES = [
  { id: 'dashboard', name: '工作台' },
  { id: 'input', name: '品类输入' },
  { id: 'trend', name: '趋势雷达' },
  { id: 'competitor', name: '竞品分析' },
  { id: 'innolab', name: '创新工坊' },
  { id: 'spec', name: '产品规格书' },
  { id: 'dev', name: '开发追踪' },
  { id: 'portfolio', name: '产品矩阵' },
  { id: 'inspiration', name: '灵感库' },
]

function MainContent() {
  const { activeModule } = useApp()
  switch (activeModule) {
    case 'dashboard': return <Dashboard />
    case 'input': return <CategoryInput />
    case 'trend': return <TrendRadar />
    case 'competitor': return <CompetitorAnalysis />
    case 'innolab': return <InnoLab />
    case 'spec': return <ProductSpec />
    case 'dev': return <DevTracker />
    case 'portfolio': return <Portfolio />
    case 'inspiration': return <InspirationVault />
    case 'admin': return <AdminPanel />
    default: return <Dashboard />
  }
}

function Shell() {
  const { user, logout, activeModule, setActiveModule, category, trendData, concepts, selectedConcept } = useApp()
  useEmbedSSO() // 嵌入场景：自动消费 ticket 登录 + 标记 embed-mode

  const canNavigate = (modId) => {
    if (['dashboard', 'input', 'portfolio', 'inspiration', 'dev'].includes(modId)) return true
    if (modId === 'trend' || modId === 'competitor') return !!trendData
    if (modId === 'innolab') return !!trendData || !!concepts
    if (modId === 'spec') return !!selectedConcept
    return false
  }

  return (
    <div className="min-h-screen flex flex-col bg-ip-bg">
      <header className="bg-white border-b border-ip-border sticky top-0 z-40 no-print">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveModule('dashboard')}>
            <div className="w-8 h-8 rounded-lg bg-ip-primary flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-semibold text-ip-text leading-tight">创品智造 <span className="text-ip-primary">Pro</span></h1>
              <p className="text-xs text-ip-text-tertiary leading-tight">真实数据 × AI创新产品开发系统</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {category && (
              <div className="hidden sm:block text-sm text-ip-text-secondary">
                当前品类: <span className="font-medium text-ip-primary">{category}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-ip-text-secondary">{user?.username}{user?.company ? ` · ${user.company}` : ''}</span>
              <button onClick={logout} className="text-xs text-ip-text-tertiary hover:text-ip-danger transition-colors">退出</button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pb-0">
          <nav className="flex gap-1 -mb-px overflow-x-auto">
            {MODULES.map((mod) => {
              const enabled = canNavigate(mod.id)
              const active = activeModule === mod.id
              return (
                <button
                  key={mod.id}
                  onClick={() => enabled && setActiveModule(mod.id)}
                  disabled={!enabled}
                  className={`px-3.5 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                    active ? 'border-ip-primary text-ip-primary'
                    : enabled ? 'border-transparent text-ip-text-secondary hover:text-ip-text'
                    : 'border-transparent text-ip-text-tertiary/50 cursor-not-allowed'
                  }`}
                >
                  {mod.name}
                </button>
              )
            })}
            {user?.username === 'qaq' && (
              <button
                onClick={() => setActiveModule('admin')}
                className={`px-3.5 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeModule === 'admin' ? 'border-ip-warning text-ip-warning' : 'border-transparent text-ip-warning/70 hover:text-ip-warning'
                }`}
              >
                管理后台
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6">
        <MainContent />
      </main>

      <AIChat />
    </div>
  )
}

function Root() {
  const { user, authChecked } = useApp()
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ip-bg">
        <div className="ip-loading" style={{ width: 28, height: 28 }}></div>
      </div>
    )
  }
  if (!user) return <LoginPage />
  return <Shell />
}

export default function App() {
  return (
    <AppProvider>
      <Root />
    </AppProvider>
  )
}
