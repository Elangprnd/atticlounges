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
- **VS Code** dengan Live Server extension

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

#### 3. Start All Services (Local Development)
```bash
# Start all services with a single command
npm run dev
```

> **Note on Vercel:** While local development requires running all services concurrently, Vercel handles this automatically in production based on your `vercel.json` configuration. Each API route is treated as an independent Serverless Function.

##### 🚀 **Cara 3: PowerShell Background (Advanced)**
```powershell
# Jalankan di PowerShell sebagai background processes
Start-Process powershell -ArgumentList "-Command", "cd 'C:\path\to\atticlounges\services\user-service'; npm start" -WindowStyle Hidden
Start-Process powershell -ArgumentList "-Command", "cd 'C:\path\to\atticlounges\services\product-service'; npm start" -WindowStyle Hidden
Start-Process powershell -ArgumentList "-Command", "cd 'C:\path\to\atticlounges\services\order-service'; npm start" -WindowStyle Hidden
Start-Process powershell -ArgumentList "-Command", "cd 'C:\path\to\atticlounges\services\ai-service'; npm start" -WindowStyle Hidden
```

#### 4. Open Website di VS Code

##### 🌐 **Menggunakan Live Server Extension**
1. Install **Live Server** extension di VS Code
2. Klik kanan pada `index.html`
3. Pilih **"Open with Live Server"**
4. Website akan terbuka di `http://127.0.0.1:5500`

##### 📁 **Menggunakan File Explorer**
1. Buka `index.html` di browser
2. Atau drag & drop `index.html` ke browser

#### 5. Verify Services Running
```bash
# Cek apakah semua services berjalan
netstat -ano | findstr ":400[1-4]"

# Atau cek di browser:
# http://localhost:4001 (User Service)
# http://localhost:4002 (Product Service)  
# http://localhost:4003 (Order Service)
# http://localhost:4004 (AI Service)
```

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
npm run dev     # Start all services
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

#### PostgreSQL Connection (Neon)
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

## 🛠️ VS Code Setup & Development

### 📋 **VS Code Extensions Required**
1. **Live Server** - Untuk menjalankan website
2. **JavaScript (ES6) code snippets** - Code completion
3. **Prettier** - Code formatting
4. **Auto Rename Tag** - HTML editing
5. **Bracket Pair Colorizer** - Code readability

### 🚀 **VS Code Workflow**

#### **Step 1: Setup Project**
```bash
# 1. Clone project
git clone <repository-url>
cd atticlounges

# 2. Install dependencies
npm run install-all
```

#### **Step 2: Start Services**
```bash
# Buka 4 terminal di VS Code (Ctrl+Shift+` untuk new terminal)

# Terminal 1: User Service
cd services/user-service
npm start

# Terminal 2: Product Service  
cd services/product-service
npm start

# Terminal 3: Order Service
cd services/order-service
npm start

# Terminal 4: AI Service
cd services/ai-service
npm start
```

#### **Step 3: Open Website**
1. Klik kanan pada `index.html`
2. Pilih **"Open with Live Server"**
3. Website akan terbuka di `http://127.0.0.1:5500`

### 🔧 **VS Code Terminal Commands**

#### **Start All Services (PowerShell)**
```powershell
# Jalankan di VS Code Terminal (PowerShell)
Start-Process powershell -ArgumentList "-Command", "cd 'C:\Users\elang\OneDrive\Dokumen\Sistem Informasi\KSM Multimedia - Web Development\atticlounges\services\user-service'; npm start" -WindowStyle Hidden
Start-Process powershell -ArgumentList "-Command", "cd 'C:\Users\elang\OneDrive\Dokumen\Sistem Informasi\KSM Multimedia - Web Development\atticlounges\services\product-service'; npm start" -WindowStyle Hidden
Start-Process powershell -ArgumentList "-Command", "cd 'C:\Users\elang\OneDrive\Dokumen\Sistem Informasi\KSM Multimedia - Web Development\atticlounges\services\order-service'; npm start" -WindowStyle Hidden
Start-Process powershell -ArgumentList "-Command", "cd 'C:\Users\elang\OneDrive\Dokumen\Sistem Informasi\KSM Multimedia - Web Development\atticlounges\services\ai-service'; npm start" -WindowStyle Hidden
```

#### **Stop All Services**
```powershell
# Matikan semua Node.js processes
tasklist | findstr node
taskkill /F /PID <process_id>
```

### 🐛 **VS Code Debugging**

#### **Check Services Status**
```bash
# Cek apakah services berjalan
netstat -ano | findstr ":400[1-4]"

# Cek Node.js processes
tasklist | findstr node
```

#### **Common VS Code Issues**

##### **❌ "Cannot find module" Error**
```bash
# Pastikan berada di direktori yang benar
pwd
# Harus: C:\Users\elang\OneDrive\Dokumen\Sistem Informasi\KSM Multimedia - Web Development\atticlounges

# Jika salah, navigasi ke direktori benar
cd "C:\Users\elang\OneDrive\Dokumen\Sistem Informasi\KSM Multimedia - Web Development\atticlounges"
```

##### **❌ "Path not found" Error**
```bash
# Gunakan path lengkap dengan quotes
cd "C:\Users\elang\OneDrive\Dokumen\Sistem Informasi\KSM Multimedia - Web Development\atticlounges\services\user-service"
```

##### **❌ PowerShell "&&" Error**
```powershell
# PowerShell tidak support && operator
# Gunakan ; sebagai separator
cd services\user-service; npm start

# Atau gunakan cmd
cmd /c "cd services\user-service && npm start"
```

### 📁 **VS Code Project Structure**
```
atticlounges/
├── index.html              # Main website
├── pages/                  # Website pages
├── services/               # Backend services
│   ├── user-service/       # Port 4001
│   ├── product-service/    # Port 4002
│   ├── order-service/      # Port 4003
│   └── ai-service/         # Port 4004
├── src/                    # Frontend assets
│   ├── css/
│   ├── js/
│   └── img/
└── package.json           # Root configuration
```

### 🎯 **Quick VS Code Commands**

#### **Start Everything**
```bash
# Method 1: Use NPM Scripts
npm run dev
npm run dev
```

#### **Stop Everything**
```bash
# Kill all Node.js processes
taskkill /F /IM node.exe
```

#### **Check Status**
```bash
# Check services
netstat -ano | findstr ":400[1-4]"

# Check processes
tasklist | findstr node
```

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
3. **Run setup**: `npm run dev`
4. **Create owner account** via website
5. **Add products** via admin panel
6. **Test AI chat** functionality

### Creating Owner Account
1. Buka website
2. Klik tombol **"OWNER"** di header
3. Isi form "Buat Akun Owner"
4. Login sebagai owner
5. Akses admin panel untuk manage products

## 🎯 **VS Code Development Workflow**

### 🚀 **Quick Start di VS Code**

#### **1. Setup Project**
```bash
# 1. Buka VS Code di project folder
code .

# 2. Install dependencies (jika belum)
npm run install-all
```

#### **2. Start Services (4 Terminal)**
```bash
# Terminal 1: User Service (Port 4001)
cd services/user-service
npm start

# Terminal 2: Product Service (Port 4002)  
cd services/product-service
npm start

# Terminal 3: Order Service (Port 4003)
cd services/order-service
npm start

# Terminal 4: AI Service (Port 4004)
cd services/ai-service
npm start
```

#### **3. Open Website**
```bash
# Klik kanan index.html → "Open with Live Server"
# Atau buka di browser: http://127.0.0.1:5500
```

### 🔧 **VS Code Development Tips**

#### **Multi-Terminal Setup**
```bash
# VS Code: Ctrl+Shift+` (new terminal)
# Atau: Terminal → New Terminal

# Split terminal: Ctrl+Shift+5
# Atau: Terminal → Split Terminal
```

#### **Quick Commands**
```bash
# Check services status
netstat -ano | findstr ":400[1-4]"

# Stop all services
taskkill /F /IM node.exe

# Start all services (PowerShell)
npm run dev
```

#### **Debugging di VS Code**
```bash
# 1. Check console errors di browser (F12)
# 2. Check terminal output untuk service errors
# 3. Check network tab untuk API calls
# 4. Verify services running:
netstat -ano | findstr ":400[1-4]"
```

### 📁 **VS Code File Organization**

#### **Key Files to Edit**
```
atticlounges/
├── index.html                 # Main homepage
├── pages/                    # All website pages
│   ├── product.html          # Product listing
│   ├── detail.html           # Product details
│   ├── cart.html             # Shopping cart
│   ├── admin.html            # Admin panel
│   └── chat.html             # AI chat
├── src/js/                   # Frontend JavaScript
│   ├── app.js                # Main app logic
│   ├── product.js            # Product management
│   ├── cart.js               # Cart functionality
│   └── chat.js                # AI chat integration
└── services/                 # Backend services
    ├── user-service/src/      # User authentication
    ├── product-service/src/   # Product CRUD
    ├── order-service/src/     # Order management
    └── ai-service/src/        # AI chat service
```

#### **VS Code Workspace Settings**
```json
{
  "files.exclude": {
    "**/node_modules": true,
    "**/.git": true
  },
  "search.exclude": {
    "**/node_modules": true
  }
}
```

### 🐛 **Common VS Code Issues & Solutions**

#### **❌ Services Won't Start**
```bash
# Problem: "Cannot find module" error
# Solution: Check current directory
pwd
# Should be: C:\Users\elang\OneDrive\Dokumen\Sistem Informasi\KSM Multimedia - Web Development\atticlounges

# If wrong, navigate to correct directory:
cd "C:\Users\elang\OneDrive\Dokumen\Sistem Informasi\KSM Multimedia - Web Development\atticlounges"
```

#### **❌ PowerShell "&&" Error**
```bash
# Problem: PowerShell doesn't support && operator
# Solution: Use semicolon or cmd
cd services\user-service; npm start
# Or: cmd /c "cd services\user-service && npm start"
```

#### **❌ Port Already in Use**
```bash
# Problem: Port 4001-4004 already in use
# Solution: Kill existing processes
tasklist | findstr node
taskkill /F /PID <process_id>
```

#### **❌ Live Server Not Working**
```bash
# Problem: Live Server extension issues
# Solution: 
# 1. Install Live Server extension
# 2. Right-click index.html → "Open with Live Server"
# 3. Or use: http://127.0.0.1:5500
```

### 🎯 **VS Code Productivity Tips**

#### **Keyboard Shortcuts**
```bash
Ctrl+Shift+`     # New terminal
Ctrl+`           # Toggle terminal
Ctrl+Shift+5     # Split terminal
F5               # Start debugging
Ctrl+F5          # Run without debugging
```

#### **Extensions for Better Development**
```bash
# Essential Extensions:
- Live Server
- JavaScript (ES6) code snippets  
- Prettier - Code formatter
- Auto Rename Tag
- Bracket Pair Colorizer
- GitLens
- Thunder Client (API testing)
```

#### **VS Code Tasks (tasks.json)**
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start User Service",
      "type": "shell",
      "command": "npm run dev",
      "group": "build"
    },
    {
      "label": "Stop All Services", 
      "type": "shell",
      "command": "taskkill /F /IM node.exe",
      "group": "build"
    }
  ]
}
```

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