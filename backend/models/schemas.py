"""
Pydantic Schemas and Models for Indian Stock Market DAA Analysis.
"""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class AlgorithmResult(BaseModel):
    max_sum: float = Field(..., description="Maximum subarray sum (maximum profit on delta array in ₹)")
    start_index: int = Field(..., description="Start index in daily change array")
    end_index: int = Field(..., description="End index in daily change array")
    algorithm: str = Field(..., description="Algorithm name")
    time_complexity: str = Field(..., description="Theoretical time complexity Big-O")
    space_complexity: str = Field(..., description="Theoretical space complexity Big-O")
    execution_time_ms: Optional[float] = Field(None, description="Empirical measured runtime in milliseconds")


class VerificationResult(BaseModel):
    is_consistent: bool = Field(..., description="True if all three algorithms produce equivalent maximum profits")
    message: str = Field(..., description="Verification diagnostics or match confirmation")


class ChartDataPoint(BaseModel):
    date: str
    close: float
    is_buy: bool = False
    is_sell: bool = False
    is_in_window: bool = False
    change: Optional[float] = None


class StockAnalysisResponse(BaseModel):
    stock: str
    symbol: str
    company_name: Optional[str] = None
    market: str = "NSE / Historical Dataset"
    currency: str = "INR (₹)"
    dataset_size: int
    trading_days: int
    date_range: Dict[str, str]
    buy_date: str
    sell_date: str
    buy_price: float
    sell_price: float
    buy_index: int
    sell_index: int
    maximum_profit: float
    profit_percentage: float
    all_negative: bool
    algorithms: Dict[str, AlgorithmResult]
    verification: VerificationResult
    chart_data: List[ChartDataPoint]
    is_temporary: bool = False
    temporary_label: Optional[str] = None


class StockMetadata(BaseModel):
    symbol: str
    name: str
    market: str = "NSE"
    currency: str = "INR (₹)"
    records: int
    start_date: str
    end_date: str
    columns: List[str]
    is_custom: bool = False
    is_temporary: bool = False
    temporary_label: Optional[str] = None


class BenchmarkRequest(BaseModel):
    sizes: List[int] = Field(default=[100, 500, 1000, 2000, 3000])
    iterations: int = Field(default=5, ge=1, le=20)
    max_brute_force_size: int = Field(default=3000, description="Safety limit for O(n^2) Brute Force execution")


class BenchmarkPoint(BaseModel):
    size: int
    brute_force_time_ms: Optional[float]
    kadane_time_ms: float
    divide_conquer_time_ms: float
    brute_force_skipped: bool = False
    reason: Optional[str] = None


class BenchmarkResponse(BaseModel):
    results: List[BenchmarkPoint]
    methodology: str
    disclaimer: str
