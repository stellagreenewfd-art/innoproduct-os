/**
 * 开发启动脚本：同时启动 API 服务(3457) 与 Vite 开发服务器
 * 将 CLI 参数（--host/--port 等）原样转发给 vite
 */
const { spawn } = require('child_process')
const path = require('path')

const root = path.join(__dirname, '..')
const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')

// 转发除 node scripts/dev.cjs 之外的所有参数给 vite
const viteArgs = process.argv.slice(2)

const server = spawn(process.execPath, [path.join(root, 'server.cjs')], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, PORT: process.env.API_PORT || '3457' }
})

const vite = spawn(process.execPath, [viteBin, ...viteArgs], {
  cwd: root,
  stdio: 'inherit'
})

function shutdown(code) {
  server.kill()
  vite.kill()
  process.exit(code || 0)
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))
server.on('exit', (code) => { if (code) { vite.kill(); process.exit(code) } })
vite.on('exit', (code) => { server.kill(); process.exit(code || 0) })
