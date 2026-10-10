"""
Unit Tests for Maximum Subarray Algorithms.
Tests:
1. Brute Force
2. Kadane's Algorithm
3. Divide and Conquer
4. Equivalence and consistency across all three algorithms on synthetic and edge-case datasets.
"""

import math
import random
import pytest
from backend.algorithms.brute_force import max_subarray_brute_force
from backend.algorithms.kadane import max_subarray_kadane
from backend.algorithms.divide_conquer import max_subarray_divide_conquer


ALL_ALGORITHMS = [
    max_subarray_brute_force,
    max_subarray_kadane,
    max_subarray_divide_conquer,
]


@pytest.mark.parametrize("algo", ALL_ALGORITHMS)
def test_case_1_all_positive(algo):
    """Test 1: [1, 2, 3, 4] -> sum = 10, start = 0, end = 3"""
    arr = [1.0, 2.0, 3.0, 4.0]
    res = algo(arr)
    assert math.isclose(res["max_sum"], 10.0, abs_tol=1e-4)
    assert res["start_index"] == 0
    assert res["end_index"] == 3


@pytest.mark.parametrize("algo", ALL_ALGORITHMS)
def test_case_2_all_negative(algo):
    """Test 2: [-5, -2, -8, -1] -> sum = -1, start = 3, end = 3"""
    arr = [-5.0, -2.0, -8.0, -1.0]
    res = algo(arr)
    assert math.isclose(res["max_sum"], -1.0, abs_tol=1e-4)
    assert res["start_index"] == 3
    assert res["end_index"] == 3


@pytest.mark.parametrize("algo", ALL_ALGORITHMS)
def test_case_3_mixed_values_all_inclusive(algo):
    """Test 3: [5, -3, 8, -2, 7] -> sum = 15, start = 0, end = 4"""
    arr = [5.0, -3.0, 8.0, -2.0, 7.0]
    res = algo(arr)
    assert math.isclose(res["max_sum"], 15.0, abs_tol=1e-4)
    assert res["start_index"] == 0
    assert res["end_index"] == 4


@pytest.mark.parametrize("algo", ALL_ALGORITHMS)
def test_case_4_classic_mixed(algo):
    """Test 4: [-3, 5, -1, 2, -4, 6] -> sum = 8 ([5, -1, 2, -4, 6]), start = 1, end = 5"""
    arr = [-3.0, 5.0, -1.0, 2.0, -4.0, 6.0]
    res = algo(arr)
    assert math.isclose(res["max_sum"], 8.0, abs_tol=1e-4)
    assert res["start_index"] == 1
    assert res["end_index"] == 5


@pytest.mark.parametrize("algo", ALL_ALGORITHMS)
def test_case_5_single_element(algo):
    """Test 5: [10] -> sum = 10, start = 0, end = 0"""
    arr = [10.0]
    res = algo(arr)
    assert math.isclose(res["max_sum"], 10.0, abs_tol=1e-4)
    assert res["start_index"] == 0
    assert res["end_index"] == 0


@pytest.mark.parametrize("algo", ALL_ALGORITHMS)
def test_case_6_alternating_values(algo):
    """Test 6: [5, -5, 5, -5, 5] -> sum = 5"""
    arr = [5.0, -5.0, 5.0, -5.0, 5.0]
    res = algo(arr)
    assert math.isclose(res["max_sum"], 5.0, abs_tol=1e-4)


@pytest.mark.parametrize("algo", ALL_ALGORITHMS)
def test_empty_array(algo):
    """Test empty input"""
    arr = []
    res = algo(arr)
    assert math.isclose(res["max_sum"], 0.0, abs_tol=1e-4)
    assert res["start_index"] == -1
    assert res["end_index"] == -1


def test_equivalence_random_arrays():
    """Verify that Brute Force, Kadane, and Divide & Conquer produce identical max_sum on random arrays."""
    random.seed(42)
    for _ in range(25):
        size = random.randint(10, 200)
        arr = [round(random.uniform(-50.0, 50.0), 2) for _ in range(size)]

        res_bf = max_subarray_brute_force(arr)
        res_kd = max_subarray_kadane(arr)
        res_dc = max_subarray_divide_conquer(arr)

        assert math.isclose(
            res_bf["max_sum"], res_kd["max_sum"], abs_tol=1e-3
        ), f"Mismatch BF ({res_bf['max_sum']}) vs KD ({res_kd['max_sum']})"
        assert math.isclose(
            res_kd["max_sum"], res_dc["max_sum"], abs_tol=1e-3
        ), f"Mismatch KD ({res_kd['max_sum']}) vs DC ({res_dc['max_sum']})"
