import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Shield,
  Activity,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { fetchMarketAnalysis } from '../services/api';

export default function AiMarketSignalCard({ symbol = 'RELIANCE', onOpenChatbot }) {
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const loadEvaluation = async () => {
      if (!symbol) return;
      setLoading(true);
      setError(null);
      try {
        const data = await fetchMarketAnalysis(symbol);
        if (isMounted) setEvaluation(data);
      } catch (err) {
        if (isMounted) setError(err.message || 'Signal analysis unavailable');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadEvaluation();
    return () => {
      isMounted = false;
    };
  }, [symbol]);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center justify-center gap-3 text-slate-500 text-xs">
        <BrainCircuit className="w-5 h-5 text-blue-600 animate-pulse" />
        <span>Evaluating technical indicators & DAA setup for {symbol}...</span>
      </div>
    );
  }

  if (error || !evaluation) {
    return null;
  }

  const isBuy = evaluation.signal_code === 'BUY';
  const isSell = evaluation.signal_code === 'SELL';
  const isWatch = evaluation.signal_code === 'WATCH';

  const badgeBg = isBuy
    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
    : isSell
    ? 'bg-rose-50 border-rose-200 text-rose-800'
    : 'bg-amber-50 border-amber-200 text-amber-800';

  const riskBadge =
    evaluation.risk_level === 'LOW RISK'
      ? 'bg-blue-50 text-blue-800 border-blue-200'
      : evaluation.risk_level === 'HIGH RISK'
      ? 'bg-rose-50 text-rose-800 border-rose-200'
      : 'bg-amber-50 text-amber-800 border-amber-200';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-xs">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-sm tracking-tight">
                AI MARKET SIGNAL
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold">
                {evaluation.symbol}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Technical Quantitative Score & Risk Classification
            </p>
          </div>
        </div>

        {/* CTA Button to open chatbot */}
        <button
          onClick={() => onOpenChatbot && onOpenChatbot(symbol)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer group"
        >
          <MessageSquare className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          <span>Ask Market Analyst</span>
        </button>
      </div>

      {/* Main Signal Display Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        
        {/* Signal Status Box */}
        <div className={`p-4 rounded-xl border ${badgeBg} space-y-1.5`}>
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">
            ANALYTICAL SETUP
          </span>
          <div className="text-base sm:text-lg font-black tracking-tight">
            {evaluation.signal}
          </div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold pt-1">
            <span>Score: <span className="font-bold">{evaluation.score > 0 ? `+${evaluation.score}` : evaluation.score}</span></span>
            <span>•</span>
            <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${riskBadge}`}>
              {evaluation.risk_level}
            </span>
          </div>
        </div>

        {/* Indicator Snapshot */}
        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div>
            <span className="text-slate-400 block text-[10px]">20-Day SMA</span>
            <span className="font-bold text-slate-800 font-mono">
              {evaluation.indicators.sma20 ? `₹${evaluation.indicators.sma20.toLocaleString('en-IN')}` : 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">RSI (14)</span>
            <span className="font-bold text-slate-800 font-mono">
              {evaluation.indicators.rsi14 ? `${evaluation.indicators.rsi14}` : 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Ann. Volatility</span>
            <span className="font-bold text-slate-800 font-mono">
              {evaluation.indicators.annualized_volatility_pct ? `${evaluation.indicators.annualized_volatility_pct}%` : 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Historical Opportunity</span>
            <span className="font-bold text-emerald-700 font-mono">
              {evaluation.daa_result ? `+₹${evaluation.daa_result.max_profit.toFixed(0)}` : 'N/A'}
            </span>
          </div>
        </div>

        {/* Why this signal? */}
        <div className="space-y-1.5 text-xs text-slate-700">
          <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">
            Primary Factors
          </span>
          <ul className="space-y-1 text-[11px]">
            {evaluation.positive_factors.slice(0, 2).map((f, i) => (
              <li key={i} className="flex items-start gap-1.5 text-emerald-800">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="line-clamp-1">{f}</span>
              </li>
            ))}
            {evaluation.negative_factors.slice(0, 1).map((f, i) => (
              <li key={i} className="flex items-start gap-1.5 text-rose-800">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                <span className="line-clamp-1">{f}</span>
              </li>
            ))}
            {evaluation.positive_factors.length === 0 && evaluation.negative_factors.length === 0 && (
              <li className="text-slate-500 italic">Indicators are in equilibrium; awaiting trend breakout.</li>
            )}
          </ul>
        </div>

      </div>

      {/* Educational Disclaimer */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <Shield className="w-3 h-3 text-slate-400" />
          <span>Educational analytical indicator • Not guaranteed investment advice</span>
        </span>
        <button
          onClick={() => onOpenChatbot && onOpenChatbot(symbol)}
          className="text-blue-600 hover:text-blue-800 font-semibold underline"
        >
          View Full Breakdown
        </button>
      </div>

    </div>
  );
}
