import { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { auth } from '../utils/api'

export default function LoginPage() {
  const { loginSuccess } = useApp()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ phone: '', username: '', company: '', industry: '', password: '' })
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setMsg(null)
    if (!form.username.trim() || !form.password) return setMsg({ type: 'err', text: '用户名和密码为必填项' })
    if (mode === 'register') {
      if (!/^1[3-9]\d{9}$/.test(form.phone)) return setMsg({ type: 'err', text: '请输入有效的手机号' })
      if (form.password.length < 6) return setMsg({ type: 'err', text: '密码至少6位' })
    }
    setBusy(true)
    try {
      const payload = mode === 'register'
        ? { phone: form.phone, username: form.username.trim(), company: form.company, industry: form.industry, password: form.password }
        : { username: form.username.trim(), password: form.password }
      const d = await auth.login(payload)
      loginSuccess(d.token, d.user)
    } catch (err) {
      setMsg({ type: 'err', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5" style={{ background: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)' }}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl p-10 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3" style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"/></svg>
            </div>
            <h1 className="text-2xl font-bold text-ip-text">创品智造 Pro</h1>
            <p className="text-sm text-ip-text-tertiary mt-1">真实数据 × AI 创新产品开发系统</p>
          </div>

          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            {[['login', '登录'], ['register', '注册']].map(([m, label]) => (
              <button key={m} onClick={() => { setMode(m); setMsg(null) }}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${mode === m ? 'bg-white text-ip-primary shadow-sm' : 'text-gray-500'}`}>
                {label}
              </button>
            ))}
          </div>

          {msg && (
            <div className={`mb-4 px-3 py-2.5 rounded-lg text-sm ${msg.type === 'err' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{msg.text}</div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-ip-text mb-1.5">手机号</label>
                <input type="tel" value={form.phone} onChange={set('phone')} placeholder="请输入手机号" maxLength={11} className="ip-input" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-ip-text mb-1.5">用户名</label>
              <input type="text" value={form.username} onChange={set('username')} placeholder="请输入用户名" className="ip-input" autoFocus />
            </div>
            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-ip-text mb-1.5">公司</label>
                  <input type="text" value={form.company} onChange={set('company')} placeholder="公司名称" className="ip-input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ip-text mb-1.5">品类方向</label>
                  <input type="text" value={form.industry} onChange={set('industry')} placeholder="关注品类" className="ip-input" />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-ip-text mb-1.5">密码</label>
              <input type="password" value={form.password} onChange={set('password')} placeholder={mode === 'register' ? '设置密码（至少6位）' : '请输入密码'} className="ip-input" />
            </div>
            <button type="submit" disabled={busy}
              className="w-full h-11 rounded-lg text-white font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:transform-none"
              style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
              {busy ? '请稍候...' : mode === 'register' ? '注册并登录' : '登录'}
            </button>
          </form>

          <p className="text-center text-xs text-ip-text-tertiary mt-6">登录即代表同意合理使用条款 · 密码已加盐加密存储</p>
        </div>
      </div>
    </div>
  )
}
