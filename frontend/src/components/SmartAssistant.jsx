import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import { getAssistantReply } from '../utils/assistantEngine';

export default function SmartAssistant({ foods = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi 👋 I'm UniEats Smart Assistant. What are you craving today?", sender: 'ai' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [contextMemory, setContextMemory] = useState({});
  const [hasSentAutoSuggest, setHasSentAutoSuggest] = useState(false);
  
  const chatEndRef = useRef(null);
  const autoSuggestTimerRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, isOpen]);

  // Handle 20s inactivity auto-suggest
  const resetInactivityTimer = () => {
    if (hasSentAutoSuggest) return;
    
    if (autoSuggestTimerRef.current) clearTimeout(autoSuggestTimerRef.current);
    
    autoSuggestTimerRef.current = setTimeout(() => {
      // Find a trending item
      const trending = [...foods].sort((a,b) => Number(b.price) - Number(a.price))[0];
      const itemName = trending ? trending.name : "Chicken Combo";
      
      setHasSentAutoSuggest(true);
      simulateTyping(`🔥 Students are loving the ${itemName} right now!`);
    }, 20000);
  };

  useEffect(() => {
    if (isOpen && !hasSentAutoSuggest) {
      resetInactivityTimer();
    }
    return () => clearTimeout(autoSuggestTimerRef.current);
  }, [isOpen, hasSentAutoSuggest, foods]);

  const simulateTyping = (text) => {
    setIsTyping(true);
    const delay = Math.floor(Math.random() * 800) + 1200; // 1.2 to 2 seconds
    
    setTimeout(() => {
      setIsTyping(false);
      
      // Stream text character-by-character
      const newMessageId = Date.now();
      setMessages(prev => [...prev, { id: newMessageId, text: '', sender: 'ai' }]);
      
      let index = 0;
      const streamInterval = setInterval(() => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === newMessageId ? { ...msg, text: text.slice(0, index + 1) } : msg
          )
        );
        index++;
        if (index === text.length) clearInterval(streamInterval);
      }, 25);
      
    }, delay);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    resetInactivityTimer();

    const userText = inputValue;
    setMessages(prev => [...prev, { id: Date.now(), text: userText, sender: 'user' }]);
    setInputValue('');

    const { reply, context } = getAssistantReply(userText, foods, contextMemory);
    setContextMemory(context);
    
    simulateTyping(reply);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-24 right-4 sm:right-6 lg:right-8 z-[60] w-80 sm:w-96 h-[420px] rounded-3xl overflow-hidden shadow-2xl flex flex-col bg-white/70 backdrop-blur-xl border border-white/40 ring-1 ring-slate-900/5"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-4 flex items-center justify-between shadow-sm z-10 shrink-0">
              <div className="flex items-center gap-3 text-white">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md shadow-inner">
                   <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide leading-tight">UniEats Assistant</h3>
                  <p className="text-[10px] text-purple-100 font-medium">Smart AI Recommendations</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar bg-slate-50/50">
              {messages.map((msg) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id} 
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-br-sm shadow-blue-500/20' 
                      : 'bg-white text-slate-700 rounded-bl-sm border border-slate-200/60'
                  }`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex justify-start"
                >
                  <div className="px-5 py-3.5 bg-white text-slate-500 rounded-2xl rounded-bl-sm border border-slate-200/60 shadow-sm flex gap-1.5 items-center">
                    <motion.div animate={{ y: [0,-4,0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                    <motion.div animate={{ y: [0,-4,0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                    <motion.div animate={{ y: [0,-4,0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-3 bg-white border-t border-slate-100 z-10 shrink-0">
              <form onSubmit={handleSend} className="flex items-center gap-2 relative">
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onFocus={resetInactivityTimer}
                  placeholder="Ask for 'cheap', 'drinks', 'combo'..." 
                  className="w-full text-[13px] rounded-2xl border border-slate-200 bg-slate-50 pl-4 pr-12 py-3 outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all font-medium text-slate-700"
                />
                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }}
                  type="submit" 
                  className="absolute right-1.5 p-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md shadow-purple-500/20"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-4 sm:right-6 lg:right-8 z-50 w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 to-blue-500 text-white shadow-xl shadow-purple-500/30 flex items-center justify-center border-2 border-white ring-4 ring-purple-500/10 group"
      >
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }} 
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full bg-white opacity-20"
        />
        {isOpen ? <X className="w-6 h-6 relative z-10" /> : <MessageCircle className="w-6 h-6 relative z-10 group-hover:scale-110 transition-transform" />}
      </motion.button>
    </>
  );
}
