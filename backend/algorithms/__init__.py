"""
Algorithms Package for Maximum Subarray Analysis.
Contains pure, manual implementations of:
1. Brute Force O(n^2)
2. Kadane's Algorithm O(n)
3. Divide and Conquer O(n log n)
"""

from .brute_force import max_subarray_brute_force
from .kadane import max_subarray_kadane
from .divide_conquer import max_subarray_divide_conquer

__all__ = [
    "max_subarray_brute_force",
    "max_subarray_kadane",
    "max_subarray_divide_conquer",
]
