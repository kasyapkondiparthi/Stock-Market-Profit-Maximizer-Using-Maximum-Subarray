"""
Unit Tests for Stock Data Processor Service.
Tests:
- Valid CSV parsing
- Missing required headers
- Chronological sorting
- Invalid / non-numeric price filtering
- Missing dates & duplicate dates handling
- Insufficient rows edge case
- Delta P calculation
"""

import io
import pytest
import pandas as pd
from backend.services.stock_processor import StockDataProcessor


def test_valid_csv_processing():
    csv_content = """Date,Open,High,Low,Close,Volume
2024-01-05,180.0,185.0,179.0,184.0,500000
2024-01-02,170.0,175.0,169.0,172.0,600000
2024-01-03,172.0,178.0,171.0,175.0,700000
2024-01-04,175.0,182.0,174.0,180.0,800000
"""
    df = StockDataProcessor.load_and_validate(io.StringIO(csv_content))
    assert len(df) == 4
    # Verify chronological sort
    assert df["Date"].tolist() == [
        "2024-01-02",
        "2024-01-03",
        "2024-01-04",
        "2024-01-05",
    ]
    assert df["Close"].tolist() == [172.0, 175.0, 180.0, 184.0]

    dates, prices, changes = StockDataProcessor.extract_prices_and_changes(df)
    assert len(prices) == 4
    assert len(changes) == 3
    assert changes == [3.0, 5.0, 4.0]


def test_missing_mandatory_columns():
    csv_content = """Timestamp,Open,High,Low,Volume
2024-01-01,100,105,95,1000
2024-01-02,102,106,98,1200
"""
    with pytest.raises(ValueError, match="CSV missing mandatory columns"):
        StockDataProcessor.load_and_validate(io.StringIO(csv_content))


def test_invalid_dates_and_non_numeric_close():
    csv_content = """Date,Close
2024-01-01,100.0
invalid-date,105.0
2024-01-03,corrupted_price
2024-01-04,-50.0
2024-01-05,110.0
2024-01-05,112.0
"""
    df = StockDataProcessor.load_and_validate(io.StringIO(csv_content))
    # 'invalid-date', 'corrupted_price', '-50.0' are dropped. Duplicate '2024-01-05' drops second entry.
    assert len(df) == 2
    assert df["Date"].tolist() == ["2024-01-01", "2024-01-05"]
    assert df["Close"].tolist() == [100.0, 110.0]


def test_insufficient_records():
    csv_content = """Date,Close
2024-01-01,100.0
"""
    with pytest.raises(ValueError, match="insufficient valid trading days"):
        StockDataProcessor.load_and_validate(io.StringIO(csv_content))
