"""
Live Indian Stock Market Data Service.
Integrates live real-time NSE and BSE stock data, market quotes, search, and historical/intraday chart feeds
leveraging public market endpoints inspired by 0xramm/Indian-Stock-Market-API, and executes the DAA
Maximum Subarray algorithms (Kadane O(n), Divide & Conquer O(n log n), Brute Force O(n^2)) on live market feeds.
"""

import time
from typing import Dict, List, Optional, Tuple, Any
import httpx
from backend.algorithms.brute_force import max_subarray_brute_force
from backend.algorithms.kadane import max_subarray_kadane
from backend.algorithms.divide_conquer import max_subarray_divide_conquer
from backend.models.schemas import (
    StockAnalysisResponse,
    ChartDataPoint,
    AlgorithmResult,
    VerificationResult,
)

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# Curated Popular Indian Stock Tickers & Company Names
NSE_SYMBOLS_CACHE: Dict[str, str] = {
    "reliance": "RELIANCE",
    "reliance industries": "RELIANCE",
    "tcs": "TCS",
    "tata consultancy": "TCS",
    "infosys": "INFY",
    "infy": "INFY",
    "hdfc bank": "HDFCBANK",
    "hdfc": "HDFCBANK",
    "icici bank": "ICICIBANK",
    "icici": "ICICIBANK",
    "sbi": "SBIN",
    "state bank of india": "SBIN",
    "sbin": "SBIN",
    "itc": "ITC",
    "bharti airtel": "BHARTIARTL",
    "airtel": "BHARTIARTL",
    "wipro": "WIPRO",
    "hindustan unilever": "HINDUNILVR",
    "hul": "HINDUNILVR",
    "maruti": "MARUTI",
    "maruti suzuki": "MARUTI",
    "asian paints": "ASIANPAINT",
    "bajaj finance": "BAJFINANCE",
    "titan": "TITAN",
    "larsen & toubro": "LT",
    "l&t": "LT",
    "lt": "LT",
    "ongc": "ONGC",
    "ntpc": "NTPC",
    "power grid": "POWERGRID",
    "coal india": "COALINDIA",
    "adani enterprises": "ADANIENT",
    "adani": "ADANIENT",
    "adani ports": "ADANIPORTS",
    "sun pharma": "SUNPHARMA",
    "dr reddy": "DRREDDY",
    "cipla": "CIPLA",
    "tata motors": "TATAMOTORS",
    "tatamotors": "TATAMOTORS",
    "tmcv": "TMCV",
    "zomato": "ZOMATO",
    "paytm": "PAYTM",
    "one97": "PAYTM",
    "jio financial": "JIOFIN",
    "jiofin": "JIOFIN",
    "kotak bank": "KOTAKBANK",
    "axis bank": "AXISBANK",
    "hcl tech": "HCLTECH",
    "tata steel": "TATASTEEL",
    "nifty 50": "^NSEI",
    "nifty": "^NSEI",
    "sensex": "^BSESN",
}

DEFAULT_WATCHLIST = [
    "RELIANCE",
    "TCS",
    "HDFCBANK",
    "ICICIBANK",
    "INFY",
    "SBIN",
    "TATAMOTORS",
    "ITC",
    "BHARTIARTL",
    "LT",
    "^NSEI",
    "^BSESN",
]


class CrumbSession:
    """Manages Yahoo Finance session cookie and crumb authentication."""

    def __init__(self):
        self.crumb: Optional[str] = None
        self.cookies: Dict[str, str] = {}
        self.expires_at: float = 0.0

    def get_headers(self) -> Dict[str, str]:
        return {
            "User-Agent": UA,
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.9",
        }

    async def get_crumb(self, client: httpx.AsyncClient, force_refresh: bool = False) -> Tuple[Optional[str], Dict[str, str]]:
        now = time.time()
        if not force_refresh and self.crumb and now < self.expires_at:
            return self.crumb, self.cookies

        try:
            # 1. Hit cookie endpoint
            res = await client.get("https://fc.yahoo.com", headers=self.get_headers(), timeout=5.0)
            cookie_dict = dict(res.cookies)

            # 2. Hit crumb endpoint with acquired cookies
            crumb_res = await client.get(
                "https://query1.finance.yahoo.com/v1/test/getcrumb",
                headers=self.get_headers(),
                cookies=cookie_dict,
                timeout=5.0,
            )
            if crumb_res.status_code == 200:
                self.crumb = crumb_res.text.strip()
                self.cookies = cookie_dict
                self.expires_at = now + (45 * 60)  # 45 minutes cache
                return self.crumb, self.cookies
        except Exception:
            pass

        return None, {}


_crumb_session = CrumbSession()


def determine_ticker_and_exchange(symbol_input: str) -> Tuple[str, str, str]:
    """
    Given a symbol input (e.g. 'RELIANCE', 'RELIANCE.NS', 'TCS.BO', '^NSEI'),
    returns (clean_symbol, exchange_suffix, exchange_name).
    """
    sym = symbol_input.strip().upper()
    if sym.startswith("^"):
        return sym, "", "INDEX"
    if sym.endswith(".NS"):
        return sym[:-3], ".NS", "NSE"
    if sym.endswith(".BO"):
        return sym[:-3], ".BO", "BSE"
    return sym, ".NS", "NSE"


def format_raw_value(val: Any) -> Optional[float]:
    if val is None:
        return None
    if isinstance(val, dict):
        return val.get("raw")
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


class LiveStockService:
    """Service to fetch live Indian stock data and run DAA Maximum Subarray profit analysis."""

    @staticmethod
    def search_in_cache(query: str) -> List[Dict[str, Any]]:
        query_clean = query.strip().lower()
        if not query_clean:
            return []

        results = []
        seen = set()

        # Exact match
        if query_clean in NSE_SYMBOLS_CACHE:
            sym = NSE_SYMBOLS_CACHE[query_clean]
            results.append({
                "symbol": sym,
                "company_name": query.upper(),
                "exchange": "NSE",
                "match_type": "exact",
                "source": "cache",
            })
            seen.add(sym)

        # Partial match
        for key, sym in NSE_SYMBOLS_CACHE.items():
            if sym in seen:
                continue
            if query_clean in key or key in query_clean:
                results.append({
                    "symbol": sym,
                    "company_name": key.title(),
                    "exchange": "NSE",
                    "match_type": "partial",
                    "source": "cache",
                })
                seen.add(sym)

        return results

    @classmethod
    async def search_stocks(cls, query: str) -> List[Dict[str, Any]]:
        """Search Indian stocks via local cache and Yahoo Finance search API."""
        query_clean = query.strip()
        if not query_clean:
            return []

        cache_results = cls.search_in_cache(query_clean)
        seen = {r["symbol"] for r in cache_results}
        combined_results = list(cache_results)

        try:
            async with httpx.AsyncClient(headers={"User-Agent": UA}, timeout=6.0) as client:
                url = f"https://query1.finance.yahoo.com/v1/finance/search?q={httpx.URL(query_clean)}&quotesCount=12"
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    quotes = data.get("quotes", [])
                    for q in quotes:
                        ticker = q.get("symbol", "")
                        if ticker.endswith((".NS", ".BO")) or ticker in ["^NSEI", "^BSESN"]:
                            clean_sym = ticker.replace(".NS", "").replace(".BO", "")
                            if clean_sym not in seen:
                                seen.add(clean_sym)
                                combined_results.append({
                                    "symbol": clean_sym,
                                    "ticker": ticker,
                                    "company_name": q.get("longname") or q.get("shortname") or clean_sym,
                                    "exchange": "BSE" if ticker.endswith(".BO") else "NSE",
                                    "sector": q.get("sector") or "Indian Equity",
                                    "industry": q.get("industry") or "Financial / Commercial",
                                    "source": "yahoo",
                                })
        except Exception:
            pass

        # Add api action links
        for r in combined_results:
            sym = r["symbol"]
            r["api_url"] = f"/api/live/quote?symbol={sym}"
            r["analyze_url"] = f"/api/live/analyze?symbol={sym}"

        return combined_results

    @classmethod
    async def get_stock_quote(cls, symbol: str) -> Dict[str, Any]:
        """Fetches live real-time price quote and market metrics for an Indian stock."""
        clean_sym, suffix, exchange = determine_ticker_and_exchange(symbol)
        ticker = f"{clean_sym}{suffix}"

        # 1. First fetch fast chart meta (doesn't need crumb)
        chart_url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?range=1d&interval=1m"
        quote_data: Dict[str, Any] = {
            "symbol": clean_sym,
            "ticker": ticker,
            "exchange": exchange,
            "currency": "INR (₹)",
            "company_name": clean_sym,
            "last_price": None,
            "previous_close": None,
            "change": 0.0,
            "percent_change": 0.0,
            "open": None,
            "day_high": None,
            "day_low": None,
            "year_high": None,
            "year_low": None,
            "volume": None,
            "market_cap": None,
            "pe_ratio": None,
            "sector": "Indian Equities",
            "industry": "NSE / BSE Listed",
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "status": "success",
        }

        async with httpx.AsyncClient(headers={"User-Agent": UA}, timeout=8.0) as client:
            try:
                res = await client.get(chart_url)
                if res.status_code == 200:
                    data = res.json()
                    result = data.get("chart", {}).get("result", [{}])[0]
                    meta = result.get("meta", {})
                    if meta:
                        last_p = meta.get("regularMarketPrice")
                        prev_c = meta.get("chartPreviousClose") or meta.get("previousClose")
                        if last_p is not None:
                            quote_data["last_price"] = round(float(last_p), 2)
                        if prev_c is not None:
                            quote_data["previous_close"] = round(float(prev_c), 2)
                        if quote_data["last_price"] is not None and quote_data["previous_close"] is not None:
                            chg = quote_data["last_price"] - quote_data["previous_close"]
                            quote_data["change"] = round(chg, 2)
                            quote_data["percent_change"] = round((chg / quote_data["previous_close"]) * 100, 2)

                        quote_data["day_high"] = meta.get("regularMarketDayHigh")
                        quote_data["day_low"] = meta.get("regularMarketDayLow")
                        quote_data["year_high"] = meta.get("fiftyTwoWeekHigh")
                        quote_data["year_low"] = meta.get("fiftyTwoWeekLow")
                        quote_data["company_name"] = meta.get("shortName") or meta.get("longName") or clean_sym
                        quote_data["currency"] = meta.get("currency") or "INR"
            except Exception:
                pass

            # 2. Try crumb-authenticated quoteSummary for richer fundamental details (PE, Cap, Sector)
            try:
                crumb, cookies = await _crumb_session.get_crumb(client)
                if crumb:
                    modules = "price,summaryDetail,defaultKeyStatistics,assetProfile"
                    summary_url = f"https://query1.finance.yahoo.com/v10/finance/quoteSummary/{ticker}?modules={modules}&crumb={crumb}"
                    cookie_header = "; ".join([f"{k}={v}" for k, v in cookies.items()])
                    s_res = await client.get(summary_url, headers={"Cookie": cookie_header, "User-Agent": UA})
                    if s_res.status_code == 200:
                        s_data = s_res.json()
                        res_list = s_data.get("quoteSummary", {}).get("result", [])
                        if res_list:
                            item = res_list[0]
                            price_sec = item.get("price", {})
                            sum_sec = item.get("summaryDetail", {})
                            profile_sec = item.get("assetProfile", {})

                            if price_sec.get("longName"):
                                quote_data["company_name"] = price_sec.get("longName")
                            elif price_sec.get("shortName"):
                                quote_data["company_name"] = price_sec.get("shortName")

                            quote_data["open"] = format_raw_value(price_sec.get("regularMarketOpen") or sum_sec.get("open"))
                            quote_data["volume"] = format_raw_value(price_sec.get("regularMarketVolume") or sum_sec.get("volume"))
                            quote_data["market_cap"] = format_raw_value(price_sec.get("marketCap") or sum_sec.get("marketCap"))
                            quote_data["pe_ratio"] = format_raw_value(sum_sec.get("trailingPE"))
                            if profile_sec.get("sector"):
                                quote_data["sector"] = profile_sec.get("sector")
                            if profile_sec.get("industry"):
                                quote_data["industry"] = profile_sec.get("industry")
            except Exception:
                pass

        return quote_data

    @classmethod
    async def get_watchlist_quotes(cls, symbols: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """Fetches batch live quotes for watchlist / ticker marquee."""
        target_symbols = symbols if symbols else DEFAULT_WATCHLIST
        results = []

        # Batch query via Yahoo chart endpoint
        async with httpx.AsyncClient(headers={"User-Agent": UA}, timeout=10.0) as client:
            for s in target_symbols:
                clean_sym, suffix, exchange = determine_ticker_and_exchange(s)
                ticker = f"{clean_sym}{suffix}" if not s.startswith("^") else s
                try:
                    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?range=1d&interval=5m"
                    res = await client.get(url)
                    if res.status_code == 200:
                        data = res.json()
                        result = data.get("chart", {}).get("result", [{}])[0]
                        meta = result.get("meta", {})
                        last_p = meta.get("regularMarketPrice")
                        prev_c = meta.get("chartPreviousClose") or meta.get("previousClose")
                        chg = 0.0
                        pct = 0.0
                        if last_p is not None and prev_c is not None and prev_c > 0:
                            chg = round(float(last_p) - float(prev_c), 2)
                            pct = round((chg / float(prev_c)) * 100, 2)
                        
                        name = meta.get("shortName") or meta.get("longName") or clean_sym
                        if clean_sym == "^NSEI":
                            name = "NIFTY 50"
                        elif clean_sym == "^BSESN":
                            name = "BSE SENSEX"

                        results.append({
                            "symbol": clean_sym,
                            "ticker": ticker,
                            "name": name,
                            "exchange": exchange,
                            "last_price": round(float(last_p), 2) if last_p else None,
                            "previous_close": round(float(prev_c), 2) if prev_c else None,
                            "change": chg,
                            "percent_change": pct,
                            "day_high": meta.get("regularMarketDayHigh"),
                            "day_low": meta.get("regularMarketDayLow"),
                        })
                except Exception:
                    continue

        return results

    @classmethod
    async def get_live_stock_history(
        cls, symbol: str, range_str: str = "1mo", interval_str: str = "1d"
    ) -> Tuple[List[str], List[float], Dict[str, Any]]:
        """
        Fetches live historical or intraday candlestick prices for DAA analysis.
        Supported ranges: 1d, 5d, 1mo, 6mo, 1y, 5y, max.
        Supported intervals: 1m, 5m, 15m, 30m, 1h, 1d, 1wk.
        """
        clean_sym, suffix, exchange = determine_ticker_and_exchange(symbol)
        ticker = f"{clean_sym}{suffix}" if not symbol.startswith("^") else symbol

        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?range={range_str}&interval={interval_str}"
        
        async with httpx.AsyncClient(headers={"User-Agent": UA}, timeout=12.0) as client:
            res = await client.get(url)
            if res.status_code != 200:
                raise ValueError(f"Failed to fetch market data for {symbol} (HTTP {res.status_code})")
            
            data = res.json()
            results = data.get("chart", {}).get("result", [])
            if not results:
                raise ValueError(f"No chart data returned for {symbol}")

            chart_obj = results[0]
            meta = chart_obj.get("meta", {})
            timestamps = chart_obj.get("timestamp", [])
            indicators = chart_obj.get("indicators", {}).get("quote", [{}])[0]
            raw_closes = indicators.get("close", [])

            dates: List[str] = []
            prices: List[float] = []

            for ts, close in zip(timestamps, raw_closes):
                if close is not None and not (isinstance(close, float) and (close != close)):  # check not NaN
                    # Format timestamp: Intraday includes time, Daily is YYYY-MM-DD
                    if range_str in ["1d", "5d"]:
                        # Convert to IST time (UTC+5:30)
                        ist_time = time.gmtime(ts + 19800)
                        date_label = time.strftime("%d %b %H:%M", ist_time)
                    else:
                        ist_time = time.gmtime(ts + 19800)
                        date_label = time.strftime("%Y-%m-%d", ist_time)

                    dates.append(date_label)
                    prices.append(round(float(close), 2))

            if len(prices) < 2:
                raise ValueError(f"Insufficient historical data points ({len(prices)}) for stock {symbol}")

            return dates, prices, meta

    @classmethod
    async def analyze_live_stock(
        cls,
        symbol: str,
        range_str: str = "1mo",
        interval_str: str = "1d",
        max_brute_force_size: int = 5000,
    ) -> StockAnalysisResponse:
        """
        Runs the full DAA Maximum Subarray algorithm pipeline on real-time live Indian stock data.
        Executes:
        - Brute Force O(n^2)
        - Kadane's Algorithm O(n)
        - Divide & Conquer O(n log n)
        and constructs full verification, KPI metrics, and chart series.
        """
        clean_sym, suffix, exchange = determine_ticker_and_exchange(symbol)
        dates, prices, meta = await cls.get_live_stock_history(symbol, range_str, interval_str)

        # Build consecutive price changes array ΔP
        changes = [round(prices[i + 1] - prices[i], 4) for i in range(len(prices) - 1)]
        n_changes = len(changes)

        # 1. Execute Brute Force O(n^2)
        if n_changes <= max_brute_force_size:
            t0 = time.perf_counter_ns()
            res_bf = max_subarray_brute_force(changes)
            t1 = time.perf_counter_ns()
            res_bf["execution_time_ms"] = round((t1 - t0) / 1_000_000.0, 4)
        else:
            res_bf = {
                "max_sum": 0.0,
                "start_index": -1,
                "end_index": -1,
                "algorithm": "Brute Force O(n^2)",
                "time_complexity": "O(n^2)",
                "space_complexity": "O(1)",
                "execution_time_ms": None,
            }

        # 2. Execute Kadane's Algorithm O(n)
        t0 = time.perf_counter_ns()
        res_kd = max_subarray_kadane(changes)
        t1 = time.perf_counter_ns()
        res_kd["execution_time_ms"] = round((t1 - t0) / 1_000_000.0, 4)

        # 3. Execute Divide and Conquer O(n log n)
        t0 = time.perf_counter_ns()
        res_dc = max_subarray_divide_conquer(changes)
        t1 = time.perf_counter_ns()
        res_dc["execution_time_ms"] = round((t1 - t0) / 1_000_000.0, 4)

        # Verification
        is_consistent = (
            abs(res_kd["max_sum"] - res_dc["max_sum"]) < 1e-4
            and (res_bf["execution_time_ms"] is None or abs(res_kd["max_sum"] - res_bf["max_sum"]) < 1e-4)
        )
        verification_msg = (
            f"All algorithms produced equivalent maximum profit of ₹{res_kd['max_sum']:,.2f}."
            if is_consistent
            else "Algorithm outputs diverge."
        )

        # Map indices to buy / sell points
        l_idx = res_kd["start_index"]
        r_idx = res_kd["end_index"]
        all_neg = res_kd["max_sum"] <= 0

        if all_neg or l_idx < 0:
            buy_idx = 0
            sell_idx = 0
            buy_date = dates[0]
            sell_date = dates[0]
            buy_price = prices[0]
            sell_price = prices[0]
            max_profit = 0.0
            profit_pct = 0.0
        else:
            buy_idx = l_idx
            sell_idx = r_idx + 1
            buy_date = dates[buy_idx]
            sell_date = dates[sell_idx]
            buy_price = prices[buy_idx]
            sell_price = prices[sell_idx]
            max_profit = round(sell_price - buy_price, 2)
            profit_pct = round((max_profit / buy_price) * 100, 2) if buy_price > 0 else 0.0

        # Build chart data points
        chart_points: List[ChartDataPoint] = []
        for i, (d, p) in enumerate(zip(dates, prices)):
            is_b = (i == buy_idx) and not all_neg
            is_s = (i == sell_idx) and not all_neg
            in_win = (buy_idx <= i <= sell_idx) and not all_neg
            chg_val = round(p - prices[i - 1], 2) if i > 0 else 0.0

            chart_points.append(
                ChartDataPoint(
                    date=d,
                    close=p,
                    is_buy=is_b,
                    is_sell=is_s,
                    is_in_window=in_win,
                    change=chg_val,
                )
            )

        company_name = meta.get("shortName") or meta.get("longName") or clean_sym
        if clean_sym == "^NSEI":
            company_name = "NIFTY 50 Index (NSE Benchmark)"
        elif clean_sym == "^BSESN":
            company_name = "BSE SENSEX Index"

        algo_dict = {
            "brute_force": AlgorithmResult(**res_bf),
            "kadane": AlgorithmResult(**res_kd),
            "divide_conquer": AlgorithmResult(**res_dc),
        }

        return StockAnalysisResponse(
            stock=clean_sym,
            symbol=clean_sym,
            company_name=company_name,
            market=f"NSE / {exchange} Real-Time Live Feed ({range_str})",
            currency="INR (₹)",
            dataset_size=len(prices),
            trading_days=len(prices),
            date_range={"start": dates[0], "end": dates[-1]},
            buy_date=buy_date,
            sell_date=sell_date,
            buy_price=buy_price,
            sell_price=sell_price,
            buy_index=buy_idx,
            sell_index=sell_idx,
            maximum_profit=max_profit,
            profit_percentage=profit_pct,
            all_negative=all_neg,
            algorithms=algo_dict,
            verification=VerificationResult(
                is_consistent=is_consistent, message=verification_msg
            ),
            chart_data=chart_points,
            is_temporary=False,
            temporary_label=f"Live Feed • {range_str.upper()} Interval",
        )
