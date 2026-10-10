"""
Unit and Integration Tests for AI Market Analyst Service and API.
Verifies technical indicator calculations, rule-based scoring (BUY, WATCH, SELL),
risk classification, DAA integration, and chatbot query processing.
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.market_analyst_service import (
    calculate_sma,
    calculate_rsi,
    calculate_volatility,
    calculate_momentum,
    calculate_support_resistance,
    MarketAnalystService,
)

client = TestClient(app)


def test_sma_calculation():
    prices = [10.0, 12.0, 14.0, 16.0, 18.0] * 5  # 25 items
    sma20 = calculate_sma(prices, 20)
    assert sma20 is not None
    assert sma20 > 0

    sma50 = calculate_sma(prices, 50)
    assert sma50 is None  # Insufficient data handled


def test_rsi_calculation():
    # Uptrend prices
    prices = [100.0 + i * 2.0 for i in range(25)]
    rsi = calculate_rsi(prices, 14)
    assert rsi is not None
    assert rsi > 70.0  # Strong uptrend leads to high RSI

    # Insufficient data
    assert calculate_rsi([100.0, 102.0], 14) is None


def test_volatility_and_risk_classification():
    prices = [100.0, 102.0, 101.0, 103.0, 102.5, 104.0, 103.0, 105.0] * 3
    daily_vol, ann_vol, risk_level, reason = calculate_volatility(prices)
    assert daily_vol is not None
    assert ann_vol is not None
    assert risk_level in ["LOW RISK", "MEDIUM RISK", "HIGH RISK"]


def test_momentum_and_support_resistance():
    prices = [100.0 + i for i in range(20)]
    mom = calculate_momentum(prices)
    assert mom["5d_pct"] is not None
    assert mom["trend"] in ["Bullish", "Bearish", "Consolidating"]

    support, resistance = calculate_support_resistance(prices)
    assert support == 100.0
    assert resistance == 119.0


@pytest.mark.anyio
async def test_evaluate_stock_service():
    res = await MarketAnalystService.evaluate_stock("RELIANCE")
    assert res["symbol"] == "RELIANCE"
    assert res["signal"] in ["🟢 POTENTIAL BUY SETUP", "🟡 HOLD / WATCH", "🔴 POTENTIAL SELL SETUP"]
    assert "score" in res
    assert "risk_level" in res
    assert "indicators" in res
    assert "disclaimer" in res


@pytest.mark.anyio
async def test_chat_analyst_service():
    # 1. Single stock analysis
    chat_res = await MarketAnalystService.process_chat_message("Analyze RELIANCE", current_symbol="RELIANCE")
    assert "reply" in chat_res
    assert "RELIANCE" in chat_res["reply"]

    # 2. Buy safety question
    chat_buy = await MarketAnalystService.process_chat_message("Should I buy TCS?", current_symbol="TCS")
    assert "analytical" in chat_buy["reply"].lower() or "signal" in chat_buy["reply"].lower()

    # 3. Comparison
    chat_comp = await MarketAnalystService.process_chat_message("Compare RELIANCE and TCS", current_symbol="RELIANCE")
    assert "RELIANCE" in chat_comp["reply"] and "TCS" in chat_comp["reply"]

    # 4. Top gainers
    chat_movers = await MarketAnalystService.process_chat_message("Who is the top gainer today?", current_symbol="RELIANCE")
    assert "Gainers" in chat_movers["reply"] or "Live" in chat_movers["reply"]


def test_api_analyst_endpoints():
    # Evaluate endpoint
    res_eval = client.get("/api/analyst/evaluate?symbol=TCS")
    assert res_eval.status_code == 200
    data = res_eval.json()
    assert data["symbol"] == "TCS"
    assert "signal" in data

    # Chat endpoint
    res_chat = client.post("/api/analyst/chat", json={"message": "What is the risk of RELIANCE?", "current_symbol": "RELIANCE"})
    assert res_chat.status_code == 200
    chat_data = res_chat.json()
    assert "reply" in chat_data

    # Compare endpoint
    res_comp = client.get("/api/analyst/compare?symbol1=RELIANCE&symbol2=INFY")
    assert res_comp.status_code == 200
    comp_data = res_comp.json()
    assert "stock_a" in comp_data and "stock_b" in comp_data
