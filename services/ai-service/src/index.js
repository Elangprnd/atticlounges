// Import dependencies yang dibutuhkan
import express from 'express';
import cors from 'cors';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

// Load environment variables dari config.env
dotenv.config({ path: './config.env' });

// Setup Express app
const app = express();
app.use(cors());
app.use(express.json());

// Ambil konfigurasi dari environment variables
const PORT = process.env.PORT;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Initialize Groq client untuk AI
const groq = new Groq({
  apiKey: GROQ_API_KEY,
});

// System prompt untuk Attic Lounges chatbot
const SYSTEM_PROMPT = `Kamu adalah Atticbot, asisten AI yang ramah untuk Attic Lounges, toko thrift preloved. 

Peranmu:
- Bantu pelanggan dengan pertanyaan produk, informasi toko, dan pertanyaan umum
- Bersikap ramah, membantu, dan berpengetahuan tentang thrift shopping
- Berikan informasi tentang produk, kategori, dan layanan kami
- Bantu dengan saran ukuran, kondisi, dan styling
- Dorong tentang fashion berkelanjutan dan thrift shopping

Panduan:
- Gunakan BAHASA INDONESIA untuk semua respons
- Jaga respons tetap ringkas tapi membantu
- Gunakan nada ramah dan santai
- Jika tidak tahu sesuatu spesifik tentang inventori, sarankan mereka cek halaman produk
- Selalu positif tentang thrift shopping dan sustainability
- Akhiri respons dengan emoji yang relevan
- Gunakan "kamu" untuk menyapa pelanggan (tidak formal)

Ingat: Kamu mewakili Attic Lounges, jadi bersikap profesional tapi mudah didekati.`;

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'AI Service',
    timestamp: new Date().toISOString()
  });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversation_history = [] } = req.body;
    
    if (!message || message.trim() === '') {
      return res.status(400).json({ 
        error: 'Message is required' 
      });
    }

    // Prepare conversation history for context
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversation_history.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    // Call Groq API
    const completion = await groq.chat.completions.create({
      messages: messages,
      model: 'llama-3.1-8b-instant', // Fast and efficient model
      temperature: 0.7,
      max_tokens: 500,
      stream: false
    });

    const aiResponse = completion.choices[0]?.message?.content || 'Sorry, I couldn\'t process that request.';

    res.json({
      response: aiResponse,
      timestamp: new Date().toISOString(),
      model: 'llama-3.1-8b-instant'
    });

  } catch (error) {
    console.error('Groq API Error:', error);
    
    // Fallback response if Groq is unavailable
    const fallbackResponses = [
      "I'm having trouble connecting to my AI brain right now, but I'm here to help! Try asking me about our products or services.",
      "Sorry, I'm experiencing some technical difficulties. Feel free to browse our products or contact us directly!",
      "I'm temporarily offline, but I'd love to help you find the perfect thrift items! Check out our product page."
    ];
    
    const randomFallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    
    res.json({
      response: randomFallback,
      timestamp: new Date().toISOString(),
      model: 'fallback',
      error: 'AI service temporarily unavailable'
    });
  }
});

// Get available models
app.get('/api/models', (req, res) => {
  res.json({
    models: [
      'llama-3.1-8b-instant',
      'llama-3.1-70b-versatile',
      'mixtral-8x7b-32768'
    ],
    default: 'llama-3.1-8b-instant'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🤖 AI Service running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`💬 Chat endpoint: http://localhost:${PORT}/api/chat`);
  
  if (GROQ_API_KEY === 'gsk_your_api_key_here') {
    console.log('⚠️  WARNING: Please set your GROQ_API_KEY in .env file');
  }
});
