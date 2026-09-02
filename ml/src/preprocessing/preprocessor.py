"""
Transaction Preprocessor
Parses raw financial transactions, validates schema conformance,
derives temporal indicators, and ensures deterministic chronological ordering.
"""

import os
from typing import Optional, Union, List, Dict, Any
import numpy as np
import pandas as pd


REQUIRED_COLUMNS = [
    "transaction_id",
    "user_id",
    "type",
    "amount",
    "category",
    "payment_method",
    "transaction_date",
]


class TransactionPreprocessor:
    """Preprocesses raw transaction records with zero data leakage."""

    def __init__(self, weekend_days: Optional[List[int]] = None):
        # 4 = Friday, 5 = Saturday, 6 = Sunday (consumer discretionary weekend cycle)
        self.weekend_days = weekend_days or [4, 5, 6]

    def transform(self, df_or_records: Union[pd.DataFrame, List[Dict[str, Any]]]) -> pd.DataFrame:
        """
        Transforms raw transaction stream into clean, chronologically indexed DataFrame
        with enriched temporal indicators.
        """
        if isinstance(df_or_records, list):
            df = pd.DataFrame(df_or_records)
        else:
            df = df_or_records.copy()

        if df.empty:
            return pd.DataFrame(columns=REQUIRED_COLUMNS + ["year_month", "day_of_week", "is_weekend", "day_of_month"])

        # Check required columns
        missing = [col for col in REQUIRED_COLUMNS if col not in df.columns]
        if missing:
            raise ValueError(f"Missing required columns in transaction stream: {missing}")

        # Ensure correct datatypes
        df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0.0)
        df["type"] = df["type"].astype(str).str.lower().str.strip()
        df["category"] = df["category"].astype(str).str.strip()
        df["user_id"] = df["user_id"].astype(str)
        df["transaction_id"] = df["transaction_id"].astype(str)

        # Parse transaction_date
        tx_dates = pd.to_datetime(df["transaction_date"], errors="coerce")
        if tx_dates.isna().any():
            raise ValueError("Found invalid ISO dates in transaction stream")
        df["tx_datetime"] = tx_dates

        # Extract temporal dimensions
        df["year_month"] = df["tx_datetime"].dt.to_period("M").astype(str)
        df["day_of_week"] = df["tx_datetime"].dt.weekday
        df["is_weekend"] = df["day_of_week"].isin(self.weekend_days)
        df["day_of_month"] = df["tx_datetime"].dt.day

        # Deterministic chronological sort
        df = df.sort_values(
            by=["user_id", "tx_datetime", "transaction_id"],
            ascending=[True, True, True],
        ).reset_index(drop=True)

        return df

    def process_and_save(self, input_path: str, output_path: str) -> pd.DataFrame:
        """Loads raw transactions, transforms them, and saves to Parquet."""
        if input_path.endswith(".parquet"):
            raw_df = pd.read_parquet(input_path)
        else:
            raw_df = pd.read_csv(input_path)

        processed_df = self.transform(raw_df)

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        if output_path.endswith(".parquet"):
            processed_df.to_parquet(output_path, index=False)
        else:
            processed_df.to_csv(output_path, index=False)

        return processed_df
