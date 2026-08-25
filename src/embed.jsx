import { useEffect } from 'react'
import { useApp } from './contexts/AppContext'

// 创品智造 Pro · 嵌入SSO（方案B：朋友调我方接口拿 ticket，前端消费自动登录）
// 仅用于 iframe 嵌入场景，正常登录流程不受影响。

export function useEmbedSSO() {
  const { loginSuccess } = useApp()
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ticket = params.get('ticket')
    const isEmbed = params.get('embed') === '1'

    if (isEmbed) document.body.classList.add('embed-mode')

    if (!ticket) return
    // 避免重复消费
    if (sessionStorage.getItem('embed_ticket_used') === ticket) return

    let active = true
    ;(async () => {
      try {
        const res = await fetch('/api/auth/ticket', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticket }),
        })
        const d = await res.json()
        if (!active) return
        if (d.success && d.token) {
          sessionStorage.setItem('embed_ticket_used', ticket)
          // 清掉 URL 里的 ticket，避免刷新复用/泄露
          const url = new URL(window.location.href)
          url.searchParams.delete('ticket')
          window.history.replaceState({}, document.title, url.pathname + url.search)
          loginSuccess(d.token, d.user)
        } else {
          console.warn('[embed] ticket 兑换失败:', d.error || res.status)
        }
      } catch (e) {
        console.warn('[embed] ticket 兑换异常:', e)
      }
    })()
    return () => { active = false }
  }, [loginSuccess])
}
