"""
Result Mapper Service for Indian Stock Market.
Transforms Maximum Subarray index solutions from the daily change array (Delta P)
back to actual stock purchase dates, sell dates, prices (₹ INR), profit calculations,
and chart visualization data.
"""

import math
from typing import Any, Dict, List, Optional
from backend.models.schemas import (
    AlgorithmResult,
    ChartDataPoint,
    StockAnalysisResponse,
    VerificationResult,
)


class StockResultMapper:
    """Maps algorithm results back to chronological financial dates and prices in Indian Rupees (₹)."""

    @classmethod
    def verify_algorithms(
        cls, results: Dict[str, Dict[str, Any]]
    ) -> VerificationResult:
        """
        Ensures Brute Force, Kadane, and Divide & Conquer all agree on the maximum sum.
        """
        bf_sum = results["brute_force"]["max_sum"]
        kd_sum = results["kadane"]["max_sum"]
        dc_sum = results["divide_conquer"]["max_sum"]

        bf_kd_match = math.isclose(bf_sum, kd_sum, abs_tol=1e-3)
        kd_dc_match = math.isclose(kd_sum, dc_sum, abs_tol=1e-3)

        if bf_kd_match and kd_dc_match:
            return VerificationResult(
                is_consistent=True,
                message=f"Algorithmic Equivalence Confirmed: All 3 algorithms returned identical maximum profit of ₹{kd_sum:.2f}",
            )
        else:
            return VerificationResult(
                is_consistent=False,
                message=f"Algorithmic Discrepancy Detected! Brute Force: ₹{bf_sum}, Kadane: ₹{kd_sum}, Divide & Conquer: ₹{dc_sum}",
            )

    @classmethod
    def build_analysis_response(
        cls,
        symbol: str,
        company_name: Optional[str],
        dates: List[str],
        prices: List[float],
        changes: List[float],
        algo_results: Dict[str, Dict[str, Any]],
        market: str = "NSE / Historical Dataset",
        is_temporary: bool = False,
        temporary_label: Optional[str] = None,
    ) -> StockAnalysisResponse:
        """
        Builds the unified StockAnalysisResponse schema.
        Maps:
            buy_index = start_index (in changes)
            sell_index = end_index + 1 (in changes)
            buy_date = dates[buy_index]
            sell_date = dates[sell_index]
            buy_price = prices[buy_index] (in ₹)
            sell_price = prices[sell_index] (in ₹)
        """
        verification = cls.verify_algorithms(algo_results)

        # Primary reference algorithm
        ref = algo_results["kadane"]
        start_idx = ref["start_index"]
        end_idx = ref["end_index"]
        max_sum = ref["max_sum"]

        # If empty or invalid
        if start_idx == -1 or not prices:
            buy_idx = 0
            sell_idx = 0
            buy_date = dates[0] if dates else ""
            sell_date = dates[0] if dates else ""
            buy_price = prices[0] if prices else 0.0
            sell_price = prices[0] if prices else 0.0
            max_profit = 0.0
            profit_pct = 0.0
            all_negative = True
        else:
            # BUY / SELL MAPPING CRITICAL LOGIC
            buy_idx = start_idx
            sell_idx = end_idx + 1

            buy_date = dates[buy_idx]
            sell_date = dates[sell_idx]
            buy_price = prices[buy_idx]
            sell_price = prices[sell_idx]

            max_profit = round(sell_price - buy_price, 2)
            profit_pct = (
                round(((sell_price - buy_price) / buy_price) * 100, 2)
                if buy_price > 0
                else 0.0
            )
            all_negative = all(c < 0 for c in changes)

        # Construct Chart Data Points
        chart_data: List[ChartDataPoint] = []
        for i, (d, p) in enumerate(zip(dates, prices)):
            is_buy = i == buy_idx
            is_sell = i == sell_idx
            is_in_win = buy_idx <= i <= sell_idx
            chg = changes[i] if i < len(changes) else None
            chart_data.append(
                ChartDataPoint(
                    date=d,
                    close=round(p, 2),
                    is_buy=is_buy,
                    is_sell=is_sell,
                    is_in_window=is_in_win,
                    change=round(chg, 2) if chg is not None else None,
                )
            )

        algorithms_formatted = {
            k: AlgorithmResult(
                max_sum=v["max_sum"],
                start_index=v["start_index"],
                end_index=v["end_index"],
                algorithm=v["algorithm"],
                time_complexity=v["time_complexity"],
                space_complexity=v["space_complexity"],
                execution_time_ms=v.get("execution_time_ms"),
            )
            for k, v in algo_results.items()
        }

        return StockAnalysisResponse(
            stock=symbol,
            symbol=symbol,
            company_name=company_name or symbol,
            market=market,
            currency="INR (₹)",
            dataset_size=len(prices),
            trading_days=len(prices),
            date_range={"start": dates[0], "end": dates[-1]},
            buy_date=buy_date,
            sell_date=sell_date,
            buy_price=round(buy_price, 2),
            sell_price=round(sell_price, 2),
            buy_index=buy_idx,
            sell_index=sell_idx,
            maximum_profit=max_profit,
            profit_percentage=profit_pct,
            all_negative=all_negative,
            algorithms=algorithms_formatted,
            verification=verification,
            chart_data=chart_data,
            is_temporary=is_temporary,
            temporary_label=temporary_label,
        )
