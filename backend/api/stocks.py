"""
Indian Stock Datasets Metadata Endpoint.
Provides the registry of all permanent Indian stock datasets in data/
(Core 5: RELIANCE, HDFCBANK, ICICIBANK, SBIN, TCS, plus any permanently saved custom datasets).
"""

import os
from typing import List
from fastapi import APIRouter
from backend.models.schemas import StockMetadata
from backend.services.stock_processor import StockDataProcessor

router = APIRouter(prefix="/api/stocks", tags=["Stocks"])

DATA_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data"
)

# Core 5 Base Permanent Stocks
CORE_PERMANENT_SYMBOLS = ["RELIANCE", "HDFCBANK", "ICICIBANK", "SBIN", "TCS"]
PERMANENT_SYMBOLS = CORE_PERMANENT_SYMBOLS


PRESET_NAMES = {
    "RELIANCE": "Reliance Industries Ltd.",
    "HDFCBANK": "HDFC Bank Ltd.",
    "ICICIBANK": "ICICI Bank Ltd.",
    "SBIN": "State Bank of India",
    "TCS": "Tata Consultancy Services Ltd.",
    "NIFTY50": "NIFTY 50 Index (NSE Benchmark)",
    "NIFTY 50": "NIFTY 50 Index (NSE Benchmark)",
}


@router.get("", response_model=List[StockMetadata])
def get_available_stocks():
    """
    Returns list of all permanent Indian stock CSV datasets in data/.
    Includes the core 5 permanent stocks and any permanently saved datasets.
    """
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR, exist_ok=True)

    stock_list: List[StockMetadata] = []
    seen_symbols = set()

    # 1. Process Core 5 in consistent order
    for symbol in CORE_PERMANENT_SYMBOLS:
        filepath = os.path.join(DATA_DIR, f"{symbol}.csv")
        if not os.path.exists(filepath):
            continue
        try:
            df = StockDataProcessor.load_and_validate(filepath)
            dates = df["Date"].tolist()
            name = PRESET_NAMES.get(symbol, f"{symbol} Ltd.")
            seen_symbols.add(symbol)

            stock_list.append(
                StockMetadata(
                    symbol=symbol,
                    name=name,
                    market="NSE",
                    currency="INR (₹)",
                    records=len(df),
                    start_date=dates[0],
                    end_date=dates[-1],
                    columns=list(df.columns),
                    is_custom=False,
                    is_temporary=False,
                )
            )
        except Exception:
            continue

    # 2. Add any additional saved permanent datasets from data/
    files = sorted([f for f in os.listdir(DATA_DIR) if f.endswith(".csv")])
    for filename in files:
        symbol = filename.replace(".csv", "").upper()
        if symbol in seen_symbols:
            continue

        filepath = os.path.join(DATA_DIR, filename)
        try:
            df = StockDataProcessor.load_and_validate(filepath)
            dates = df["Date"].tolist()
            name = PRESET_NAMES.get(symbol, f"{symbol} (Saved Dataset)")

            stock_list.append(
                StockMetadata(
                    symbol=symbol,
                    name=name,
                    market="NSE / Saved",
                    currency="INR (₹)",
                    records=len(df),
                    start_date=dates[0],
                    end_date=dates[-1],
                    columns=list(df.columns),
                    is_custom=True,
                    is_temporary=False,
                )
            )
            seen_symbols.add(symbol)
        except Exception:
            continue

    return stock_list
