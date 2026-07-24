const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3456;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ===== GitHub-based persistent database =====
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_RAW = process.env.GITHUB_RAW || 'https://raw.githubusercontent.com/stellagreenewfd-art/innoproduct-os/render/data/database.json';
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'database.json');
let _cachedDB = null;
let _lastSync = 0;

function readDB() {
  try {
    if (_cachedDB) return _cachedDB;
    if (!fs.existsSync(DB_PATH)) {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(DB_PATH, JSON.stringify({ users: [], records: [] }, null, 2));
    }
    _cachedDB = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    return _cachedDB;
  } catch (e) {
    return { users: [], records: [] };
  }
}

function writeDB(data) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  _cachedDB = data;
  syncToGitHub(data);
}

async function pullFromGitHub() {
  return new Promise((resolve) => {
    https.get(GITHUB_RAW, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const data = JSON.parse(d);
          if (data.users?.length > 0) {
            console.log('[DB] GitHub restore: ' + data.users.length + ' users');
          }
          resolve(data);
        } catch(e) { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

async function syncToGitHub(data) {
  if (!GITHUB_TOKEN) return;
  const now = Date.now();
  if (now - _lastSync < 10000) return;
  _lastSync = now;
  try {
    const body = JSON.stringify({
      message: 'Auto-sync database',
      content: Buffer.from(JSON.stringify(data, null, 2)).toString('base64'),
      branch: 'render'
    });
    // First get current file SHA
    const getReq = https.request({
      hostname: 'api.github.com',
      path: '/repos/stellagreenewfd-art/innoproduct-os/contents/data/database.json',
      headers: { 'Authorization': 'Bearer ' + GITHUB_TOKEN, 'User-Agent': 'innoproduct-os', 'Accept': 'application/vnd.github.v3+json' }
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const current = JSON.parse(d);
          const putBody = JSON.parse(body);
          if (current.sha) putBody.sha = current.sha;
          const putReq = https.request({
            hostname: 'api.github.com',
            path: '/repos/stellagreenewfd-art/innoproduct-os/contents/data/database.json',
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + GITHUB_TOKEN, 'User-Agent': 'innoproduct-os', 'Content-Type': 'application/json' }
          }, putRes => {
            if (putRes.statusCode === 200 || putRes.statusCode === 201) console.log('[DB] Synced to GitHub');
            putRes.resume();
          });
          putReq.on('error', () => {});
          putReq.write(JSON.stringify(putBody));
          putReq.end();
        } catch(e) {}
      });
    });
    getReq.on('error', () => {});
    getReq.end();
  } catch(e) {}
}

// Password hash

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

const TOKENS = {};

function loadTokens() {
  try {
    const db = readDB();
    if (db._tokens) Object.assign(TOKENS, db._tokens);
  } catch(e) {}
}

function saveTokens() {
  const db = readDB();
  db._tokens = TOKENS;
  writeDB(db);
}

// ========== API Routes ==========

// Register / Login (login by username+password, register needs phone)
app.post('/api/auth', (req, res) => {
  const { phone, username, company, industry, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码为必填项' });
  }

  const db = readDB();
  const pwHash = password; // Frontend already sent SHA-256 hash

  // Login: find by username first
  let user = db.users.find(u => u.username === username);

  if (user) {
    // Login
    if (user.password !== pwHash) {
      return res.status(401).json({ error: '密码错误' });
    }
    // Update login time
    user.lastLogin = new Date().toISOString();
  } else {
    // Register
    user = {
      id: crypto.randomUUID(),
      phone,
      username,
      company: company || '',
      industry: industry || '',
      password: pwHash,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      recordCount: 0
    };
    db.users.push(user);
  }

  writeDB(db);

  // Generate token
  const token = generateToken();
  TOKENS[token] = user.id;
  saveTokens();

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      phone: user.phone,
      username: user.username,
      company: user.company,
      industry: user.industry,
      createdAt: user.createdAt
    },
    isNew: !db.users.find(u => u.phone === phone && u.id !== user.id)
  });
});

// Verify token
app.get('/api/verify', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !TOKENS[token]) {
    return res.status(401).json({ error: '未登录或登录已过期' });
  }
  const db = readDB();
  const user = db.users.find(u => u.id === TOKENS[token]);
  if (!user) {
    return res.status(401).json({ error: '用户不存在' });
  }
  res.json({
    success: true,
    user: {
      id: user.id,
      phone: user.phone,
      username: user.username,
      company: user.company,
      industry: user.industry,
      createdAt: user.createdAt
    }
  });
});

// Submit search record
app.post('/api/records', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !TOKENS[token]) {
    return res.status(401).json({ error: '未登录' });
  }

  const userId = TOKENS[token];
  const { category, result } = req.body;

  const db = readDB();
  const record = {
    id: crypto.randomUUID(),
    userId,
    category: category || '',
    result: result || '',
    createdAt: new Date().toISOString()
  };
  db.records.push(record);

  // Update user record count
  const user = db.users.find(u => u.id === userId);
  if (user) user.recordCount = (user.recordCount || 0) + 1;

  writeDB(db);

  res.json({ success: true, record });
});

// Admin: Get all users
app.get('/api/admin/users', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !TOKENS[token]) {
    return res.status(401).json({ error: '未登录' });
  }

  const db = readDB();
  const adminUser = db.users.find(u => u.id === TOKENS[token]);
  const isAdmin = adminUser && adminUser.username === 'qaq';

  if (!isAdmin) {
    return res.status(403).json({ error: '无管理员权限' });
  }

  const users = db.users.map(u => ({
    id: u.id,
    phone: u.phone,
    username: u.username,
    company: u.company,
    industry: u.industry,
    createdAt: u.createdAt,
    lastLogin: u.lastLogin,
    recordCount: u.recordCount || 0
  }));

  res.json({ success: true, users });
});

// Admin: Get user records
app.get('/api/admin/records/:userId', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !TOKENS[token]) {
    return res.status(401).json({ error: '未登录' });
  }

  const db = readDB();
  const adminUser = db.users.find(u => u.id === TOKENS[token]);
  const isAdmin = adminUser && adminUser.username === 'qaq';

  if (!isAdmin) {
    return res.status(403).json({ error: '无管理员权限' });
  }

  const records = db.records
    .filter(r => r.userId === req.params.userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ success: true, records });
});

// Admin: Get all records (for dashboard)
app.get('/api/admin/all-records', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !TOKENS[token]) {
    return res.status(401).json({ error: '未登录' });
  }

  const db = readDB();
  const adminUser = db.users.find(u => u.id === TOKENS[token]);
  const isAdmin = adminUser && adminUser.username === 'qaq';

  if (!isAdmin) {
    return res.status(403).json({ error: '无管理员权限' });
  }

  const records = db.records
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(r => {
      const user = db.users.find(u => u.id === r.userId);
      return {
        ...r,
        username: user?.username || '未知',
        company: user?.company || '',
        phone: user?.phone || ''
      };
    });

  res.json({ success: true, records });
});

// Fallback: serve index.html for SPA routes
app.get('*', (req, res) => {
  // Check if it's an API route first
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' });
  }

  // For SPA routes, check if the file exists, otherwise serve index.html
  const filePath = path.join(__dirname, req.path);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return res.sendFile(filePath);
  }

  // Serve appropriate HTML
  if (req.path === '/login' || req.path === '/login.html') {
    return res.sendFile(path.join(__dirname, 'login.html'));
  }
  if (req.path === '/admin' || req.path === '/admin.html') {
    return res.sendFile(path.join(__dirname, 'admin.html'));
  }

  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, async () => {
  loadTokens();

  // Restore data from GitHub on cold start
  if (!_cachedDB || _cachedDB.users?.length === 0) {
    const remote = await pullFromGitHub();
    if (remote && remote.users?.length > 0) {
      writeDB(remote);
    }
  }

  console.log(`创品智造 服务已启动: http://localhost:${PORT}`);
  console.log(`注册/登录: http://localhost:${PORT}/login`);
  console.log(`管理后台: http://localhost:${PORT}/admin`);

  // Auto-create admin account
  const db = readDB();
  if (!db.users.find(u => u.username === 'qaq')) {
    const adminPwHash = '44788e32f8b2ac8ebc00e636a68918630f414127dc0cfdd919bca4c9ba31f58d';
    db.users.push({
      id: crypto.randomUUID(),
      phone: 'qaq',
      username: 'qaq',
      company: '创品智造',
      industry: '电商',
      password: adminPwHash,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      recordCount: 0
    });
    writeDB(db);
    console.log('管理员账号已创建: qaq');
  }
});
