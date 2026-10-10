import React from 'react';
import { Calendar, TrendingUp, ShieldCheck, Clock, Layers, AlertTriangle, Info, Trash2, BookmarkPlus, CheckCircle2 } from 'lucide-react';
import AiMarketSignalCard from './AiMarketSignalCard';

export default function MetricCards({
  analysis,
  onClearTemporary,
  onSaveTemporary,
  isSaved,
  onOpenChatbot,
}) {
  if (!analysis) return null;

  const {
    stock,
    symbol,
    company_name,
    market,
    currency,
    dataset_size,
    buy_date,
    sell_date,
    buy_price,
    sell_price,
    maximum_profit,
    profit_percentage,
    all_negative,
    verification,
    is_temporary,
    temporary_label,
  } = analysis;

  const isProfit = maximum_profit > 0;
  const isNifty = symbol?.toUpperCase().includes('NIFTY') || stock?.toUpperCase().includes('NIFTY');

  return (
    <div className="space-y-4">
      
      {/* Temporary Uploaded Dataset Banner */}
      {is_temporary && !isSaved && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-900 border border-amber-300">
                TEMPORARY DATASET
              </span>
              <span className="text-xs sm:text-sm font-bold text-amber-950">
                {isNifty ? 'NIFTY 50 — Temporary Demonstration Dataset' : (temporary_label || `${symbol} — Temporary Uploaded Dataset`)}
              </span>
            </div>
            <p className="text-xs text-amber-800">
              This dataset is temporary and is not part of the permanent stock collection until saved.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            {onSaveTemporary && (
              <button
                onClick={() => onSaveTemporary(symbol, company_name)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>Save Data</span>
              </button>
            )}

            {onClearTemporary && (
              <button
                onClick={onClearTemporary}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-medium text-xs shadow-sm transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Data</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Saved Dataset Notification Banner */}
      {isSaved && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                SAVED / PERMANENT
              </span>
              <span className="text-xs sm:text-sm font-bold text-emerald-950">
                {company_name || symbol} is now part of the permanent collection
              </span>
            </div>
            <p className="text-xs text-emerald-700">
              Dataset is permanently saved and accessible across Analysis and Multi-Stock Compare.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 font-semibold text-xs border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Saved</span>
            </span>

            {onClearTemporary && (
              <button
                onClick={onClearTemporary}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-medium text-xs shadow-sm transition-all"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Clear View</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Verification Banner */}
      <div
        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
          verification.is_consistent
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">
            {verification.message}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs bg-white px-2.5 py-1 rounded-md border border-emerald-200 font-mono font-medium text-emerald-800">
          <span>O(n²) ≡ O(n) ≡ O(n log n)</span>
        </div>
      </div>

      {all_negative && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Decreasing Market Movement:</strong> All daily price differences in this period are negative. The algorithm selected the single least negative day (minimum loss step of ₹{maximum_profit.toFixed(2)}).
          </span>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Target Asset */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Target Asset</span>
            <div className="w-7 h-7 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{symbol || stock}</span>
            </div>
            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{company_name}</p>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2.5 pt-2 border-t border-slate-100">
              <span className="font-mono text-blue-600 font-medium">{market || 'NSE'}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{dataset_size.toLocaleString()} Days</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Best Historical Buy */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Best Historical Buy</span>
            <div className="w-7 h-7 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold text-emerald-600 font-mono">
              ₹{buy_price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-600 mt-1 font-medium flex items-center gap-1">
              <span className="text-slate-400">Buy Date:</span>
              <span className="font-mono text-slate-800 font-semibold">{buy_date}</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
              Subarray start index
            </p>
          </div>
        </div>

        {/* Card 3: Best Historical Sell */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Best Historical Sell</span>
            <div className="w-7 h-7 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold text-blue-600 font-mono">
              ₹{sell_price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-600 mt-1 font-medium flex items-center gap-1">
              <span className="text-slate-400">Sell Date:</span>
              <span className="font-mono text-slate-800 font-semibold">{sell_date}</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
              Subarray end index + 1
            </p>
          </div>
        </div>

        {/* Card 4: Maximum Historical Profit */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Max Historical Profit</span>
            <div className="w-7 h-7 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold font-mono ${isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isProfit ? `+₹${maximum_profit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `₹${maximum_profit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${isProfit ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                {profit_percentage >= 0 ? `+${profit_percentage.toFixed(2)}%` : `${profit_percentage.toFixed(2)}%`}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              Formula: P[Sell] - P[Buy]
            </p>
            <p className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
              Window return on capital
            </p>
          </div>
        </div>

      </div>

      {/* AI Market Signal Evaluation */}
      <AiMarketSignalCard symbol={symbol || stock} onOpenChatbot={onOpenChatbot} />

      {/* Financial Disclaimer Note */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600">
        <Info className="w-4 h-4 text-blue-600 shrink-0" />
        <span>
          <strong>Financial Disclaimer:</strong> This application analyzes historical market data for educational and analytical purposes only. Historical performance does not guarantee future results and this is not financial advice.
        </span>
      </div>

    </div>
  );
}
