import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import jwt from 'jsonwebtoken'

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 4002
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/product_service'
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwt'

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  image: String,
  category: String,
  condition: String,
  size: String,
  brand: String,
  stock: { type: Number, default: 0 }
}, { timestamps: true })

const Product = mongoose.model('Product', productSchema)

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

// Seed default products if collection is empty
async function seedProductsIfEmpty() {
  const count = await Product.estimatedDocumentCount()
  if (count > 0) return
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
  await Product.insertMany(defaults)
  console.log('Seeded default products')
}

app.get('/api/products', async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 }).limit(50)
  res.json(products)
})

app.post('/api/products', authenticateToken, requireOwner, async (req, res) => {
  try {
    const product = await Product.create(req.body)
    res.status(201).json(product)
  } catch (e) {
    res.status(400).json({ message: 'Invalid payload' })
  }
})

app.get('/api/products/:id', async (req, res) => {
  const item = await Product.findById(req.params.id)
  if (!item) return res.status(404).json({ message: 'Not found' })
  res.json(item)
})

app.put('/api/products/:id', authenticateToken, requireOwner, async (req, res) => {
  const item = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!item) return res.status(404).json({ message: 'Not found' })
  res.json(item)
})

app.delete('/api/products/:id', authenticateToken, requireOwner, async (req, res) => {
  const del = await Product.findByIdAndDelete(req.params.id)
  if (!del) return res.status(404).json({ message: 'Not found' })
  res.status(204).end()
})

app.get('/health', (req, res) => res.json({ ok: true }))

async function start() {
  await mongoose.connect(MONGO_URI)
  await seedProductsIfEmpty()
  app.listen(PORT, () => console.log(`product-service listening on ${PORT}`))
}

start().catch(err => {
  console.error(err)
  process.exit(1)
})


