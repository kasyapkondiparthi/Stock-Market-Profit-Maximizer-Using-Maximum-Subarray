import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, RefreshCw, FileUp, Info, Sparkles, Trash2, BookmarkPlus } from 'lucide-react';
import { uploadStockCsv, loadDemoNifty50 } from '../services/api';

export default function CsvUploader({
  onUploadSuccess,
  onClearTemporary,
  onSaveTemporary,
  temporaryStock,
  isSaved,
}) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (!selected.name.toLowerCase().endsWith('.csv')) {
        setError('Please select a valid CSV file (.csv extension).');
        setFile(null);
        return;
      }
      setFile(selected);
      setError(null);
      setSuccess(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please choose a CSV file first.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await uploadStockCsv(file);
      const isNifty = result.symbol.toUpperCase().includes('NIFTY');
      const label = isNifty ? 'NIFTY 50 — Temporary Demonstration Dataset' : `${result.symbol} (Temporary Dataset)`;
      setSuccess(`${label} successfully ingested (${result.records.toLocaleString()} trading days). You can analyze it temporarily or click 'Save Data' to store permanently.`);
      setFile(null);
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
    } catch (err) {
      setError(err.message || 'CSV upload and validation failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleLoadDemoNifty = async () => {
    setDemoLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await loadDemoNifty50();
      setSuccess(`NIFTY 50 — Temporary Demonstration Dataset loaded (${result.records.toLocaleString()} trading days: 2025-10-06 to 2026-10-05).`);
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
    } catch (err) {
      setError(err.message || 'Failed to load NIFTY 50 demonstration dataset.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Active Temporary Dataset Callout with [ Save Data ] [ Clear Uploaded Data ] */}
      {temporaryStock && !isSaved && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-950 flex items-center gap-2">
                <span>Active Temporary Dataset:</span>
                <span className="font-mono bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-200">
                  {temporaryStock.symbol}
                </span>
              </p>
              <p className="text-xs text-amber-800 mt-0.5">
                This dataset is held in temporary memory. Click <strong>Save Data</strong> to add permanently to collection.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            {onSaveTemporary && (
              <button
                onClick={() => onSaveTemporary(temporaryStock.symbol, temporaryStock.name)}
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
                <span>Clear Uploaded Data</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Upload Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileUp className="w-5 h-5 text-blue-600" />
              <span>Upload Stock Dataset</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload a CSV file containing historical stock data. Uploaded datasets start as temporary and can be saved permanently via the <strong>Save Data</strong> action.
            </p>
          </div>

          {/* Quick Demo Action */}
          <button
            onClick={handleLoadDemoNifty}
            disabled={demoLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-semibold text-xs transition-all disabled:opacity-50 shadow-sm"
          >
            <Sparkles className={`w-4 h-4 text-amber-600 ${demoLoading ? 'animate-spin' : ''}`} />
            <span>{demoLoading ? 'Loading NIFTY 50...' : 'Load NIFTY 50 Demo Dataset'}</span>
          </button>
        </div>

        {/* Drag & Drop Box */}
        <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-8 text-center transition-all bg-slate-50">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            id="csv-upload-input"
            className="hidden"
          />
          <label htmlFor="csv-upload-input" className="cursor-pointer flex flex-col items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {file ? file.name : 'Click or Drag CSV file here'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Accepted format: CSV • Required columns: Date, Close (Max 10MB)
              </p>
            </div>
          </label>
        </div>

        {file && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-slate-900">{file.name}</span>
              <span className="text-slate-500">({(file.size / 1024).toFixed(1)} KB)</span>
            </div>

            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Validating & Processing...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Ingest & Analyze</span>
                </>
              )}
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}
      </div>

      {/* CSV Format Guide */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600" />
          <span>Expected CSV Dataset Structure</span>
        </h3>

        <div className="p-3.5 rounded-lg bg-slate-900 font-mono text-xs text-slate-200 border border-slate-800 overflow-x-auto">
          <p className="text-emerald-400 font-bold">Date,Open,High,Low,Close,Shares Traded,Turnover (₹ Cr)</p>
          <p className="text-slate-300">05-OCT-2026,22532.4,22621.8,22397.1,22555.75,412554239,33398.25</p>
          <p className="text-slate-400">01-OCT-2026,22543.7,22610.6,22217.3,22421.95,451303049,36534.26</p>
        </div>

        <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4 pt-1">
          <li><strong>Mandatory Columns:</strong> <code className="text-blue-600 font-semibold">Date</code> (YYYY-MM-DD or DD-MMM-YYYY) and <code className="text-blue-600 font-semibold">Close</code> (numerical closing price).</li>
          <li><strong>Temporary vs Permanent Workflow:</strong> Uploaded CSV datasets are initially TEMPORARY. Click <strong>Save Data</strong> to permanently add the dataset to the registry and Multi-Stock Compare.</li>
          <li><strong>Clear Action:</strong> Clicking <strong>Clear Uploaded Data</strong> on a temporary dataset removes it from memory and returns to RELIANCE without affecting permanent collections.</li>
        </ul>
      </div>

    </div>
  );
}
