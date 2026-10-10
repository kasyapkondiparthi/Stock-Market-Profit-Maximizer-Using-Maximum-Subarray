import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceArea,
  ReferenceDot,
} from 'recharts';
import { TrendingUp, Calendar, Filter } from 'lucide-react';

export default function StockChart({ analysis }) {
  if (!analysis || !analysis.chart_data) return null;

  const { chart_data, buy_date, sell_date, buy_price, sell_price, symbol, stock } = analysis;
  const [zoomRange, setZoomRange] = useState('ALL'); // 'ALL', 'WINDOW', '1Y'

  // Filter or focus data if requested
  const filteredData = useMemo(() => {
    if (zoomRange === 'WINDOW') {
      const bIdx = chart_data.findIndex((d) => d.date === buy_date);
      const sIdx = chart_data.findIndex((d) => d.date === sell_date);
      if (bIdx !== -1 && sIdx !== -1) {
        const padding = Math.max(10, Math.floor((sIdx - bIdx) * 0.15));
        const start = Math.max(0, bIdx - padding);
        const end = Math.min(chart_data.length, sIdx + padding + 1);
        return chart_data.slice(start, end);
      }
    } else if (zoomRange === '1Y') {
      return chart_data.slice(-252); // ~252 trading days in a year
    }
    return chart_data;
  }, [chart_data, zoomRange, buy_date, sell_date]);

  // Compute min/max Y for chart scaling
  const minPrice = Math.floor(Math.min(...filteredData.map((d) => d.close)) * 0.95);
  const maxPrice = Math.ceil(Math.max(...filteredData.map((d) => d.close)) * 1.05);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-lg text-xs space-y-1 z-50">
          <p className="font-semibold text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-1">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>{data.date}</span>
          </p>
          <p className="text-slate-900 font-bold text-sm">
            Close: <span className="text-blue-600 font-mono">₹{data.close.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </p>
          {data.change !== null && data.change !== undefined && (
            <p className="text-slate-500 font-mono text-[11px]">
              Daily ΔP: <span className={data.change >= 0 ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
                {data.change >= 0 ? `+₹${data.change.toFixed(2)}` : `-₹${Math.abs(data.change).toFixed(2)}`}
              </span>
            </p>
          )}
          {data.is_buy && (
            <div className="mt-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[10px] text-center">
              BUY POINT (P[Buy]: ₹{buy_price.toFixed(2)})
            </div>
          )}
          {data.is_sell && (
            <div className="mt-1 px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold border border-rose-200 text-[10px] text-center">
              SELL POINT (P[Sell]: ₹{sell_price.toFixed(2)})
            </div>
          )}
          {data.is_in_window && !data.is_buy && !data.is_sell && (
            <div className="text-[10px] text-blue-600 font-medium italic">
              Within Maximum Subarray Window
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
      
      {/* Header with Title & Zoom Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span>Historical Price Analysis</span>
            <span className="text-xs font-normal text-slate-500 font-mono">({symbol || stock})</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Green Marker = Buy Day, Red Marker = Sell Day, Shaded Area = Maximum Historical Profit Window
          </p>
        </div>

        {/* View Mode Filters */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 px-2 flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-400" /> View:
          </span>
          {[
            { id: 'ALL', label: 'Full History' },
            { id: 'WINDOW', label: 'Focus Max Window' },
            { id: '1Y', label: 'Recent 1 Year' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setZoomRange(mode.id)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                zoomRange === mode.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recharts Container */}
      <div className="h-[380px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredData} margin={{ top: 15, right: 20, left: 15, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={{ stroke: '#cbd5e1' }}
              minTickGap={45}
            />
            <YAxis
              domain={[minPrice, maxPrice]}
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={{ stroke: '#cbd5e1' }}
              tickFormatter={(val) => `₹${val.toLocaleString('en-IN')}`}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Shaded Area for Optimal Window */}
            {buy_date && sell_date && (
              <ReferenceArea
                x1={buy_date}
                x2={sell_date}
                fill="#dbeafe"
                fillOpacity={0.6}
                stroke="#93c5fd"
                strokeOpacity={0.8}
                strokeDasharray="3 3"
              />
            )}

            {/* Buy Reference Dot (Green) */}
            {buy_date && (
              <ReferenceDot
                x={buy_date}
                y={buy_price}
                r={6}
                fill="#16a34a"
                stroke="#ffffff"
                strokeWidth={2}
                isFront={true}
              />
            )}

            {/* Sell Reference Dot (Red) */}
            {sell_date && (
              <ReferenceDot
                x={sell_date}
                y={sell_price}
                r={6}
                fill="#dc2626"
                stroke="#ffffff"
                strokeWidth={2}
                isFront={true}
              />
            )}

            {/* Price Line (Professional Blue) */}
            <Line
              type="monotone"
              dataKey="close"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend and Subarray Explanation */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 border border-white inline-block"></span>
            <span>BUY: <strong className="text-slate-900 font-mono">₹{buy_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> ({buy_date})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 border border-white inline-block"></span>
            <span>SELL: <strong className="text-slate-900 font-mono">₹{sell_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> ({sell_date})</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-2 bg-blue-100 border border-blue-300 rounded inline-block"></span>
          <span className="text-slate-600 font-medium">Optimal Holding Window (Maximum Subarray)</span>
        </div>
      </div>

    </div>
  );
}
