import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Activity,
  Search,
  Plus,
  Trash2,
  BrainCircuit,
  MessageSquare,
  Layers,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Scale,
  Calendar,
} from 'lucide-react';
import { analyzeAllStocks, fetchLiveMatrix, searchLiveStocks } from '../services/api';

const DEFAULT_LIVE_SYMBOLS = [
  'RELIANCE',
  'TCS',
  'HDFCBANK',
  'ICICIBANK',
  'INFY',
  'SBIN',
  'TATAMOTORS',
  'ITC',
  'BHARTIARTL',
  'MARUTI',
  'LT',
  'ZOMATO',
  '^NSEI',
];

const TIMEFRAMES = [
  { id: '1d', label: '1D (Intraday 5m)', range: '1d' },
  { id: '5d', label: '5D (15m)', range: '5d' },
  { id: '1mo', label: '1 Month', range: '1mo' },
  { id: '6mo', label: '6 Months', range: '6mo' },
  { id: '1y', label: '1 Year', range: '1y' },
  { id: '5y', label: '5 Years', range: '5y' },
];

export default function MultiStockView({ onSelectStock, onOpenChatbot }) {
  const [viewMode, setViewMode] = useState('live'); // 'live' or 'historical'
  
  // Live Matrix State
  const [liveSymbols, setLiveSymbols] = useState(DEFAULT_LIVE_SYMBOLS);
  const [liveTimeframe, setLiveTimeframe] = useState(TIMEFRAMES[2]); // 1mo
  const [liveStocks, setLiveStocks] = useState([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Search & Add Stock
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Head-to-Head Comparison State
  const [compareA, setCompareA] = useState('RELIANCE');
  const [compareB, setCompareB] = useState('TCS');
  const [showHeadToHead, setShowHeadToHead] = useState(true);

  // Historical State
  const [historicalSummaries, setHistoricalSummaries] = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [histError, setHistError] = useState(null);

  // Fetch Live Matrix
  const fetchLiveStockMatrix = useCallback(async () => {
    setLiveLoading(true);
    setLiveError(null);
    try {
      const data = await fetchLiveMatrix(liveSymbols, liveTimeframe.range);
      if (data && data.stocks) {
        setLiveStocks(data.stocks);
        setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour12: false }));
      }
    } catch (err) {
      setLiveError(err.message || 'Failed to load live stock matrix.');
    } finally {
      setLiveLoading(false);
    }
  }, [liveSymbols, liveTimeframe]);

  // Fetch Historical Matrix
  const fetchHistoricalMatrix = async () => {
    setHistLoading(true);
    setHistError(null);
    try {
      const data = await analyzeAllStocks();
      setHistoricalSummaries(data);
    } catch (err) {
      setHistError(err.message || 'Failed to load historical stock comparisons.');
    } finally {
      setHistLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'live') {
      fetchLiveStockMatrix();
    } else {
      fetchHistoricalMatrix();
    }
  }, [viewMode, fetchLiveStockMatrix]);

  // Search Debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchLiveStocks(searchQuery);
        setSearchResults(res);
        setSearchOpen(true);
      } catch (e) {
        console.error('Search error:', e);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAddStock = (sym) => {
    const clean = sym.toUpperCase().replace(/\.(NS|BO)/, '');
    if (!liveSymbols.includes(clean)) {
      setLiveSymbols((prev) => [...prev, clean]);
    }
    setSearchQuery('');
    setSearchOpen(false);
  };

  const handleRemoveStock = (sym) => {
    setLiveSymbols((prev) => prev.filter((s) => s !== sym));
    setLiveStocks((prev) => prev.filter((s) => s.symbol !== sym));
  };

  // Find stocks for Head-to-Head
  const stockAData = liveStocks.find((s) => s.symbol === compareA);
  const stockBData = liveStocks.find((s) => s.symbol === compareB);

  return (
    <div className="space-y-6">

      {/* Top Header & Mode Switcher */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <BarChart3 className="w-4 h-4" />
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Multi-Stock Comparative Analysis Matrix
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Simultaneous real-time price monitoring, technical signal scoring, and DAA Maximum Subarray profit windows across Indian equities.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('live')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'live'
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200/90'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <span>Live Market Matrix</span>
            </button>
            <button
              onClick={() => setViewMode('historical')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'historical'
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200/90'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>Historical Datasets</span>
            </button>
          </div>

          <button
            onClick={viewMode === 'live' ? fetchLiveStockMatrix : fetchHistoricalMatrix}
            disabled={liveLoading || histLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${liveLoading || histLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          LIVE MARKET COMPARISON VIEW
         ========================================================================= */}
      {viewMode === 'live' && (
        <div className="space-y-6">

          {/* Control Strip: Timeframes, Add Stock */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
            
            {/* Timeframe Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 overflow-x-auto">
              {TIMEFRAMES.map((tf) => {
                const isActive = liveTimeframe.id === tf.id;
                return (
                  <button
                    key={tf.id}
                    onClick={() => setLiveTimeframe(tf)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
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

            {/* Search & Add Custom Stock */}
            <div className="relative w-full sm:w-72">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Add stock e.g. WIPRO, CIPLA..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              {searchOpen && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto">
                  {searchResults.map((res, i) => (
                    <button
                      key={i}
                      onClick={() => handleAddStock(res.symbol)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 flex items-center justify-between border-b border-slate-100 last:border-0"
                    >
                      <div>
                        <span className="font-bold text-slate-900 font-mono">{res.symbol}</span>
                        <span className="text-[11px] text-slate-500 ml-1.5 truncate">{res.company_name}</span>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-blue-600" />
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Error Message */}
          {liveError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center justify-between">
              <span>{liveError}</span>
              <button onClick={fetchLiveStockMatrix} className="font-bold underline text-rose-900">
                Retry
              </button>
            </div>
          )}

          {/* Loading State */}
          {liveLoading && liveStocks.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-16 shadow-sm flex flex-col items-center justify-center gap-3 text-slate-500 text-xs">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              <span className="font-semibold text-slate-700">
                Streaming live prices, calculating technical indicators, and running Kadane O(n) across {liveSymbols.length} Indian equities...
              </span>
            </div>
          ) : (
            <>
              {/* Main Live Comparative Matrix Table */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Live Equities Matrix ({liveStocks.length} Stocks)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Interval: {liveTimeframe.label}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Last update: {lastUpdated ? `${lastUpdated} IST` : 'Real-time'}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3.5 px-4">Stock Asset</th>
                        <th className="py-3.5 px-3">Live Price</th>
                        <th className="py-3.5 px-3">Session Δ</th>
                        <th className="py-3.5 px-3">AI Market Signal</th>
                        <th className="py-3.5 px-3">Risk Rating</th>
                        <th className="py-3.5 px-3">RSI (14)</th>
                        <th className="py-3.5 px-3">20-Day SMA</th>
                        <th className="py-3.5 px-3">DAA Max Profit</th>
                        <th className="py-3.5 px-3">Max ROI %</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {liveStocks.map((stock, idx) => {
                        const isPos = (stock.percent_change || 0) >= 0;
                        const isBuy = stock.signal_code === 'BUY';
                        const isSell = stock.signal_code === 'SELL';

                        const signalBadge = isBuy
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : isSell
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200';

                        const riskBadge =
                          stock.risk_level === 'LOW RISK'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : stock.risk_level === 'HIGH RISK'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200';

                        return (
                          <tr
                            key={stock.symbol}
                            className={`hover:bg-blue-50/40 transition-colors ${
                              idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                            }`}
                          >
                            {/* Stock Asset */}
                            <td className="py-3.5 px-4">
                              <div className="font-extrabold text-slate-900 text-sm font-mono flex items-center gap-1.5">
                                <span>{stock.symbol.replace('^', '')}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-sans">
                                  {stock.exchange || 'NSE'}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 truncate max-w-[140px]">
                                {stock.company_name}
                              </div>
                            </td>

                            {/* Live Price */}
                            <td className="py-3.5 px-3 font-mono font-black text-slate-900 text-sm">
                              ₹{stock.current_price?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '—'}
                            </td>

                            {/* Session Change */}
                            <td className="py-3.5 px-3 font-mono font-bold">
                              <span
                                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] ${
                                  isPos
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {isPos ? '+' : ''}{stock.percent_change?.toFixed(2) || '0.00'}%
                              </span>
                            </td>

                            {/* AI Market Signal */}
                            <td className="py-3.5 px-3">
                              <span className={`inline-block px-2.5 py-1 rounded-md border text-[10px] font-extrabold whitespace-nowrap ${signalBadge}`}>
                                {stock.signal} <span className="font-mono font-normal">({stock.score > 0 ? `+${stock.score}` : stock.score})</span>
                              </span>
                            </td>

                            {/* Risk Rating */}
                            <td className="py-3.5 px-3">
                              <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-bold whitespace-nowrap ${riskBadge}`}>
                                {stock.risk_level.replace(' RISK', '')}
                              </span>
                            </td>

                            {/* RSI 14 */}
                            <td className="py-3.5 px-3 font-mono text-slate-800 font-semibold">
                              {stock.indicators?.rsi14 ? `${stock.indicators.rsi14}` : '—'}
                            </td>

                            {/* 20-Day SMA */}
                            <td className="py-3.5 px-3 font-mono text-slate-600">
                              {stock.indicators?.sma20 ? `₹${stock.indicators.sma20.toLocaleString('en-IN')}` : '—'}
                            </td>

                            {/* DAA Max Profit */}
                            <td className="py-3.5 px-3 font-mono font-bold text-emerald-600">
                              {stock.daa_result ? `+₹${stock.daa_result.max_profit.toFixed(2)}` : '—'}
                            </td>

                            {/* DAA ROI % */}
                            <td className="py-3.5 px-3 font-mono font-bold text-emerald-700">
                              {stock.daa_result ? `+${stock.daa_result.roi_percentage.toFixed(1)}%` : '—'}
                            </td>

                            {/* Action Buttons */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => onSelectStock && onSelectStock(stock.symbol)}
                                  className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white transition-all shadow-2xs cursor-pointer"
                                  title={`Analyze ${stock.symbol} Live`}
                                >
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => onOpenChatbot && onOpenChatbot(stock.symbol)}
                                  className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white transition-all shadow-2xs cursor-pointer"
                                  title={`Ask AI Market Analyst about ${stock.symbol}`}
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </button>
                                {liveSymbols.length > 3 && (
                                  <button
                                    onClick={() => handleRemoveStock(stock.symbol)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                    title="Remove from matrix"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Head-to-Head Comparative Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-extrabold text-sm text-slate-900">
                      Head-to-Head Stock Comparison
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <select
                      value={compareA}
                      onChange={(e) => setCompareA(e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 font-bold text-slate-800"
                    >
                      {liveStocks.map((s) => (
                        <option key={s.symbol} value={s.symbol}>
                          {s.symbol} - {s.company_name}
                        </option>
                      ))}
                    </select>

                    <span className="font-bold text-slate-400">VS</span>

                    <select
                      value={compareB}
                      onChange={(e) => setCompareB(e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 font-bold text-slate-800"
                    >
                      {liveStocks.map((s) => (
                        <option key={s.symbol} value={s.symbol}>
                          {s.symbol} - {s.company_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {stockAData && stockBData && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Stock A Card */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-extrabold text-base text-slate-900">{stockAData.symbol}</span>
                          <p className="text-[11px] text-slate-500">{stockAData.company_name}</p>
                        </div>
                        <span className="text-lg font-black font-mono text-slate-900">
                          ₹{stockAData.current_price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[11px] pt-2 border-t border-slate-200">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Signal</span>
                          <span className="font-bold text-indigo-700">{stockAData.signal}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">RSI (14)</span>
                          <span className="font-bold text-slate-800 font-mono">{stockAData.indicators?.rsi14 || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">DAA Max Profit</span>
                          <span className="font-bold text-emerald-600 font-mono">
                            {stockAData.daa_result ? `+₹${stockAData.daa_result.max_profit.toFixed(0)}` : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stock B Card */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-extrabold text-base text-slate-900">{stockBData.symbol}</span>
                          <p className="text-[11px] text-slate-500">{stockBData.company_name}</p>
                        </div>
                        <span className="text-lg font-black font-mono text-slate-900">
                          ₹{stockBData.current_price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[11px] pt-2 border-t border-slate-200">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Signal</span>
                          <span className="font-bold text-indigo-700">{stockBData.signal}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">RSI (14)</span>
                          <span className="font-bold text-slate-800 font-mono">{stockBData.indicators?.rsi14 || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">DAA Max Profit</span>
                          <span className="font-bold text-emerald-600 font-mono">
                            {stockBData.daa_result ? `+₹${stockBData.daa_result.max_profit.toFixed(0)}` : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            </>
          )}

        </div>
      )}

      {/* =========================================================================
          HISTORICAL DATASETS MATRIX VIEW
         ========================================================================= */}
      {viewMode === 'historical' && (
        <div className="space-y-6">
          {histError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {histError}
            </div>
          )}

          {histLoading ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white border border-slate-200 rounded-xl gap-3 text-slate-500 text-xs shadow-sm">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              <span>Analyzing historical CSV datasets across Brute Force, Kadane, and Divide & Conquer...</span>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4">Stock Asset</th>
                      <th className="py-3.5 px-3">Trading Days</th>
                      <th className="py-3.5 px-3">Best Buy Date</th>
                      <th className="py-3.5 px-3">Buy Price</th>
                      <th className="py-3.5 px-3">Best Sell Date</th>
                      <th className="py-3.5 px-3">Sell Price</th>
                      <th className="py-3.5 px-3">Max Profit</th>
                      <th className="py-3.5 px-3">Return %</th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {historicalSummaries.map((stock, idx) => {
                      const isProfit = stock.maximum_profit > 0;
                      return (
                        <tr
                          key={stock.symbol}
                          className={`hover:bg-blue-50/40 transition-colors ${
                            idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 text-sm">{stock.symbol}</div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
                              {stock.company_name}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 font-mono text-slate-600">
                            {stock.dataset_size.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-3 font-mono text-slate-600">{stock.buy_date}</td>
                          <td className="py-3.5 px-3 font-mono font-semibold text-emerald-700">
                            ₹{stock.buy_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-3 font-mono text-slate-600">{stock.sell_date}</td>
                          <td className="py-3.5 px-3 font-mono font-semibold text-blue-700">
                            ₹{stock.sell_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-3 font-mono font-bold">
                            <span className={isProfit ? 'text-emerald-600' : 'text-rose-600'}>
                              {isProfit ? '+' : ''}₹{stock.maximum_profit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 font-mono font-bold">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                                isProfit
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {stock.profit_percentage >= 0 ? '+' : ''}{stock.profit_percentage.toFixed(2)}%
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => onSelectStock && onSelectStock(stock.symbol)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                            >
                              <span>View Chart</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
