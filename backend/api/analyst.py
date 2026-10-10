"""
AI Market Analyst API Endpoints.
Provides technical analysis evaluations, rule-based buy/watch/sell signal scoring,
stock comparisons, and conversational AI Market Insight Assistant processing.
"""

from typing import Dict, List, Optional, Any
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from backend.services.market_analyst_service import MarketAnalystService

router = APIRouter(prefix="/api/analyst", tags=["AI Market Analyst"])


class EvaluateRequest(BaseModel):
    symbol: str = Field(default="RELIANCE", description="Indian stock ticker symbol")
    range: str = Field(default="6mo", description="Historical candle range: 1mo, 6mo, 1y, 5y")
    interval: str = Field(default="1d", description="Candle interval: 5m, 15m, 1d")


class ChatMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User prompt or question")
    current_symbol: str = Field(default="RELIANCE", description="Currently active stock in dashboard")
    conversation_history: Optional[List[Dict[str, str]]] = Field(default=[], description="Previous chat turns")


@router.get("/evaluate")
async def evaluate_stock_get(
    symbol: str = Query(default="RELIANCE", description="Stock symbol"),
    range: str = Query(default="6mo", description="Historical range: 1mo, 6mo, 1y, 5y"),
):
    """
    Computes technical indicators (SMA20, SMA50, RSI14, Volatility, Momentum, Support/Resistance),
    rule-based signal score (+3 BUY, -2..+2 WATCH, -3 SELL), risk classification, and DAA Maximum Subarray.
    """
    try:
        return await MarketAnalystService.evaluate_stock(symbol, range_str=range)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to evaluate market signal for {symbol}: {str(e)}")


@router.post("/evaluate")
async def evaluate_stock_post(req: EvaluateRequest):
    """
    POST endpoint for technical evaluation and rule-based signal computation.
    """
    try:
        return await MarketAnalystService.evaluate_stock(
            symbol=req.symbol, range_str=req.range, interval_str=req.interval
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to evaluate market signal for {req.symbol}: {str(e)}")


@router.post("/chat")
async def chat_with_analyst(req: ChatMessageRequest):
    """
    Processes interactive conversational inquiries with the AI Market Analyst chatbot.
    """
    try:
        return await MarketAnalystService.process_chat_message(
            message=req.message,
            current_symbol=req.current_symbol,
            conversation_history=req.conversation_history,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Market Analyst processing error: {str(e)}")


@router.get("/compare")
async def compare_stocks(
    symbol1: str = Query(default="RELIANCE", description="First stock symbol"),
    symbol2: str = Query(default="TCS", description="Second stock symbol"),
):
    """
    Side-by-side technical, signal, risk, and DAA comparative analysis for two Indian equities.
    """
    try:
        return await MarketAnalystService.compare_two_stocks(symbol1, symbol2)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to compare {symbol1} and {symbol2}: {str(e)}")


@router.get("/matrix")
async def get_multi_stock_live_matrix(
    symbols: Optional[str] = Query(None, description="Comma-separated stock symbols"),
    range: str = Query(default="1mo", description="Historical range: 1d, 5d, 1mo, 6mo, 1y"),
):
    """
    Computes real-time multi-stock comparison matrix with live prices, AI signals, scores,
    technical indicators, risk classification, and DAA Maximum Subarray profit windows concurrently.
    """
    import asyncio
    from backend.services.live_stock_service import DEFAULT_WATCHLIST

    if symbols:
        target_symbols = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    else:
        target_symbols = [
            "RELIANCE",
            "TCS",
            "HDFCBANK",
            "ICICIBANK",
            "INFY",
            "SBIN",
            "TATAMOTORS",
            "ITC",
            "BHARTIARTL",
            "MARUTI",
            "LT",
            "ZOMATO",
            "^NSEI",
        ]

    try:
        tasks = [MarketAnalystService.evaluate_stock(sym, range_str=range) for sym in target_symbols]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        valid_results = []
        for r in results:
            if isinstance(r, dict) and "symbol" in r:
                valid_results.append(r)

        return {
            "status": "success",
            "timeframe": range,
            "count": len(valid_results),
            "stocks": valid_results,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate live matrix: {str(e)}")

