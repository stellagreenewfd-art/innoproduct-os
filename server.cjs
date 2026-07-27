const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3456;

app.use(express.json());
// Serve built frontend from dist/ directory
app.use(express.static(path.join(__dirname, 'dist')));

// ===== GitHub-based persistent database =====
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_RAW = process.env.GITHUB_RAW || 'https://raw.githubusercontent.com/stellagreenewfd-art/innoproduct-os/render/data/database.json';
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'database.json');
let _cachedDB = null;
let _noSync = false; // Prevent sync during initial restore

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
    console.error('[DB] read error:', e.message);
    return { users: [], records: [] };
  }
}

function writeDBSync(data) {
  // Sync write to disk only (no GitHub sync) - used during startup restore
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  _cachedDB = data;
}

async function writeDB(data) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  _cachedDB = data;

  if (!_noSync) {
    await syncToGitHub(data);
  }
}

async function pullFromGitHub() {
  console.log('[DB] Attempting GitHub restore...');
  return new Promise((resolve) => {
    const req = https.get(GITHUB_RAW, { timeout: 10000 }, res => {
      if (res.statusCode !== 200) {
        console.log('[DB] GitHub raw returned ' + res.statusCode);
        resolve(null);
        return;
      }
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const data = JSON.parse(d);
          if (data && data.users) {
            console.log('[DB] GitHub restore: ' + data.users.length + ' users, ' + (data.records?.length || 0) + ' records');
          }
          resolve(data);
        } catch(e) {
          console.error('[DB] GitHub JSON parse error:', e.message);
          resolve(null);
        }
      });
    });
    req.on('error', (e) => {
      console.error('[DB] GitHub fetch error:', e.message);
      resolve(null);
    });
    req.on('timeout', () => {
      req.destroy();
      console.error('[DB] GitHub fetch timeout');
      resolve(null);
    });
  });
}

function syncToGitHub(data) {
  return new Promise((resolve) => {
    if (!GITHUB_TOKEN) {
      console.log('[DB] ⚠️ GITHUB_TOKEN not set — data NOT synced to GitHub!');
      console.log('[DB]   Set GITHUB_TOKEN env var in Render dashboard.');
      resolve(false);
      return;
    }

    const content = JSON.stringify(data, null, 2);
    const body = JSON.stringify({
      message: 'Auto-sync database',
      content: Buffer.from(content).toString('base64'),
      branch: 'render'
    });

    const apiPath = '/repos/stellagreenewfd-art/innoproduct-os/contents/data/database.json?ref=render';

    // Get current file SHA first
    const getReq = https.request({
      hostname: 'api.github.com',
      path: apiPath,
      headers: {
        'Authorization': 'Bearer ' + GITHUB_TOKEN,
        'User-Agent': 'innoproduct-os',
        'Accept': 'application/vnd.github.v3+json'
      },
      timeout: 10000
    }, res => {
      if (res.statusCode !== 200) {
        let errD = '';
        res.on('data', c => errD += c);
        res.on('end', () => {
          console.error('[DB] ❌ GitHub GET returned HTTP ' + res.statusCode + ': ' + errD.substring(0, 200));
          resolve(false);
        });
        return;
      }
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const current = JSON.parse(d);
          const putBody = JSON.parse(body);
          if (current.sha) putBody.sha = current.sha;

          const putReq = https.request({
            hostname: 'api.github.com',
            path: apiPath,
            method: 'PUT',
            headers: {
              'Authorization': 'Bearer ' + GITHUB_TOKEN,
              'User-Agent': 'innoproduct-os',
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }, putRes => {
            let putData = '';
            putRes.on('data', c => putData += c);
            putRes.on('end', () => {
              if (putRes.statusCode === 200 || putRes.statusCode === 201) {
                console.log('[DB] ✅ Synced to GitHub — ' + data.users.length + ' users, ' + (data.records?.length || 0) + ' records');
                resolve(true);
              } else {
                console.error('[DB] ❌ GitHub sync failed: HTTP ' + putRes.statusCode);
                console.error('[DB]   Response:', putData.substring(0, 200));
                resolve(false);
              }
            });
          });
          putReq.on('error', (e) => {
            console.error('[DB] ❌ GitHub PUT error:', e.message);
            resolve(false);
          });
          putReq.on('timeout', () => {
            putReq.destroy();
            console.error('[DB] ❌ GitHub PUT timeout');
            resolve(false);
          });
          putReq.write(JSON.stringify(putBody));
          putReq.end();
        } catch(e) {
          console.error('[DB] ❌ GitHub sync parse error:', e.message);
          resolve(false);
        }
      });
    });
    getReq.on('error', (e) => {
      console.error('[DB] ❌ GitHub GET error:', e.message);
      resolve(false);
    });
    getReq.on('timeout', () => {
      getReq.destroy();
      console.error('[DB] ❌ GitHub GET timeout');
      resolve(false);
    });
    getReq.end();
  });
}

// Password hash
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// In-memory token cache (performance only, rebuilt from DB on cold start)
const TOKENS = {};

// Rebuild in-memory token map from user records (survives sleep/restart)
function loadTokens() {
  try {
    const db = readDB();
    for (const u of db.users) {
      if (u._token) TOKENS[u._token] = u.id;
    }
  } catch(e) {}
}

// Save token to user record (persists to GitHub, survives sleep)
function saveToken(token, userId) {
  TOKENS[token] = userId;
  const db = readDB();
  const user = db.users.find(u => u.id === userId);
  if (user) {
    user._token = token;
    writeDBSync(db); // write locally, will sync on next writeDB call
  }
}

// ========== API Routes ==========

// Health check
app.get('/api/health', (req, res) => {
  const db = readDB();
  res.json({
    status: 'ok',
    users: db.users?.length || 0,
    records: db.records?.length || 0,
    githubToken: !!GITHUB_TOKEN,
    uptime: process.uptime()
  });
});

// Register / Login
app.post('/api/auth', async (req, res) => {
  const { phone, username, company, industry, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码为必填项' });
  }

  const db = readDB();
  const pwHash = password;

  let user = db.users.find(u => u.username === username);

  if (user) {
    if (user.password !== pwHash) {
      return res.status(401).json({ error: '密码错误' });
    }
    user.lastLogin = new Date().toISOString();
  } else {
    // New registration: must provide valid phone number
    if (!phone || !/^\d{5,15}$/.test(phone)) {
      return res.status(400).json({ error: '注册需要填写手机号。如已有账号，请切换到"登录"标签。' });
    }
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
    console.log('[AUTH] New user registered: ' + username + ' (' + phone + ')');
  }

  const token = generateToken();
  // Embed token in user record so it survives Render sleep/restart
  user._token = token;
  TOKENS[token] = user.id;

  await writeDB(db);

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
    }
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
app.post('/api/records', async (req, res) => {
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

  const user = db.users.find(u => u.id === userId);
  if (user) user.recordCount = (user.recordCount || 0) + 1;

  console.log('[RECORD] ' + (user?.username || 'unknown') + ' searched: ' + category);
  await writeDB(db);

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

// Admin: Get all records
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

// Fallback: serve HTML for specific routes + SPA
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' });
  }

  // Check if file exists at project root (for admin.html, login.html)
  const rootFilePath = path.join(__dirname, req.path);
  if (fs.existsSync(rootFilePath) && fs.statSync(rootFilePath).isFile()) {
    return res.sendFile(rootFilePath);
  }

  // Dedicated routes
  if (req.path === '/login' || req.path === '/login.html') {
    return res.sendFile(path.join(__dirname, 'login.html'));
  }
  if (req.path === '/admin' || req.path === '/admin.html') {
    return res.sendFile(path.join(__dirname, 'admin.html'));
  }

  // SPA fallback: serve built frontend index.html
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, async () => {
  console.log('=== 创品智造 v2 ===');
  console.log('GitHub sync: ' + (GITHUB_TOKEN ? '✅ ENABLED (token set)' : '⚠️ DISABLED (no GITHUB_TOKEN)'));

  // Step 1: Restore data from GitHub
  const remote = await pullFromGitHub();
  if (remote && remote.users?.length > 0) {
    _noSync = true;
    writeDBSync(remote);
    _noSync = false;
    console.log('[DB] Restored from GitHub: ' + remote.users.length + ' users');
  } else {
    console.log('[DB] No GitHub data to restore, starting fresh');
  }

  // Step 2: Rebuild in-memory tokens from user records (tokens embedded in DB, survive sleep)
  loadTokens();
  console.log('[DB] Loaded ' + Object.keys(TOKENS).length + ' active tokens');

  // Step 3: Ensure admin account exists
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
    writeDBSync(db);
    console.log('[DB] Admin account created: qaq');
  } else {
    console.log('[DB] Admin account exists (qaq), total users: ' + db.users.length);
  }

  console.log(`🚀 服务启动: http://localhost:${PORT}`);
  console.log(`   登录: /login | 管理: /admin | 健康: /api/health`);
});
