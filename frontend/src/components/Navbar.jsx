import React from 'react';
import { TrendingUp, Cpu, BarChart3, Database, AlertCircle, LineChart, Sparkles, Activity, Radio } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, backendOnline }) {
  const navItems = [
    { id: 'live', label: 'Live Market Analyzer', icon: Activity, isLive: true },
    { id: 'dashboard', label: 'Historical Datasets', icon: TrendingUp },
    { id: 'multistock', label: 'Multi-Stock Compare', icon: BarChart3 },
    { id: 'benchmark', label: 'Empirical Benchmark', icon: Cpu },
    { id: 'upload', label: 'Upload Dataset', icon: Database },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-sm ring-1 ring-black/5">
              <TrendingUp className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight leading-none">
                  INDIAN STOCK MARKET PROFIT MAXIMIZER
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                <span>Maximum Historical Profit Analysis</span>
                <span className="text-slate-300">•</span>
                <span className="text-blue-700 font-semibold font-mono">NSE / INR (₹)</span>
              </p>
            </div>
          </div>

          {/* Premium Segmented Navigation Tabs */}
          <nav className="hidden lg:flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 shadow-inner">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-white text-blue-700 shadow-sm font-bold border border-slate-200/90'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600 stroke-[2.2]' : item.isLive ? 'text-rose-500' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.isLive && (
                    <span className="relative flex h-2 w-2 ml-0.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Status Pill Group */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* Currency Badge */}
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-xs font-mono font-semibold">
              <span className="text-slate-400">CURRENCY:</span>
              <span className="text-blue-700 font-bold">₹ INR</span>
            </div>

            {/* Backend Status Indicator */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border shadow-xs transition-all ${
                backendOnline
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200 animate-pulse'
              }`}
            >
              {backendOnline ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="hidden md:inline font-medium">NSE Feed Live</span>
                  <span className="md:hidden">Live</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Offline</span>
                </>
              )}
            </div>

          </div>

        </div>

        {/* Mobile & Tablet Nav Bar */}
        <div className="flex lg:hidden overflow-x-auto py-2 gap-1.5 border-t border-slate-100">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
}
