import React from 'react';
import { Database, PlusCircle, Check, Trash2, Sparkles, BookmarkPlus } from 'lucide-react';

export default function StockSelector({
  stocks,
  selectedSymbol,
  temporaryStock,
  onSelectStock,
  onOpenUpload,
  onClearTemporary,
  onSaveTemporary,
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
      <div className="flex items-center gap-2">
        <Database className="w-4 h-4 text-blue-600" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Permanent Indian Stocks (NSE):
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Permanent Stocks */}
        {stocks.map((stock) => {
          const isSelected = stock.symbol === selectedSymbol && !temporaryStock;
          return (
            <button
              key={stock.symbol}
              onClick={() => onSelectStock(stock.symbol)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <span>{stock.symbol}</span>
              <span className={`text-[9px] px-1 py-0.2 rounded font-normal ${isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-200 text-slate-600'}`}>
                {stock.is_custom ? 'Saved' : 'NSE'}
              </span>
              {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
            </button>
          );
        })}

        {/* Temporary Uploaded Stock (e.g. NIFTY 50 demonstration) */}
        {temporaryStock && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <button
              onClick={() => onSelectStock(temporaryStock.symbol)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                selectedSymbol === temporaryStock.symbol
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                  : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{temporaryStock.symbol}</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-200/80 text-amber-950 uppercase font-semibold">
                Temporary
              </span>
              {selectedSymbol === temporaryStock.symbol && <Check className="w-3.5 h-3.5 text-slate-950" />}
            </button>

            {onSaveTemporary && (
              <button
                onClick={() => onSaveTemporary(temporaryStock.symbol, temporaryStock.name)}
                title="Save this dataset permanently to collection"
                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 font-semibold text-xs flex items-center gap-1 transition-all"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            )}

            <button
              onClick={onClearTemporary}
              title="Clear temporary uploaded dataset and return to RELIANCE"
              className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-medium text-xs flex items-center gap-1 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        )}

        {/* Upload Action */}
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition-all ml-1 shadow-sm"
        >
          <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
          <span>Upload Dataset</span>
        </button>
      </div>
    </div>
  );
}
