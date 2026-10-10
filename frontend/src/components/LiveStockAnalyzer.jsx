import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceArea,
  ReferenceDot,
} from 'recharts';
import {
  Search,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Calendar,
  Zap,
  CheckCircle2,
  Clock,
  Activity,
  ArrowUpRight,
  Sparkles,
  BarChart2,
  Info,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { searchLiveStocks, fetchLiveQuote, analyzeLiveStock } from '../services/api';
import AiMarketSignalCard from './AiMarketSignalCard';

const PRESET_STOCKS = [
  { symbol: 'RELIANCE', name: 'Reliance Ind.', sector: 'Energy / Oil' },
  { symbol: 'TCS', name: 'Tata Consultancy', sector: 'IT Services' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', sector: 'Banking' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', sector: 'Banking' },
  { symbol: 'INFY', name: 'Infosys', sector: 'IT Services' },
  { symbol: 'SBIN', name: 'SBI', sector: 'Public Bank' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors', sector: 'Automobile' },
  { symbol: 'ITC', name: 'ITC Ltd.', sector: 'FMCG' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel', sector: 'Telecom' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki', sector: 'Automobile' },
  { symbol: 'LT', name: 'L&T', sector: 'Infrastructure' },
  { symbol: 'ZOMATO', name: 'Zomato', sector: 'Tech / Consumer' },
  { symbol: '^NSEI', name: 'NIFTY 50', sector: 'Benchmark Index' },
  { symbol: '^BSESN', name: 'SENSEX', sector: 'Benchmark Index' },
];

const TIMEFRAMES = [
  { id: '1d', label: '1D (Intraday 5m)', range: '1d', interval: '5m' },
  { id: '5d', label: '5D (15m)', range: '5d', interval: '15m' },
  { id: '1mo', label: '1 Month', range: '1mo', interval: '1d' },
  { id: '6mo', label: '6 Months', range: '6mo', interval: '1d' },
  { id: '1y', label: '1 Year', range: '1y', interval: '1d' },
  { id: '5y', label: '5 Years', range: '5y', interval: '1d' },
];

export default function LiveStockAnalyzer({ initialSymbol = 'RELIANCE', onOpenChatbot }) {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [exchange, setExchange] = useState('NSE');
  const [timeframe, setTimeframe] = useState(TIMEFRAMES[2]); // 1mo default
  const [analysis, setAnalysis] = useState(null);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Search autocomplete state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchContainerRef = useRef(null);

  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [countdown, setCountdown] = useState(15);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Perform Live DAA Analysis
  const performLiveAnalysis = useCallback(async (sym, tf) => {
    if (!sym) return;
    setLoading(true);
    setError(null);
    try {
      // Build effective symbol with exchange suffix if needed
      let targetSym = sym;
      if (!sym.startsWith('^') && !sym.includes('.')) {
        targetSym = exchange === 'BSE' ? `${sym}.BO` : `${sym}.NS`;
      }

      const [analysisData, quoteData] = await Promise.all([
        analyzeLiveStock(targetSym, tf.range, tf.interval),
        fetchLiveQuote(targetSym).catch(() => null),
      ]);

      setAnalysis(analysisData);
      setQuote(quoteData);
      setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour12: false }));
      setCountdown(15);
    } catch (err) {
      setError(err.message || `Failed to analyze live feed for ${sym}`);
    } finally {
      setLoading(false);
    }
  }, [exchange]);

  // Load when symbol or timeframe changes
  useEffect(() => {
    performLiveAnalysis(symbol, timeframe);
  }, [symbol, timeframe, performLiveAnalysis]);

  // Search debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchLiveStocks(searchQuery);
        setSearchResults(results);
        setSearchOpen(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close search dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto refresh timer
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          performLiveAnalysis(symbol, timeframe);
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, symbol, timeframe, performLiveAnalysis]);

  const handleSelectSearchResult = (res) => {
    setSymbol(res.symbol);
    if (res.exchange) setExchange(res.exchange);
    setSearchQuery('');
    setSearchOpen(false);
  };

  const handleSelectPreset = (preset) => {
    setSymbol(preset.symbol);
    setSearchQuery('');
    setSearchOpen(false);
  };

  const isPositive = quote && quote.change >= 0;
  const isNeutral = quote && (quote.change === 0 || quote.change === null);

  return (
    <div className="space-y-6">

      {/* Header Banner & Live Search Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/50 relative overflow-hidden">
        {/* Background ambient glowing orbs */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-[11px] font-bold text-rose-300 tracking-wider">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                REAL-TIME NSE / BSE FEED
              </span>
              <span className="text-xs text-indigo-300 font-mono">Powered by Indian Stock Market API</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Live Stock Market DAA Profit Analyzer
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Stream live tick & candlestick data for any Indian company across NSE & BSE. 
              The engine reduces the real-time continuous holding problem to Maximum Subarray and computes 
              optimal buy/sell boundaries in <span className="font-mono text-emerald-400 font-bold">O(n)</span> via Kadane's Algorithm.
            </p>
          </div>

          {/* Search Box */}
          <div className="w-full md:w-80 relative" ref={searchContainerRef}>
            <label className="block text-[11px] font-semibold text-indigo-200 mb-1.5">
              SEARCH ANY INDIAN STOCK OR TICKER
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Tata Motors, Zomato, Reliance, INFY..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setSearchOpen(true);
                }}
                className="w-full bg-slate-800/90 border border-indigo-500/40 rounded-xl pl-9 pr-8 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              {searching && (
                <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin absolute right-3 top-3.5" />
              )}
            </div>

            {/* Autocomplete Dropdown */}
            {searchOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-indigo-500/40 rounded-xl shadow-2xl z-50 overflow-hidden max-h-72 overflow-y-auto">
                <div className="p-2 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Matching Indian Equities ({searchResults.length})
                </div>
                {searchResults.map((item, idx) => (
                  <button
                    key={`${item.symbol}-${idx}`}
                    onClick={() => handleSelectSearchResult(item)}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-indigo-900/50 flex items-center justify-between transition-colors border-b border-slate-800/50 last:border-0"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-blue-400 text-xs font-mono">{item.symbol}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                          {item.exchange || 'NSE'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-200 truncate max-w-[200px]">{item.company_name}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Popular Presets Bar */}
        <div className="mt-6 pt-4 border-t border-indigo-900/60 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Top NSE Equities:
          </span>
          {PRESET_STOCKS.map((preset) => {
            const isSelected = symbol.toUpperCase().replace(/\.(NS|BO)/, '') === preset.symbol;
            return (
              <button
                key={preset.symbol}
                onClick={() => handleSelectPreset(preset)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/50 ring-1 ring-blue-300'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/50'
                }`}
              >
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Control Strip: Timeframe, Exchange, Auto-Refresh */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3">
        
        {/* Timeframe Selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 overflow-x-auto">
          {TIMEFRAMES.map((tf) => {
            const isActive = timeframe.id === tf.id;
            return (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white text-blue-700 shadow-sm font-bold border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tf.label}
              </button>
            );
          })}
        </div>

        {/* Right Side: Refresh & Polling Status */}
        <div className="flex items-center gap-3">
          
          {/* Exchange Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setExchange('NSE')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                exchange === 'NSE' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              NSE (.NS)
            </button>
            <button
              onClick={() => setExchange('BSE')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                exchange === 'BSE' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              BSE (.BO)
            </button>
          </div>

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              autoRefresh
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-slate-100 text-slate-600 border-slate-300'
            }`}
          >
            <Activity className={`w-3.5 h-3.5 ${autoRefresh ? 'text-emerald-600 animate-pulse' : 'text-slate-400'}`} />
            <span>{autoRefresh ? `Live (${countdown}s)` : 'Paused'}</span>
          </button>

          {/* Manual Refresh Button */}
          <button
            onClick={() => performLiveAnalysis(symbol, timeframe)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => performLiveAnalysis(symbol, timeframe)}
            className="font-bold underline text-rose-900 hover:text-black"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Analysis Display */}
      {loading && !analysis ? (
        <div className="bg-white border border-slate-200 rounded-xl p-20 shadow-sm flex flex-col items-center justify-center gap-3 text-slate-500 text-xs">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="font-semibold text-slate-700">
            Streaming live market data for {symbol} ({exchange}) and running Kadane O(n)...
          </span>
        </div>
      ) : (
        analysis && (
          <div className="space-y-6">

            {/* Live Stock Quote & Fundamentals Header Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                
                {/* Left: Company & Live Price */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {analysis.company_name || analysis.stock}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-xs font-mono font-bold">
                      {analysis.symbol} • {exchange}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                      LIVE
                    </span>
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl sm:text-4xl font-black font-mono text-slate-900">
                      ₹{quote?.last_price !== null && quote?.last_price !== undefined
                        ? quote.last_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })
                        : analysis.sell_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>

                    {quote && (
                      <div
                        className={`flex items-center gap-1 text-sm font-bold font-mono ${
                          isNeutral ? 'text-slate-500' : isPositive ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span>
                          {isPositive ? '+' : ''}₹{quote.change?.toFixed(2) || '0.00'} (
                          {isPositive ? '+' : ''}{quote.percent_change?.toFixed(2) || '0.00'}%)
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    Last tick: {lastUpdated ? `Today at ${lastUpdated} IST` : 'Real-time feed'} • Currency: INR (₹)
                  </p>
                </div>

                {/* Right: Key Fundamental Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Day High / Low</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {quote?.day_high ? `₹${quote.day_high}` : '—'} / {quote?.day_low ? `₹${quote.day_low}` : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">52-Week High / Low</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {quote?.year_high ? `₹${quote.year_high}` : '—'} / {quote?.year_low ? `₹${quote.year_low}` : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">P/E Ratio</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {quote?.pe_ratio ? `${quote.pe_ratio.toFixed(2)}x` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Market Cap</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {quote?.market_cap ? `₹${(quote.market_cap / 1e7).toFixed(0)} Cr` : 'N/A'}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* DAA KPI Cards (Maximum Retrospective Continuous Profit) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Maximum Subarray Profit */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>MAX HISTORICAL PROFIT</span>
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black font-mono text-emerald-600">
                  +₹{analysis.maximum_profit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold font-mono">
                    +{analysis.profit_percentage.toFixed(2)}% ROI
                  </span>
                  <span className="text-slate-400">in window</span>
                </div>
              </div>

              {/* Card 2: Optimal Buy Date & Price */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>OPTIMAL BUY (L = {analysis.buy_index})</span>
                  <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black font-mono text-blue-600">
                  ₹{analysis.buy_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-slate-600 flex items-center gap-1 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{analysis.buy_date}</span>
                </p>
              </div>

              {/* Card 3: Optimal Sell Date & Price */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>OPTIMAL SELL (R+1 = {analysis.sell_index})</span>
                  <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black font-mono text-indigo-600">
                  ₹{analysis.sell_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-slate-600 flex items-center gap-1 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{analysis.sell_date}</span>
                </p>
              </div>

              {/* Card 4: Holding Duration & Samples */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>HOLDING WINDOW</span>
                  <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black font-mono text-slate-900">
                  {analysis.sell_index - analysis.buy_index} <span className="text-sm font-normal text-slate-500">Candles</span>
                </div>
                <p className="text-xs text-slate-500">
                  Sampled: {analysis.dataset_size} total points ({timeframe.label})
                </p>
              </div>

            </div>

            {/* AI Market Signal Card & Technical Indicators */}
            <AiMarketSignalCard symbol={symbol} onOpenChatbot={onOpenChatbot} />

            {/* Verification Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-600 text-white shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-900 block">
                    3-Way Algorithmic Equivalence Confirmed
                  </span>
                  <span className="text-xs text-emerald-700">
                    {analysis.verification.message} — Dynamic Programming Kadane O(n) ≡ Divide & Conquer O(n log n) ≡ Brute Force O(n²).
                  </span>
                </div>
              </div>
              <span className="hidden sm:inline px-3 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-800 text-xs font-mono font-bold shadow-xs">
                S_KD ≡ S_DC ≡ S_BF
              </span>
            </div>

            {/* Interactive Live Price Chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-blue-600" />
                    <span>Live Price Chart with Optimal Holding Window</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Shaded emerald area highlights the continuous maximum subarray holding window [L={analysis.buy_index}, R+1={analysis.sell_index}].
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                    <span>Buy Point (₹{analysis.buy_price.toFixed(2)})</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                    <span>Sell Point (₹{analysis.sell_price.toFixed(2)})</span>
                  </span>
                </div>
              </div>

              {/* Chart Canvas */}
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analysis.chart_data} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                      minTickGap={30}
                    />
                    <YAxis
                      domain={['auto', 'auto']}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickFormatter={(v) => `₹${v}`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const pt = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs space-y-1 border border-slate-700">
                              <p className="font-semibold text-slate-300 flex items-center gap-1 border-b border-slate-700 pb-1">
                                <Calendar className="w-3 h-3 text-blue-400" />
                                <span>{pt.date}</span>
                              </p>
                              <p className="font-bold text-sm font-mono text-emerald-400">
                                Close: ₹{pt.close.toFixed(2)}
                              </p>
                              {pt.change !== null && (
                                <p className="text-[11px] font-mono text-slate-300">
                                  ΔP: {pt.change >= 0 ? `+₹${pt.change.toFixed(2)}` : `-₹${Math.abs(pt.change).toFixed(2)}`}
                                </p>
                              )}
                              {pt.is_buy && (
                                <span className="inline-block px-1.5 py-0.5 rounded bg-blue-500 text-white font-bold text-[10px]">
                                  BUY POINT
                                </span>
                              )}
                              {pt.is_sell && (
                                <span className="inline-block px-1.5 py-0.5 rounded bg-rose-500 text-white font-bold text-[10px]">
                                  SELL POINT
                                </span>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />

                    {/* Shaded Optimal Window */}
                    {!analysis.all_negative && (
                      <ReferenceArea
                        x1={analysis.buy_date}
                        x2={analysis.sell_date}
                        fill="#10b981"
                        fillOpacity={0.12}
                        stroke="#10b981"
                        strokeOpacity={0.4}
                        strokeDasharray="3 3"
                      />
                    )}

                    <Line
                      type="monotone"
                      dataKey="close"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 5, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }}
                    />

                    {/* Buy Marker Dot */}
                    {!analysis.all_negative && (
                      <ReferenceDot
                        x={analysis.buy_date}
                        y={analysis.buy_price}
                        r={6}
                        fill="#10b981"
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    )}

                    {/* Sell Marker Dot */}
                    {!analysis.all_negative && (
                      <ReferenceDot
                        x={analysis.sell_date}
                        y={analysis.sell_price}
                        r={6}
                        fill="#ef4444"
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* DAA Algorithm Comparison Table */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>DAA Algorithm Performance Matrix on Live Stream Data</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Measured on {analysis.dataset_size} live candlestick price changes in pure Python.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Algorithm</th>
                      <th className="py-3 px-4">Paradigm</th>
                      <th className="py-3 px-4">Time Complexity</th>
                      <th className="py-3 px-4">Space Complexity</th>
                      <th className="py-3 px-4">Max Profit (₹)</th>
                      <th className="py-3 px-4 text-right">Measured Runtime</th>
                      <th className="py-3 px-4 text-right">Empirical Speedup</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* Kadane */}
                    <tr className="bg-emerald-50/40 hover:bg-emerald-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-emerald-900 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                        Kadane's Algorithm
                        <span className="px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-800 text-[10px] font-mono font-bold">
                          OPTIMAL
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">Dynamic Programming</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">O(n)</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">O(1)</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        ₹{analysis.algorithms.kadane.max_sum.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                        {analysis.algorithms.kadane.execution_time_ms !== null
                          ? `${analysis.algorithms.kadane.execution_time_ms.toFixed(4)} ms`
                          : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                        {analysis.algorithms.brute_force?.execution_time_ms &&
                        analysis.algorithms.kadane?.execution_time_ms &&
                        analysis.algorithms.kadane.execution_time_ms > 0
                          ? `${(analysis.algorithms.brute_force.execution_time_ms / analysis.algorithms.kadane.execution_time_ms).toFixed(1)}x faster`
                          : 'Baseline'}
                      </td>
                    </tr>

                    {/* Divide & Conquer */}
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-blue-900 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        Divide & Conquer
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">Recursive Reduction</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">O(n log n)</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">O(log n) stack</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        ₹{analysis.algorithms.divide_conquer.max_sum.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-blue-700">
                        {analysis.algorithms.divide_conquer.execution_time_ms !== null
                          ? `${analysis.algorithms.divide_conquer.execution_time_ms.toFixed(4)} ms`
                          : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                        {analysis.algorithms.brute_force?.execution_time_ms &&
                        analysis.algorithms.divide_conquer?.execution_time_ms &&
                        analysis.algorithms.divide_conquer.execution_time_ms > 0
                          ? `${(analysis.algorithms.brute_force.execution_time_ms / analysis.algorithms.divide_conquer.execution_time_ms).toFixed(1)}x faster`
                          : '—'}
                      </td>
                    </tr>

                    {/* Brute Force */}
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-amber-900 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                        Brute Force
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">Exhaustive Search</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-700">O(n²)</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">O(1)</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        ₹{analysis.algorithms.brute_force.max_sum.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-700">
                        {analysis.algorithms.brute_force.execution_time_ms !== null
                          ? `${analysis.algorithms.brute_force.execution_time_ms.toFixed(4)} ms`
                          : 'Skipped (>5000)'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-400">1.0x (Reference)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )
      )}

    </div>
  );
}
