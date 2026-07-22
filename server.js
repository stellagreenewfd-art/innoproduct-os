const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3456;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// SQLite-like JSON file database
const DB_PATH = path.join(__dirname, 'data', 'database.json');

function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DB_PATH, JSON.stringify({ users: [], records: [] }, null, 2));
    }
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  } catch (e) {
    return { users: [], records: [] };
  }
}

function writeDB(data) {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Password: frontend sends SHA-256 hash, server stores it directly
// Admin password hash: SHA-256("admin123") = 6c7ca345f63f835f8c508aed3cb3ed3d2a93c48cba1c956012ec1f2f8a7b2f16

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

const TOKENS = {};

// ========== API Routes ==========

// Register / Login (register if new, login if exists)
app.post('/api/auth', (req, res) => {
  const { phone, username, company, industry, password } = req.body;

  if (!phone || !username || !password) {
    return res.status(400).json({ error: '手机号、用户名和密码为必填项' });
  }

  const db = readDB();
  const pwHash = password; // Frontend already sent SHA-256 hash

  // Check if user exists
  let user = db.users.find(u => u.phone === phone);

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
  const isAdmin = adminUser && adminUser.phone === '13800000000';

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
  const isAdmin = adminUser && adminUser.phone === '13800000000';

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
  const isAdmin = adminUser && adminUser.phone === '13800000000';

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

app.listen(PORT, () => {
  console.log(`创品智造 服务已启动: http://localhost:${PORT}`);
  console.log(`注册/登录: http://localhost:${PORT}/login`);
  console.log(`管理后台: http://localhost:${PORT}/admin`);

  // Auto-create admin account
  const db = readDB();
  if (!db.users.find(u => u.phone === '13800000000')) {
    const adminPwHash = crypto.createHash('sha256').update('admin123').digest('hex');
    db.users.push({
      id: crypto.randomUUID(),
      phone: '13800000000',
      username: '管理员',
      company: '创品智造',
      industry: '电商',
      password: adminPwHash,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      recordCount: 0
    });
    writeDB(db);
    console.log('管理员账号已创建: 13800000000 / admin123');
  }
});
