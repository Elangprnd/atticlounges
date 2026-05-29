import express from 'express'
import pg from 'pg'
import cors from 'cors'
import jwt from 'jsonwebtoken'

const { Pool } = pg

const app = express()
app.use(cors())
app.use(express.json())

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/atticlounges'

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

async function initDb() {
  await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";')
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR(255) NOT NULL,
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
      product_id VARCHAR(255),
      name VARCHAR(255),
      price DECIMAL,
      quantity INTEGER,
      image_url TEXT,
      category VARCHAR(255)
    );
  `)
}

app.post('/api/cart/checkout', async (req, res) => {
  try {
    const { userId, items } = req.body
    const total = (items || []).reduce((s, it) => s + (it.price * it.quantity), 0)
    
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const { rows } = await client.query(
        'INSERT INTO orders (user_id, total, status) VALUES ($1, $2, $3) RETURNING *',
        [userId, total, 'pending']
      )
      const order = rows[0]
      
      for (const item of (items || [])) {
        await client.query(
          'INSERT INTO order_items (order_uuid, product_id, name, price, quantity, image_url, category) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [order.id, item.productId || item._id || item.id, item.name, item.price, item.quantity || item.qty, item.imageUrl || item.image, item.category]
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
    res.status(400).json({ message: 'Invalid payload' })
  }
})

app.post('/api/orders', async (req, res) => {
  try {
    const { userId, items, orderId, payment, shipping, orderDate, status = 'pending' } = req.body
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
      
      for (const item of (items || [])) {
        await client.query(
          'INSERT INTO order_items (order_uuid, product_id, name, price, quantity, image_url, category) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [order.id, item.productId || item._id || item.id, item.name, item.price, item.quantity || item.qty, item.imageUrl || item.image, item.category]
        )
      }
      await client.query('COMMIT')
      
      const { rows: itemsRows } = await pool.query('SELECT * FROM order_items WHERE order_uuid = $1', [order.id])
      order.items = itemsRows
      
      if (items && items.length > 0) {
        const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : (process.env.PRODUCT_SERVICE_URL || 'http://localhost:4002')
        for (const item of items) {
          const productId = item.productId || item._id || item.id;
          if (productId) {
            fetch(`${baseUrl}/api/products/${productId}/sold`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' }
            }).catch(e => console.error('Error marking product as sold:', e))
          }
        }
      }
      
      res.status(201).json(order)
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  } catch (e) {
    console.error('Error creating order:', e)
    res.status(400).json({ message: 'Invalid payload' })
  }
})

app.get('/api/orders/:userId', async (req, res) => {
  try {
    const { rows: orders } = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [req.params.userId])
    for (const order of orders) {
      const { rows: items } = await pool.query('SELECT * FROM order_items WHERE order_uuid = $1', [order.id])
      order.items = items
    }
    res.json(orders)
  } catch (e) {
    res.status(500).json({ message: 'Server error' })
  }
})

app.get('/api/orders', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, 'supersecretjwt');
    const userId = decoded.sub;
    
    const { rows: orders } = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId])
    for (const order of orders) {
      const { rows: items } = await pool.query('SELECT * FROM order_items WHERE order_uuid = $1', [order.id])
      order.items = items
    }
    res.json(orders);
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
})

app.get('/api/admin/orders', async (req, res) => {
  try {
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

app.put('/api/admin/orders/:orderId/status', async (req, res) => {
  try {
    const { status } = req.body
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' })
    }
    
    const { rows: currentOrderRows } = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.orderId])
    if (currentOrderRows.length === 0) {
      return res.status(404).json({ message: 'Order not found' })
    }
    const currentOrder = currentOrderRows[0]
    
    if (currentOrder.status === 'cancelled') {
      return res.status(400).json({ 
        message: 'Cannot update status of a cancelled order',
        currentStatus: currentOrder.status
      })
    }
    
    const { rows: updatedRows } = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.orderId]
    )
    const order = updatedRows[0]
    
    const { rows: items } = await pool.query('SELECT * FROM order_items WHERE order_uuid = $1', [order.id])
    order.items = items
    
    if (status === 'cancelled' && currentOrder.status !== 'cancelled') {
      const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : (process.env.PRODUCT_SERVICE_URL || 'http://localhost:4002')
      for (const item of order.items) {
        const productId = item.product_id
        if (productId) {
          fetch(`${baseUrl}/api/products/${productId}/available`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
          }).catch(e => console.error('Error making product available:', e))
        }
      }
    }
    
    res.json(order)
  } catch (error) {
    res.status(500).json({ message: 'Error updating order status' })
  }
})

app.put('/api/orders/:orderId/fix', async (req, res) => {
  try {
    const { rows: orders } = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.orderId]);
    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const order = orders[0];
    
    if (!order.payment) {
      await pool.query('UPDATE orders SET payment = $1 WHERE id = $2', ['bank-transfer', order.id])
      order.payment = 'bank-transfer'
    }
    if (!order.order_id) {
      const newOrderId = 'ORD-' + order.id.slice(-8);
      await pool.query('UPDATE orders SET order_id = $1 WHERE id = $2', [newOrderId, order.id])
      order.order_id = newOrderId
    }
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error fixing order data' });
  }
})

app.delete('/api/admin/cleanup-orders', async (req, res) => {
  try {
    const { rowCount } = await pool.query("DELETE FROM orders WHERE user_id LIKE 'user-%'");
    res.json({ 
      message: \`Cleaned up \${rowCount} orders with invalid user IDs\`,
      deletedCount: rowCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Error cleaning up orders' });
  }
})

app.get('/health', (req, res) => res.json({ ok: true }))

if (process.env.NODE_ENV !== 'test') {
  initDb().catch(console.error)
}

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 4003
  app.listen(PORT, () => console.log(\`order-service listening on \${PORT}\`))
}

export default app;
