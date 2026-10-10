import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import MetricCards from './components/MetricCards';
import StockSelector from './components/StockSelector';
import StockChart from './components/StockChart';
import AlgorithmTable from './components/AlgorithmTable';
import BenchmarkView from './components/BenchmarkView';
import MultiStockView from './components/MultiStockView';
import CsvUploader from './components/CsvUploader';
import SaveConfirmModal from './components/SaveConfirmModal';
import LiveMarketTicker from './components/LiveMarketTicker';
import LiveStockAnalyzer from './components/LiveStockAnalyzer';
import MarketAnalystChatbot from './components/MarketAnalystChatbot';
import { fetchHealth, fetchStocks, analyzeStock, clearUploadedData, saveUploadedData } from './services/api';
import { RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('live');
  const [stocks, setStocks] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState('RELIANCE');
  const [liveStockSymbol, setLiveStockSymbol] = useState('RELIANCE');
  const [temporaryStock, setTemporaryStock] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [chatbotOpen, setChatbotOpen] = useState(false);

  // Save Modal State
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveTarget, setSaveTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedSymbols, setSavedSymbols] = useState(new Set());

  // Check Backend Health
  const checkHealth = useCallback(async () => {
    try {
      await fetchHealth();
      setBackendOnline(true);
    } catch {
      setBackendOnline(false);
    }
  }, []);

  // Load permanent Indian stocks (Core 5 + any saved datasets)
  const loadStocks = useCallback(async () => {
    try {
      const stockList = await fetchStocks();
      setStocks(stockList);
    } catch (err) {
      console.error('Error loading permanent stocks:', err);
    }
  }, []);

  // Load analysis for currently selected stock
  const loadAnalysis = useCallback(async (sym) => {
    if (!sym) return;
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeStock(sym);
      setAnalysis(data);
      if (data.is_temporary) {
        setTemporaryStock({
          symbol: data.symbol,
          name: data.company_name,
          records: data.dataset_size,
          is_temporary: true,
        });
      } else {
        setTemporaryStock(null);
      }
    } catch (err) {
      setError(err.message || `Failed to analyze ${sym}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    loadStocks();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, [checkHealth, loadStocks]);

  useEffect(() => {
    if (selectedSymbol) {
      loadAnalysis(selectedSymbol);
    }
  }, [selectedSymbol, loadAnalysis]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleSelectStock = (sym) => {
    setSelectedSymbol(sym);
    if (activeTab !== 'dashboard') {
      setActiveTab('dashboard');
    }
  };

  const handleSelectLiveStock = (sym) => {
    setLiveStockSymbol(sym);
    setActiveTab('live');
  };

  const handleOpenChatbot = (sym) => {
    if (sym) {
      setLiveStockSymbol(sym);
      setSelectedSymbol(sym);
    }
    setChatbotOpen(true);
  };

  const handleUploadSuccess = (meta) => {
    const sym = meta.symbol || meta;
    setTemporaryStock(typeof meta === 'object' ? meta : { symbol: sym, is_temporary: true });
    setSelectedSymbol(sym);
    setActiveTab('dashboard');
  };

  const handleClearUploadedData = async () => {
    try {
      await clearUploadedData();
    } catch (e) {
      console.error('Error calling backend clear:', e);
    }
    setTemporaryStock(null);
    setSelectedSymbol('RELIANCE');
    if (activeTab === 'upload') {
      setActiveTab('dashboard');
    }
  };

  const handleOpenSaveModal = (sym, name) => {
    const currentSym = sym || selectedSymbol;
    const currentName = name || analysis?.company_name || currentSym;
    setSaveTarget({
      symbol: currentSym,
      name: currentName,
      records: analysis?.dataset_size || temporaryStock?.records,
    });
    setSaveModalOpen(true);
  };

  const handleConfirmSave = async ({ symbol, targetSymbol, name, overwrite }) => {
    setSaving(true);
    setError(null);
    try {
      const result = await saveUploadedData(symbol, targetSymbol, name, overwrite);
      await loadStocks();
      setSavedSymbols((prev) => new Set([...prev, result.symbol]));
      setTemporaryStock(null);
      setSelectedSymbol(result.symbol);
      setSaveModalOpen(false);
      setToastMessage(`Dataset '${result.symbol}' saved successfully to permanent collection.`);
      await loadAnalysis(result.symbol);
    } catch (err) {
      setError(err.message || 'Failed to permanently save dataset.');
    } finally {
      setSaving(false);
    }
  };

  const isCurrentStockSaved = savedSymbols.has(selectedSymbol) || (analysis && !analysis.is_temporary && selectedSymbol !== 'RELIANCE' && !['HDFCBANK', 'ICICIBANK', 'SBIN', 'TCS'].includes(selectedSymbol));

  const currentActiveSymbol = activeTab === 'live' ? liveStockSymbol : selectedSymbol;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        backendOnline={backendOnline}
      />

      {/* Real-time Streaming Ticker */}
      <LiveMarketTicker onSelectStock={handleSelectLiveStock} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2.5 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => {
                setError(null);
                loadAnalysis(selectedSymbol);
              }}
              className="underline text-rose-900 hover:text-black font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {/* Tab 0: Live Stock Market Analyzer */}
        {activeTab === 'live' && (
          <LiveStockAnalyzer
            initialSymbol={liveStockSymbol}
            onOpenChatbot={handleOpenChatbot}
          />
        )}

        {/* Tab 1: Single Stock Analysis Dashboard (Historical Datasets) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Stock Selector Pill Bar */}
            <StockSelector
              stocks={stocks}
              selectedSymbol={selectedSymbol}
              temporaryStock={temporaryStock}
              onSelectStock={handleSelectStock}
              onOpenUpload={() => setActiveTab('upload')}
              onClearTemporary={handleClearUploadedData}
              onSaveTemporary={handleOpenSaveModal}
            />

            {loading ? (
              <div className="bg-white border border-slate-200 rounded-xl p-16 shadow-sm flex flex-col items-center justify-center gap-3 text-slate-500 text-xs">
                <RefreshCw className="w-7 h-7 text-blue-600 animate-spin" />
                <span>Executing Brute Force, Kadane, and Divide & Conquer on {selectedSymbol} (NSE)...</span>
              </div>
            ) : (
              analysis && (
                <>
                  {/* KPI Metric Cards & Verification Banner with Save Data / Clear Data buttons */}
                  <MetricCards
                    analysis={analysis}
                    onClearTemporary={handleClearUploadedData}
                    onSaveTemporary={handleOpenSaveModal}
                    isSaved={isCurrentStockSaved}
                    onOpenChatbot={handleOpenChatbot}
                  />

                  {/* Interactive Price Chart with Optimal Continuous Subarray Window */}
                  <StockChart analysis={analysis} />

                  {/* Side-by-Side Algorithm Comparison & Speedups */}
                  <AlgorithmTable analysis={analysis} />
                </>
              )
            )}
          </div>
        )}

        {/* Tab 2: Multi-Stock Comparative Matrix (Live Market & Historical Matrix) */}
        {activeTab === 'multistock' && (
          <MultiStockView
            onSelectStock={(sym) => {
              setLiveStockSymbol(sym);
              setSelectedSymbol(sym);
              setActiveTab('live');
            }}
            onOpenChatbot={handleOpenChatbot}
          />
        )}

        {/* Tab 3: Empirical Performance Benchmark */}
        {activeTab === 'benchmark' && (
          <BenchmarkView />
        )}

        {/* Tab 4: Temporary CSV Dataset Upload */}
        {activeTab === 'upload' && (
          <CsvUploader
            onUploadSuccess={handleUploadSuccess}
            onClearTemporary={handleClearUploadedData}
            onSaveTemporary={handleOpenSaveModal}
            temporaryStock={temporaryStock}
            isSaved={isCurrentStockSaved}
          />
        )}

      </main>

      {/* Save Confirmation Modal */}
      <SaveConfirmModal
        isOpen={saveModalOpen}
        datasetInfo={saveTarget}
        onClose={() => setSaveModalOpen(false)}
        onConfirmSave={handleConfirmSave}
        saving={saving}
      />

      {/* Floating AI Market Analyst Chatbot */}
      <MarketAnalystChatbot
        isOpen={chatbotOpen}
        setIsOpen={setChatbotOpen}
        selectedSymbol={currentActiveSymbol}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Indian Stock Market Profit Maximizer</p>
          <p className="flex items-center gap-2 text-slate-600 font-medium">
            <span>Algorithms:</span>
            <span className="text-emerald-700 font-mono font-semibold">Kadane O(n)</span>
            <span>•</span>
            <span className="text-blue-700 font-mono font-semibold">Divide & Conquer O(n log n)</span>
            <span>•</span>
            <span className="text-amber-700 font-mono font-semibold">Brute Force O(n²)</span>
          </p>
        </div>
      </footer>

    </div>
  );
}
