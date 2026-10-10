"""
Brute Force Maximum Subarray Algorithm.

Theoretical Analysis:
- Time Complexity: O(n^2)
  We iterate through all possible start positions i from 0 to n-1, and for each start,
  we iterate through all possible end positions j from i to n-1, maintaining a running sum.
  Total operations = n + (n-1) + ... + 1 = n(n+1)/2 = O(n^2).
- Space Complexity: O(1) Auxiliary Space
  Only scalar variables are used to track indices and running sums.
"""

from typing import Any, Dict, List


def max_subarray_brute_force(arr: List[float]) -> Dict[str, Any]:
    """
    Finds the contiguous subarray within arr that has the largest sum using Brute Force.

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
            "algorithm": "Brute Force",
            "time_complexity": "O(n^2)",
            "space_complexity": "O(1)",
        }

    n = len(arr)
    max_sum = -float("inf")
    best_start = 0
    best_end = 0

    for i in range(n):
        current_sum = 0.0
        for j in range(i, n):
            current_sum += arr[j]
            if current_sum > max_sum:
                max_sum = current_sum
                best_start = i
                best_end = j

    return {
        "max_sum": round(float(max_sum), 4),
        "start_index": best_start,
        "end_index": best_end,
        "algorithm": "Brute Force",
        "time_complexity": "O(n^2)",
        "space_complexity": "O(1)",
    }
