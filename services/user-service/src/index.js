import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 4001
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/user_service'
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwt'

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'owner'], default: 'user' }
}, { timestamps: true })

const User = mongoose.model('User', userSchema)

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
    const existing = await User.findOne({ email })
    if (existing) return res.status(409).json({ message: 'Email already used' })
    const passwordHash = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email, passwordHash })
    const token = jwt.sign({ sub: user._id, email, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
    res.status(201).json({ token, user: { id: user._id, name, email, role: user.role } })
  } catch (e) {
    res.status(500).json({ message: 'Server error' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user) return res.status(401).json({ message: 'Invalid credentials' })
    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' })
    const token = jwt.sign({ sub: user._id, email, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: { id: user._id, name: user.name, email, role: user.role } })
  } catch (e) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Endpoint khusus untuk membuat owner (hanya bisa dipanggil sekali)
app.post('/api/auth/create-owner', async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' })
    
    // Cek apakah sudah ada owner
    const existingOwner = await User.findOne({ role: 'owner' })
    if (existingOwner) return res.status(409).json({ message: 'Owner already exists' })
    
    const existing = await User.findOne({ email })
    if (existing) return res.status(409).json({ message: 'Email already used' })
    
    const passwordHash = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email, passwordHash, role: 'owner' })
    const token = jwt.sign({ sub: user._id, email, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
    res.status(201).json({ token, user: { id: user._id, name, email, role: user.role } })
  } catch (e) {
    res.status(500).json({ message: 'Server error' })
  }
})

app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.sub).select('-passwordHash')
    if (!user) return res.status(404).json({ message: 'Not found' })
    res.json(user)
  } catch (e) {
    res.status(401).json({ message: 'Unauthorized' })
  }
})

app.get('/health', (req, res) => res.json({ ok: true }))

// Debug endpoint untuk melihat semua user
app.get('/api/debug/users', async (req, res) => {
  try {
    const users = await User.find({}).select('-passwordHash')
    res.json({ users, count: users.length })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create default admin account
async function createDefaultAdmin() {
  try {
    const adminEmail = 'owner@atticlounges.com'
    const adminPassword = 'admin123'
    const passwordHash = await bcrypt.hash(adminPassword, 10)
    
    const existingAdmin = await User.findOne({ role: 'owner' })
    if (existingAdmin) {
      // Update existing admin password
      existingAdmin.passwordHash = passwordHash
      await existingAdmin.save()
      console.log('Admin account password updated:')
      console.log(`Email: ${adminEmail}`)
      console.log(`Password: ${adminPassword}`)
      return
    }
    
    const admin = await User.create({
      name: 'Admin Attic Lounges',
      email: adminEmail,
      passwordHash,
      role: 'owner'
    })
    
    console.log('Default admin account created:')
    console.log(`Email: ${adminEmail}`)
    console.log(`Password: ${adminPassword}`)
  } catch (error) {
    console.error('Error creating default admin:', error)
  }
}

async function start() {
  await mongoose.connect(MONGO_URI)
  await createDefaultAdmin()
  app.listen(PORT, () => console.log(`user-service listening on ${PORT}`))
}

start().catch(err => {
  console.error(err)
  process.exit(1)
})


