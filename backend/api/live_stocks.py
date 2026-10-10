"""
Live Indian Stock Market API Endpoints.
Provides live search, quotes, ticker watchlists, and live DAA maximum profit analysis
for real-time NSE and BSE stock data.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from backend.models.schemas import StockAnalysisResponse
from backend.services.live_stock_service import (
    LiveStockService,
    NSE_SYMBOLS_CACHE,
    DEFAULT_WATCHLIST,
)

router = APIRouter(prefix="/api/live", tags=["Live Stock Market"])


class LiveAnalysisRequest(BaseModel):
    symbol: str = Field(default="RELIANCE", description="NSE or BSE stock symbol (e.g. RELIANCE, TCS, INFY, TATAMOTORS, ^NSEI)")
    range: str = Field(default="1mo", description="Historical range: 1d, 5d, 1mo, 6mo, 1y, 5y")
    interval: str = Field(default="1d", description="Candle interval: 5m, 15m, 1h, 1d")
    max_brute_force_size: Optional[int] = Field(default=5000, description="Max array size for O(n^2) brute force")


@router.get("/search")
async def search_live_stocks(q: str = Query(..., min_length=1, description="Stock ticker or company name search term")):
    """
    Search Indian stocks by symbol or company name using local cache and Yahoo Finance search.
    """
    results = await LiveStockService.search_stocks(q)
    return {
        "status": "success",
        "query": q,
        "total_results": len(results),
        "results": results,
    }


@router.get("/quote")
async def get_live_quote(symbol: str = Query(..., description="Indian stock symbol, e.g. RELIANCE, TCS, INFY")):
    """
    Fetch real-time live price, day change, % change, day high/low, 52W range, PE ratio, and market cap.
    """
    try:
        quote = await LiveStockService.get_stock_quote(symbol)
        return quote
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch live quote for {symbol}: {str(e)}")


@router.get("/watchlist")
async def get_live_watchlist(symbols: Optional[str] = Query(None, description="Comma-separated stock symbols")):
    """
    Fetch batch real-time quotes for live ticker marquee and watchlist.
    """
    symbol_list = [s.strip().upper() for s in symbols.split(",") if s.strip()] if symbols else DEFAULT_WATCHLIST
    try:
        quotes = await LiveStockService.get_watchlist_quotes(symbol_list)
        return {
            "status": "success",
            "count": len(quotes),
            "watchlist": quotes,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch watchlist: {str(e)}")


@router.get("/symbols")
def get_cached_symbols():
    """
    Returns list of curated top Indian stocks and indices available for fast lookup.
    """
    items = []
    seen = set()
    for name, sym in NSE_SYMBOLS_CACHE.items():
        if sym not in seen:
            seen.add(sym)
            items.append({
                "symbol": sym,
                "name": name.title(),
                "exchange": "NSE",
                "ticker": f"{sym}.NS" if not sym.startswith("^") else sym,
            })
    return {
        "status": "success",
        "total": len(items),
        "symbols": items,
    }


@router.get("/analyze", response_model=StockAnalysisResponse)
async def analyze_live_stock_get(
    symbol: str = Query(default="RELIANCE", description="Indian stock symbol"),
    range: str = Query(default="1mo", description="Timeframe: 1d, 5d, 1mo, 6mo, 1y, 5y"),
    interval: str = Query(default="1d", description="Interval: 5m, 15m, 1h, 1d"),
):
    """
    Fetch live real-time price history from NSE/BSE and run the 3 DAA algorithms
    (Kadane, Divide & Conquer, Brute Force) to compute maximum profit and optimal holding window.
    """
    try:
        # Default intervals based on range
        eff_interval = interval
        if range == "1d" and interval == "1d":
            eff_interval = "5m"
        elif range == "5d" and interval == "1d":
            eff_interval = "15m"

        return await LiveStockService.analyze_live_stock(symbol, range, eff_interval)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Live analysis failed for {symbol}: {str(e)}")


@router.post("/analyze", response_model=StockAnalysisResponse)
async def analyze_live_stock_post(req: LiveAnalysisRequest):
    """
    POST endpoint for running DAA analysis on live real-time Indian stock market feeds.
    """
    try:
        eff_interval = req.interval
        if req.range == "1d" and req.interval == "1d":
            eff_interval = "5m"
        elif req.range == "5d" and req.interval == "1d":
            eff_interval = "15m"

        return await LiveStockService.analyze_live_stock(
            symbol=req.symbol,
            range_str=req.range,
            interval_str=eff_interval,
            max_brute_force_size=req.max_brute_force_size or 5000,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Live analysis failed for {req.symbol}: {str(e)}")
