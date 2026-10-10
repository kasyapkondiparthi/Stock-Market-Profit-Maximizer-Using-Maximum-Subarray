import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  RefreshCw,
  TrendingUp,
  Shield,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  BarChart2,
  Trash2,
} from 'lucide-react';
import { sendAnalystChatMessage, fetchMarketAnalysis } from '../services/api';

export default function MarketAnalystChatbot({
  isOpen,
  setIsOpen,
  selectedSymbol = 'RELIANCE',
}) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: `👋 Hello! I am your **AI Market Analyst**.\n\nI combine real-time Indian stock market feeds, technical indicators (SMA20, SMA50, RSI14, Volatility), and **DAA Maximum Subarray** algorithmic optimization (Kadane O(n)) to provide objective analytical insights.\n\nCurrently analyzing: **${selectedSymbol}**.\n\n*How can I assist you with your market analysis today?*`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [showQuickMetrics, setShowQuickMetrics] = useState(true);
  const messagesEndRef = useRef(null);

  // Load evaluation context when stock changes
  useEffect(() => {
    let isMounted = true;
    const loadEval = async () => {
      try {
        const data = await fetchMarketAnalysis(selectedSymbol);
        if (isMounted) setEvaluation(data);
      } catch (err) {
        console.error('Failed to load evaluation for chatbot:', err);
      }
    };
    if (selectedSymbol) {
      loadEval();
    }
    return () => {
      isMounted = false;
    };
  }, [selectedSymbol]);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend = null) => {
    const query = textToSend || inputValue;
    if (!query.trim() || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const response = await sendAnalystChatMessage(query, selectedSymbol, historyPayload);

      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: `⚠️ **Unable to process analysis request:** ${err.message || 'Live market service timeout'}. Please verify that the backend feed is active.`,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: Date.now(),
        sender: 'bot',
        text: `Chat cleared. Currently analyzing **${selectedSymbol}**. Ask me any technical, risk, or DAA profit question!`,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Quick Prompt Chips
  const promptSuggestions = [
    `Analyze ${selectedSymbol}`,
    `Should I buy ${selectedSymbol}?`,
    `What is the risk level?`,
    `Compare ${selectedSymbol} and TCS`,
    `Show DAA maximum profit window`,
    `Who is the top gainer today?`,
    `Explain RSI & moving averages`,
  ];

  // Helper to render markdown-like text nicely
  const renderMessageContent = (text) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Table formatting
      if (line.startsWith('|')) {
        return (
          <div key={idx} className="font-mono text-[11px] bg-slate-800/80 px-2 py-0.5 rounded my-0.5 text-slate-200 overflow-x-auto whitespace-pre">
            {line}
          </div>
        );
      }
      // Headings
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-extrabold text-sm text-indigo-200 mt-2 mb-1">
            {line.replace('### ', '')}
          </h4>
        );
      }
      // Blockquote disclaimer
      if (line.startsWith('> ')) {
        return (
          <div key={idx} className="mt-2.5 p-2 rounded bg-indigo-950/60 border-l-2 border-indigo-500 text-[10px] text-indigo-300 italic">
            {line.replace('> ', '')}
          </div>
        );
      }
      // Bold list items or bullet points
      if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('✓') || line.trim().startsWith('✗')) {
        return (
          <div key={idx} className="flex items-start gap-1.5 my-0.5 text-slate-200 text-xs">
            <span className="text-indigo-400 font-bold">{line.trim().charAt(0)}</span>
            <span>{line.trim().slice(1)}</span>
          </div>
        );
      }
      // Empty lines
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }
      // Normal paragraph
      return (
        <p key={idx} className="text-xs text-slate-100 leading-relaxed">
          {line}
        </p>
      );
    });
  };

  return (
    <>
      {/* Floating Action Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer ring-2 ring-white/20 group"
          title="Open AI Market Analyst"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <span className="font-extrabold text-xs tracking-wide">
            AI Market Analyst
          </span>
          <span className="px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-mono font-bold">
            {selectedSymbol}
          </span>
        </button>
      )}

      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[95vw] sm:w-[440px] max-h-[88vh] h-[640px] flex flex-col bg-slate-900 border border-indigo-500/40 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* Top Header */}
          <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-indigo-500/30 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-white tracking-tight">
                    AI MARKET ANALYST
                  </h3>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold">
                    LIVE
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Active Stock: <span className="font-mono font-bold text-blue-400">{selectedSymbol}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                title="Clear Chat History"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                title="Close Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Stock Metrics Context Bar */}
          {evaluation && (
            <div className="bg-slate-950/80 border-b border-indigo-950 p-3 shrink-0">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">LIVE PRICE</span>
                  <span className="font-extrabold font-mono text-white text-sm">
                    ₹{evaluation.current_price?.toLocaleString('en-IN') || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">ANALYTICAL SIGNAL</span>
                  <span
                    className={`font-bold text-xs ${
                      evaluation.signal_code === 'BUY'
                        ? 'text-emerald-400'
                        : evaluation.signal_code === 'SELL'
                        ? 'text-rose-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {evaluation.signal}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">SCORE / RISK</span>
                  <span className="font-mono text-xs font-semibold text-slate-300">
                    {evaluation.score > 0 ? `+${evaluation.score}` : evaluation.score} • {evaluation.risk_level.replace(' RISK', '')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Chat Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-700">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs ${
                      isUser
                        ? 'bg-blue-600 text-white'
                        : 'bg-indigo-600 text-white shadow-xs'
                    }`}
                  >
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs shadow-md ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-slate-800 border border-slate-700/80 text-slate-100 rounded-tl-none space-y-1'
                    }`}
                  >
                    {isUser ? <p>{msg.text}</p> : renderMessageContent(msg.text)}
                    <span className={`block text-[9px] mt-1 ${isUser ? 'text-blue-200 text-right' : 'text-slate-400 text-left'}`}>
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-3 rounded-tl-none flex items-center gap-2 text-xs text-slate-400">
                  <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                  <span>Computing technical indicators & DAA setup...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="p-2 bg-slate-950/70 border-t border-slate-800/80 overflow-x-auto scrollbar-none flex items-center gap-1.5 shrink-0">
            {promptSuggestions.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={loading}
                className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-indigo-900/60 text-slate-300 hover:text-white border border-slate-700 text-[10px] font-medium whitespace-nowrap transition-all cursor-pointer shrink-0 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Bottom Chat Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-slate-900 border-t border-indigo-950/80 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              placeholder={`Ask about ${selectedSymbol}, indicators, or comparisons...`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={loading}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || loading}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>
      )}
    </>
  );
}
