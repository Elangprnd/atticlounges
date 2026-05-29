import express from 'express'
import pg from 'pg'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const { Pool } = pg

const app = express()
app.use(cors())
app.use(express.json())

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/atticlounges'
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwt'

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

let dbInitialized = false;

async function initDb() {
  try {
    await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'owner')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)
    console.log('User database initialized');
  } catch (err) {
    console.error('User DB Init Error:', err);
  }
}

async function createDefaultAdmin() {
  try {
    const adminEmail = 'owner@atticlounges.com'
    const adminPassword = 'admin123'
    
    const { rows: existing } = await pool.query('SELECT * FROM users WHERE email = $1', [adminEmail])
    if (existing.length > 0) {
      console.log('Admin account already exists');
      return
    }
    
    const passwordHash = await bcrypt.hash(adminPassword, 10)
    await pool.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'owner')",
      ['Admin Attic Lounges', adminEmail, passwordHash]
    )
    
    console.log('Default admin account created:', adminEmail)
  } catch (error) {
    console.error('Error creating default admin:', error)
  }
}

async function ensureDb() {
  if (dbInitialized) return;
  try {
    await initDb();
    await createDefaultAdmin();
    dbInitialized = true;
    console.log('User database ready');
  } catch (err) {
    console.error('User DB Ensure Error:', err);
    throw err;
  }
}

// Middleware untuk autentikasi
const authenticateToken = (req, res, next) => {
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).json({ message: 'Unauthorized' })
  
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = payload
    next()
  } catch (e) {
    res.status(401).json({ message: 'Unauthorized' })
  }
}

app.post('/api/auth/register', async (req, res) => {
  try {
    await ensureDb();
    const { name, email, password } = req.body
    if (!name || !email || !password) return res.status(400).json({ message: 'Lengkapi semua field' })
    
    const { rows: existing } = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    if (existing.length > 0) return res.status(409).json({ message: 'Email sudah terdaftar' })
    
    const passwordHash = await bcrypt.hash(password, 10)
    const { rows: created } = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [name, email, passwordHash]
    )
    const user = created[0]
    const token = jwt.sign({ sub: user.id, email, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
    res.status(201).json({ token, user: { id: user.id, name, email, role: user.role } })
  } catch (e) {
    console.error('Register error:', e)
    res.status(500).json({ message: 'Server error: ' + e.message })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    await ensureDb();
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ message: 'Email dan password wajib diisi' });

    const { rows: users } = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    if (users.length === 0) return res.status(401).json({ message: 'Email atau password salah' })
    const user = users[0]
    
    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) return res.status(401).json({ message: 'Email atau password salah' })
    
    const token = jwt.sign({ sub: user.id, email, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: { id: user.id, name: user.name, email, role: user.role } })
  } catch (e) {
    console.error('Login error:', e)
    res.status(500).json({ message: 'Server error: ' + e.message })
  }
})

app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    await ensureDb();
    const { rows: users } = await pool.query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [req.user.sub])
    if (users.length === 0) return res.status(404).json({ message: 'User tidak ditemukan' })
    res.json(users[0])
  } catch (e) {
    console.error('Users me error:', e)
    res.status(401).json({ message: 'Unauthorized' })
  }
})

app.get('/health', (req, res) => res.json({ ok: true }))

app.get('/api/debug/users', async (req, res) => {
  try {
    await ensureDb();
    const { rows: users } = await pool.query('SELECT id, name, email, role, created_at FROM users')
    res.json({ users, count: users.length })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
})

if (process.env.NODE_ENV !== 'test') {
  ensureDb().catch(console.error)
}

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 4001
  app.listen(PORT, () => console.log(`user-service listening on ${PORT}`))
}

export default app;