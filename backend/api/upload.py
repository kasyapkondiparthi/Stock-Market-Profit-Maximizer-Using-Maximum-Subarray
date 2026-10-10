"""
CSV Dataset Upload & Permanent Save Endpoint.
Allows users to upload custom historical stock CSV files as TEMPORARY datasets,
and provides explicit Save Data action to permanently persist them to data/.
"""

import io
import os
import re
import shutil
from typing import Optional
from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel
from backend.models.schemas import StockMetadata
from backend.services.stock_processor import StockDataProcessor
from backend.api.stocks import PRESET_NAMES, CORE_PERMANENT_SYMBOLS

router = APIRouter(prefix="/api/upload", tags=["Upload"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
TEMP_DIR = os.path.join(BASE_DIR, "temp_uploads")
DEMO_DIR = os.path.join(BASE_DIR, "demo_datasets")
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10MB


def get_temp_dir() -> str:
    os.makedirs(TEMP_DIR, exist_ok=True)
    return TEMP_DIR


class SaveDatasetRequest(BaseModel):
    symbol: str
    target_symbol: Optional[str] = None
    name: Optional[str] = None
    overwrite: bool = False


@router.post("", response_model=StockMetadata)
async def upload_stock_csv(file: UploadFile = File(...)):
    """
    Validates and temporarily stores an uploaded historical stock CSV file.
    """
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Invalid file format. Please upload a standard CSV file with .csv extension.",
        )

    # Sanitize symbol from filename
    raw_name = file.filename.rsplit(".", 1)[0]
    symbol = re.sub(r"[^A-Za-z0-9_-]", "", raw_name).upper()
    if not symbol:
        symbol = "CUSTOM_STOCK"

    # Read content with size guard
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum supported CSV size is {MAX_FILE_SIZE_BYTES // (1024*1024)}MB.",
        )

    try:
        buffer = io.BytesIO(contents)
        df = StockDataProcessor.load_and_validate(buffer)
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Failed to process CSV: {str(e)}"
        )

    temp_dir = get_temp_dir()
    destination_path = os.path.join(temp_dir, f"{symbol}.csv")

    df.to_csv(destination_path, index=False)
    dates = df["Date"].tolist()

    is_nifty = "NIFTY" in symbol
    temp_label = (
        "NIFTY 50 — Temporary Demonstration Dataset"
        if is_nifty
        else f"{symbol} — Temporary Uploaded Dataset"
    )

    return StockMetadata(
        symbol=symbol,
        name=temp_label,
        market="NSE / Uploaded Demo",
        currency="INR (₹)",
        records=len(df),
        start_date=dates[0],
        end_date=dates[-1],
        columns=list(df.columns),
        is_custom=True,
        is_temporary=True,
        temporary_label=temp_label,
    )


@router.post("/load-demo-nifty50", response_model=StockMetadata)
def load_demo_nifty50():
    """
    Quick helper for faculty demonstration: loads the authentic NIFTY 50 CSV as a temporary uploaded dataset.
    """
    demo_file = os.path.join(DEMO_DIR, "NIFTY 50-05-10-2025-to-05-10-2026.csv")
    if not os.path.exists(demo_file):
        demo_file = os.path.join(DEMO_DIR, "NIFTY50.csv")

    if not os.path.exists(demo_file):
        raise HTTPException(
            status_code=404,
            detail="NIFTY 50 demonstration dataset not found in demo_datasets repository.",
        )

    df = StockDataProcessor.load_and_validate(demo_file)
    temp_dir = get_temp_dir()
    destination_path = os.path.join(temp_dir, "NIFTY50.csv")
    df.to_csv(destination_path, index=False)

    dates = df["Date"].tolist()
    temp_label = "NIFTY 50 — Temporary Demonstration Dataset"

    return StockMetadata(
        symbol="NIFTY50",
        name=temp_label,
        market="NSE / Temporary Demo",
        currency="INR (₹)",
        records=len(df),
        start_date=dates[0],
        end_date=dates[-1],
        columns=list(df.columns),
        is_custom=True,
        is_temporary=True,
        temporary_label=temp_label,
    )


@router.post("/save", response_model=StockMetadata)
def save_temporary_dataset_permanently(req: SaveDatasetRequest):
    """
    Converts a temporary uploaded dataset into a permanent dataset in data/.
    Checks for duplicates and supports saving as a new unique dataset.
    """
    temp_dir = get_temp_dir()
    source_symbol = req.symbol.strip().upper()
    temp_file = os.path.join(temp_dir, f"{source_symbol}.csv")

    if not os.path.exists(temp_file):
        raise HTTPException(
            status_code=404,
            detail=f"Temporary dataset '{source_symbol}' not found in temporary uploads.",
        )

    # Determine target symbol
    target_sym = (req.target_symbol or source_symbol).strip().upper()
    target_sym = re.sub(r"[^A-Za-z0-9_-]", "", target_sym)
    if not target_sym:
        target_sym = source_symbol

    os.makedirs(DATA_DIR, exist_ok=True)
    permanent_file = os.path.join(DATA_DIR, f"{target_sym}.csv")

    # Duplicate check
    if os.path.exists(permanent_file) and not req.overwrite:
        # Find next available suggested symbol
        idx = 1
        suggested = f"{target_sym}_{idx}"
        while os.path.exists(os.path.join(DATA_DIR, f"{suggested}.csv")):
            idx += 1
            suggested = f"{target_sym}_{idx}"

        raise HTTPException(
            status_code=409,
            detail=f"Dataset '{target_sym}' already exists in permanent collection. Use '{suggested}' or confirm overwrite.",
        )

    # Validate and copy to permanent storage
    try:
        df = StockDataProcessor.load_and_validate(temp_file)
        df.to_csv(permanent_file, index=False)
        # Remove from temporary uploads
        if os.path.exists(temp_file):
            os.remove(temp_file)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to permanently save dataset: {str(e)}",
        )

    dates = df["Date"].tolist()
    name = (
        req.name
        or PRESET_NAMES.get(target_sym, f"{target_sym} (Saved Asset)")
    )

    return StockMetadata(
        symbol=target_sym,
        name=name,
        market="NSE / Permanent Collection",
        currency="INR (₹)",
        records=len(df),
        start_date=dates[0],
        end_date=dates[-1],
        columns=list(df.columns),
        is_custom=target_sym not in CORE_PERMANENT_SYMBOLS,
        is_temporary=False,
        temporary_label=None,
    )


@router.post("/clear")
def clear_all_temporary_uploads():
    """
    Deletes all temporary uploaded datasets from temporary storage.
    Does NOT delete permanent saved datasets in data/.
    """
    if os.path.exists(TEMP_DIR):
        try:
            for f in os.listdir(TEMP_DIR):
                f_path = os.path.join(TEMP_DIR, f)
                if os.path.isfile(f_path):
                    os.remove(f_path)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to clear temporary upload directory: {str(e)}",
            )

    return {
        "status": "cleared",
        "message": "All temporary uploaded datasets deleted successfully.",
    }


@router.delete("/{symbol}")
def delete_temporary_stock(symbol: str):
    """
    Deletes a specific temporary stock dataset.
    """
    symbol_clean = symbol.strip().upper()
    temp_dir = get_temp_dir()
    file_path = os.path.join(temp_dir, f"{symbol_clean}.csv")

    if os.path.exists(file_path):
        os.remove(file_path)
        return {
            "status": "deleted",
            "symbol": symbol_clean,
            "message": f"Temporary dataset '{symbol_clean}' removed.",
        }

    return {
        "status": "not_found",
        "symbol": symbol_clean,
        "message": f"Temporary dataset '{symbol_clean}' was not active.",
    }
