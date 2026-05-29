import express from 'express'
import pg from 'pg'
import cors from 'cors'
import jwt from 'jsonwebtoken'

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
  try {
    await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";')
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
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

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
  if (req.user.role !== 'owner') {
    return res.status(403).json({ message: 'Owner access required' })
  }
  next()
}

async function seedProductsIfEmpty() {
  const { rows } = await pool.query('SELECT count(*) FROM products')
  if (parseInt(rows[0].count) > 0) return
  
  const defaults = [
    { name: 'Selamat Tinggal - Tere Liye', category: 'Buku', price: 70000, image: 'https://i.pinimg.com/736x/99/7c/74/997c7452cd8405547fb0775d3d5aae87.jpg', description: 'Novel terbaru dari Tere Liye yang mengisahkan tentang perjalanan hidup yang penuh makna.', condition: 'Good', size: 'One Size', brand: 'Gramedia' },
    { name: 'Laut Bercerita - Leila S. Chudori', category: 'Buku', price: 85000, image: 'https://i.pinimg.com/1200x/b4/71/f8/b471f81470297a93aae8bc706c81ee7c.jpg', description: 'Novel sejarah yang mengisahkan tentang perjuangan dan pengorbanan di masa lalu.', condition: 'Excellent', size: 'One Size', brand: 'Kepustakaan Populer Gramedia' },
    { name: 'Hoodie Dino', category: 'Fashion', price: 120000, image: 'https://i.pinimg.com/1200x/cb/0d/30/cb0d300987439aa123c1a8cd59dbdd5a.jpg', description: 'Hoodie dengan motif dinosaurus yang lucu dan nyaman dipakai sehari-hari.', condition: 'Very Good', size: 'L', brand: 'Uniqlo' },
    { name: 'Headphone Wireless', category: 'Elektronik', price: 250000, image: 'https://i.pinimg.com/1200x/b5/16/64/b51664b1e415e856171d408e69a33c7a.jpg', description: 'Headphone wireless dengan kualitas suara yang jernih dan baterai tahan lama.', condition: 'Like New', size: 'One Size', brand: 'Sony' },
    { name: 'Vintage Denim Jacket', category: 'Fashion', price: 150000, image: 'https://i.pinimg.com/1200x/c0/2b/dd/c02bddac3a2ad03ceec74b86dc0e7d3e.jpg', description: 'Jaket denim vintage dengan potongan klasik yang timeless.', condition: 'Excellent', size: 'M', brand: "Levi's" },
    { name: 'Designer Handbag', category: 'Accessories', price: 450000, image: 'https://i.pinimg.com/1200x/22/c5/7b/22c57b231bfe81ec1802624fe152f7bb.jpg', description: 'Tas designer dengan kualitas premium dan desain yang elegan.', condition: 'Like New', size: 'One Size', brand: 'Coach' },
    { name: 'Graphic T-Shirt', category: 'Fashion', price: 75000, image: 'https://i.pinimg.com/1200x/61/2c/f8/612cf8de92a9ea8f813b9f0042102ee7.jpg', description: 'Kaos dengan desain grafis yang unik dan bahan yang nyaman.', condition: 'Good', size: 'L', brand: 'Uniqlo' },
    { name: 'Midi Skirt', category: 'Fashion', price: 120000, image: 'https://i.pinimg.com/736x/69/bb/b0/69bbb06902a057ca8d280f9f79f4594e.jpg', description: 'Rok midi dengan potongan yang flattering dan cocok untuk berbagai acara.', condition: 'Excellent', size: 'S', brand: 'Zara' },
    { name: 'High-Waist Jeans', category: 'Fashion', price: 180000, image: 'https://i.pinimg.com/1200x/27/70/82/27708210401730b2fca2221086cc7d98.jpg', description: 'Jeans high-waist dengan fit yang sempurna dan warna yang timeless.', condition: 'Very Good', size: 'M', brand: 'H&M' },
    { name: 'Leather Crossbody Bag', category: 'Accessories', price: 200000, image: 'https://i.pinimg.com/1200x/fc/3e/1d/fc3e1d20167f4de35e4709b1dce1656d.jpg', description: 'Tas crossbody kulit dengan desain yang praktis dan stylish.', condition: 'Good', size: 'One Size', brand: 'Fossil' },
    { name: 'Wireless Headphones', category: 'Elektronik', price: 300000, image: 'https://i.pinimg.com/1200x/b5/16/64/b51664b1e415e856171d408e69a33c7a.jpg', description: 'Headphone wireless dengan noise cancellation dan kualitas suara premium.', condition: 'Like New', size: 'One Size', brand: 'Sony' },
    { name: 'Vintage Watch', category: 'Accessories', price: 350000, image: 'https://i.pinimg.com/1200x/2f/21/5b/2f215b7168faeed4201923fe8c8273cc.jpg', description: 'Jam tangan vintage dengan strap kulit dan desain yang timeless.', condition: 'Excellent', size: 'One Size', brand: 'Seiko' }
  ]
  
  for (const p of defaults) {
    await pool.query(
      `INSERT INTO products (name, description, price, image, category, condition, size, brand) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [p.name, p.description, p.price, p.image, p.category, p.condition, p.size, p.brand]
    )
  }
  console.log('Seeded default products')
}

app.get('/api/products', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM products WHERE is_sold = false ORDER BY created_at DESC LIMIT 50')
    res.json(rows)
  } catch (e) {
    res.status(500).json({ message: 'Server error' })
  }
})

app.get('/api/products/all', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM products ORDER BY created_at DESC LIMIT 50')
    res.json(rows)
  } catch (e) {
    res.status(500).json({ message: 'Server error' })
  }
})

app.put('/api/products/reset-sold', async (req, res) => {
  try {
    const { rowCount } = await pool.query('UPDATE products SET is_sold = false, stock = 1 WHERE is_sold = true')
    res.json({ 
      message: \`Reset \${rowCount} products to available\`,
      modifiedCount: rowCount
    })
  } catch (error) {
    res.status(500).json({ message: 'Error resetting products' })
  }
})

app.put('/api/products/fix-stock', async (req, res) => {
  try {
    const { rowCount } = await pool.query('UPDATE products SET stock = 1 WHERE stock = 0')
    res.json({ 
      message: \`Updated \${rowCount} products to have stock: 1\`,
      modifiedCount: rowCount
    })
  } catch (error) {
    res.status(500).json({ message: 'Error fixing stock' })
  }
})

app.post('/api/products', authenticateToken, requireOwner, async (req, res) => {
  try {
    const { name, description, price, image, category, condition, size, brand, stock, is_sold } = req.body
    const { rows } = await pool.query(
      `INSERT INTO products (name, description, price, image, category, condition, size, brand, stock, is_sold) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [name, description, price, image, category, condition, size, brand, stock || 1, is_sold || false]
    )
    res.status(201).json(rows[0])
  } catch (e) {
    res.status(400).json({ message: 'Invalid payload' })
  }
})

app.get('/api/products/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id])
    if (rows.length === 0) return res.status(404).json({ message: 'Not found' })
    res.json(rows[0])
  } catch (e) {
    res.status(500).json({ message: 'Server error' })
  }
})

app.put('/api/products/:id/sold', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE products SET is_sold = true, stock = 0 WHERE id = $1 RETURNING *',
      [req.params.id]
    )
    if (rows.length === 0) return res.status(404).json({ message: 'Product not found' })
    res.json({ message: 'Product marked as sold', product: rows[0] })
  } catch (error) {
    res.status(500).json({ message: 'Error updating product status' })
  }
})

app.put('/api/products/:id/available', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE products SET is_sold = false, stock = 1 WHERE id = $1 RETURNING *',
      [req.params.id]
    )
    if (rows.length === 0) return res.status(404).json({ message: 'Product not found' })
    res.json({ message: 'Product made available again', product: rows[0] })
  } catch (error) {
    res.status(500).json({ message: 'Error updating product status' })
  }
})

app.put('/api/products/:id', authenticateToken, requireOwner, async (req, res) => {
  try {
    const { name, description, price, image, category, condition, size, brand, stock, isSold, is_sold } = req.body
    const finalIsSold = isSold !== undefined ? isSold : is_sold
    const { rows } = await pool.query(
      `UPDATE products SET 
        name = COALESCE($1, name), 
        description = COALESCE($2, description), 
        price = COALESCE($3, price), 
        image = COALESCE($4, image), 
        category = COALESCE($5, category), 
        condition = COALESCE($6, condition), 
        size = COALESCE($7, size), 
        brand = COALESCE($8, brand), 
        stock = COALESCE($9, stock), 
        is_sold = COALESCE($10, is_sold) 
       WHERE id = $11 RETURNING *`,
      [name, description, price, image, category, condition, size, brand, stock, finalIsSold, req.params.id]
    )
    if (rows.length === 0) return res.status(404).json({ message: 'Not found' })
    res.json(rows[0])
  } catch (e) {
    res.status(500).json({ message: 'Server error' })
  }
})

app.delete('/api/products/:id', authenticateToken, requireOwner, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM products WHERE id = $1', [req.params.id])
    if (rowCount === 0) return res.status(404).json({ message: 'Not found' })
    res.status(204).end()
  } catch (e) {
    res.status(500).json({ message: 'Server error' })
  }
})

app.get('/health', (req, res) => res.json({ ok: true }))

app.get('/api/test', (req, res) => {
  res.json({ message: 'Product service is working', timestamp: new Date().toISOString() })
})

if (process.env.NODE_ENV !== 'test') {
  initDb().then(() => seedProductsIfEmpty()).catch(console.error)
}

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 4002
  app.listen(PORT, () => console.log(\`product-service listening on \${PORT}\`))
}

export default app;
