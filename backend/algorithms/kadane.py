"""
Kadane's Maximum Subarray Algorithm (Dynamic Programming).

Theoretical Analysis:
- Time Complexity: O(n)
  A single linear pass over the input array of size n.
- Space Complexity: O(1) Auxiliary Space
  Only scalar accumulators and index pointers are maintained.
- DP Recurrence:
  M[i] = max(arr[i], M[i-1] + arr[i])
  where M[i] represents the maximum subarray sum ending at index i.
"""

from typing import Any, Dict, List


def max_subarray_kadane(arr: List[float]) -> Dict[str, Any]:
    """
    Finds the contiguous subarray within arr that has the largest sum using Kadane's Algorithm.

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
            "algorithm": "Kadane's Algorithm",
            "time_complexity": "O(n)",
            "space_complexity": "O(1)",
        }

    max_so_far = -float("inf")
    current_max = 0.0
    start = 0
    best_start = 0
    best_end = 0

    for i in range(len(arr)):
        val = arr[i]
        if current_max + val < val:
            current_max = val
            start = i
        else:
            current_max += val

        if current_max > max_so_far:
            max_so_far = current_max
            best_start = start
            best_end = i

    return {
        "max_sum": round(float(max_so_far), 4),
        "start_index": best_start,
        "end_index": best_end,
        "algorithm": "Kadane's Algorithm",
        "time_complexity": "O(n)",
        "space_complexity": "O(1)",
    }
