/**
 * 本地存储工具 — 数据持久化
 * 独立命名空间 innoproduct:* ，与现有系统完全隔离
 */

const PREFIX = 'innoproduct:'

export function saveData(key, data) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(data))
  } catch (e) {
    console.error('保存失败:', e)
  }
}

export function loadData(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? JSON.parse(raw) : fallback
  } catch (e) {
    return fallback
  }
}

export function removeData(key) {
  localStorage.removeItem(PREFIX + key)
}

export function loadProducts() {
  return loadData('products', [])
}

export function saveProducts(products) {
  saveData('products', products)
}

export function loadDevProjects() {
  return loadData('devProjects', [])
}

export function saveDevProjects(projects) {
  saveData('devProjects', projects)
}

export function loadInspirations() {
  return loadData('inspirations', [])
}

export function saveInspirations(items) {
  saveData('inspirations', items)
}
