"""
Behavioral Feature Engineering Engine
Extracts reproducible, leakage-free behavioral financial features from preprocessed transaction streams
(Section 22 & Section 64 of the Master Prompt).
"""

from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd


STANDARD_EXPENSE_CATEGORIES = [
    "Food",
    "Transport",
    "Shopping",
    "Bills",
    "Education",
    "Entertainment",
    "Healthcare",
    "Travel",
    "Subscriptions",
    "Other",
]


class FeatureEngineer:
    """Extracts deterministic behavioral feature representations from transaction streams."""

    def __init__(self, expense_categories: Optional[List[str]] = None):
        self.categories = expense_categories or STANDARD_EXPENSE_CATEGORIES

    def extract_user_features(self, df: pd.DataFrame) -> Dict[str, float]:
        """
        Extracts all behavioral financial features for a single user.
        Input DataFrame must contain preprocessed columns:
        ['type', 'amount', 'category', 'year_month', 'is_weekend'].
        """
        if df.empty:
            return self._empty_features()

        income_tx = df[df["type"] == "income"]
        expense_tx = df[df["type"] == "expense"]

        num_incomes = len(income_tx)
        num_expenses = len(expense_tx)

        # Unique active months
        active_months = df["year_month"].unique()
        n_months = max(1, len(active_months))

        # Monthly series
        monthly_income_series = income_tx.groupby("year_month")["amount"].sum().reindex(active_months, fill_value=0.0)
        monthly_expense_series = expense_tx.groupby("year_month")["amount"].sum().reindex(active_months, fill_value=0.0)
        monthly_savings_series = monthly_income_series - monthly_expense_series

        total_income = float(income_tx["amount"].sum())
        total_expense = float(expense_tx["amount"].sum())

        avg_monthly_income = total_income / n_months
        avg_monthly_expense = total_expense / n_months

        # Savings rate
        if avg_monthly_income > 0:
            savings_rate = ((avg_monthly_income - avg_monthly_expense) / avg_monthly_income) * 100.0
        else:
            savings_rate = 0.0

        # Transaction size metrics
        if num_expenses > 0:
            exp_amounts = expense_tx["amount"].values
            avg_tx_amt = float(np.mean(exp_amounts))
            med_tx_amt = float(np.median(exp_amounts))
            largest_tx = float(np.max(exp_amounts))
        else:
            avg_tx_amt = 0.0
            med_tx_amt = 0.0
            largest_tx = 0.0

        largest_tx_ratio = (largest_tx / total_expense) if total_expense > 0 else 0.0

        # Volatility (coefficient of variation: std / mean)
        if n_months > 1 and avg_monthly_expense > 0:
            expense_volatility = float(monthly_expense_series.std(ddof=1) / avg_monthly_expense)
        else:
            expense_volatility = 0.0

        if n_months > 1 and avg_monthly_income > 0:
            income_volatility = float(monthly_income_series.std(ddof=1) / avg_monthly_income)
        else:
            income_volatility = 0.0

        # Transaction frequency (expenses per month)
        tx_frequency = num_expenses / n_months

        # Category shares & entropy
        cat_spend = expense_tx.groupby("category")["amount"].sum().to_dict()
        cat_ratios: Dict[str, float] = {}
        entropy = 0.0

        for cat in self.categories:
            spend = cat_spend.get(cat, 0.0)
            ratio = (spend / total_expense) if total_expense > 0 else 0.0
            cat_ratios[f"{cat.lower()}_ratio"] = round(float(ratio), 6)
            if ratio > 0:
                entropy -= float(ratio * np.log(ratio))

        # Weekend spending ratio
        weekend_spend = float(expense_tx[expense_tx["is_weekend"]]["amount"].sum())
        weekend_spending_ratio = (weekend_spend / total_expense) if total_expense > 0 else 0.0

        # Discretionary spending ratio (Food, Shopping, Entertainment, Travel)
        discretionary_spend = sum(cat_spend.get(c, 0.0) for c in ["Food", "Shopping", "Entertainment", "Travel"])
        discretionary_ratio = (discretionary_spend / total_expense) if total_expense > 0 else 0.0

        # Month-over-month trend / changes
        if n_months >= 2:
            time_idx = np.arange(n_months)
            # Linear trend slope
            exp_slope = float(np.polyfit(time_idx, monthly_expense_series.values, 1)[0])
            inc_slope = float(np.polyfit(time_idx, monthly_income_series.values, 1)[0])
            monthly_expense_change = exp_slope / avg_monthly_expense if avg_monthly_expense > 0 else 0.0
            monthly_income_change = inc_slope / avg_monthly_income if avg_monthly_income > 0 else 0.0
            monthly_savings_var = float(monthly_savings_series.var(ddof=1))
        else:
            monthly_expense_change = 0.0
            monthly_income_change = 0.0
            monthly_savings_var = 0.0

        # Build feature dictionary
        features: Dict[str, float] = {
            "average_monthly_income": round(avg_monthly_income, 2),
            "average_monthly_expense": round(avg_monthly_expense, 2),
            "savings_rate": round(savings_rate, 4),
            "average_transaction_amount": round(avg_tx_amt, 2),
            "median_transaction_amount": round(med_tx_amt, 2),
            "expense_volatility": round(expense_volatility, 4),
            "income_volatility": round(income_volatility, 4),
            "transaction_frequency": round(tx_frequency, 2),
            "food_ratio": cat_ratios.get("food_ratio", 0.0),
            "shopping_ratio": cat_ratios.get("shopping_ratio", 0.0),
            "transport_ratio": cat_ratios.get("transport_ratio", 0.0),
            "bills_ratio": cat_ratios.get("bills_ratio", 0.0),
            "discretionary_ratio": round(discretionary_ratio, 4),
            "weekend_spending_ratio": round(weekend_spending_ratio, 4),
            "monthly_expense_change": round(monthly_expense_change, 4),
            "monthly_income_change": round(monthly_income_change, 4),
            "largest_transaction": round(largest_tx, 2),
            "largest_transaction_ratio": round(largest_tx_ratio, 4),
            "number_of_expenses": float(num_expenses),
            "number_of_income_transactions": float(num_incomes),
            "monthly_savings_variance": round(monthly_savings_var, 2),
            "category_spending_entropy": round(entropy, 4),
        }

        # Also add remaining specific category ratios
        for cat in self.categories:
            k = f"{cat.lower()}_ratio"
            if k not in features:
                features[k] = cat_ratios.get(k, 0.0)

        return features

    def extract_features_batch(self, preprocessed_df: pd.DataFrame) -> pd.DataFrame:
        """
        Extracts feature representations for all unique users in a preprocessed DataFrame.
        Returns a DataFrame with user_id index and engineered feature columns.
        """
        user_features: List[Dict[str, Any]] = []

        grouped = preprocessed_df.groupby("user_id")
        for user_id, user_tx in grouped:
            feats = self.extract_user_features(user_tx)
            feats["user_id"] = str(user_id)
            user_features.append(feats)

        feature_df = pd.DataFrame(user_features)
        # Reorder to put user_id first
        cols = ["user_id"] + [c for c in feature_df.columns if c != "user_id"]
        return feature_df[cols]

    def _empty_features(self) -> Dict[str, float]:
        """Returns baseline zero vector for empty transaction history."""
        base: Dict[str, float] = {
            "average_monthly_income": 0.0,
            "average_monthly_expense": 0.0,
            "savings_rate": 0.0,
            "average_transaction_amount": 0.0,
            "median_transaction_amount": 0.0,
            "expense_volatility": 0.0,
            "income_volatility": 0.0,
            "transaction_frequency": 0.0,
            "food_ratio": 0.0,
            "shopping_ratio": 0.0,
            "transport_ratio": 0.0,
            "bills_ratio": 0.0,
            "discretionary_ratio": 0.0,
            "weekend_spending_ratio": 0.0,
            "monthly_expense_change": 0.0,
            "monthly_income_change": 0.0,
            "largest_transaction": 0.0,
            "largest_transaction_ratio": 0.0,
            "number_of_expenses": 0.0,
            "number_of_income_transactions": 0.0,
            "monthly_savings_variance": 0.0,
            "category_spending_entropy": 0.0,
        }
        for cat in self.categories:
            k = f"{cat.lower()}_ratio"
            base[k] = 0.0
        return base
