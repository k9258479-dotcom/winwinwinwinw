import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, ShieldCheck } from 'lucide-react';
import { sounds } from '../utils/audio';
import { db } from '../firebase';
import { doc, setDoc, collection } from 'firebase/firestore';

interface ChatMessage {
  id: string;
  sender: 'cs' | 'user';
  senderName?: string;
  text: string;
  time: string;
}

const FAQ_PROMPTS = [
  'Paano mag-deposit sa GCash / Maya?',
  'Magkano ang minimum cashout?',
  'Paano kunin ang Welcome Bonus ₱100?',
  'Mabilis ba ang payout settlement?',
];

export const LiveChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'cs',
      senderName: 'Bet88 Support',
      text: 'Magandang araw! Welcome po sa Bet88 24/7 Live Customer Support. Paano po namin kayo matutulungan ngayon?',
      time: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper to dynamically get active session info
  const getActiveSessionInfo = () => {
    try {
      const storedUser = localStorage.getItem('bet88_currentUser');
      if (storedUser) {
        const u = JSON.parse(storedUser);
        if (u && u.phone) {
          return {
            sessionId: u.phone,
            phone: u.phone,
            playerName: u.username || `Player_${u.phone.slice(-4)}`
          };
        }
      }
    } catch {}

    let sid = sessionStorage.getItem('bet88_chat_sid');
    if (!sid) {
      sid = `guest_${Math.floor(100000 + Math.random() * 900000)}`;
      sessionStorage.setItem('bet88_chat_sid', sid);
    }
    return {
      sessionId: sid,
      phone: '',
      playerName: 'Guest Player'
    };
  };

  const [activeSession, setActiveSession] = useState(getActiveSessionInfo);

  // Sync session whenever chat widget is opened
  useEffect(() => {
    if (isOpen) {
      setActiveSession(getActiveSessionInfo());
    }
  }, [isOpen]);

  // Poll backend for real-time CSR replies while chat window is open
  useEffect(() => {
    if (!isOpen) return;

    const currentSession = getActiveSessionInfo();
    setActiveSession(currentSession);

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chat/messages?sessionId=${encodeURIComponent(currentSession.sessionId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.messages) && data.messages.length > 0) {
            setMessages(prev => {
              const map = new Map<string, ChatMessage>();
              prev.forEach(m => map.set(m.id, m));
              data.messages.forEach((m: any) => {
                map.set(m.id, {
                  id: m.id,
                  sender: m.sender,
                  senderName: m.senderName,
                  text: m.text,
                  time: m.time || 'Just now',
                });
              });
              return Array.from(map.values());
            });
          }
        }
      } catch (err) {}
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const sessionInfo = getActiveSessionInfo();
    setActiveSession(sessionInfo);

    sounds.playClick();
    const tempId = `temp_${Date.now()}`;
    const userMsg: ChatMessage = {
      id: tempId,
      sender: 'user',
      senderName: sessionInfo.playerName || 'You',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText('');

    // 1. Post to backend Live Support API
    try {
      await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionInfo.sessionId,
          senderName: sessionInfo.playerName,
          phone: sessionInfo.phone,
          text,
        }),
      });
    } catch (e) {}

    // 2. Also save to Firestore for resilient multi-device sync
    try {
      const msgDocId = `msg_${Date.now()}`;
      await setDoc(doc(db, 'csr_messages', msgDocId), {
        id: msgDocId,
        sessionId: sessionInfo.sessionId,
        phone: sessionInfo.phone || sessionInfo.sessionId,
        sender: 'user',
        senderName: sessionInfo.playerName || 'Player',
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
      });

      await setDoc(doc(db, 'csr_sessions', sessionInfo.sessionId), {
        sessionId: sessionInfo.sessionId,
        phone: sessionInfo.phone || sessionInfo.sessionId,
        playerName: sessionInfo.playerName || 'Player',
        lastMessage: text,
        lastTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {}

    // 2. Instant helpful quick response for known FAQs if CSR hasn't replied yet
    const lower = text.toLowerCase();
    if (lower.includes('deposit') || lower.includes('gcash') || lower.includes('cash in') || lower.includes('cashin')) {
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: `auto_${Date.now()}`,
            sender: 'cs',
            senderName: 'Bet88 Bot Support',
            text: 'Pindutin lamang ang "+ PHP" button sa itaas o pumunta sa Cashier. Piliin ang GCash, PayMaya, o PayMongo Gateway, i-type ang halaga (min. ₱50), at kumpirmahin. Auto-credit po agad ito!',
            time: 'Just now',
          },
        ]);
      }, 700);
    } else if (lower.includes('cashout') || lower.includes('withdraw') || lower.includes('minimum')) {
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: `auto_${Date.now()}`,
            sender: 'cs',
            senderName: 'Bet88 Bot Support',
            text: 'Ang minimum cashout natin ay ₱200 lamang at 0% withdrawal fee. Payouts are dispatched within 3-5 minutes direkta sa inyong GCash/Maya number!',
            time: 'Just now',
          },
        ]);
      }, 700);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => {
            sounds.playClick();
            setIsOpen(true);
          }}
          className="fixed bottom-5 right-5 z-40 p-3.5 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 font-bold text-xs"
        >
          <MessageSquare className="w-5 h-5 fill-current" />
          <span className="hidden sm:inline">24/7 Live CS</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 w-80 sm:w-96 bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 h-[480px]">
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-slate-900 via-amber-950/50 to-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-400">BET88 LIVE AGENT</h4>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Online · Instant Response
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="p-3 overflow-y-auto flex-1 space-y-2.5 text-xs">
            {messages.map(m => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-2.5 rounded-xl max-w-[85%] leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-amber-500 text-slate-950 font-medium rounded-br-none'
                      : 'bg-slate-800 text-slate-200 border border-slate-700/80 rounded-bl-none'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[9px] text-slate-500 mt-0.5 px-1">{m.time}</span>
              </div>
            ))}
          </div>

          {/* Quick FAQ Chips */}
          <div className="p-2 border-t border-slate-800/80 bg-slate-950/60 overflow-x-auto flex gap-1.5 scrollbar-none text-[11px]">
            {FAQ_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-amber-400 whitespace-nowrap hover:border-slate-700"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Magtanong dito..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="p-2 bg-amber-500 text-slate-950 rounded-xl hover:bg-amber-400"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
