"""
Indian Stock Analysis API Endpoints.
Executes Brute Force O(n^2), Kadane's Algorithm O(n), and Divide & Conquer O(n log n)
on the 5 permanent Indian stocks (RELIANCE, HDFCBANK, ICICIBANK, SBIN, TCS) or active temporary uploads.
"""

import os
import time
from typing import Dict, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.algorithms.brute_force import max_subarray_brute_force
from backend.algorithms.kadane import max_subarray_kadane
from backend.algorithms.divide_conquer import max_subarray_divide_conquer
from backend.models.schemas import StockAnalysisResponse
from backend.services.stock_processor import StockDataProcessor
from backend.services.result_mapper import StockResultMapper
from backend.api.stocks import CORE_PERMANENT_SYMBOLS, PERMANENT_SYMBOLS, PRESET_NAMES


router = APIRouter(prefix="/api/analyze", tags=["Analysis"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
TEMP_DIR = os.path.join(BASE_DIR, "temp_uploads")


class AnalysisRequest(BaseModel):
    symbol: str = "RELIANCE"
    max_brute_force_size: Optional[int] = 5000


def run_single_stock_analysis(
    symbol: str, max_brute_force_size: int = 5000
) -> StockAnalysisResponse:
    symbol_clean = symbol.strip().upper()
    is_temporary = False
    temporary_label = None

    # 1. Check temporary uploads first
    temp_candidates = [
        os.path.join(TEMP_DIR, f"{symbol_clean}.csv"),
        os.path.join(TEMP_DIR, f"{symbol.strip()}.csv"),
        os.path.join(TEMP_DIR, f"{symbol_clean.replace(' ', '')}.csv"),
        os.path.join(TEMP_DIR, f"{symbol_clean.replace(' ', '_')}.csv"),
    ]
    filepath = None
    for p in temp_candidates:
        if os.path.exists(p):
            filepath = p
            is_temporary = True
            is_nifty = "NIFTY" in symbol_clean
            temporary_label = (
                "NIFTY 50 — Temporary Demonstration Dataset"
                if is_nifty
                else f"{symbol_clean} — Temporary Uploaded Dataset"
            )
            break

    # 2. Check permanent data repository if not in temporary uploads
    if not filepath:
        perm_candidates = [
            os.path.join(DATA_DIR, f"{symbol_clean}.csv"),
            os.path.join(DATA_DIR, f"{symbol.strip()}.csv"),
        ]
        for p in perm_candidates:
            if os.path.exists(p):
                filepath = p
                is_temporary = False
                break

    if not filepath:
        raise HTTPException(
            status_code=404,
            detail=f"Stock dataset for symbol '{symbol_clean}' not found in active repository or temporary uploads.",
        )

    try:
        df = StockDataProcessor.load_and_validate(filepath)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error processing stock dataset '{symbol_clean}': {str(e)}",
        )

    dates, prices, changes = StockDataProcessor.extract_prices_and_changes(df)

    # 1. Measure Brute Force O(n^2)
    t0 = time.perf_counter_ns()
    res_bf = max_subarray_brute_force(changes)
    t1 = time.perf_counter_ns()
    res_bf["execution_time_ms"] = round((t1 - t0) / 1_000_000.0, 4)

    # 2. Measure Kadane's Algorithm O(n)
    t0 = time.perf_counter_ns()
    res_kd = max_subarray_kadane(changes)
    t1 = time.perf_counter_ns()
    res_kd["execution_time_ms"] = round((t1 - t0) / 1_000_000.0, 4)

    # 3. Measure Divide and Conquer O(n log n)
    t0 = time.perf_counter_ns()
    res_dc = max_subarray_divide_conquer(changes)
    t1 = time.perf_counter_ns()
    res_dc["execution_time_ms"] = round((t1 - t0) / 1_000_000.0, 4)

    algo_results = {
        "brute_force": res_bf,
        "kadane": res_kd,
        "divide_conquer": res_dc,
    }

    if is_temporary:
        company_name = (
            "NIFTY 50 Index (Temporary Demonstration Dataset)"
            if "NIFTY" in symbol_clean
            else f"{symbol_clean} (Temporary Demonstration Dataset)"
        )
        market_label = "NSE / Temporary Demonstration"
    else:
        company_name = PRESET_NAMES.get(
            symbol_clean, f"{symbol_clean} Ltd."
        )
        market_label = "NSE / Historical Dataset"

    return StockResultMapper.build_analysis_response(
        symbol=symbol_clean,
        company_name=company_name,
        dates=dates,
        prices=prices,
        changes=changes,
        algo_results=algo_results,
        market=market_label,
        is_temporary=is_temporary,
        temporary_label=temporary_label,
    )


@router.post("", response_model=StockAnalysisResponse)
def analyze_stock(req: AnalysisRequest):
    """
    Analyzes the specified stock dataset with all three DAA algorithms.
    """
    return run_single_stock_analysis(
        req.symbol, req.max_brute_force_size or 5000
    )


@router.get("/{symbol}", response_model=StockAnalysisResponse)
def analyze_stock_get(symbol: str):
    """
    GET shorthand for stock analysis by ticker symbol.
    """
    return run_single_stock_analysis(symbol)


@router.get("-all/summary", response_model=List[StockAnalysisResponse])
def analyze_all_stocks():
    """
    Runs analysis across all permanent Indian stocks in data/ (Core 5 + any permanently saved datasets)
    for Multi-Stock Comparative Matrix.
    """
    if not os.path.exists(DATA_DIR):
        return []

    summaries: List[StockAnalysisResponse] = []
    seen = set()

    # Core 5 first
    for sym in CORE_PERMANENT_SYMBOLS:
        filepath = os.path.join(DATA_DIR, f"{sym}.csv")
        if os.path.exists(filepath):
            try:
                res = run_single_stock_analysis(sym)
                summaries.append(res)
                seen.add(sym)
            except Exception:
                continue

    # Additional saved permanent datasets
    files = sorted([f for f in os.listdir(DATA_DIR) if f.endswith(".csv")])
    for filename in files:
        sym = filename.replace(".csv", "").upper()
        if sym in seen:
            continue
        try:
            res = run_single_stock_analysis(sym)
            summaries.append(res)
            seen.add(sym)
        except Exception:
            continue

    return summaries

