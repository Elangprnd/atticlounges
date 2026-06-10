import express from 'express'
import pg from 'pg'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const { Pool } = pg
const app = express()
app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => res.json({ ok: true }))

const DATABASE_URL = process.env.DATABASE_URL
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwt'
const PORT = process.env.PORT || 4001

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

let dbInitialized = false;

async function ensureDb() {
  if (dbInitialized) return;
  try {
    await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'owner')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure Default Admin
    const { rows } = await pool.query('SELECT * FROM users WHERE role = $1', ['owner']);
    if (rows.length === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      await pool.query('INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4)', ['Admin', 'owner@atticlounges.com', hash, 'owner']);
      console.log('✅ Admin Created');
    }
    dbInitialized = true;
  } catch (err) {
    console.error('❌ User DB Error:', err.message);
  }
}

app.post('/api/auth/register', async (req, res) => {
  await ensureDb();
  try {
    const { name, email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query('INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3) RETURNING id, name, email, role', [name, email, hash]);
    const user = rows[0];
    const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  await ensureDb();
  try {
    const { email, password } = req.body;
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (rows.length === 0) return res.status(401).json({ message: 'User not found' });
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: 'Invalid password' });
    const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/users/me', async (req, res) => {
  const token = (req.headers.authorization || '').split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    await ensureDb();
    const { rows } = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [payload.sub]);
    res.json(rows[0]);
  } catch (e) { res.status(401).json({ message: 'Invalid token' }); }
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route Not Found in User Service', path: req.url });
});

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`👤 User Service running on port ${PORT}`);
  });
}

export default app;