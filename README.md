# Stock Market Profit Maximizer Using Maximum Subarray for Indian Stock Market
### Design and Analysis of Algorithms (DAA) Academic Project

[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React-18.3+-61DAFB.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4+-38B2AC.svg)](https://tailwindcss.com/)
[![Currency](https://img.shields.io/badge/Currency-INR%20(%E2%82%B9)-green.svg)](https://www.nseindia.com/)
[![Market](https://img.shields.io/badge/Market-NSE%20India-orange.svg)](https://www.nseindia.com/)
[![Tests](https://img.shields.io/badge/pytest-35%20passed-brightgreen.svg)](https://pytest.org/)

---

## 1. Abstract & Introduction
The **Indian Stock Market Profit Maximizer** is a comprehensive academic project for **Design and Analysis of Algorithms (DAA)**. It demonstrates how the real-world quantitative finance problem of identifying the most profitable historical continuous stock holding period on the **National Stock Exchange of India (NSE)** is rigorously reduced to the fundamental **Maximum Contiguous Subarray** problem.

The application manually implements, verifies, and benchmarks three core algorithmic paradigms in pure Python:
1. **Brute Force** — $\mathcal{O}(n^2)$ Time, $\mathcal{O}(1)$ Space
2. **Kadane's Algorithm** (Dynamic Programming) — $\mathcal{O}(n)$ Time, $\mathcal{O}(1)$ Space
3. **Divide and Conquer** (Recursive Reduction) — $\mathcal{O}(n \log n)$ Time, $\mathcal{O}(\log n)$ Stack Space

> **Important Academic Disclaimer**: This application performs retrospective historical stock-price analysis strictly for academic demonstration in Design and Analysis of Algorithms (DAA). It does NOT use Machine Learning, does NOT predict future stock prices, does NOT guarantee returns, and does NOT provide financial advice.

---

## 2. Mathematical Reduction to Maximum Subarray

Given a sequence of daily closing prices in Indian Rupees (₹):
$$P = [p_0, p_1, p_2, \dots, p_{n-1}]$$

We construct the consecutive daily price change array $\Delta P$:
$$\Delta P[k] = p_{k+1} - p_k \quad \text{for } k \in [0, n-2] \text{ (in ₹)}$$

By the telescoping sum identity:
$$P[j] - P[i] = \sum_{k=i}^{j-1} (p_{k+1} - p_k) = \sum_{k=i}^{j-1} \Delta P[k]$$

### Exact Buy / Sell Index Mapping
If the Maximum Subarray on $\Delta P$ yields $(\text{max\_sum}, L, R)$:
- **Optimal Buy Date Index in $P$**: $\text{Buy\_Index} = L \implies \text{Buy Date} = D[L], \text{Buy Price} = P[L]$ (₹)
- **Optimal Sell Date Index in $P$**: $\text{Sell\_Index} = R + 1 \implies \text{Sell Date} = D[R+1], \text{Sell Price} = P[R+1]$ (₹)
- **Maximum Historical Profit**: $P[R+1] - P[L] \equiv \text{max\_sum}$ (₹)

---

## 3. Algorithm Complexity Comparison

| Algorithm | Paradigm | Time Complexity | Space Complexity | Correctness Verification |
|---|---|---|---|---|
| **Kadane's Algorithm** | Dynamic Programming | $\mathcal{O}(n)$ | $\mathcal{O}(1)$ | Verified ($S_{\text{KD}} \equiv S_{\text{BF}} \equiv S_{\text{DC}}$) |
| **Divide and Conquer** | Recursive D&C | $\mathcal{O}(n \log n)$ | $\mathcal{O}(\log n)$ stack | Verified ($S_{\text{DC}} \equiv S_{\text{KD}} \equiv S_{\text{BF}}$) |
| **Brute Force** | Exhaustive Search | $\mathcal{O}(n^2)$ | $\mathcal{O}(1)$ | Verified ($S_{\text{BF}} \equiv S_{\text{KD}} \equiv S_{\text{DC}}$) |

---

## 4. Authentic Indian Stock Datasets (NSE)

The project includes authentic 5-year daily trading history for 14 leading Indian companies:
- **RELIANCE.csv** (Reliance Industries Ltd)
- **TCS.csv** (Tata Consultancy Services Ltd)
- **INFY.csv** (Infosys Ltd)
- **HDFCBANK.csv** (HDFC Bank Ltd)
- **ICICIBANK.csv** (ICICI Bank Ltd)
- **SBIN.csv** (State Bank of India)
- **ITC.csv** (ITC Limited)
- **LT.csv** (Larsen & Toubro Ltd)
- **BHARTIARTL.csv** (Bharti Airtel Ltd)
- **MARUTI.csv** (Maruti Suzuki India Ltd)
- **HINDUNILVR.csv** (Hindustan Unilever Ltd)
- **KOTAKBANK.csv** (Kotak Mahindra Bank Ltd)
- **AXISBANK.csv** (Axis Bank Ltd)
- **WIPRO.csv** (Wipro Limited)

---

## 5. Installation & Setup

### Prerequisites
- Python 3.9+
- Node.js 18+ and npm

### 1. Backend Setup
```bash
# Navigate to project root
cd "DAA PROJECT"

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

# Run backend automated test suite (35 tests)
pytest backend/tests/ -v

# Start FastAPI backend server
uvicorn backend.main:app --reload --port 8000
```
Backend will be live at `http://127.0.0.1:8000` with Swagger docs at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup
```bash
# In a separate terminal window
cd "DAA PROJECT/frontend"

# Install dependencies
npm install

# Start Vite React development server
npm run dev
```
Frontend will be live at `http://localhost:5173`.

---

## 6. Project Architecture & Features

1. **🔴 Live Stock Market Feed & Real-Time Analyzer (NEW)**:
   - Powered by integration inspired by `0xramm/Indian-Stock-Market-API`.
   - Real-time search and live quote streaming across **NSE** and **BSE** equities and benchmark indices (NIFTY 50, SENSEX, Reliance, TCS, HDFC Bank, Infosys, Tata Motors, Zomato, etc.).
   - Live intraday (5m, 15m) and historical timeframes (1M, 6M, 1Y, 5Y).
   - Live DAA algorithmic profit optimization: dynamically applies Kadane's Algorithm $\mathcal{O}(n)$, Divide & Conquer $\mathcal{O}(n \log n)$, and Brute Force $\mathcal{O}(n^2)$ to live market feeds.
   - Continuous real-time streaming ticker marquee with auto-refresh and price change metrics.
2. **Analysis & Price Charts**: Select any Indian stock (e.g. RELIANCE, TCS, INFY) to inspect the historical price chart, shaded optimal holding window, and exact Buy/Sell dates and prices in Indian Rupees (₹).
3. **Deterministic Verification**: Real-time consistency check confirming all 3 algorithms find identical maximum profits ($S_{\text{KD}} \equiv S_{\text{DC}} \equiv S_{\text{BF}}$).
4. **Multi-Stock Comparator Matrix**: Side-by-side performance matrix for all permanent NSE equities.
5. **Empirical Benchmarking Engine**: High-resolution `time.perf_counter_ns()` timer measuring empirical runtimes across $N=100 \dots 10,000$ with CPU safety cutoffs for $\mathcal{O}(n^2)$.
6. **CSV Dataset Manager**: Drag-and-drop CSV uploader for custom Indian stock datasets with automatic cleaning, sorting, validation, and permanent collection saving.

---

## 7. Live API Endpoints (`/api/live`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/live/search?q={query}` | Search Indian stocks by ticker or company name |
| `GET` | `/api/live/quote?symbol={symbol}` | Fetch live real-time price, day high/low, 52W range, PE, and market cap |
| `GET` | `/api/live/watchlist` | Get batch live prices for NIFTY 50, SENSEX, and top Indian stocks |
| `GET` | `/api/live/symbols` | List pre-cached top Indian equities |
| `GET/POST` | `/api/live/analyze` | Fetch live candlestick prices and run Kadane, D&C, and Brute Force |

---

## 8. License
Academic DAA Project — Suitable for college evaluation, faculty demonstration, and viva voce defense.

