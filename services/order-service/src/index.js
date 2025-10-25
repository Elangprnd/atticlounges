import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import jwt from 'jsonwebtoken'

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 4003
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/order_service'

const cartItemSchema = new mongoose.Schema({
  productId: String,
  name: String,
  price: Number,
  quantity: Number,
  imageUrl: String
}, { _id: false })

const orderSchema = new mongoose.Schema({
  userId: String,
  items: [cartItemSchema],
  total: Number,
  status: { type: String, default: 'pending' }
}, { timestamps: true })

const Order = mongoose.model('Order', orderSchema)

app.post('/api/cart/checkout', async (req, res) => {
  try {
    const { userId, items } = req.body
    const total = (items || []).reduce((s, it) => s + (it.price * it.quantity), 0)
    const order = await Order.create({ userId, items, total, status: 'pending' })
    res.status(201).json(order)
  } catch (e) {
    res.status(400).json({ message: 'Invalid payload' })
  }
})

// Endpoint untuk checkout dari frontend
app.post('/api/orders', async (req, res) => {
  try {
    const { userId, items, orderId, status = 'pending' } = req.body
    const total = (items || []).reduce((s, it) => s + (it.price * it.qty), 0)
    const order = await Order.create({ userId, items, total, status })
    res.status(201).json(order)
  } catch (e) {
    console.error('Error creating order:', e)
    res.status(400).json({ message: 'Invalid payload' })
  }
})

app.get('/api/orders/:userId', async (req, res) => {
  const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 })
  res.json(orders)
})

// Endpoint untuk user mengambil pesanan mereka sendiri (dengan token)
app.get('/api/orders', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const token = authHeader.slice(7);
    // Decode token untuk mendapatkan user ID
    const decoded = jwt.verify(token, 'supersecretjwt');
    const userId = decoded.sub;
    
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
})

// Admin endpoints untuk mengelola semua pesanan
app.get('/api/admin/orders', async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 })
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
    
    const order = await Order.findByIdAndUpdate(
      req.params.orderId, 
      { status }, 
      { new: true }
    )
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }
    
    res.json(order)
  } catch (error) {
    res.status(500).json({ message: 'Error updating order status' })
  }
})

app.get('/health', (req, res) => res.json({ ok: true }))

async function start() {
  await mongoose.connect(MONGO_URI)
  app.listen(PORT, () => console.log(`order-service listening on ${PORT}`))
}

start().catch(err => {
  console.error(err)
  process.exit(1)
})


