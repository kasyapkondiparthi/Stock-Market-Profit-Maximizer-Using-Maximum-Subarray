"""
Empirical Performance Benchmark Endpoint.
"""

from fastapi import APIRouter
from backend.models.schemas import BenchmarkRequest, BenchmarkResponse
from backend.services.benchmark_runner import BenchmarkRunner

router = APIRouter(prefix="/api/benchmark", tags=["Benchmark"])


@router.post("", response_model=BenchmarkResponse)
def execute_benchmark(req: BenchmarkRequest):
    """
    Runs empirical execution time comparisons across Brute Force, Kadane,
    and Divide & Conquer algorithms across specified dataset sizes.
    """
    return BenchmarkRunner.run_benchmark(
        sizes=req.sizes,
        iterations=req.iterations,
        max_brute_force_size=req.max_brute_force_size,
    )


@router.get("/quick", response_model=BenchmarkResponse)
def execute_quick_benchmark():
    """
    Runs a fast default benchmark suite for immediate UI rendering.
    """
    return BenchmarkRunner.run_benchmark(
        sizes=[100, 500, 1000, 2000, 3000, 5000, 10000],
        iterations=3,
        max_brute_force_size=2500,
    )
