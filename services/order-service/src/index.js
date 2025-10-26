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
  _id: String, // Support _id from cart
  id: String, // Support id field
  name: String,
  price: Number,
  quantity: Number,
  qty: Number, // Support both quantity and qty
  imageUrl: String,
  image: String, // Support both imageUrl and image
  category: String
}, { _id: false })

const orderSchema = new mongoose.Schema({
  userId: String,
  items: [cartItemSchema],
  total: Number,
  orderId: String, // Add orderId field
  payment: String, // Add payment method field
  shipping: {
    method: String
  },
  orderDate: String,
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
    const { userId, items, orderId, payment, shipping, orderDate, status = 'pending' } = req.body
    const total = (items || []).reduce((s, it) => s + (it.price * (it.qty || it.quantity)), 0)
    
    // Buat order
    const order = await Order.create({ 
      userId, 
      items, 
      total, 
      orderId, 
      payment, 
      shipping, 
      orderDate, 
      status 
    })
    
    // Thrift store: tandai semua produk dalam order sebagai terjual
    if (items && items.length > 0) {
      try {
        const productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://localhost:4002'
        
        // Tandai setiap produk sebagai terjual
        for (const item of items) {
          const productId = item.productId || item._id || item.id;
          if (productId) {
            await fetch(`${productServiceUrl}/api/products/${productId}/sold`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' }
            })
            console.log(`Product ${productId} marked as sold`)
          } else {
            console.warn('No product ID found for item:', item)
          }
        }
      } catch (error) {
        console.error('Error marking products as sold:', error)
        // Jangan gagal order jika gagal update produk
      }
    }
    
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
    
    // Get the current order to check previous status
    const currentOrder = await Order.findById(req.params.orderId)
    if (!currentOrder) {
      return res.status(404).json({ message: 'Order not found' })
    }
    
    // Prevent updating status if order is already cancelled
    if (currentOrder.status === 'cancelled') {
      return res.status(400).json({ 
        message: 'Cannot update status of a cancelled order',
        currentStatus: currentOrder.status
      })
    }
    
    // Update order status
    const order = await Order.findByIdAndUpdate(
      req.params.orderId, 
      { status }, 
      { new: true }
    )
    
    // If order is being cancelled, make products available again
    console.log(`Order status update: ${currentOrder.status} -> ${status}`)
    console.log(`Order items:`, order.items)
    if (status === 'cancelled' && currentOrder.status !== 'cancelled') {
      console.log('Making products available again after cancellation...')
      try {
        const productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://localhost:4002'
        console.log(`Product service URL: ${productServiceUrl}`)
        
        // Make all products in the order available again
        for (const item of order.items) {
          const productId = item.productId || item._id || item.id;
          if (productId) {
            try {
              const response = await fetch(`${productServiceUrl}/api/products/${productId}/available`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
              })
              
              if (response.ok) {
                const result = await response.json()
                console.log(`Product ${productId} made available again after order cancellation:`, result.message)
              } else {
                console.error(`Failed to make product ${productId} available:`, response.status, response.statusText)
              }
            } catch (fetchError) {
              console.error(`Error calling product service for product ${productId}:`, fetchError.message)
            }
          } else {
            console.warn('No product ID found for item:', item)
          }
        }
      } catch (error) {
        console.error('Error making products available after cancellation:', error)
        // Don't fail the status update if product update fails
      }
    } else {
      console.log('Not making products available - status not cancelled or already cancelled')
    }
    
    res.json(order)
  } catch (error) {
    res.status(500).json({ message: 'Error updating order status' })
  }
})

// Endpoint untuk memperbaiki data order yang sudah ada
app.put('/api/orders/:orderId/fix', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Fix missing payment method
    if (!order.payment) {
      order.payment = 'bank-transfer'; // Default payment method
    }
    
    // Fix missing orderId
    if (!order.orderId) {
      order.orderId = 'ORD-' + order._id.toString().slice(-8);
    }
    
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error fixing order data' });
  }
})

// Endpoint untuk membersihkan order dengan user ID yang tidak konsisten
app.delete('/api/admin/cleanup-orders', async (req, res) => {
  try {
    // Hapus order dengan user ID yang tidak valid (user-001, user-002, dll)
    const result = await Order.deleteMany({
      userId: { $regex: /^user-\d+$/ }
    });
    
    res.json({ 
      message: `Cleaned up ${result.deletedCount} orders with invalid user IDs`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Error cleaning up orders' });
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


