import { useState } from 'react'
import { getApiKey, setApiKey } from '../utils/api'

export default function ApiKeyModal({ onClose }) {
  const [key, setKey] = useState(getApiKey())
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setApiKey(key.trim())
    setSaved(true)
    setTimeout(() => {
      onClose()
    }, 800)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={onClose}>
      <div className="ip-card p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-ip-text mb-2">配置 DeepSeek API Key</h3>
        <p className="text-sm text-ip-text-secondary mb-4">
          API Key存储在浏览器本地，不会上传到服务器。
        </p>
        <input
          type="password"
          value={key}
          onChange={(e) => { setKey(e.target.value); setSaved(false) }}
          placeholder="sk-..."
          className="ip-input mb-4"
          autoFocus
        />
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="ip-btn-ghost">取消</button>
          <button onClick={handleSave} className="ip-btn-primary">
            {saved ? '已保存' : '保存'}
          </button>
        </div>
        {saved && (
          <p className="text-sm text-ip-success mt-2 text-center">API Key已保存</p>
        )}
      </div>
    </div>
  )
}
