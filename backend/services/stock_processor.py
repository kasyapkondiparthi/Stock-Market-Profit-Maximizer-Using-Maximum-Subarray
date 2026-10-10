"""
Stock Data Processor Service.
Handles CSV validation, chronological ordering, cleaning, missing data handling,
and extraction of consecutive daily price changes (Delta P).
"""

import io
from typing import Dict, List, Tuple, Union
import pandas as pd


class StockDataProcessor:
    """Processes historical stock price CSV datasets for Maximum Subarray analysis."""

    REQUIRED_COLUMNS = ["Date", "Close"]

    @classmethod
    def load_and_validate(
        cls, file_or_path: Union[str, io.BytesIO, io.StringIO]
    ) -> pd.DataFrame:
        """
        Reads CSV, verifies required headers, cleans invalid data, sorts chronologically.

        Parameters:
            file_or_path: Filepath or file-like buffer.

        Returns:
            Cleaned, sorted pandas DataFrame.
        """
        try:
            df = pd.read_csv(file_or_path)
        except Exception as e:
            raise ValueError(f"Failed to parse CSV file: {str(e)}")

        # Normalize column names: strip whitespace, title case
        col_map = {col: col.strip() for col in df.columns}
        df.rename(columns=col_map, inplace=True)

        # Standardize matching for Date and Close if case-different
        normalized_cols = {c.lower(): c for c in df.columns}
        if "date" not in normalized_cols or "close" not in normalized_cols:
            raise ValueError(
                f"CSV missing mandatory columns: 'Date' and 'Close'. Found columns: {list(df.columns)}"
            )

        date_col = normalized_cols["date"]
        close_col = normalized_cols["close"]

        df.rename(columns={date_col: "Date", close_col: "Close"}, inplace=True)

        # 1. Parse Date column
        df["Date"] = pd.to_datetime(df["Date"], errors="coerce", format="mixed")
        df.dropna(subset=["Date"], inplace=True)

        # 2. Parse Close column as float
        df["Close"] = pd.to_numeric(df["Close"], errors="coerce")
        df.dropna(subset=["Close"], inplace=True)

        # 3. Filter positive closing prices
        df = df[df["Close"] > 0]

        # 4. Sort chronologically
        df.sort_values(by="Date", ascending=True, inplace=True)

        # 5. Drop duplicate dates (keep first entry)
        df.drop_duplicates(subset=["Date"], keep="first", inplace=True)

        # Format date back to ISO string
        df["Date"] = df["Date"].dt.strftime("%Y-%m-%d")
        df.reset_index(drop=True, inplace=True)

        if len(df) < 2:
            raise ValueError(
                f"Dataset contains insufficient valid trading days ({len(df)} records). At least 2 days are required."
            )

        return df

    @classmethod
    def extract_prices_and_changes(
        cls, df: pd.DataFrame
    ) -> Tuple[List[str], List[float], List[float]]:
        """
        Extracts dates, closing prices, and consecutive daily differences (Delta P).

        Formula:
            Delta P[k] = Close[k+1] - Close[k]

        Returns:
            Tuple of (dates, prices, changes)
        """
        dates = df["Date"].tolist()
        prices = [round(float(p), 4) for p in df["Close"].tolist()]

        changes = [
            round(prices[i + 1] - prices[i], 4) for i in range(len(prices) - 1)
        ]

        return dates, prices, changes
