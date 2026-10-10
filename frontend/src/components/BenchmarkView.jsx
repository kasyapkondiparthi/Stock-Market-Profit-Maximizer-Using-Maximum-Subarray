import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { Cpu, Play, RefreshCw, ShieldAlert, Zap, GitFork, Info } from 'lucide-react';
import { runBenchmark } from '../services/api';

export default function BenchmarkView() {
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [iterations, setIterations] = useState(5);
  const [maxBfSize, setMaxBfSize] = useState(3000);
  const [scaleMode, setScaleMode] = useState('linear'); // 'linear' or 'log'
  const [error, setError] = useState(null);

  const customSizes = [100, 500, 1000, 2000, 3000, 5000, 10000];

  const handleExecuteBenchmark = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await runBenchmark(customSizes, iterations, maxBfSize);
      setBenchmarkData(data);
    } catch (err) {
      setError(err.message || 'Benchmark execution failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleExecuteBenchmark();
  }, []);

  const CustomBenchmarkTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-lg text-xs space-y-1.5 z-50">
          <p className="font-bold text-slate-900 border-b border-slate-100 pb-1 flex items-center justify-between gap-3">
            <span>Input Size (N):</span>
            <span className="font-mono text-blue-600 font-semibold">{label.toLocaleString()} elements</span>
          </p>
          {payload.map((entry, idx) => (
            <p key={idx} className="flex items-center justify-between gap-4 font-mono">
              <span style={{ color: entry.color }} className="font-semibold">{entry.name}:</span>
              <span className="text-slate-900 font-bold">
                {entry.value !== null && entry.value !== undefined ? `${entry.value.toFixed(4)} ms` : 'Skipped (> Cutoff)'}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* Control Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-600" />
              <span>Empirical Algorithm Performance Benchmark</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              High-resolution runtime measurements comparing O(n) Kadane, O(n log n) Divide & Conquer, and O(n²) Brute Force on scaling input sizes (N ∈ [100 … 10,000]).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600">
              <span>Runs:</span>
              <select
                value={iterations}
                onChange={(e) => setIterations(Number(e.target.value))}
                className="bg-white text-slate-900 rounded px-2 py-0.5 border border-slate-300 focus:outline-none focus:border-blue-600 font-medium"
              >
                <option value={3}>3 runs</option>
                <option value={5}>5 runs (Median)</option>
                <option value={10}>10 runs</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600">
              <span>O(n²) Limit:</span>
              <select
                value={maxBfSize}
                onChange={(e) => setMaxBfSize(Number(e.target.value))}
                className="bg-white text-slate-900 rounded px-2 py-0.5 border border-slate-300 focus:outline-none focus:border-blue-600 font-medium"
              >
                <option value={1500}>N ≤ 1,500</option>
                <option value={3000}>N ≤ 3,000 (Standard)</option>
                <option value={5000}>N ≤ 5,000</option>
              </select>
            </div>

            <button
              onClick={handleExecuteBenchmark}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Benchmarking...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Run Benchmark</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {error}
        </div>
      )}

      {/* Benchmark Scaling Chart */}
      {benchmarkData && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Empirical Runtime Scaling Curve (Time in ms vs Input Size N)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Demonstrates linear growth for Kadane O(n) vs steep polynomial growth for Brute Force O(n²).
              </p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setScaleMode('linear')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  scaleMode === 'linear' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                Linear Scale
              </button>
              <button
                onClick={() => setScaleMode('log')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  scaleMode === 'log' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                Logarithmic
              </button>
            </div>
          </div>

          <div className="h-[360px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={benchmarkData.results.map((r) => ({
                  ...r,
                  bf_display:
                    scaleMode === 'log' && r.brute_force_time_ms
                      ? Math.log10(Math.max(0.0001, r.brute_force_time_ms))
                      : r.brute_force_time_ms,
                  kd_display:
                    scaleMode === 'log'
                      ? Math.log10(Math.max(0.0001, r.kadane_time_ms))
                      : r.kadane_time_ms,
                  dc_display:
                    scaleMode === 'log'
                      ? Math.log10(Math.max(0.0001, r.divide_conquer_time_ms))
                      : r.divide_conquer_time_ms,
                }))}
                margin={{ top: 15, right: 20, left: 15, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="size"
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(val) => `N=${val}`}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(val) => scaleMode === 'log' ? `10^${val.toFixed(1)}` : `${val.toFixed(2)} ms`}
                />
                <Tooltip content={<CustomBenchmarkTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />

                <Line
                  type="monotone"
                  name="Kadane O(n)"
                  dataKey={scaleMode === 'log' ? 'kd_display' : 'kadane_time_ms'}
                  stroke="#16a34a"
                  strokeWidth={2.2}
                  dot={{ r: 4, fill: '#16a34a' }}
                />
                <Line
                  type="monotone"
                  name="Divide & Conquer O(n log n)"
                  dataKey={scaleMode === 'log' ? 'dc_display' : 'divide_conquer_time_ms'}
                  stroke="#2563eb"
                  strokeWidth={2.2}
                  dot={{ r: 4, fill: '#2563eb' }}
                />
                <Line
                  type="monotone"
                  name="Brute Force O(n²)"
                  dataKey={scaleMode === 'log' ? 'bf_display' : 'brute_force_time_ms'}
                  stroke="#ea580c"
                  strokeWidth={2.2}
                  strokeDasharray="4 4"
                  dot={{ r: 4, fill: '#ea580c' }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Benchmark Results Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-200 mt-4">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-3 px-4">Dataset Size (N)</th>
                  <th className="py-3 px-4 text-emerald-800">Kadane O(n)</th>
                  <th className="py-3 px-4 text-blue-800">Divide & Conquer O(n log n)</th>
                  <th className="py-3 px-4 text-amber-800">Brute Force O(n²)</th>
                  <th className="py-3 px-4 text-slate-700">Measured Speedup (Kadane vs BF)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {benchmarkData.results.map((row) => {
                  const speedup =
                    row.brute_force_time_ms && row.kadane_time_ms > 0
                      ? (row.brute_force_time_ms / row.kadane_time_ms).toFixed(1)
                      : null;
                  return (
                    <tr key={row.size} className="hover:bg-slate-50 font-mono">
                      <td className="py-2.5 px-4 font-bold text-slate-900">{row.size.toLocaleString()}</td>
                      <td className="py-2.5 px-4 text-emerald-700 font-semibold">{row.kadane_time_ms.toFixed(4)} ms</td>
                      <td className="py-2.5 px-4 text-blue-700 font-semibold">{row.divide_conquer_time_ms.toFixed(4)} ms</td>
                      <td className="py-2.5 px-4">
                        {row.brute_force_time_ms !== null ? (
                          <span className="text-amber-800 font-semibold">{row.brute_force_time_ms.toFixed(4)} ms</span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Bypassed (Safety Limit)</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        {speedup ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {speedup}x faster
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Benchmarking Methodology & Disclaimer */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800">Benchmarking Methodology:</p>
                <p className="mt-0.5">{benchmarkData.methodology}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 pt-2 border-t border-slate-200">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800">Empirical vs Theoretical Analysis:</p>
                <p className="mt-0.5 text-slate-600">{benchmarkData.disclaimer}</p>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
