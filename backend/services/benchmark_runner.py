"""
Empirical Benchmark Runner Service.
Executes high-resolution timing comparisons between Brute Force, Kadane,
and Divide & Conquer algorithms across various array sizes.
"""

import random
import time
from typing import List, Optional
from backend.algorithms.brute_force import max_subarray_brute_force
from backend.algorithms.kadane import max_subarray_kadane
from backend.algorithms.divide_conquer import max_subarray_divide_conquer
from backend.models.schemas import BenchmarkPoint, BenchmarkResponse


class BenchmarkRunner:
    """Executes controlled empirical runtime measurements."""

    @classmethod
    def run_benchmark(
        cls,
        sizes: Optional[List[int]] = None,
        iterations: int = 5,
        max_brute_force_size: int = 3000,
    ) -> BenchmarkResponse:
        """
        Runs empirical benchmarks for specified input sizes.
        """
        if sizes is None:
            sizes = [100, 500, 1000, 2000, 3000, 5000, 10000]

        # Sort sizes
        sizes = sorted(list(set(sizes)))
        results: List[BenchmarkPoint] = []

        # Deterministic seed for reproducible benchmarking arrays
        rng = random.Random(1337)

        for size in sizes:
            # Generate representative array of daily changes
            arr = [round(rng.uniform(-10.0, 10.0), 2) for _ in range(size)]

            # 1. Kadane's Algorithm O(n)
            kd_times = []
            for _ in range(iterations):
                t0 = time.perf_counter_ns()
                max_subarray_kadane(arr)
                t1 = time.perf_counter_ns()
                kd_times.append((t1 - t0) / 1_000_000.0)  # ms
            kd_median = round(sorted(kd_times)[len(kd_times) // 2], 5)

            # 2. Divide and Conquer O(n log n)
            dc_times = []
            for _ in range(iterations):
                t0 = time.perf_counter_ns()
                max_subarray_divide_conquer(arr)
                t1 = time.perf_counter_ns()
                dc_times.append((t1 - t0) / 1_000_000.0)  # ms
            dc_median = round(sorted(dc_times)[len(dc_times) // 2], 5)

            # 3. Brute Force O(n^2) with safety ceiling
            if size <= max_brute_force_size:
                bf_times = []
                # For larger N within limit, reduce iterations to keep response snappy
                bf_iters = min(iterations, 3) if size > 1500 else iterations
                for _ in range(bf_iters):
                    t0 = time.perf_counter_ns()
                    max_subarray_brute_force(arr)
                    t1 = time.perf_counter_ns()
                    bf_times.append((t1 - t0) / 1_000_000.0)  # ms
                bf_median = round(sorted(bf_times)[len(bf_times) // 2], 5)
                bf_skipped = False
                reason = None
            else:
                bf_median = None
                bf_skipped = True
                reason = f"O(n^2) Brute Force safely bypassed for N={size} > {max_brute_force_size} to avoid quadratic CPU blocking."

            results.append(
                BenchmarkPoint(
                    size=size,
                    brute_force_time_ms=bf_median,
                    kadane_time_ms=kd_median,
                    divide_conquer_time_ms=dc_median,
                    brute_force_skipped=bf_skipped,
                    reason=reason,
                )
            )

        methodology = (
            f"Measured via Python time.perf_counter_ns() over {iterations} iterations per size. "
            f"Median execution times reported in milliseconds (ms). "
            f"Safety cutoff for Brute Force O(n^2) set at N={max_brute_force_size}."
        )

        disclaimer = (
            "Empirical runtimes reflect physical CPU execution, interpreter overhead, and memory hierarchy. "
            "While theoretical Big-O represents asymptotic bounds, actual millisecond measurements demonstrate "
            "the dramatic real-world performance divergence between O(n), O(n log n), and O(n^2)."
        )

        return BenchmarkResponse(
            results=results, methodology=methodology, disclaimer=disclaimer
        )
