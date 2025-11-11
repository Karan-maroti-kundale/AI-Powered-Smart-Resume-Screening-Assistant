'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send } from 'lucide-react';

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ from: 'user' | 'bot'; text: string }[]>([
    { from: 'bot', text: '👋 Hi! I’m your AI assistant. How can I help you today?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // 🧠 Auto-scroll to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages((prev) => [
      ...prev,
      { from: 'user', text: userMessage },
      { from: 'bot', text: '' }, // placeholder for streaming reply
    ]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.body) {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { from: 'bot', text: '⚠️ No response from AI.' },
        ]);
        setLoading(false);
        return;
      }

      // 🔁 Real-time streaming from backend (Ollama)
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        result += chunk;

        // 🧠 Update latest bot message dynamically
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1].text = result;
          return updated;
        });
      }
    } catch (err) {
      console.error('Chat Error:', err);
      setMessages((prev) => [
        ...prev,
        {
          from: 'bot',
          text: '❌ Unable to connect to assistant. Ensure backend & Ollama are running.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="chat-open"
            onClick={() => setOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full p-4 shadow-lg flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <MessageCircle className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-window"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="bg-white rounded-2xl shadow-2xl w-80 h-[460px] flex flex-col border border-emerald-200 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-emerald-600 text-white flex justify-between items-center px-4 py-3">
              <span className="font-semibold">AI Assistant 🤖</span>
              <button onClick={() => setOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Section */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-green-50 to-white scroll-smooth">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`px-4 py-2 rounded-2xl text-sm shadow-sm max-w-[75%] whitespace-pre-wrap ${
                      msg.from === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-none'
                        : 'bg-gray-200 text-gray-800 rounded-bl-none'
                    }`}
                  >
                    {msg.text || (loading && msg.from === 'bot' ? '🤖 ...' : '')}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input Box */}
            <div className="border-t border-gray-200 flex items-center p-3 bg-white">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask something..."
                className="flex-1 outline-none px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 text-sm"
              />
              <button
                onClick={sendMessage}
                disabled={loading}
                className={`ml-2 rounded-full p-2 transition ${
                  loading
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
