import { useState, useRef, useEffect } from 'react'
import { useApp } from '../contexts/AppContext'
import { chatWithAI } from '../utils/api'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function AIChat() {
  const { category, activeModule } = useApp()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || streaming) return

    const userMsg = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setStreaming(true)

    try {
      const reply = await chatWithAI(category, { stage: activeModule }, messages, userMsg.content)
      setMessages([...newMessages, { role: 'assistant', content: reply }])
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: '抱歉，AI回复失败。请检查API Key配置后重试。' }])
    } finally {
      setStreaming(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-ip-primary shadow-lg flex items-center justify-center hover:bg-ip-primary-dark transition-colors z-40"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-3rem)] bg-white rounded-xl shadow-xl border border-ip-border flex flex-col z-40 ip-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ip-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-ip-primary flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-ip-text">AI助手</p>
            <p className="text-xs text-ip-text-tertiary">{category ? `品类: ${category}` : '产品开发顾问'}</p>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="text-ip-text-tertiary hover:text-ip-text p-1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-ip-text-secondary mb-3">你好！我是你的产品开发AI助手</p>
            <p className="text-xs text-ip-text-tertiary mb-4">可以问我关于品类趋势、产品设计、开发管理的问题</p>
            <div className="space-y-2">
              {[
                '当前品类有哪些创新机会？',
                '如何评估一个产品概念的好坏？',
                '开发周期一般多长？',
              ].map(q => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="block w-full text-left text-xs text-ip-primary bg-ip-primary-light rounded-lg px-3 py-2 hover:bg-ip-primary/10 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 ${
                msg.role === 'user'
                  ? 'bg-ip-primary text-white text-sm'
                  : 'bg-ip-bg text-ip-text text-sm'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_strong]:text-ip-text [&_code]:text-ip-primary [&_code]:bg-white [&_code]:px-1 [&_code]:rounded">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        {streaming && (
          <div className="flex justify-start">
            <div className="bg-ip-bg rounded-lg px-3 py-2">
              <div className="ip-loading"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-ip-border p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="输入问题..."
          className="ip-input flex-1 text-sm"
          disabled={streaming}
        />
        <button
          onClick={handleSend}
          disabled={streaming || !input.trim()}
          className="ip-btn-primary px-3"
        >
          {streaming ? <span className="ip-loading"></span> : '发送'}
        </button>
      </div>
    </div>
  )
}
