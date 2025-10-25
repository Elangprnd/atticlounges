# 🚧 Still in Progress
# 🛍️ Attic Lounges - Thrift Store Website
This project is currently under development. Some features may not be fully stable or completed.  

# Attic Lounges - Thrift Store Website
Website thrift store modern dengan sistem **owner-only product management** dan **AI-powered chat**. Hanya owner yang bisa mengelola produk, sementara user biasa bisa berbelanja dan berinteraksi dengan AI chatbot.

## ✨ Features

### 🛒 **E-commerce Features**
- **Product Management** - Owner dapat menambah, edit, hapus produk
- **Shopping Cart** - User dapat menambah produk ke keranjang
- **Wishlist** - User dapat menyimpan produk favorit
- **Order Management** - Admin dapat mengelola pesanan customer
- **User Authentication** - Login/Register untuk user dan owner

### 🤖 **AI-Powered Chat**
- **Groq Integration** - AI chatbot menggunakan Groq API
- **Bahasa Indonesia** - Chatbot menjawab dalam bahasa Indonesia
- **Context Aware** - AI mengingat percakapan sebelumnya
- **Thrift Store Specialized** - AI terlatih khusus untuk thrift shopping

### 🎨 **Modern UI/UX**
- **Responsive Design** - Mobile-friendly
- **Tailwind CSS** - Modern styling
- **Hero Section** - Optimized untuk semua device
- **Unified Navigation** - Konsisten di semua halaman

## 🚀 Quick Start

### Prerequisites
- **Node.js** 16+ ([Download](https://nodejs.org/))
- **MongoDB** ([Download](https://www.mongodb.com/try/download/community))
- **Groq API Key** ([Get Free](https://console.groq.com/))

### Installation & Setup

#### 1. Clone & Install
```bash
# Install dependencies untuk semua services
npm run install-all

# Atau install manual
cd services/user-service && npm install
cd services/product-service && npm install  
cd services/order-service && npm install
cd services/ai-service && npm install
```

#### 2. Setup AI Service
```bash
# Edit config.env di services/ai-service/
GROQ_API_KEY=gsk_your_actual_api_key_here
PORT=4004
```

#### 3. Start All Services
```bash
# Windows
.\start.bat

# Manual start
npm run start:user    # Port 4001
npm run start:product # Port 4002  
npm run start:order   # Port 4003
npm run start:ai      # Port 4004
```

#### 4. Open Website
- Buka `index.html` di browser
- Atau gunakan Live Server di VS Code

## 🏗️ Architecture

### Microservices
- **User Service** (Port 4001) - Authentication & user management
- **Product Service** (Port 4002) - Product CRUD operations
- **Order Service** (Port 4003) - Order management & checkout
- **AI Service** (Port 4004) - Groq AI chatbot integration

### Database
- **MongoDB** - Primary database
- **Separate databases** per service untuk isolasi data
- **Collections**: users, products, orders

### Frontend
- **HTML/CSS/JavaScript** - Vanilla frontend
- **Tailwind CSS** - Styling framework
- **Responsive design** - Mobile-first approach

## 👥 User Roles

### 👤 **Regular User**
- Browse products
- Add to cart/wishlist
- Place orders
- Chat with AI
- View order history

### 👑 **Owner/Admin**
- Manage products (CRUD)
- Manage orders (status updates)
- View customer orders
- Access admin dashboard
- Chat with AI

## 🤖 AI Chatbot Setup

### Groq API Configuration
1. Daftar di [Groq Console](https://console.groq.com/)
2. Buat API key (gratis)
3. Edit `services/ai-service/config.env`:
   ```
   GROQ_API_KEY=gsk_your_actual_api_key_here
   PORT=4004
   ```

### AI Features
- **Bahasa Indonesia** - Semua respons dalam bahasa Indonesia
- **Context Aware** - Mengingat percakapan sebelumnya
- **Thrift Specialized** - Terlatih untuk thrift shopping
- **Fallback System** - Otomatis relay ke owner jika AI error

## 📱 Pages Structure

### Public Pages
- **Homepage** (`index.html`) - Hero, new products, reviews
- **Products** (`pages/product.html`) - Product listing
- **Product Detail** (`pages/detail.html`) - Product details
- **Chat** (`pages/chat.html`) - AI chatbot

### User Pages  
- **Cart** (`pages/cart.html`) - Shopping cart
- **Wishlist** (`pages/wishlist.html`) - Saved products
- **Orders** (`pages/orders.html`) - Order history
- **Profile** (`pages/profile.html`) - User profile

### Admin Pages
- **Admin Panel** (`pages/admin.html`) - Product management
- **Order Management** (`pages/admin-orders.html`) - Order management
- **Payment** (`pages/payment.html`) - Checkout process

## 🔧 Development

### Scripts Available
```bash
npm run install-all    # Install semua dependencies
npm run start:user     # Start user service
npm run start:product  # Start product service  
npm run start:order     # Start order service
npm run start:ai        # Start AI service
```

### API Endpoints

#### User Service (4001)
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `GET /api/profile` - Get user profile

#### Product Service (4002)
- `GET /api/products` - Get all products
- `POST /api/products` - Create product (owner only)
- `PUT /api/products/:id` - Update product (owner only)
- `DELETE /api/products/:id` - Delete product (owner only)

#### Order Service (4003)
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `GET /api/admin/orders` - Get all orders (admin)
- `PUT /api/admin/orders/:id/status` - Update order status

#### AI Service (4004)
- `POST /api/chat` - Chat with AI
- `GET /api/health` - Health check
- `GET /api/models` - Available AI models

## 🚨 Troubleshooting

### Common Issues

#### Services Not Starting
```bash
# Check if ports are available
netstat -an | findstr :4001
netstat -an | findstr :4002
netstat -an | findstr :4003
netstat -an | findstr :4004
```

#### MongoDB Connection
```bash
# Check MongoDB status
mongosh --eval "show dbs"
```

#### AI Service Error
- Pastikan Groq API key valid
- Cek koneksi internet
- Lihat console untuk error details

#### Chat Not Working
- Pastikan AI service running di port 4004
- Cek browser console untuk errors
- Test API: `curl http://localhost:4004/api/health`

## 📊 Database Structure

### User Service Database
```javascript
// users collection
{
  _id: ObjectId,
  name: String,
  email: String,
  passwordHash: String,
  role: String, // 'user' or 'owner'
  createdAt: Date,
  updatedAt: Date
}
```

### Product Service Database
```javascript
// products collection
{
  _id: ObjectId,
  name: String,
  description: String,
  price: Number,
  image: String,
  category: String,
  condition: String,
  size: String,
  brand: String,
  stock: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Order Service Database
```javascript
// orders collection
{
  _id: ObjectId,
  userId: String,
  items: [{
    productId: String,
    name: String,
    price: Number,
    quantity: Number,
    imageUrl: String
  }],
  total: Number,
  status: String, // 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
  createdAt: Date,
  updatedAt: Date
}
```

## 🎯 Getting Started

### First Time Setup
1. **Install prerequisites** (Node.js, MongoDB)
2. **Get Groq API key** (gratis)
3. **Run setup**: `.\start.bat`
4. **Create owner account** via website
5. **Add products** via admin panel
6. **Test AI chat** functionality

### Creating Owner Account
1. Buka website
2. Klik tombol **"OWNER"** di header
3. Isi form "Buat Akun Owner"
4. Login sebagai owner
5. Akses admin panel untuk manage products

## 📝 License

MIT License - Attic Lounges Team

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

---

**Attic Lounges** - Modern thrift store with AI-powered customer service! 🛍️🤖