import React, { useState } from 'react';
import { BookmarkPlus, X } from 'lucide-react';

export default function SaveConfirmModal({
  isOpen,
  datasetInfo,
  onClose,
  onConfirmSave,
  saving,
}) {
  if (!isOpen || !datasetInfo) return null;

  const [customName, setCustomName] = useState(datasetInfo.name || datasetInfo.symbol || '');
  const [customSymbol, setCustomSymbol] = useState(datasetInfo.symbol || '');
  const [overwrite, setOverwrite] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirmSave({
      symbol: datasetInfo.symbol,
      targetSymbol: customSymbol.trim().toUpperCase(),
      name: customName.trim(),
      overwrite,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md p-6 bg-white rounded-2xl border border-slate-200 shadow-2xl space-y-4 text-slate-900">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={saving}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <BookmarkPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Save Dataset Permanently?</h3>
            <p className="text-xs text-slate-500">Persist to permanent Indian stock collection</p>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Target Asset:</span>
              <span className="font-mono font-bold text-blue-600">{datasetInfo.symbol}</span>
            </div>
            {datasetInfo.records && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Trading Days:</span>
                <span className="font-mono text-slate-700">{datasetInfo.records.toLocaleString()} records</span>
              </div>
            )}
            <p className="text-xs text-slate-600 pt-1 border-t border-slate-200 mt-1">
              Saving this dataset will add it to the permanent stock collection and include it in Multi-Stock Compare and Analysis.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dataset Symbol / Ticker:
              </label>
              <input
                type="text"
                value={customSymbol}
                onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())}
                required
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 font-mono focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Display Name:
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium transition-all shadow-sm"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Data'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
