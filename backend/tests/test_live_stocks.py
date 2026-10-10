"""
Unit and Integration Tests for Live Indian Stock Market API and Service.
Tests live search, quote retrieval, watchlist generation, and real-time DAA algorithmic analysis.
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.live_stock_service import (
    LiveStockService,
    determine_ticker_and_exchange,
    NSE_SYMBOLS_CACHE,
)

client = TestClient(app)


def test_determine_ticker_and_exchange():
    sym, suffix, ex = determine_ticker_and_exchange("RELIANCE")
    assert sym == "RELIANCE"
    assert suffix == ".NS"
    assert ex == "NSE"

    sym, suffix, ex = determine_ticker_and_exchange("TCS.BO")
    assert sym == "TCS"
    assert suffix == ".BO"
    assert ex == "BSE"

    sym, suffix, ex = determine_ticker_and_exchange("^NSEI")
    assert sym == "^NSEI"
    assert ex == "INDEX"


def test_search_in_cache():
    results = LiveStockService.search_in_cache("reliance")
    assert len(results) > 0
    assert any(r["symbol"] == "RELIANCE" for r in results)

    results = LiveStockService.search_in_cache("tcs")
    assert len(results) > 0
    assert any(r["symbol"] == "TCS" for r in results)


def test_api_cached_symbols():
    response = client.get("/api/live/symbols")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["total"] > 10
    symbols = [s["symbol"] for s in data["symbols"]]
    assert "RELIANCE" in symbols
    assert "TCS" in symbols


def test_api_live_search():
    response = client.get("/api/live/search?q=Tata")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert len(data["results"]) > 0


@pytest.mark.anyio
async def test_live_quote_retrieval():
    quote = await LiveStockService.get_stock_quote("RELIANCE")
    assert quote["symbol"] == "RELIANCE"
    assert quote["exchange"] in ["NSE", "BSE"]
    assert quote["currency"] in ["INR", "INR (₹)"]
    if quote["last_price"] is not None:
        assert quote["last_price"] > 0


@pytest.mark.anyio
async def test_live_daa_analysis():
    # Run analysis for RELIANCE over 1 month
    res = await LiveStockService.analyze_live_stock("RELIANCE", range_str="1mo", interval_str="1d")
    assert res.symbol == "RELIANCE"
    assert res.dataset_size >= 2
    assert "kadane" in res.algorithms
    assert "divide_conquer" in res.algorithms
    assert "brute_force" in res.algorithms
    assert res.verification.is_consistent is True
    assert len(res.chart_data) == res.dataset_size


def test_api_live_analyze_endpoint():
    response = client.get("/api/live/analyze?symbol=TCS&range=1mo&interval=1d")
    assert response.status_code == 200
    data = response.json()
    assert data["symbol"] == "TCS"
    assert "algorithms" in data
    assert "kadane" in data["algorithms"]
    assert data["maximum_profit"] >= 0 or data["all_negative"] is True
