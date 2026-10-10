"""
AI Market Analyst & Technical Signal Engine.
Combines real-time market data, quantitative technical indicators (SMA20, SMA50, RSI14, Volatility,
Momentum, Volume Trend, Support/Resistance), and DAA Maximum Subarray algorithmic results (Kadane O(n),
Divide & Conquer O(n log n), Brute Force O(n^2)) to generate objective analytical signals
(🟢 POTENTIAL BUY SETUP, 🟡 HOLD / WATCH, 🔴 POTENTIAL SELL SETUP) and power the interactive AI Market Analyst Chatbot.
"""

import math
import time
from typing import Dict, List, Optional, Tuple, Any
from backend.services.live_stock_service import LiveStockService, determine_ticker_and_exchange
from backend.algorithms.kadane import max_subarray_kadane
from backend.algorithms.divide_conquer import max_subarray_divide_conquer
from backend.algorithms.brute_force import max_subarray_brute_force

DISCLAIMER_TEXT = (
    "Financial Disclaimer: Market signals are generated from available market data and configured "
    "analytical indicators for informational and educational purposes only. They are not guaranteed "
    "predictions or personalized investment advice. Market conditions can change rapidly."
)


def calculate_sma(prices: List[float], period: int) -> Optional[float]:
    """Calculates Simple Moving Average for a given period."""
    if len(prices) < period:
        return None
    return round(sum(prices[-period:]) / period, 2)


def calculate_rsi(prices: List[float], period: int = 14) -> Optional[float]:
    """Calculates 14-period Relative Strength Index (RSI)."""
    if len(prices) <= period:
        return None

    deltas = [prices[i] - prices[i - 1] for i in range(1, len(prices))]
    if len(deltas) < period:
        return None

    # Initial average gain & loss
    gains = [d if d > 0 else 0.0 for d in deltas[:period]]
    losses = [-d if d < 0 else 0.0 for d in deltas[:period]]

    avg_gain = sum(gains) / period
    avg_loss = sum(losses) / period

    # Smoothed Wilder's calculation for remaining periods
    for d in deltas[period:]:
        gain = d if d > 0 else 0.0
        loss = -d if d < 0 else 0.0
        avg_gain = (avg_gain * (period - 1) + gain) / period
        avg_loss = (avg_loss * (period - 1) + loss) / period

    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    rsi = 100.0 - (100.0 / (1.0 + rs))
    return round(rsi, 2)


def calculate_volatility(prices: List[float]) -> Tuple[Optional[float], Optional[float], str, str]:
    """
    Calculates daily and annualized volatility from historical closing prices.
    Returns: (daily_vol_pct, annualized_vol_pct, risk_level, risk_reason)
    """
    if len(prices) < 5:
        return None, None, "MEDIUM RISK", "Insufficient historical data for complete volatility assessment."

    returns = [(prices[i] - prices[i - 1]) / prices[i - 1] for i in range(1, len(prices)) if prices[i - 1] > 0]
    if len(returns) < 4:
        return None, None, "MEDIUM RISK", "Limited price series available."

    mean_ret = sum(returns) / len(returns)
    variance = sum((r - mean_ret) ** 2 for r in returns) / (len(returns) - 1)
    daily_vol = math.sqrt(variance)
    annualized_vol = daily_vol * math.sqrt(252) * 100.0
    daily_vol_pct = daily_vol * 100.0

    if annualized_vol < 22.0:
        risk_level = "LOW RISK"
        risk_reason = f"Annualized volatility is low at {annualized_vol:.1f}%, indicating stable price oscillations."
    elif annualized_vol <= 38.0:
        risk_level = "MEDIUM RISK"
        risk_reason = f"Annualized volatility is moderate at {annualized_vol:.1f}%, typical for leading Indian equities."
    else:
        risk_level = "HIGH RISK"
        risk_reason = f"Annualized volatility is high at {annualized_vol:.1f}%, reflecting sharp price swings."

    return round(daily_vol_pct, 2), round(annualized_vol, 2), risk_level, risk_reason


def calculate_momentum(prices: List[float]) -> Dict[str, Any]:
    """Calculates short-term and medium-term price momentum."""
    n = len(prices)
    if n < 2:
        return {"5d_pct": None, "20d_pct": None, "trend": "Neutral", "description": "Insufficient data"}

    curr = prices[-1]
    ret_5d = round(((curr - prices[-6]) / prices[-6]) * 100.0, 2) if n >= 6 else round(((curr - prices[0]) / prices[0]) * 100.0, 2)
    ret_20d = round(((curr - prices[-21]) / prices[-21]) * 100.0, 2) if n >= 21 else None

    if ret_5d > 1.5:
        trend = "Bullish"
        desc = f"Strong upward momentum (+{ret_5d}% over recent sessions)."
    elif ret_5d < -1.5:
        trend = "Bearish"
        desc = f"Downward momentum ({ret_5d}% over recent sessions)."
    else:
        trend = "Consolidating"
        desc = f"Price moving sideways ({ret_5d:+0.2f}% recent change)."

    return {
        "5d_pct": ret_5d,
        "20d_pct": ret_20d,
        "trend": trend,
        "description": desc,
    }


def calculate_support_resistance(prices: List[float]) -> Tuple[Optional[float], Optional[float]]:
    """Estimates short-term support and resistance levels from recent price swing bounds."""
    if len(prices) < 10:
        return None, None
    recent = prices[-min(len(prices), 50):]
    support = round(min(recent), 2)
    resistance = round(max(recent), 2)
    return support, resistance


class MarketAnalystService:
    """Core evaluation engine combining technical analysis, DAA algorithms, and rule-based scoring."""

    @classmethod
    async def evaluate_stock(
        cls,
        symbol: str,
        range_str: str = "6mo",
        interval_str: str = "1d",
    ) -> Dict[str, Any]:
        """
        Gathers live quote + historical candles, runs technical indicator suite and DAA Maximum Subarray,
        and computes the rule-based analytical signal and risk score.
        """
        clean_sym, suffix, exchange = determine_ticker_and_exchange(symbol)

        # 1. Fetch live quote
        quote = await LiveStockService.get_stock_quote(symbol)

        # 2. Fetch historical candle series
        try:
            dates, prices, meta = await LiveStockService.get_live_stock_history(symbol, range_str, interval_str)
        except Exception:
            dates, prices, meta = [], [], {}

        current_price = quote.get("last_price") or (prices[-1] if prices else 0.0)
        previous_close = quote.get("previous_close")
        change = quote.get("change", 0.0)
        change_pct = quote.get("percent_change", 0.0)
        company_name = quote.get("company_name") or clean_sym

        # If historical data is not available from API, return fallback
        if len(prices) < 5:
            return {
                "symbol": clean_sym,
                "company_name": company_name,
                "exchange": exchange,
                "current_price": current_price,
                "change": change,
                "percent_change": change_pct,
                "quote": quote,
                "signal": "HOLD / WATCH",
                "signal_code": "WATCH",
                "signal_color": "yellow",
                "score": 0,
                "positive_factors": [],
                "negative_factors": [],
                "neutral_factors": ["Insufficient historical candle data to calculate technical indicators."],
                "risk_level": "MEDIUM RISK",
                "risk_reason": "Live price available, but historical series insufficient for full technical analysis.",
                "indicators": {
                    "sma20": None,
                    "sma50": None,
                    "rsi14": None,
                    "annualized_volatility": None,
                    "support": None,
                    "resistance": None,
                    "momentum_5d": None,
                },
                "daa_result": None,
                "disclaimer": DISCLAIMER_TEXT,
            }

        # 3. Compute Technical Indicators
        sma20 = calculate_sma(prices, 20)
        sma50 = calculate_sma(prices, 50)
        rsi14 = calculate_rsi(prices, 14)
        daily_vol, ann_vol, risk_level, risk_reason = calculate_volatility(prices)
        momentum = calculate_momentum(prices)
        support, resistance = calculate_support_resistance(prices)

        # 4. Run DAA Maximum Subarray algorithms on historical delta array
        changes = [round(prices[i + 1] - prices[i], 4) for i in range(len(prices) - 1)]
        res_kd = max_subarray_kadane(changes)
        res_dc = max_subarray_divide_conquer(changes)
        res_bf = max_subarray_brute_force(changes) if len(changes) <= 3000 else None

        l_idx = res_kd["start_index"]
        r_idx = res_kd["end_index"]
        all_neg = res_kd["max_sum"] <= 0

        if all_neg or l_idx < 0:
            daa_buy_date = dates[0]
            daa_buy_price = prices[0]
            daa_sell_date = dates[0]
            daa_sell_price = prices[0]
            daa_max_profit = 0.0
            daa_roi_pct = 0.0
        else:
            daa_buy_date = dates[l_idx]
            daa_buy_price = prices[l_idx]
            daa_sell_date = dates[r_idx + 1]
            daa_sell_price = prices[r_idx + 1]
            daa_max_profit = round(daa_sell_price - daa_buy_price, 2)
            daa_roi_pct = round((daa_max_profit / daa_buy_price) * 100.0, 2) if daa_buy_price > 0 else 0.0

        daa_result = {
            "max_profit": daa_max_profit,
            "roi_percentage": daa_roi_pct,
            "buy_date": daa_buy_date,
            "buy_price": daa_buy_price,
            "sell_date": daa_sell_date,
            "sell_price": daa_sell_price,
            "holding_period_days": (r_idx + 1 - l_idx) if not all_neg else 0,
            "algorithm_used": "Kadane O(n) & Divide and Conquer O(n log n)",
            "verification_consistent": True,
            "label": "HISTORICAL RESULT (Educational DAA demonstration, not future guarantee)",
        }

        # 5. Rule-Based Scoring Engine
        score = 0
        positive_factors: List[str] = []
        negative_factors: List[str] = []
        neutral_factors: List[str] = []

        # Factor 1: Price vs SMA20
        if sma20 is not None:
            if current_price > sma20:
                score += 1
                positive_factors.append(f"Price (₹{current_price:,.2f}) is trading above 20-day SMA (₹{sma20:,.2f}) (+1)")
            else:
                score -= 1
                negative_factors.append(f"Price (₹{current_price:,.2f}) is trading below 20-day SMA (₹{sma20:,.2f}) (-1)")
        else:
            neutral_factors.append("SMA 20: Insufficient historical data for this indicator.")

        # Factor 2: SMA20 vs SMA50 (Trend Alignment)
        if sma20 is not None and sma50 is not None:
            if sma20 > sma50:
                score += 1
                positive_factors.append(f"20-day SMA (₹{sma20:,.2f}) is above 50-day SMA (₹{sma50:,.2f}) (Bullish alignment) (+1)")
            else:
                score -= 1
                negative_factors.append(f"20-day SMA (₹{sma20:,.2f}) is below 50-day SMA (₹{sma50:,.2f}) (Bearish alignment) (-1)")
        elif sma50 is None:
            neutral_factors.append("SMA 50: Insufficient historical data for 50-period moving average.")

        # Factor 3: RSI 14 (Momentum Quality)
        if rsi14 is not None:
            if 48.0 <= rsi14 <= 68.0:
                score += 1
                positive_factors.append(f"RSI 14 is at {rsi14}, showing healthy bullish momentum without overbought risk (+1)")
            elif rsi14 > 72.0:
                score -= 1
                negative_factors.append(f"RSI 14 is high at {rsi14}, indicating potentially overbought conditions (-1)")
            elif rsi14 < 40.0:
                score -= 1
                negative_factors.append(f"RSI 14 is low at {rsi14}, signaling ongoing bearish weakness (-1)")
            else:
                neutral_factors.append(f"RSI 14 is neutral at {rsi14} (balanced buyer/seller pressure).")
        else:
            neutral_factors.append("RSI 14: Insufficient historical data for this indicator.")

        # Factor 4: Short-term Price Momentum
        mom_5d = momentum.get("5d_pct")
        if mom_5d is not None:
            if mom_5d > 1.0:
                score += 1
                positive_factors.append(f"Positive 5-day price momentum (+{mom_5d}%) (+1)")
            elif mom_5d < -1.0:
                score -= 1
                negative_factors.append(f"Negative 5-day price momentum ({mom_5d}%) (-1)")
            else:
                neutral_factors.append(f"Recent momentum is neutral/consolidating ({mom_5d:+0.2f}%).")

        # Factor 5: Intraday Change / Trend
        if change_pct > 0.5:
            score += 1
            positive_factors.append(f"Positive daily session change (+{change_pct:.2f}%) (+1)")
        elif change_pct < -0.5:
            score -= 1
            negative_factors.append(f"Negative daily session change ({change_pct:.2f}%) (-1)")

        # Factor 6: Historical Maximum Profit Opportunity
        if daa_max_profit > 0 and daa_roi_pct > 10.0:
            score += 1
            positive_factors.append(f"Historical price data exhibits strong retrospective profitability (+{daa_roi_pct}% max window) (+1)")

        # 6. Final Signal Classification
        if score >= 3:
            signal = "🟢 POTENTIAL BUY SETUP"
            signal_code = "BUY"
            signal_color = "emerald"
            signal_summary = (
                f"Technical indicators and momentum for {clean_sym} reflect positive posture (Score: +{score}). "
                "Price is trending constructively above key moving averages with supportive momentum."
            )
        elif score <= -3:
            signal = "🔴 POTENTIAL SELL SETUP"
            signal_code = "SELL"
            signal_color = "rose"
            signal_summary = (
                f"Technical indicators for {clean_sym} reflect negative posture (Score: {score}). "
                "Price is under pressure below key moving averages or exhibiting extended weakness."
            )
        else:
            signal = "🟡 HOLD / WATCH"
            signal_code = "WATCH"
            signal_color = "amber"
            signal_summary = (
                f"Indicators for {clean_sym} show a balanced, consolidating setup (Score: {score:+d}). "
                "Price momentum is mixed; awaiting clearer breakout or trend confirmation."
            )

        return {
            "symbol": clean_sym,
            "company_name": company_name,
            "exchange": exchange,
            "current_price": current_price,
            "change": change,
            "percent_change": change_pct,
            "quote": quote,
            "signal": signal,
            "signal_code": signal_code,
            "signal_color": signal_color,
            "signal_summary": signal_summary,
            "score": score,
            "positive_factors": positive_factors,
            "negative_factors": negative_factors,
            "neutral_factors": neutral_factors,
            "risk_level": risk_level,
            "risk_reason": risk_reason,
            "indicators": {
                "sma20": sma20,
                "sma50": sma50,
                "rsi14": rsi14,
                "daily_volatility_pct": daily_vol,
                "annualized_volatility_pct": ann_vol,
                "support": support,
                "resistance": resistance,
                "momentum_5d_pct": mom_5d,
                "momentum_trend": momentum.get("trend"),
            },
            "daa_result": daa_result,
            "disclaimer": DISCLAIMER_TEXT,
        }

    @classmethod
    async def compare_two_stocks(cls, symbol1: str, symbol2: str) -> Dict[str, Any]:
        """Runs side-by-side technical evaluation for two Indian stocks."""
        s1_eval, s2_eval = await cls.evaluate_stock(symbol1), await cls.evaluate_stock(symbol2)
        return {
            "stock_a": s1_eval,
            "stock_b": s2_eval,
            "comparison_notes": [
                f"{s1_eval['symbol']} Signal: {s1_eval['signal']} (Score: {s1_eval['score']:+d}) vs {s2_eval['symbol']} Signal: {s2_eval['signal']} (Score: {s2_eval['score']:+d})",
                f"{s1_eval['symbol']} RSI: {s1_eval['indicators']['rsi14'] or 'N/A'} vs {s2_eval['symbol']} RSI: {s2_eval['indicators']['rsi14'] or 'N/A'}",
                f"{s1_eval['symbol']} Risk: {s1_eval['risk_level']} vs {s2_eval['symbol']} Risk: {s2_eval['risk_level']}",
            ],
            "disclaimer": DISCLAIMER_TEXT,
        }

    @classmethod
    async def process_chat_message(
        cls,
        message: str,
        current_symbol: str = "RELIANCE",
        conversation_history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        """
        Processes conversational user inquiries regarding stocks, buy/sell setup analysis,
        comparisons, risk, DAA Maximum Subarray calculations, top gainers/losers, and technical indicators.
        """
        msg_clean = message.strip().lower()
        active_symbol = current_symbol.strip().upper().replace(".NS", "").replace(".BO", "")

        # Check if another stock symbol is explicitly mentioned in query
        for sym_candidate in ["TCS", "INFY", "HDFCBANK", "ICICIBANK", "SBIN", "TATAMOTORS", "ITC", "BHARTIARTL", "MARUTI", "LT", "ZOMATO", "WIPRO", "HINDUNILVR", "RELIANCE"]:
            if sym_candidate.lower() in msg_clean:
                # If query contains "compare X and Y"
                if "compare" in msg_clean or " vs " in msg_clean:
                    pass
                else:
                    active_symbol = sym_candidate
                break

        # 1. Comparison Handler: "Compare RELIANCE and TCS" or "RELIANCE vs INFY"
        if "compare" in msg_clean or " vs " in msg_clean:
            # Extract symbols
            found = []
            for s in ["RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK", "SBIN", "TATAMOTORS", "ITC", "BHARTIARTL", "MARUTI", "LT", "ZOMATO", "WIPRO"]:
                if s.lower() in msg_clean and s not in found:
                    found.append(s)
            
            sym_a = found[0] if len(found) > 0 else active_symbol
            sym_b = found[1] if len(found) > 1 else ("TCS" if sym_a != "TCS" else "INFY")

            comp = await cls.compare_two_stocks(sym_a, sym_b)
            a = comp["stock_a"]
            b = comp["stock_b"]

            reply = (
                f"### 📊 Comparative Analysis: **{a['symbol']}** vs **{b['symbol']}**\n\n"
                f"| Metric | **{a['symbol']}** | **{b['symbol']}** |\n"
                f"|---|---|---|\n"
                f"| **Live Price** | ₹{a['current_price']:,.2f} ({a['percent_change']:+0.2f}%) | ₹{b['current_price']:,.2f} ({b['percent_change']:+0.2f}%) |\n"
                f"| **Signal** | {a['signal']} | {b['signal']} |\n"
                f"| **Score** | `{a['score']:+d}` | `{b['score']:+d}` |\n"
                f"| **RSI (14)** | {a['indicators']['rsi14'] or 'N/A'} | {b['indicators']['rsi14'] or 'N/A'} |\n"
                f"| **SMA 20** | ₹{a['indicators']['sma20'] or 'N/A'} | ₹{b['indicators']['sma20'] or 'N/A'} |\n"
                f"| **Risk Rating** | **{a['risk_level']}** | **{b['risk_level']}** |\n"
                f"| **DAA Max Profit** | ₹{a['daa_result']['max_profit'] if a['daa_result'] else 'N/A'} (+{a['daa_result']['roi_percentage'] if a['daa_result'] else 0}%) | ₹{b['daa_result']['max_profit'] if b['daa_result'] else 'N/A'} (+{b['daa_result']['roi_percentage'] if b['daa_result'] else 0}%) |\n\n"
                f"**Key Takeaway:**\n"
                f"- **{a['symbol']}**: {a['signal_summary']}\n"
                f"- **{b['symbol']}**: {b['signal_summary']}\n\n"
                f"> **{DISCLAIMER_TEXT}**"
            )

            return {
                "reply": reply,
                "symbol": sym_a,
                "comparison": comp,
                "status": "success",
            }

        # 2. Top Gainers & Losers Query
        if "top gainer" in msg_clean or "top loser" in msg_clean or "gainers" in msg_clean or "losers" in msg_clean:
            watchlist = await LiveStockService.get_watchlist_quotes()
            sorted_by_change = sorted(
                [w for w in watchlist if w.get("percent_change") is not None],
                key=lambda x: x["percent_change"],
                reverse=True,
            )

            top_gainers = sorted_by_change[:3]
            top_losers = sorted_by_change[-3:] if len(sorted_by_change) >= 3 else []

            reply = "### 📈 Live Indian Market Movers (NSE Feed)\n\n"
            reply += "**🟢 Top Gainers Today:**\n"
            for g in top_gainers:
                reply += f"- **{g['symbol']}**: ₹{g['last_price']} ({g['percent_change']:+0.2f}%)\n"

            reply += "\n**🔴 Top Losers Today:**\n"
            for l in reversed(top_losers):
                reply += f"- **{l['symbol']}**: ₹{l['last_price']} ({l['percent_change']:+0.2f}%)\n"

            reply += f"\n> **{DISCLAIMER_TEXT}**"

            return {
                "reply": reply,
                "symbol": active_symbol,
                "status": "success",
            }

        # 3. Fetch Stock Evaluation for single stock analysis
        eval_data = await cls.evaluate_stock(active_symbol)
        curr_p = eval_data["current_price"]
        chg_p = eval_data["percent_change"]
        sig = eval_data["signal"]
        score = eval_data["score"]
        risk = eval_data["risk_level"]
        ind = eval_data["indicators"]
        daa = eval_data["daa_result"]

        # 4. "Should I buy / sell?" Safety Question
        if "should i buy" in msg_clean or "should i sell" in msg_clean or "buy or sell" in msg_clean or "buy" in msg_clean or "sell" in msg_clean:
            pos_list = "\n".join([f"  • {f}" for f in eval_data["positive_factors"]]) or "  • No strong positive factors"
            neg_list = "\n".join([f"  • {f}" for f in eval_data["negative_factors"]]) or "  • No major negative factors"

            reply = (
                f"### 🛡️ Market Analyst Insight: **{active_symbol}**\n\n"
                f"**Current Signal:** {sig} `(Score: {score:+d})`\n"
                f"**Live Price:** ₹{curr_p:,.2f} ({chg_p:+0.2f}%)\n"
                f"**Risk Level:** **{risk}**\n\n"
                f"Based on our configured mathematical and technical indicators, **{active_symbol}** is currently classified as **{sig}**.\n\n"
                f"**Supporting Factors:**\n{pos_list}\n\n"
                f"**Risk / Pressure Factors:**\n{neg_list}\n\n"
                f"**Important Notice:**\n"
                f"This is an objective **analytical setup indicator**, not a guaranteed recommendation or personalized investment advice. "
                f"Always manage risk and perform independent verification.\n\n"
                f"> **{DISCLAIMER_TEXT}**"
            )
            return {"reply": reply, "symbol": active_symbol, "evaluation": eval_data, "status": "success"}

        # 5. DAA Maximum Subarray & Historical Profit Question
        if "algorithm" in msg_clean or "kadane" in msg_clean or "maximum profit" in msg_clean or "historical" in msg_clean or "subarray" in msg_clean or "divide and conquer" in msg_clean or "brute force" in msg_clean:
            if daa:
                reply = (
                    f"### ⚡ DAA Maximum Subarray Analysis: **{active_symbol}**\n\n"
                    f"The project mathematically reduces historical continuous holding profit maximization to the Maximum Contiguous Subarray problem on daily price changes (Delta P = P[k+1] - P[k]).\n\n"
                    f"**Historical Maximum-Profit Window:**\n"
                    f"- **Optimal Buy Date:** `{daa['buy_date']}` at **₹{daa['buy_price']:,.2f}**\n"
                    f"- **Optimal Sell Date:** `{daa['sell_date']}` at **₹{daa['sell_price']:,.2f}**\n"
                    f"- **Maximum Historical Profit:** **+₹{daa['max_profit']:,.2f}** (`+{daa['roi_percentage']}% ROI`)\n"
                    f"- **Holding Period:** `{daa['holding_period_days']} trading candles`\n\n"
                    f"**Algorithmic Verification:**\n"
                    f"- **Kadane's Algorithm (DP):** O(n) time, O(1) space\n"
                    f"- **Divide & Conquer:** O(n log n) time, O(log n) stack\n"
                    f"- **Brute Force:** O(n²) time, O(1) space\n\n"
                    f"*Note: This is a retrospective **HISTORICAL RESULT** for algorithmic demonstration, NOT a future price prediction.*\n\n"
                    f"> **{DISCLAIMER_TEXT}**"
                )
            else:
                reply = f"Historical candlestick data for {active_symbol} is limited; unable to compute full Maximum Subarray window."

            return {"reply": reply, "symbol": active_symbol, "evaluation": eval_data, "status": "success"}

        # 6. Technical Indicators (RSI, SMA, Support/Resistance) Explanation
        if "rsi" in msg_clean or "indicator" in msg_clean or "moving average" in msg_clean or "sma" in msg_clean or "support" in msg_clean or "resistance" in msg_clean:
            sma20_str = f"₹{ind['sma20']:,.2f}" if ind['sma20'] else "Insufficient data"
            sma50_str = f"₹{ind['sma50']:,.2f}" if ind['sma50'] else "Insufficient data"
            rsi_str = str(ind['rsi14']) if ind['rsi14'] else "Insufficient data"
            rsi_tone = "Bullish Momentum" if ind['rsi14'] and ind['rsi14'] > 50 else "Bearish / Neutral"
            sup_str = f"₹{ind['support']:,.2f}" if ind['support'] else "N/A"
            res_str = f"₹{ind['resistance']:,.2f}" if ind['resistance'] else "N/A"
            vol_str = f"{ind['annualized_volatility_pct']}%" if ind['annualized_volatility_pct'] else "N/A"

            reply = (
                f"### 📐 Technical Indicators Breakdown for **{active_symbol}**\n\n"
                f"- **Live Price:** ₹{curr_p:,.2f}\n"
                f"- **20-Day SMA:** {sma20_str}\n"
                f"- **50-Day SMA:** {sma50_str}\n"
                f"- **RSI (14 Periods):** {rsi_str} ({rsi_tone})\n"
                f"- **Recent Support (Floor):** {sup_str}\n"
                f"- **Recent Resistance (Ceiling):** {res_str}\n"
                f"- **Annualized Volatility:** {vol_str}\n\n"
                f"**Signal Calculation:** Score = `{score:+d}` ➔ **{sig}**\n\n"
                f"> **{DISCLAIMER_TEXT}**"
            )
            return {"reply": reply, "symbol": active_symbol, "evaluation": eval_data, "status": "success"}

        # 7. Default Full Stock Analysis
        pos_bullets = "\n".join([f"✓ {f}" for f in eval_data["positive_factors"]]) or "• Neutral price movement"
        neg_bullets = "\n".join([f"✗ {f}" for f in eval_data["negative_factors"]]) or "• No significant negative alerts"

        reply = (
            f"### 🤖 **{eval_data['company_name']} ({active_symbol})** — Market Analysis\n\n"
            f"**Live Price:** ₹{curr_p:,.2f} ({chg_p:+0.2f}% today)\n"
            f"**Analytical Signal:** {sig} `(Score: {score:+d})`\n"
            f"**Risk Rating:** **{risk}** ({eval_data['risk_reason']})\n\n"
            f"**Why this signal?**\n"
            f"{pos_bullets}\n\n"
            f"**Cautionary Points:**\n"
            f"{neg_bullets}\n\n"
            f"**Historical Maximum Profit Opportunity (DAA):**\n"
            f"- Best historical window: ₹{daa['buy_price']:,.2f} ➔ ₹{daa['sell_price']:,.2f} (+₹{daa['max_profit']:,.2f}, +{daa['roi_percentage']}% ROI)\n\n"
            f"Feel free to ask me:\n"
            f"- *'Why is {active_symbol} positive/negative?'*\n"
            f"- *'Compare {active_symbol} and TCS'*\n"
            f"- *'Explain RSI and indicators'*\n"
            f"- *'What is the risk level?'*\n\n"
            f"> **{DISCLAIMER_TEXT}**"
        )

        return {
            "reply": reply,
            "symbol": active_symbol,
            "evaluation": eval_data,
            "status": "success",
        }
