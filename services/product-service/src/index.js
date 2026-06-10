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

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

pg.types.setTypeParser(1700, val => parseFloat(val));

let dbInitialized = false;

async function ensureDb() {
  if (dbInitialized) return;
  try {
    await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) UNIQUE NOT NULL,
        image TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL NOT NULL,
        image TEXT,
        category VARCHAR(255),
        is_sold BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Seed Categories
    const { rows: catCount } = await pool.query('SELECT count(*) FROM categories');
    if (parseInt(catCount[0].count) === 0) {
      await pool.query(`INSERT INTO categories (name, image) VALUES 
        ('Fashion', 'https://i.pinimg.com/1200x/ea/0a/13/ea0a13bdc7d5ba10d3801bd95e866768.jpg'),
        ('Books', 'https://i.pinimg.com/1200x/af/c2/8c/afc28cb871c7134bfd23578b3489db90.jpg'),
        ('Accessories', 'https://i.pinimg.com/1200x/fa/b8/cd/fab8cdfc5af40c894dff84544e6f9dfa.jpg'),
        ('Electronics', 'https://i.pinimg.com/736x/54/3f/d0/543fd0eab594c0d0da8aea6580d7a24f.jpg')
      `);
    }

    // Seed Products
    const { rows: prodCount } = await pool.query('SELECT count(*) FROM products');
    if (parseInt(prodCount[0].count) === 0) {
      await pool.query(`INSERT INTO products (name, category, price, image) VALUES 
        ('Selamat Tinggal - Tere Liye', 'Books', 70000, 'https://i.pinimg.com/736x/99/7c/74/997c7452cd8405547fb0775d3d5aae87.jpg'),
        ('Laut Bercerita - Leila S. Chudori', 'Books', 85000, 'https://i.pinimg.com/1200x/b4/71/f8/b471f81470297a93aae8bc706c81ee7c.jpg'),
        ('Hoodie Dino', 'Fashion', 120000, 'https://i.pinimg.com/1200x/cb/0d/30/cb0d300987439aa123c1a8cd59dbdd5a.jpg')
      `);
    }
    dbInitialized = true;
    console.log('✅ Product Database Ready');
  } catch (err) {
    console.error('❌ DB Error:', err.message);
  }
}

app.get('/api/categories', async (req, res) => {
  await ensureDb();
  const { rows } = await pool.query('SELECT * FROM categories ORDER BY name ASC');
  res.json(rows);
});

app.get('/api/products', async (req, res) => {
  await ensureDb();
  const { rows } = await pool.query('SELECT * FROM products WHERE is_sold = false ORDER BY created_at DESC');
  res.json(rows.map(r => ({ ...r, _id: r.id })));
});

app.get('/api/products/:id', async (req, res) => {
  await ensureDb();
  const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ message: 'Product Not Found' });
  res.json({ ...rows[0], _id: rows[0].id });
});

// Admin routes
const auth = (req, res, next) => {
  const token = (req.headers.authorization || '').split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); } catch (e) { res.status(401).json({ message: 'Unauthorized' }); }
};

app.post('/api/products', auth, async (req, res) => {
  await ensureDb();
  if (req.user.role !== 'owner') return res.status(403).json({ message: 'Forbidden' });
  const { name, price, image, category, description } = req.body;
  const { rows } = await pool.query('INSERT INTO products (name, price, image, category, description) VALUES ($1,$2,$3,$4,$5) RETURNING *', [name, price, image, category, description]);
  res.status(201).json({ ...rows[0], _id: rows[0].id });
});

app.put('/api/products/:id', auth, async (req, res) => {
  await ensureDb();
  if (req.user.role !== 'owner') return res.status(403).json({ message: 'Forbidden' });
  const { name, price, image, category, description, is_sold } = req.body;
  const { rows } = await pool.query('UPDATE products SET name=COALESCE($1,name), price=COALESCE($2,price), image=COALESCE($3,image), category=COALESCE($4,category), description=COALESCE($5,description), is_sold=COALESCE($6,is_sold) WHERE id=$7 RETURNING *', [name, price, image, category, description, is_sold, req.params.id]);
  res.json({ ...rows[0], _id: rows[0].id });
});

app.delete('/api/products/:id', auth, async (req, res) => {
  await ensureDb();
  if (req.user.role !== 'owner') return res.status(403).json({ message: 'Forbidden' });
  await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
  res.status(204).send();
});

// Fallback for debugging
app.use((req, res) => {
  res.status(404).json({ message: 'Route Not Found in Product Service', path: req.url });
});

export default app;