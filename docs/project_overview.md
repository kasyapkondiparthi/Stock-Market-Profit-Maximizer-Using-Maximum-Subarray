# Project Overview: Stock Market Profit Maximizer Using Maximum Subarray for Indian Stock Market

## 1. Academic Context
- **Course**: Design and Analysis of Algorithms (DAA) / Analysis of Algorithms
- **Project Category**: Divide and Conquer, Dynamic Programming & Empirical Complexity Analysis
- **Core Algorithmic Problem**: Maximum Contiguous Subarray
- **Real-World Domain**: Indian Stock Market (NSE / National Stock Exchange of India)
- **Currency**: Indian Rupee (INR / ₹)

## 2. Problem Statement
Given a discrete historical price sequence $P = [p_0, p_1, \dots, p_{n-1}]$ of an Indian equity (in ₹) over $n$ trading days, determine the optimal continuous historical holding window defined by buy day $i$ and sell day $j$ ($0 \le i < j \le n-1$) that produces the maximum historical profit $P[j] - P[i]$.

## 3. Mathematical Reduction to Maximum Subarray
Let the consecutive daily price change array be $\Delta P$:
$$\Delta P = [\delta_0, \delta_1, \dots, \delta_{n-2}] \quad \text{where } \delta_k = p_{k+1} - p_k \text{ (in ₹)}$$

By the telescoping sum property:
$$P[j] - P[i] = \sum_{k=i}^{j-1} (p_{k+1} - p_k) = \sum_{k=i}^{j-1} \delta_k$$

Hence, maximizing the gross profit $P[j] - P[i]$ is strictly isomorphic to finding the **Maximum Contiguous Subarray** of $\Delta P$ spanning from index $L = i$ to index $R = j-1$.

## 4. Key Deliverables
1. **Manual Implementation of 3 DAA Algorithms in Python**:
   - Brute Force $\mathcal{O}(n^2)$ Time, $\mathcal{O}(1)$ Space
   - Kadane's Algorithm $\mathcal{O}(n)$ Time, $\mathcal{O}(1)$ Space
   - Divide and Conquer $\mathcal{O}(n \log n)$ Time, $\mathcal{O}(\log n)$ Stack Space
2. **Deterministic Equivalence & Verification**:
   - Backend verification proving $S_{\text{BF}} \equiv S_{\text{Kadane}} \equiv S_{\text{D\&C}}$ on all datasets.
3. **Exact Index Mapping**:
   - $\text{Buy Index} = L \implies \text{Buy Date} = D[L], \text{Buy Price} = P[L]$ (₹)
   - $\text{Sell Index} = R + 1 \implies \text{Sell Date} = D[R+1], \text{Sell Price} = P[R+1]$ (₹)
   - $\text{Maximum Profit} = P[R+1] - P[L] \equiv \text{max\_sum}$ (₹)
4. **Authentic Indian Equities Dataset**:
   - Real 5-year daily trading history for 14 major Indian companies (RELIANCE, TCS, INFY, HDFCBANK, ICICIBANK, SBIN, ITC, LT, BHARTIARTL, MARUTI, HINDUNILVR, KOTAKBANK, AXISBANK, WIPRO).
5. **Interactive Full-Stack Web Application**:
   - FastAPI Python backend + React Vite Tailwind CSS frontend with interactive Recharts visualizer, empirical benchmarking suite, and 25 faculty viva voce questions.
