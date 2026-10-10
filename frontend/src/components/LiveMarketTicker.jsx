import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Radio } from 'lucide-react';
import { fetchLiveWatchlist } from '../services/api';

export default function LiveMarketTicker({ onSelectStock }) {
  const [tickerItems, setTickerItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadWatchlist = async () => {
    try {
      const data = await fetchLiveWatchlist();
      if (data && data.length > 0) {
        setTickerItems(data);
        setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour12: false }));
      }
    } catch (e) {
      console.error('Ticker fetch error:', e);
    }
  };

  useEffect(() => {
    loadWatchlist();
    const interval = setInterval(loadWatchlist, 20000); // 20s auto-refresh
    return () => clearInterval(interval);
  }, []);

  if (!tickerItems || tickerItems.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-900 text-slate-100 border-y border-slate-800 shadow-inner overflow-hidden select-none">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3">
        
        {/* Live Indicator Pill */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/30 text-[11px] font-bold text-rose-400 shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
          <span className="tracking-wider">LIVE FEED</span>
        </div>

        {/* Scrolling Ticker Stream */}
        <div className="flex-1 overflow-x-auto scrollbar-none flex items-center gap-4 text-xs py-0.5">
          {tickerItems.map((item) => {
            const isPos = (item.change || 0) >= 0;
            const isNeutral = item.change === 0 || item.change === null;
            return (
              <button
                key={item.symbol}
                onClick={() => onSelectStock && onSelectStock(item.symbol)}
                className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 transition-all shrink-0 group text-left cursor-pointer"
                title={`Click to analyze ${item.name} (${item.symbol})`}
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-slate-100 group-hover:text-blue-400 transition-colors">
                      {item.symbol.replace('^', '')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                      {item.exchange}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-300 truncate max-w-[100px]">
                    {item.name}
                  </span>
                </div>

                <div className="text-right font-mono flex flex-col items-end">
                  <span className="font-bold text-slate-100">
                    {item.last_price !== null ? `₹${item.last_price.toLocaleString('en-IN')}` : '—'}
                  </span>
                  <div
                    className={`flex items-center text-[10px] font-semibold ${
                      isNeutral ? 'text-slate-400' : isPos ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isPos ? (
                      <TrendingUp className="w-2.5 h-2.5 mr-0.5 inline" />
                    ) : (
                      <TrendingDown className="w-2.5 h-2.5 mr-0.5 inline" />
                    )}
                    <span>
                      {isPos ? '+' : ''}
                      {item.change !== null ? item.change.toFixed(2) : '0.00'} (
                      {isPos ? '+' : ''}
                      {item.percent_change !== null ? item.percent_change.toFixed(2) : '0.00'}%)
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Refresh Icon */}
        <button
          onClick={loadWatchlist}
          className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors shrink-0"
          title="Refresh live prices"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>

      </div>
    </div>
  );
}
