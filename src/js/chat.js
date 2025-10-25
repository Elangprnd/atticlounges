// AI-powered chat with Groq integration[=]
const OWNER_INBOX_KEY = 'owner_inbox';
const AI_SERVICE_URL = 'http://localhost:4004/api/chat';
const CONVERSATION_KEY = 'chat_conversation_history';

function getCurrentUserId() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.id || null;
}

function getOwnerInbox() {
  return JSON.parse(localStorage.getItem(OWNER_INBOX_KEY) || '[]');
}

function saveOwnerInbox(messages) {
  localStorage.setItem(OWNER_INBOX_KEY, JSON.stringify(messages));
}

function getConversationHistory() {
  return JSON.parse(localStorage.getItem(CONVERSATION_KEY) || '[]');
}

function saveConversationHistory(history) {
  // Keep only last 10 messages to avoid token limit
  const limitedHistory = history.slice(-10);
  localStorage.setItem(CONVERSATION_KEY, JSON.stringify(limitedHistory));
}

async function getAIResponse(message) {
  try {
    const conversationHistory = getConversationHistory();
    
    const response = await fetch(AI_SERVICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        conversation_history: conversationHistory
      })
    });

    if (!response.ok) {
      throw new Error(`AI Service error: ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('AI Service Error:', error);
    return null;
  }
}

function appendMessage(el, message, sender) {
  const wrapper = document.createElement('div');
  wrapper.className = 'flex mb-4 gap-2.5 ' + (sender === 'user' ? 'justify-end' : 'justify-start');
  const time = new Date(message.ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  if (sender === 'user') {
    wrapper.innerHTML = `
      <div class="flex flex-col gap-1 w-full max-w-xs items-end">
        <div class="flex items-center space-x-2 rtl:space-x-reverse">
          <span class="text-sm font-semibold text-gray-900">Anda</span>
          <span class="text-sm font-normal text-gray-500">${time}</span>
        </div>
        <div class="flex flex-col leading-1.5 p-4 bg-black text-white rounded-s-xl rounded-ee-xl">
          <p class="text-sm font-normal">${message.text}</p>
        </div>
      </div>
      <img class="w-8 h-8 rounded-full" src="https://cdn-icons-png.flaticon.com/128/1077/1077012.png" alt="User Avatar">
    `;
  } else {
    wrapper.innerHTML = `
      <img class="w-8 h-8 rounded-full" src="https://cdn-icons-png.flaticon.com/128/6134/6134447.png" alt="Atticbot Avatar">
      <div class="flex flex-col gap-1 w-full max-w-xs">
        <div class="flex items-center space-x-2 rtl:space-x-reverse">
          <span class="text-sm font-semibold text-gray-900">Atticbot</span>
          <span class="text-sm font-normal text-gray-500">${time}</span>
        </div>
        <div class="flex flex-col leading-1.5 p-4 bg-gray-200 rounded-e-xl rounded-es-xl">
          <p class="text-sm font-normal">${message.text}</p>
        </div>
      </div>
    `;
  }
  el.appendChild(wrapper);
  el.scrollTop = el.scrollHeight;
}

document.addEventListener('DOMContentLoaded', () => {
  const chatMessages = document.getElementById('chat-messages');
  const userInput = document.getElementById('user-input');
  const sendButton = document.getElementById('send-button');

  async function handleSend() {
    const text = userInput.value.trim();
    if (!text) return;
    
    const userId = getCurrentUserId() || 'guest';
    const msg = { from: userId, text, ts: Date.now(), to: 'bot' };
    
    // Add user message to chat
    appendMessage(chatMessages, msg, 'user');
    userInput.value = '';

    // Show typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'flex mb-4 gap-2.5 justify-start';
    typingIndicator.innerHTML = `
      <img class="w-8 h-8 rounded-full" src="https://cdn-icons-png.flaticon.com/128/6134/6134447.png" alt="Atticbot Avatar">
      <div class="flex flex-col gap-1 w-full max-w-xs">
        <div class="flex items-center space-x-2 rtl:space-x-reverse">
          <span class="text-sm font-semibold text-gray-900">Atticbot</span>
          <span class="text-sm font-normal text-gray-500">typing...</span>
        </div>
        <div class="flex flex-col leading-1.5 p-4 bg-gray-200 rounded-e-xl rounded-es-xl">
          <div class="flex space-x-1">
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
          </div>
        </div>
      </div>
    `;
    chatMessages.appendChild(typingIndicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
      // Get AI response
      const aiResponse = await getAIResponse(text);
      
      // Remove typing indicator
      typingIndicator.remove();
      
      if (aiResponse) {
        // AI responded successfully
        const reply = { from: 'bot', text: aiResponse, ts: Date.now() };
        appendMessage(chatMessages, reply, 'bot');
        
        // Update conversation history
        const conversationHistory = getConversationHistory();
        conversationHistory.push(
          { role: 'user', content: text },
          { role: 'assistant', content: aiResponse }
        );
        saveConversationHistory(conversationHistory);
      } else {
        // Fallback to owner relay if AI fails
        const inbox = getOwnerInbox();
        inbox.push({ ...msg, to: 'owner' });
        saveOwnerInbox(inbox);
        
        const reply = { from: 'bot', text: 'Terima kasih! Pesan Anda sudah diteruskan ke owner. Kami akan balas secepatnya.', ts: Date.now() };
        appendMessage(chatMessages, reply, 'bot');
      }
    } catch (error) {
      console.error('Chat error:', error);
      
      // Remove typing indicator
      typingIndicator.remove();
      
      // Fallback response
      const reply = { from: 'bot', text: 'Maaf, saya sedang mengalami gangguan teknis. Silakan coba lagi nanti atau hubungi kami langsung.', ts: Date.now() };
      appendMessage(chatMessages, reply, 'bot');
    }
  }

  sendButton?.addEventListener('click', handleSend);
  userInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
  });
});


