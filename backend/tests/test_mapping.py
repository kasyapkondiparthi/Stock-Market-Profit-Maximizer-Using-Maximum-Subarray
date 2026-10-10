"""
Unit Tests for Buy/Sell Index and Price Mapping.
CRITICAL DAA VERIFICATION:
Given prices P = [p_0, p_1, ..., p_{n-1}]
and Delta P = [p_1 - p_0, ..., p_{n-1} - p_{n-2}]
If maximum subarray on Delta P is [L, R]:
- Buy Day = L, Buy Price = P[L]
- Sell Day = R + 1, Sell Price = P[R + 1]
- Maximum Profit = P[R + 1] - P[L] == max_sum == sum(Delta P[L..R])
"""

import math
from backend.algorithms.brute_force import max_subarray_brute_force
from backend.algorithms.kadane import max_subarray_kadane
from backend.algorithms.divide_conquer import max_subarray_divide_conquer
from backend.services.result_mapper import StockResultMapper


def test_example_stock_mapping_walkthrough():
    """
    Example from Project Specification:
    Days:   1    2    3    4    5
    Close: 100  105  102  110  115
    Dates: D1   D2   D3   D4   D5
    Delta: [5,  -3,   8,   5]
    Max subarray: entire array [5, -3, 8, 5] -> sum = 15
    L = 0, R = 3
    Buy index = 0 (Day 1, Price $100)
    Sell index = 3 + 1 = 4 (Day 5, Price $115)
    Profit = 115 - 100 = $15 == 15
    """
    dates = ["2024-01-01", "2024-01-02", "2024-01-03", "2024-01-04", "2024-01-05"]
    prices = [100.0, 105.0, 102.0, 110.0, 115.0]
    changes = [5.0, -3.0, 8.0, 5.0]

    res_bf = max_subarray_brute_force(changes)
    res_kd = max_subarray_kadane(changes)
    res_dc = max_subarray_divide_conquer(changes)

    algo_results = {
        "brute_force": res_bf,
        "kadane": res_kd,
        "divide_conquer": res_dc,
    }

    response = StockResultMapper.build_analysis_response(
        symbol="TEST",
        company_name="Test Corp",
        dates=dates,
        prices=prices,
        changes=changes,
        algo_results=algo_results,
    )

    assert response.verification.is_consistent is True
    assert response.buy_index == 0
    assert response.sell_index == 4
    assert response.buy_date == "2024-01-01"
    assert response.sell_date == "2024-01-05"
    assert math.isclose(response.buy_price, 100.0, abs_tol=1e-2)
    assert math.isclose(response.sell_price, 115.0, abs_tol=1e-2)
    assert math.isclose(response.maximum_profit, 15.0, abs_tol=1e-2)
    assert math.isclose(response.profit_percentage, 15.0, abs_tol=1e-2)


def test_internal_dip_mapping():
    """
    Prices: [100, 90, 85, 120, 115]
    Delta:  [-10, -5, +35, -5]
    Max subarray on Delta is [+35] at index 2 (L=2, R=2)
    Buy index: L = 2 -> Price 85
    Sell index: R+1 = 3 -> Price 120
    Profit: 120 - 85 = 35 == max_sum 35
    """
    dates = ["2024-01-01", "2024-01-02", "2024-01-03", "2024-01-04", "2024-01-05"]
    prices = [100.0, 90.0, 85.0, 120.0, 115.0]
    changes = [-10.0, -5.0, 35.0, -5.0]

    algo_results = {
        "brute_force": max_subarray_brute_force(changes),
        "kadane": max_subarray_kadane(changes),
        "divide_conquer": max_subarray_divide_conquer(changes),
    }

    response = StockResultMapper.build_analysis_response(
        symbol="DIP_TEST",
        company_name="Dip Stock",
        dates=dates,
        prices=prices,
        changes=changes,
        algo_results=algo_results,
    )

    assert response.verification.is_consistent is True
    assert response.buy_index == 2
    assert response.sell_index == 3
    assert response.buy_price == 85.0
    assert response.sell_price == 120.0
    assert response.maximum_profit == 35.0
