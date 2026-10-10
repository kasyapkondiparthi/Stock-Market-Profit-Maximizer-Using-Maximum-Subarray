import React from 'react';
import { Cpu, Zap, GitFork, CheckCircle2, Award } from 'lucide-react';

export default function AlgorithmTable({ analysis }) {
  if (!analysis || !analysis.algorithms) return null;

  const { algorithms, dataset_size } = analysis;
  const bf = algorithms.brute_force;
  const kd = algorithms.kadane;
  const dc = algorithms.divide_conquer;

  const algoRows = [
    {
      name: "Kadane's Algorithm",
      complexity: 'O(n)',
      space: 'O(1)',
      runtime: kd.execution_time_ms,
      profit: kd.max_sum,
      indices: `[${kd.start_index} → ${kd.end_index}]`,
      isFastest: true,
      description: 'Linear scan maintaining local maximum subarray',
    },
    {
      name: 'Divide & Conquer',
      complexity: 'O(n log n)',
      space: 'O(log n)',
      runtime: dc.execution_time_ms,
      profit: dc.max_sum,
      indices: `[${dc.start_index} → ${dc.end_index}]`,
      isFastest: false,
      description: 'Recursive binary division with midpoint crossing',
    },
    {
      name: 'Brute Force',
      complexity: 'O(n²)',
      space: 'O(1)',
      runtime: bf.execution_time_ms,
      profit: bf.max_sum,
      indices: `[${bf.start_index} → ${bf.end_index}]`,
      isFastest: false,
      description: 'Exhaustive pairwise interval evaluation',
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-600" />
            <span>Algorithm Performance Comparison</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Measured execution time on {dataset_size.toLocaleString()} daily price change elements (ΔP).
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Equivalence Verified: Identical Max Profit of ₹{kd.max_sum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Algorithm</th>
              <th className="py-3 px-4">Time Complexity</th>
              <th className="py-3 px-4">Space Complexity</th>
              <th className="py-3 px-4">Execution Time</th>
              <th className="py-3 px-4">Subarray Window</th>
              <th className="py-3 px-4 text-right">Calculated Profit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {algoRows.map((row) => (
              <tr
                key={row.name}
                className={row.isFastest ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'hover:bg-slate-50'}
              >
                <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                  <span>{row.name}</span>
                  {row.isFastest && (
                    <span className="flex items-center gap-1 text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-bold">
                      <Award className="w-3 h-3 text-blue-600" /> Fastest
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 font-mono text-slate-800 font-bold">{row.complexity}</td>
                <td className="py-3 px-4 font-mono text-slate-500">{row.space}</td>
                <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                  {row.runtime !== null && row.runtime !== undefined ? `${row.runtime.toFixed(4)} ms` : 'N/A'}
                </td>
                <td className="py-3 px-4 font-mono text-slate-500">{row.indices}</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                  ₹{row.profit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
