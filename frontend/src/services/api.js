/**
 * Frontend API Service Layer.
 */

const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Failed to connect to backend service.');
  return await res.json();
}

export async function fetchStocks() {
  const res = await fetch(`${API_BASE}/stocks`);
  if (!res.ok) throw new Error('Failed to fetch available stock datasets.');
  return await res.json();
}

export async function analyzeStock(symbol) {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Analysis failed for stock ${symbol}.`);
  }
  return await res.json();
}

export async function analyzeAllStocks() {
  const res = await fetch(`${API_BASE}/analyze-all/summary`);
  if (!res.ok) throw new Error('Failed to fetch batch stock comparisons.');
  return await res.json();
}

export async function uploadStockCsv(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'CSV upload failed.');
  }
  return await res.json();
}

export async function runBenchmark(sizes = [100, 500, 1000, 2000, 3000, 5000, 10000], iterations = 5, maxBruteForceSize = 3000) {
  const res = await fetch(`${API_BASE}/benchmark`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sizes, iterations, max_brute_force_size: maxBruteForceSize }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Empirical benchmark failed.');
  }
  return await res.json();
}

export async function clearUploadedData() {
  const res = await fetch(`${API_BASE}/upload/clear`, {
    method: 'POST',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to clear temporary upload data.');
  }
  return await res.json();
}

export async function loadDemoNifty50() {
  const res = await fetch(`${API_BASE}/upload/load-demo-nifty50`, {
    method: 'POST',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to load NIFTY 50 demonstration dataset.');
  }
  return await res.json();
}

export async function saveUploadedData(symbol, targetSymbol = null, name = null, overwrite = false) {
  const res = await fetch(`${API_BASE}/upload/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      symbol,
      target_symbol: targetSymbol,
      name,
      overwrite,
    }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const err = new Error(errorData.detail || 'Failed to save dataset permanently.');
    err.status = res.status;
    err.conflict = res.status === 409;
    throw err;
  }
  return await res.json();
}

export async function runQuickBenchmark() {
  const res = await fetch(`${API_BASE}/benchmark/quick`);
  if (!res.ok) throw new Error('Quick benchmark failed.');
  return await res.json();
}

/* =========================================================================
   Live Indian Stock Market API Integration (NSE & BSE Real-Time Feed)
   ========================================================================= */

export async function searchLiveStocks(query) {
  if (!query || query.trim().length === 0) return [];
  const res = await fetch(`${API_BASE}/live/search?q=${encodeURIComponent(query.trim())}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.results || [];
}

export async function fetchLiveQuote(symbol) {
  const res = await fetch(`${API_BASE}/live/quote?symbol=${encodeURIComponent(symbol)}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch live quote for ${symbol}`);
  }
  return await res.json();
}

export async function fetchLiveWatchlist(symbols = null) {
  const url = symbols
    ? `${API_BASE}/live/watchlist?symbols=${encodeURIComponent(symbols.join(','))}`
    : `${API_BASE}/live/watchlist`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data.watchlist || [];
}

export async function fetchLiveSymbols() {
  const res = await fetch(`${API_BASE}/live/symbols`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.symbols || [];
}

export async function analyzeLiveStock(symbol, range = '1mo', interval = '1d') {
  const res = await fetch(`${API_BASE}/live/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol, range, interval }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Live analysis failed for ${symbol}`);
  }
  return await res.json();
}

/* =========================================================================
   AI Market Analyst & Assistant API Endpoints
   ========================================================================= */

export async function fetchMarketAnalysis(symbol, range = '6mo') {
  const res = await fetch(`${API_BASE}/analyst/evaluate?symbol=${encodeURIComponent(symbol)}&range=${encodeURIComponent(range)}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Market evaluation failed for ${symbol}`);
  }
  return await res.json();
}

export async function sendAnalystChatMessage(message, currentSymbol = 'RELIANCE', conversationHistory = []) {
  const res = await fetch(`${API_BASE}/analyst/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      current_symbol: currentSymbol,
      conversation_history: conversationHistory,
    }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to process Market Analyst request.');
  }
  return await res.json();
}

export async function compareStocks(symbol1, symbol2) {
  const res = await fetch(`${API_BASE}/analyst/compare?symbol1=${encodeURIComponent(symbol1)}&symbol2=${encodeURIComponent(symbol2)}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Comparison failed for ${symbol1} and ${symbol2}`);
  }
  return await res.json();
}

export async function fetchLiveMatrix(symbols = null, range = '1mo') {
  const url = symbols
    ? `${API_BASE}/analyst/matrix?symbols=${encodeURIComponent(symbols.join(','))}&range=${encodeURIComponent(range)}`
    : `${API_BASE}/analyst/matrix?range=${encodeURIComponent(range)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch live stock comparative matrix.');
  }
  return await res.json();
}





