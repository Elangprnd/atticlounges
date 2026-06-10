import express from 'express'
import pg from 'pg'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import 'dotenv/config'

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
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        total DECIMAL NOT NULL,
        order_id VARCHAR(255),
        payment VARCHAR(255),
        shipping_method VARCHAR(255),
        order_date VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_uuid UUID REFERENCES orders(id) ON DELETE CASCADE,
        product_id UUID,
        name VARCHAR(255),
        price DECIMAL,
        quantity INTEGER,
        image_url TEXT,
        category VARCHAR(255)
      );
    `)
    console.log('Order database initialized');
  } catch (err) {
    console.error('Order DB Init Error:', err);
  }
}

async function ensureDb() {
  if (dbInitialized) return;
  try {
    await initDb();
    dbInitialized = true;
  } catch (err) {
    console.error('Order DB Ensure Error:', err);
    throw err;
  }
}

// Middleware to extract userId from JWT
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

app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    await ensureDb();
    const { items, orderId, payment, shipping, orderDate, status = 'pending' } = req.body
    const userId = req.user.sub; // From JWT
    
    if (!items || items.length === 0) return res.status(400).json({ message: 'Cart is empty' });

    const total = (items || []).reduce((s, it) => s + (it.price * (it.qty || it.quantity)), 0)
    
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const shippingMethod = shipping ? shipping.method : null
      const { rows } = await client.query(
        'INSERT INTO orders (user_id, total, order_id, payment, shipping_method, order_date, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [userId, total, orderId, payment, shippingMethod, orderDate, status]
      )
      const order = rows[0]
      
      for (const item of items) {
        await client.query(
          'INSERT INTO order_items (order_uuid, product_id, name, price, quantity, image_url, category) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [order.id, item.id || item._id, item.name, item.price, item.qty || item.quantity, item.image || item.imageUrl, item.category]
        )
      }
      await client.query('COMMIT')
      
      const { rows: itemsRows } = await pool.query('SELECT * FROM order_items WHERE order_uuid = $1', [order.id])
      order.items = itemsRows
      
      res.status(201).json(order)
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  } catch (e) {
    console.error('Create order error:', e)
    res.status(500).json({ message: 'Server error: ' + e.message })
  }
})

// Get orders ONLY for the logged in user
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    await ensureDb();
    const userId = req.user.sub; // From JWT
    
    const { rows: orders } = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId])
    for (const order of orders) {
      const { rows: items } = await pool.query('SELECT * FROM order_items WHERE order_uuid = $1', [order.id])
      order.items = items
    }
    res.json(orders)
  } catch (e) {
    console.error('Get orders error:', e)
    res.status(500).json({ message: 'Server error' })
  }
})

app.get('/api/admin/orders', authenticateToken, async (req, res) => {
  try {
    await ensureDb();
    if (req.user.role !== 'owner') return res.status(403).json({ message: 'Forbidden' });

    const { rows: orders } = await pool.query('SELECT * FROM orders ORDER BY created_at DESC')
    for (const order of orders) {
      const { rows: items } = await pool.query('SELECT * FROM order_items WHERE order_uuid = $1', [order.id])
      order.items = items
    }
    res.json(orders)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders' })
  }
})

app.get('/health', (req, res) => res.json({ ok: true }))

if (process.env.NODE_ENV !== 'test') {
  ensureDb().catch(console.error)
}

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 4003
  app.listen(PORT, () => console.log(`order-service listening on ${PORT}`))
}

export default app;