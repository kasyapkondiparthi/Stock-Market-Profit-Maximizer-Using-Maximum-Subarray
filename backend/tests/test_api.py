"""
Integration Tests for FastAPI Endpoints (Indian Stock Market).
Verifies permanent stocks, temporary dataset upload, NIFTY 50 demo ingestion,
saving temporary datasets to permanent collection, duplicate handling, and clearing.
"""

import os
import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

DATA_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data"
)


def test_health_check_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["currency"] == "INR (₹)"
    assert "Divide & Conquer" in data["algorithms_available"]


def test_get_available_indian_stocks():
    response = client.get("/api/stocks")
    assert response.status_code == 200
    stocks = response.json()
    assert isinstance(stocks, list)
    assert len(stocks) >= 5
    symbols = [s["symbol"] for s in stocks]
    for core in ["RELIANCE", "HDFCBANK", "ICICIBANK", "SBIN", "TCS"]:
        assert core in symbols


def test_analyze_reliance_post_endpoint():
    response = client.post("/api/analyze", json={"symbol": "RELIANCE"})
    assert response.status_code == 200
    data = response.json()
    assert data["symbol"] == "RELIANCE"
    assert data["currency"] == "INR (₹)"
    assert data["dataset_size"] > 0
    assert "algorithms" in data
    assert "brute_force" in data["algorithms"]
    assert "kadane" in data["algorithms"]
    assert "divide_conquer" in data["algorithms"]
    assert data["verification"]["is_consistent"] is True
    assert data["maximum_profit"] > 0
    assert len(data["chart_data"]) == data["dataset_size"]
    assert data["is_temporary"] is False


def test_analyze_tcs_get_endpoint():
    response = client.get("/api/analyze/TCS")
    assert response.status_code == 200
    data = response.json()
    assert data["symbol"] == "TCS"
    assert data["currency"] == "INR (₹)"
    assert data["verification"]["is_consistent"] is True
    assert data["is_temporary"] is False


def test_analyze_all_indian_stocks_summary():
    response = client.get("/api/analyze-all/summary")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 5
    symbols = [s["symbol"] for s in data]
    for core in ["RELIANCE", "HDFCBANK", "ICICIBANK", "SBIN", "TCS"]:
        assert core in symbols


def test_upload_and_analyze_custom_indian_csv():
    csv_bytes = b"""Date,Close
2024-01-01,1500.0
2024-01-02,1550.0
2024-01-03,1520.0
2024-01-04,1680.0
2024-01-05,1620.0
"""
    files = {"file": ("TEST_CUSTOM_STOCK.csv", csv_bytes, "text/csv")}
    upload_res = client.post("/api/upload", files=files)
    assert upload_res.status_code == 200
    upload_data = upload_res.json()
    assert upload_data["symbol"] == "TEST_CUSTOM_STOCK"
    assert upload_data["records"] == 5
    assert upload_data["is_temporary"] is True

    # Analyze uploaded stock
    analysis_res = client.get("/api/analyze/TEST_CUSTOM_STOCK")
    assert analysis_res.status_code == 200
    res = analysis_res.json()
    assert res["maximum_profit"] == 180.0  # Buy at 1500 on Day 1, Sell at 1680 on Day 4 -> Profit ₹180
    assert res["buy_date"] == "2024-01-01"
    assert res["sell_date"] == "2024-01-04"
    assert res["verification"]["is_consistent"] is True
    assert res["is_temporary"] is True

    # Clear uploaded data
    clear_res = client.post("/api/upload/clear")
    assert clear_res.status_code == 200
    assert clear_res.json()["status"] == "cleared"

    # Verify stock not found after clearing
    analysis_after_clear = client.get("/api/analyze/TEST_CUSTOM_STOCK")
    assert analysis_after_clear.status_code == 404


def test_demo_nifty50_load_save_and_persistence():
    # 1. Load demonstration NIFTY 50 (temporary)
    demo_res = client.post("/api/upload/load-demo-nifty50")
    assert demo_res.status_code == 200
    meta = demo_res.json()
    assert meta["symbol"] == "NIFTY50"
    assert meta["is_temporary"] is True
    assert meta["records"] == 247

    # 2. Analyze NIFTY 50
    analysis_res = client.get("/api/analyze/NIFTY50")
    assert analysis_res.status_code == 200
    data = analysis_res.json()
    assert data["maximum_profit"] == 2442.9
    assert data["buy_date"] == "2026-03-30"
    assert data["sell_date"] == "2026-08-03"
    assert data["is_temporary"] is True

    # 3. Save NIFTY 50 permanently
    save_res = client.post(
        "/api/upload/save",
        json={"symbol": "NIFTY50", "name": "NIFTY 50 Index (Permanent)", "overwrite": True},
    )
    assert save_res.status_code == 200
    saved_meta = save_res.json()
    assert saved_meta["symbol"] == "NIFTY50"
    assert saved_meta["is_temporary"] is False

    # 4. Verify NIFTY 50 now appears in permanent stocks list
    stocks_res = client.get("/api/stocks")
    assert stocks_res.status_code == 200
    stock_symbols = [s["symbol"] for s in stocks_res.json()]
    assert "NIFTY50" in stock_symbols

    # 5. Verify NIFTY 50 appears in multi-stock summary
    summary_res = client.get("/api/analyze-all/summary")
    assert summary_res.status_code == 200
    summary_symbols = [s["symbol"] for s in summary_res.json()]
    assert "NIFTY50" in summary_symbols

    # 6. Verify analysis is now marked permanent (not temporary)
    perm_analysis = client.get("/api/analyze/NIFTY50")
    assert perm_analysis.status_code == 200
    assert perm_analysis.json()["is_temporary"] is False

    # 7. Clearing temporary uploads does NOT delete permanent NIFTY50
    clear_res = client.post("/api/upload/clear")
    assert clear_res.status_code == 200

    stocks_after_clear = client.get("/api/stocks")
    assert "NIFTY50" in [s["symbol"] for s in stocks_after_clear.json()]

    # Clean up test saved file from data/ for test isolation
    nifty_perm_file = os.path.join(DATA_DIR, "NIFTY50.csv")
    if os.path.exists(nifty_perm_file):
        os.remove(nifty_perm_file)


def test_duplicate_dataset_handling():
    # 1. Upload a dataset named RELIANCE (duplicate of permanent stock)
    csv_bytes = b"""Date,Close\n2024-01-01,2500.0\n2024-01-02,2550.0\n"""
    files = {"file": ("RELIANCE.csv", csv_bytes, "text/csv")}
    upload_res = client.post("/api/upload", files=files)
    assert upload_res.status_code == 200

    # 2. Attempt to save without overwrite -> 409 Conflict
    save_conflict_res = client.post(
        "/api/upload/save",
        json={"symbol": "RELIANCE", "overwrite": False},
    )
    assert save_conflict_res.status_code == 409
    assert "already exists" in save_conflict_res.json()["detail"]

    # 3. Save with unique target symbol RELIANCE_NEW
    save_new_res = client.post(
        "/api/upload/save",
        json={"symbol": "RELIANCE", "target_symbol": "RELIANCE_NEW", "overwrite": False},
    )
    assert save_new_res.status_code == 200
    assert save_new_res.json()["symbol"] == "RELIANCE_NEW"

    # Clean up created file
    rel_new_file = os.path.join(DATA_DIR, "RELIANCE_NEW.csv")
    if os.path.exists(rel_new_file):
        os.remove(rel_new_file)


def test_benchmark_endpoint():
    req_body = {
        "sizes": [50, 100, 200],
        "iterations": 2,
        "max_brute_force_size": 300,
    }
    response = client.post("/api/benchmark", json=req_body)
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert len(data["results"]) == 3
    assert data["results"][0]["size"] == 50
    assert data["results"][0]["kadane_time_ms"] >= 0
