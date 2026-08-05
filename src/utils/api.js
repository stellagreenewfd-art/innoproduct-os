/**
 * API 客户端 — 创品智造 Pro
 * 所有 AI 调用与数据采集都经过服务端，浏览器不再持有任何密钥
 */

function getToken() { return localStorage.getItem('inno_token') || '' }

async function request(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: 'Bearer ' + getToken() } : {}),
      ...(options.headers || {})
    }
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `请求失败 HTTP ${res.status}`)
  return data
}

export const auth = {
  login: (payload) => request('/api/auth', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => request('/api/logout', { method: 'POST', body: '{}' }).catch(() => {}),
  verify: () => request('/api/verify'),
}

export const ai = {
  trends: (category) => request('/api/ai/trends', { method: 'POST', body: JSON.stringify({ category }) }),
  concepts: (category, trendData) => request('/api/ai/concepts', { method: 'POST', body: JSON.stringify({ category, trendData }) }),
  spec: (category, concept) => request('/api/ai/spec', { method: 'POST', body: JSON.stringify({ category, concept }) }),
}

export const dataApi = {
  me: () => request('/api/me/data'),
  saveProjects: (projects) => request('/api/me/projects', { method: 'PUT', body: JSON.stringify({ projects }) }),
  saveInspirations: (inspirations) => request('/api/me/inspirations', { method: 'PUT', body: JSON.stringify({ inspirations }) }),
  getAnalysis: (id) => request(`/api/me/analyses/${id}`),
}

export const adminApi = {
  users: () => request('/api/admin/users'),
  allRecords: () => request('/api/admin/all-records'),
}

/**
 * AI 对话（SSE 流式）
 * onDelta(text) 逐段回调，onDone(fullText) 完成回调
 */
export async function chatStream({ messages, category, stage, onDelta, onDone, onError }) {
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(getToken() ? { Authorization: 'Bearer ' + getToken() } : {})
      },
      body: JSON.stringify({ messages, category, stage })
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      throw new Error(d.error || 'HTTP ' + res.status)
    }
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let full = ''
    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const payload = line.slice(6)
        if (payload === '[DONE]') continue
        try {
          const json = JSON.parse(payload)
          if (json.error) throw new Error(json.error)
          const delta = json.choices?.[0]?.delta?.content
          if (delta) { full += delta; onDelta && onDelta(full) }
        } catch (e) {
          if (e.message && !e.message.includes('JSON')) throw e
        }
      }
    }
    onDone && onDone(full)
  } catch (e) {
    onError && onError(e.message || '对话失败')
  }
}
