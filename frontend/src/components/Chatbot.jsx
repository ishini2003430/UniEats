import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";

// Animation Variants
const windowVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 100, filter: "blur(10px)" },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0, 
    filter: "blur(0px)",
    transition: { type: "spring", damping: 25, stiffness: 300 } 
  },
  exit: { opacity: 0, scale: 0.8, y: 50, transition: { duration: 0.2 } }
};

const messageVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2 } }
};

const dotVariants = {
  animate: {
    y: [0, -5, 0],
    transition: { duration: 0.6, repeat: Infinity, ease: "easeInOut" }
  }
};

export default function Chatbot({ user }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const recognitionRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, loading]);

  useEffect(() => {
    setMessages([{ id: 0, from: "bot", text: "Hi! How can I help you eat today? 🍕" }]);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setRecognitionSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      const r = new SpeechRecognition();
      r.lang = "en-US";
      r.onresult = (ev) => {
        const t = ev.results[0][0].transcript;
        setText(t);
        setTimeout(() => sendRecognized(t), 500);
      };
      r.onend = () => setRecognizing(false);
      recognitionRef.current = r;
    }
  }, []);

  const send = async () => {
    if (!text.trim() || loading) return;
    const userMsg = { id: Date.now(), from: "me", text: text.trim() };
    setMessages((m) => [...m, userMsg]);
    setText("");
    setLoading(true);

    try {
      const res = await api.post("/api/chatbot", { question: userMsg.text });
      const botText = res.data.answer || "I'm not sure about that.";
      
      setMessages((m) => [...m, { id: Date.now() + 1, from: "bot", text: botText }]);
      
      if (voiceEnabled && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(botText));
      }
    } catch (err) {
      setMessages((m) => [...m, { id: Date.now() + 2, from: "bot", text: "Connection error. Try again?" }]);
    } finally {
      setLoading(false);
    }
  };

  const sendRecognized = (t) => { setText(t); send(); };

  const toggleRecognition = () => {
    if (recognizing) { recognitionRef.current.stop(); } 
    else { recognitionRef.current.start(); setRecognizing(true); }
  };

  return (
    <div className="font-sans">
      {/* Trigger Button with Pulse Effect */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(!open)}
        className="fixed right-6 bottom-6 z-50 bg-amber-500 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-2xl"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="close" initial={{ rotate: -90 }} animate={{ rotate: 0 }} exit={{ rotate: 90 }}>✕</motion.span>
          ) : (
            <motion.span key="open" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>💬</motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            variants={windowVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed right-6 bottom-24 z-50 w-80 sm:w-96 max-w-[90vw] h-[500px] bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header with Gradient */}
            <div className="p-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                UniEats Helper
              </h3>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  variants={messageVariants}
                  initial="hidden"
                  animate="visible"
                  className={`flex ${m.from === "bot" ? "justify-start" : "justify-end"}`}
                >
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
                    m.from === "bot" 
                      ? "bg-white text-slate-800 rounded-tl-none border border-slate-200" 
                      : "bg-amber-500 text-white rounded-tr-none"
                  }`}>
                    {m.text}
                  </div>
                </motion.div>
              ))}

              {/* Animated Typing Indicator */}
              {loading && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="flex justify-start"
                >
                  <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none flex gap-1">
                    <motion.span variants={dotVariants} animate="animate" className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                    <motion.span variants={dotVariants} animate="animate" transition={{ delay: 0.2 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                    <motion.span variants={dotVariants} animate="animate" transition={{ delay: 0.4 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer Input */}
            <div className="p-4 bg-white border-t border-slate-100">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Type a message..."
                  className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500 transition-all"
                />
                
                {recognitionSupported && (
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={toggleRecognition}
                    className={`p-2 rounded-xl border transition-all ${
                      recognizing ? "bg-red-500 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]" : "bg-slate-100 text-slate-500 border-slate-100"
                    }`}
                  >
                    {recognizing ? "⏹️" : "🎤"}
                  </motion.button>
                )}

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={send}
                  disabled={!text.trim() || loading}
                  className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                >
                  Send
                </motion.button>
              </div>
              
              <div className="mt-3 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={voiceEnabled} 
                      onChange={(e) => setVoiceEnabled(e.target.checked)} 
                    />
                    <div className={`w-8 h-4 rounded-full transition-colors ${voiceEnabled ? 'bg-amber-500' : 'bg-slate-300'}`} />
                    <motion.div 
                      animate={{ x: voiceEnabled ? 16 : 2 }}
                      className="absolute top-0.5 left-0 w-3 h-3 bg-white rounded-full shadow-sm"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-600 transition-colors uppercase tracking-widest">Voice</span>
                </label>
                <span className="text-[10px] text-slate-300 font-medium">Powered by UniEats AI</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}