"""
FastAPI Application Entrypoint.
Stock Market Profit Maximizer Using Maximum Subarray for Indian Stock Market (DAA Academic Project).
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.analysis import router as analysis_router
from backend.api.stocks import router as stocks_router
from backend.api.upload import router as upload_router
from backend.api.benchmark import router as benchmark_router
from backend.api.live_stocks import router as live_stocks_router
from backend.api.analyst import router as analyst_router

app = FastAPI(
    title="Stock Market Profit Maximizer for Indian Stock Market (DAA Project)",
    description=(
        "Academic DAA system analyzing real historical Indian stock market (NSE) data "
        "using manual implementations of Brute Force O(n^2), Kadane's Algorithm O(n), "
        "and Divide & Conquer O(n log n)."
    ),
    version="2.0.0",
)

# Enable CORS for frontend local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(analysis_router)
app.include_router(stocks_router)
app.include_router(upload_router)
app.include_router(benchmark_router)
app.include_router(live_stocks_router)
app.include_router(analyst_router)


@app.get("/api/health", tags=["Health"])
def health_check():
    """Health check endpoint to verify backend status."""
    return {
        "status": "online",
        "service": "Indian Stock Market Profit Maximizer API",
        "market": "NSE / Indian Equities",
        "currency": "INR (₹)",
        "version": "2.0.0",
        "algorithms_available": ["Brute Force", "Kadane", "Divide & Conquer"],
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
