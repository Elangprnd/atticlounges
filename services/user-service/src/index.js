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

async function initDb() {
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

// Middleware untuk cek role owner
const requireOwner = (req, res, next) => {
  if (req.user.role !== 'owner') {
    return res.status(403).json({ message: 'Owner access required' })
  }
  next()
}

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' })
    
    const { rows: existing } = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    if (existing.length > 0) return res.status(409).json({ message: 'Email already used' })
    
    const passwordHash = await bcrypt.hash(password, 10)
    const { rows: created } = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [name, email, passwordHash]
    )
    const user = created[0]
    const token = jwt.sign({ sub: user.id, email, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
    res.status(201).json({ token, user: { id: user.id, name, email, role: user.role } })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Server error' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const { rows: users } = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    if (users.length === 0) return res.status(401).json({ message: 'Invalid credentials' })
    const user = users[0]
    
    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' })
    
    const token = jwt.sign({ sub: user.id, email, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: { id: user.id, name: user.name, email, role: user.role } })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Server error' })
  }
})

app.post('/api/auth/create-owner', async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' })
    
    const { rows: owners } = await pool.query("SELECT * FROM users WHERE role = 'owner'")
    if (owners.length > 0) return res.status(409).json({ message: 'Owner already exists' })
    
    const { rows: existing } = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    if (existing.length > 0) return res.status(409).json({ message: 'Email already used' })
    
    const passwordHash = await bcrypt.hash(password, 10)
    const { rows: created } = await pool.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'owner') RETURNING *",
      [name, email, passwordHash]
    )
    const user = created[0]
    const token = jwt.sign({ sub: user.id, email, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
    res.status(201).json({ token, user: { id: user.id, name, email, role: user.role } })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Server error' })
  }
})

app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const { rows: users } = await pool.query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [req.user.sub])
    if (users.length === 0) return res.status(404).json({ message: 'Not found' })
    res.json(users[0])
  } catch (e) {
    console.error(e)
    res.status(401).json({ message: 'Unauthorized' })
  }
})

app.get('/health', (req, res) => res.json({ ok: true }))

app.get('/api/debug/users', async (req, res) => {
  try {
    const { rows: users } = await pool.query('SELECT id, name, email, role, created_at FROM users')
    res.json({ users, count: users.length })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
})

async function createDefaultAdmin() {
  try {
    const adminEmail = 'owner@atticlounges.com'
    const adminPassword = 'admin123'
    const passwordHash = await bcrypt.hash(adminPassword, 10)
    
    const { rows: owners } = await pool.query("SELECT * FROM users WHERE role = 'owner'")
    if (owners.length > 0) {
      await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, owners[0].id])
      console.log('Admin account password updated:', adminEmail)
      return
    }
    
    await pool.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'owner')",
      ['Admin Attic Lounges', adminEmail, passwordHash]
    )
    
    console.log('Default admin account created:', adminEmail)
  } catch (error) {
    console.error('Error creating default admin:', error)
  }
}

if (process.env.NODE_ENV !== 'test') {
  initDb().then(() => createDefaultAdmin()).catch(console.error)
}

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 4001
  app.listen(PORT, () => console.log(\`user-service listening on \${PORT}\`))
}

export default app;
