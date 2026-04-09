import { useEffect, useState, useRef } from "react";
import api from "../services/api";

export default function Chatbot({ user }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const [synthesisSupported, setSynthesisSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // welcome message
    setMessages([{ id: 0, from: "bot", text: "Hi — ask me: how many active vendors, list vendors, or what foods does <vendor> have?" }]);
    // detect Web Speech API support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setRecognitionSupported(!!SpeechRecognition);
    setSynthesisSupported(!!window.speechSynthesis);
    if (SpeechRecognition) {
      try {
        const r = new SpeechRecognition();
        r.lang = "en-US";
        r.interimResults = false;
        r.maxAlternatives = 1;
        recognitionRef.current = r;
        r.onresult = (ev) => {
          const t = ev.results[0][0].transcript;
          setText(t);
          // auto-send the recognized text
          setTimeout(() => sendRecognized(t), 50);
        };
        r.onend = () => setRecognizing(false);
      } catch (e) {
        console.warn("SpeechRecognition init failed", e);
        recognitionRef.current = null;
      }
    }
  }, []);

  const send = async () => {
    if (!text.trim()) return;
    const my = { id: Date.now(), from: "me", text: text.trim() };
    setMessages((m) => [...m, my]);
    setText("");
    setLoading(true);
    try {
      const res = await api.post("/api/chatbot", { question: my.text });
      const bot = { id: Date.now() + 1, from: "bot", text: res.data.answer || "Sorry, no answer." };
      setMessages((m) => [...m, bot]);
      // speak bot reply if enabled
      if (voiceEnabled && window.speechSynthesis && bot.text) {
        try {
          const utter = new SpeechSynthesisUtterance(bot.text);
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utter);
        } catch (e) {
          console.warn("SpeechSynthesis failed", e);
        }
      }
    } catch (err) {
      console.error("Chatbot request failed", err);
      setMessages((m) => [...m, { id: Date.now() + 2, from: "bot", text: "Sorry, I can't reach the helper right now." }]);
    } finally {
      setLoading(false);
    }
  };

  const sendRecognized = async (recognizedText) => {
    if (!recognizedText || !recognizedText.trim()) return;
    const my = { id: Date.now(), from: "me", text: recognizedText.trim() };
    setMessages((m) => [...m, my]);
    setLoading(true);
    try {
      const res = await api.post("/api/chatbot", { question: my.text });
      const bot = { id: Date.now() + 1, from: "bot", text: res.data.answer || "Sorry, no answer." };
      setMessages((m) => [...m, bot]);
      if (voiceEnabled && window.speechSynthesis && bot.text) {
        try {
          const utter = new SpeechSynthesisUtterance(bot.text);
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utter);
        } catch (e) {
          console.warn("SpeechSynthesis failed", e);
        }
      }
    } catch (err) {
      console.error("Chatbot request failed", err);
      setMessages((m) => [...m, { id: Date.now() + 2, from: "bot", text: "Sorry, I can't reach the helper right now." }]);
    } finally {
      setLoading(false);
    }
  };

  const toggleRecognition = () => {
    const r = recognitionRef.current;
    if (!r) return;
    if (recognizing) {
      r.stop();
      setRecognizing(false);
    } else {
      try {
        r.start();
        setRecognizing(true);
      } catch (e) {
        console.warn("Recognition start failed", e);
      }
    }
  };

  return (
    <div>
      <button
        aria-label="Open chat"
        onClick={() => setOpen((v) => !v)}
        className="fixed right-6 bottom-6 z-50 bg-amber-500 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center"
      >
        💬
      </button>

      {open && (
        <div className="fixed right-6 bottom-20 z-50 w-80 max-w-[90vw] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-3 border-b border-slate-100 font-semibold">UniEats Assistant</div>
          <div className="p-3 h-56 overflow-auto space-y-2">
            {messages.map((m) => (
              <div key={m.id} className={m.from === "bot" ? "text-sm text-slate-700" : "text-sm text-right text-slate-900"}>
                <div className={m.from === "bot" ? "inline-block bg-slate-50 p-2 rounded-lg" : "inline-block bg-amber-50 p-2 rounded-lg"}>{m.text}</div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-slate-100 flex items-center gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e)=>{ if(e.key==='Enter') send(); }}
              className="flex-1 px-3 py-2 border rounded-lg"
              placeholder="Ask me about vendors or menus"
            />
            <div className="flex items-center gap-2 flex-shrink-0">
              {recognitionSupported ? (
                <button
                  title="Use microphone"
                  onClick={toggleRecognition}
                  className={`p-2 rounded-lg border ${recognizing? 'bg-red-500 text-white':'bg-white'}`}
                >
                  {recognizing ? '🎙️' : '🎤'}
                </button>
              ) : (
                <div className="text-xs text-slate-400 px-2">Mic N/A</div>
              )}
              <button onClick={send} disabled={loading} className="px-3 py-2 bg-amber-500 text-white rounded-lg">Send</button>
            </div>
            <label className="flex items-center gap-1 text-xs ml-1">
              <input type="checkbox" checked={voiceEnabled} onChange={(e)=>setVoiceEnabled(e.target.checked)} />
              <span className="select-none">Voice</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
