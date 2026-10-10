# System Architecture: Indian Stock Market Profit Maximizer

## 1. High-Level Architecture Flow
```
[ Indian Stock Historical CSV (data/*.csv or User Upload) ]
                       │
                       ▼
[ StockDataProcessor (Pandas / Python) ]
   • CSV validation (Date, Close)
   • Chronological sorting (Ascending)
   • Data cleaning & Deduplication
   • Closing Price Sequence P (in ₹)
   • Consecutive Daily Differences ΔP = [P[k+1] - P[k]] (in ₹)
                       │
                       ▼
[ DAA Algorithms Layer (Pure Python) ]
   ├── Brute Force: max_subarray_brute_force (O(n²))
   ├── Kadane's Algorithm: max_subarray_kadane (O(n))
   └── Divide and Conquer: max_subarray_divide_conquer (O(n log n))
                       │
                       ▼
[ Result Mapper & Verification Engine ]
   • Deterministic Proof: S_BF == S_Kadane == S_DC
   • Index Alignment: Buy_Index = L, Sell_Index = R + 1
   • Financial Conversion: Buy Price = P[L] (₹), Sell Price = P[R+1] (₹), Profit = P[R+1] - P[L] (₹)
                       │
                       ▼
[ FastAPI REST API (Port 8000) ]
   ├── GET /api/health
   ├── GET /api/stocks
   ├── POST /api/analyze
   ├── GET /api/analyze-all/summary
   ├── POST /api/upload
   └── POST /api/benchmark
                       │
                       ▼
[ React + Vite + Tailwind CSS Frontend (Port 5173) ]
   ├── Interactive Recharts Price Trajectory with Shaded Max Subarray Window (₹)
   ├── KPI Metric Cards (Buy/Sell Dates & Prices in ₹)
   ├── Tri-Algorithmic Comparison & Speedup Matrix
   ├── Multi-Stock Comparative Matrix (NSE India)
   ├── Empirical Benchmark Scaling Curves (t vs N)
   ├── CSV Drag & Drop Ingestion Portal
   └── DAA Theory, Recurrence Proofs & Viva Voce Q&A Panel
```
