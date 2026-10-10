"""
Divide and Conquer Maximum Subarray Algorithm.

Theoretical Analysis:
- Time Complexity: O(n log n)
  Recurrence relation: T(n) = 2T(n/2) + Theta(n)
  By Master Theorem Case 2: a = 2, b = 2, f(n) = Theta(n) = Theta(n^(log_b a))
  Therefore, T(n) = Theta(n log n).
- Space Complexity: O(log n) Call Stack Space for recursion depth.
"""

from typing import Any, Dict, List, Tuple


def _max_crossing_subarray(
    arr: List[float], low: int, mid: int, high: int
) -> Tuple[float, int, int]:
    """
    Finds the maximum subarray that crosses the midpoint 'mid'.
    Linear time Theta(n) search on arr[low..mid] and arr[mid+1..high].
    """
    # 1. Search maximum suffix in left half arr[low..mid]
    left_sum = -float("inf")
    curr_sum = 0.0
    max_left = mid
    for i in range(mid, low - 1, -1):
        curr_sum += arr[i]
        if curr_sum > left_sum:
            left_sum = curr_sum
            max_left = i

    # 2. Search maximum prefix in right half arr[mid+1..high]
    right_sum = -float("inf")
    curr_sum = 0.0
    max_right = mid + 1
    for j in range(mid + 1, high + 1):
        curr_sum += arr[j]
        if curr_sum > right_sum:
            right_sum = curr_sum
            max_right = j

    return (left_sum + right_sum, max_left, max_right)


def _divide_conquer_helper(
    arr: List[float], low: int, high: int
) -> Tuple[float, int, int]:
    """
    Recursive core for Divide and Conquer Maximum Subarray.
    """
    # Base case: only one element
    if low == high:
        return (arr[low], low, low)

    mid = (low + high) // 2

    # Recursive subproblems
    left_sum, l_low, l_high = _divide_conquer_helper(arr, low, mid)
    right_sum, r_low, r_high = _divide_conquer_helper(arr, mid + 1, high)
    cross_sum, c_low, c_high = _max_crossing_subarray(arr, low, mid, high)

    # Combine step: choose the maximal segment
    if left_sum >= right_sum and left_sum >= cross_sum:
        return (left_sum, l_low, l_high)
    elif right_sum >= left_sum and right_sum >= cross_sum:
        return (right_sum, r_low, r_high)
    else:
        return (cross_sum, c_low, c_high)


def max_subarray_divide_conquer(arr: List[float]) -> Dict[str, Any]:
    """
    Finds the contiguous subarray within arr that has the largest sum using Divide and Conquer.

    Parameters:
        arr: List of numerical consecutive daily price differences.

    Returns:
        Dict containing max_sum, start_index, end_index, and complexity metadata.
    """
    if not arr:
        return {
            "max_sum": 0.0,
            "start_index": -1,
            "end_index": -1,
            "algorithm": "Divide and Conquer",
            "time_complexity": "O(n log n)",
            "space_complexity": "O(log n)",
        }

    max_sum, start_idx, end_idx = _divide_conquer_helper(arr, 0, len(arr) - 1)

    return {
        "max_sum": round(float(max_sum), 4),
        "start_index": start_idx,
        "end_index": end_idx,
        "algorithm": "Divide and Conquer",
        "time_complexity": "O(n log n)",
        "space_complexity": "O(log n)",
    }
