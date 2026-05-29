import express from 'express'
import pg from 'pg'
import cors from 'cors'
import jwt from 'jsonwebtoken'

const { Pool } = pg

const app = express()
app.use(cors())
app.use(express.json())

const DATABASE_URL = process.env.DATABASE_URL
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwt'

if (!DATABASE_URL) {
  console.warn('⚠️ WARNING: DATABASE_URL is not set. Database connections will fail.');
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

// Cast DECIMAL to number automatically
pg.types.setTypeParser(1700, function(val) {
  return parseFloat(val);
});

let dbInitialized = false;

async function initDb() {
  try {
    if (!DATABASE_URL) throw new Error('DATABASE_URL is missing');
    
    await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";')
    
    // Create categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) UNIQUE NOT NULL,
        image TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Create products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL NOT NULL,
        image TEXT,
        category VARCHAR(255),
        condition VARCHAR(255),
        size VARCHAR(255),
        brand VARCHAR(255),
        stock INTEGER DEFAULT 1,
        is_sold BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)
    console.log('✅ Database tables verified/created');
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    throw error;
  }
}

async function seedCategoriesIfEmpty() {
  try {
    const { rows } = await pool.query('SELECT count(*) FROM categories')
    if (parseInt(rows[0].count) > 0) return
    
    const categories = [
      { name: 'Fashion', image: 'https://i.pinimg.com/1200x/ea/0a/13/ea0a13bdc7d5ba10d3801bd95e866768.jpg', description: 'Trendi and stylish clothing' },
      { name: 'Books', image: 'https://i.pinimg.com/1200x/af/c2/8c/afc28cb871c7134bfd23578b3489db90.jpg', description: 'Curated collection of books' },
      { name: 'Accessories', image: 'https://i.pinimg.com/1200x/fa/b8/cd/fab8cdfc5af40c894dff84544e6f9dfa.jpg', description: 'Complete your look' },
      { name: 'Electronics', image: 'https://i.pinimg.com/736x/54/3f/d0/543fd0eab594c0d0da8aea6580d7a24f.jpg', description: 'Gadgets and tech' }
    ]
    
    for (const c of categories) {
      await pool.query(
        'INSERT INTO categories (name, image, description) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING',
        [c.name, c.image, c.description]
      )
    }
    console.log('🌱 Seeded categories');
  } catch (error) {
    console.error('⚠️ Seeding categories error:', error.message);
  }
}

async function seedProductsIfEmpty() {
  try {
    const { rows } = await pool.query('SELECT count(*) FROM products')
    if (parseInt(rows[0].count) > 0) return
    
    const defaults = [
      { name: 'Selamat Tinggal - Tere Liye', category: 'Books', price: 70000, image: 'https://i.pinimg.com/736x/99/7c/74/997c7452cd8405547fb0775d3d5aae87.jpg', description: 'Novel terbaru dari Tere Liye yang mengisahkan tentang perjalanan hidup yang penuh makna.' },
      { name: 'Laut Bercerita - Leila S. Chudori', category: 'Books', price: 85000, image: 'https://i.pinimg.com/1200x/b4/71/f8/b471f81470297a93aae8bc706c81ee7c.jpg', description: 'Novel sejarah yang mengisahkan tentang perjuangan dan pengorbanan di masa lalu.' },
      { name: 'Hoodie Dino', category: 'Fashion', price: 120000, image: 'https://i.pinimg.com/1200x/cb/0d/30/cb0d300987439aa123c1a8cd59dbdd5a.jpg', description: 'Hoodie dengan motif dinosaurus yang lucu.' },
      { name: 'Headphone Wireless', category: 'Electronics', price: 250000, image: 'https://i.pinimg.com/1200x/b5/16/64/b51664b1e415e856171d408e69a33c7a.jpg', description: 'Headphone wireless berkualitas.' },
      { name: 'Vintage Denim Jacket', category: 'Fashion', price: 150000, image: 'https://i.pinimg.com/1200x/c0/2b/dd/c02bddac3a2ad03ceec74b86dc0e7d3e.jpg', description: 'Jaket denim vintage klasik.' }
    ]
    
    for (const p of defaults) {
      await pool.query(
        `INSERT INTO products (name, description, price, image, category) 
         VALUES ($1, $2, $3, $4, $5)`,
        [p.name, p.description, p.price, p.image, p.category]
      )
    }
    console.log('🌱 Seeded products');
  } catch (error) {
    console.error('⚠️ Seeding products error:', error.message);
  }
}

async function ensureDb() {
  if (dbInitialized) return;
  try {
    await initDb();
    await seedCategoriesIfEmpty();
    await seedProductsIfEmpty();
    dbInitialized = true;
    console.log('🚀 Database ready');
  } catch (err) {
    console.error('❌ Database failure:', err.message);
    throw err;
  }
}

// Routes
app.get('/api/categories', async (req, res) => {
  try {
    await ensureDb();
    const { rows } = await pool.query('SELECT * FROM categories ORDER BY name ASC')
    res.json(rows)
  } catch (e) {
    res.status(500).json({ message: 'Database error', error: e.message })
  }
})

app.get('/api/products', async (req, res) => {
  try {
    await ensureDb();
    const { rows } = await pool.query('SELECT * FROM products WHERE is_sold = false ORDER BY created_at DESC LIMIT 50')
    res.json(rows)
  } catch (e) {
    res.status(500).json({ message: 'Database error', error: e.message })
  }
})

app.get('/api/products/:id', async (req, res) => {
  try {
    await ensureDb();
    const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id])
    if (rows.length === 0) return res.status(404).json({ message: 'Product not found' })
    res.json(rows[0])
  } catch (e) {
    res.status(500).json({ message: 'Database error', error: e.message })
  }
})

app.get('/api/test', async (req, res) => {
  try {
    await ensureDb();
    res.json({ status: 'ok', database: 'connected', time: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// Middleware & other endpoints...
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

const requireOwner = (req, res, next) => {
  if (req.user.role !== 'owner') return res.status(403).json({ message: 'Owner only' })
  next()
}

app.post('/api/products', authenticateToken, requireOwner, async (req, res) => {
  try {
    await ensureDb();
    const { name, description, price, image, category } = req.body
    const { rows } = await pool.query(
      'INSERT INTO products (name, description, price, image, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description, price, image, category]
    )
    res.status(201).json(rows[0])
  } catch (e) {
    res.status(500).json({ message: 'Database error', error: e.message })
  }
})

// Initialize locally
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 4002
  app.listen(PORT, () => console.log(`Product service on ${PORT}`))
  ensureDb().catch(console.error)
}

export default app;