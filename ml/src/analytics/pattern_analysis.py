"""
Statistical Pattern Analyzer (Python Parity)
Deterministic statistical pattern analysis implementation for Phase 8 (Section 24 & 67).
Provides 100% mathematical parity with @expense-tracker/analytics TypeScript implementation.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional, Union
import numpy as np
import pandas as pd

from .financial_analytics import (
    calculate_monthly_spending,
    calculate_monthly_savings,
    calculate_volatility,
)


def calculate_linear_trend(values: List[float]) -> Optional[Dict[str, Any]]:
    """Computes Ordinary Least Squares (OLS) regression parameters and coefficient of determination (R^2)."""
    n = len(values)
    if n < 2:
        return None

    x = np.arange(n, dtype=np.float64)
    y = np.array(values, dtype=np.float64)

    sum_x = float(np.sum(x))
    sum_y = float(np.sum(y))
    sum_xy = float(np.sum(x * y))
    sum_xx = float(np.sum(x * x))

    denominator = n * sum_xx - sum_x * sum_x
    if denominator == 0:
        return None

    slope = (n * sum_xy - sum_x * sum_y) / denominator
    intercept = (sum_y - slope * sum_x) / n

    mean_y = sum_y / n
    y_pred = slope * x + intercept
    ss_tot = float(np.sum((y - mean_y) ** 2))
    ss_res = float(np.sum((y - y_pred) ** 2))

    r_squared = max(0.0, min(1.0, 1.0 - ss_res / ss_tot)) if ss_tot > 0 else 1.0

    first = values[0]
    last = values[-1]
    percentage_growth = round(((last - first) / abs(first)) * 100, 2) if first != 0 else None

    slope_threshold = abs(mean_y) * 0.02
    if slope > slope_threshold:
        direction = "increasing"
    elif slope < -slope_threshold:
        direction = "decreasing"
    else:
        direction = "stable"

    if direction == "increasing":
        summary = f"Upward trend increasing at approximately ₹{slope:.2f} per period (R²={r_squared:.2f})."
    elif direction == "decreasing":
        summary = f"Downward trend decreasing at approximately ₹{abs(slope):.2f} per period (R²={r_squared:.2f})."
    else:
        summary = f"Stable trajectory with minimal slope (₹{slope:.2f}/mo)."

    return {
        "slope": round(float(slope), 2),
        "intercept": round(float(intercept), 2),
        "r_squared": round(float(r_squared), 4),
        "percentage_growth": percentage_growth,
        "direction": direction,
        "summary": summary,
    }


def analyze_spending_trend(monthly_spending: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Analyzes spending trend across monthly spending points."""
    if len(monthly_spending) < 2:
        return None
    expenses = [float(m.get("total_expense", m.get("totalExpense", 0.0))) for m in monthly_spending]
    return calculate_linear_trend(expenses)


def analyze_savings_trend(monthly_savings: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Analyzes net savings trend across monthly savings points."""
    if len(monthly_savings) < 2:
        return None
    savings = [float(m.get("savings", 0.0)) for m in monthly_savings]
    return calculate_linear_trend(savings)


def _to_df(transactions: Union[List[Dict[str, Any]], pd.DataFrame]) -> pd.DataFrame:
    """Converts transaction input to standardized pandas DataFrame."""
    if isinstance(transactions, pd.DataFrame):
        df = transactions.copy()
    else:
        df = pd.DataFrame(transactions)

    if df.empty:
        return pd.DataFrame(columns=["type", "amount", "category", "transaction_date"])

    if "categoryId" in df.columns and "category" not in df.columns:
        df["category"] = df["categoryId"]
    if "transactionDate" in df.columns and "transaction_date" not in df.columns:
        df["transaction_date"] = df["transactionDate"]

    df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0.0)
    df["transaction_date"] = pd.to_datetime(df["transaction_date"], errors="coerce")
    return df.dropna(subset=["transaction_date"])


def analyze_category_changes(transactions: Union[List[Dict[str, Any]], pd.DataFrame]) -> Dict[str, Any]:
    """Analyzes category spending growth and decline."""
    df = _to_df(transactions)
    expense_df = df[df["type"] == "expense"]

    if expense_df.empty:
        return {
            "shifts": [],
            "growing_categories": [],
            "declining_categories": [],
            "stable_categories": [],
            "top_growing_category": None,
            "top_declining_category": None,
        }

    expense_df["month"] = expense_df["transaction_date"].dt.strftime("%Y-%m")
    months = sorted(expense_df["month"].unique().tolist())

    if len(months) >= 2:
        prev_month = months[-2]
        curr_month = months[-1]
        prev_group = expense_df[expense_df["month"] == prev_month].groupby("category")["amount"].sum().to_dict()
        curr_group = expense_df[expense_df["month"] == curr_month].groupby("category")["amount"].sum().to_dict()
    else:
        # Split chronologically
        sorted_df = expense_df.sort_values("transaction_date")
        mid = len(sorted_df) // 2
        prev_group = sorted_df.iloc[:mid].groupby("category")["amount"].sum().to_dict()
        curr_group = sorted_df.iloc[mid:].groupby("category")["amount"].sum().to_dict()

    all_categories = sorted(list(set(list(prev_group.keys()) + list(curr_group.keys()))))
    shifts: List[Dict[str, Any]] = []

    for cat in all_categories:
        prev_amt = round(float(prev_group.get(cat, 0.0)), 2)
        curr_amt = round(float(curr_group.get(cat, 0.0)), 2)
        abs_change = round(curr_amt - prev_amt, 2)
        pct_change: Optional[float] = None
        status = "stable"

        if prev_amt == 0 and curr_amt > 0:
            status = "new"
        elif prev_amt > 0 and curr_amt == 0:
            status = "inactive"
            pct_change = -100.0
        elif prev_amt > 0:
            pct_change = round(((curr_amt - prev_amt) / prev_amt) * 100, 2)
            if pct_change > 5.0:
                status = "growing"
            elif pct_change < -5.0:
                status = "declining"
            else:
                status = "stable"

        shifts.append({
            "category": cat,
            "previous_amount": prev_amt,
            "current_amount": curr_amt,
            "absolute_change": abs_change,
            "percentage_change": pct_change,
            "status": status,
        })

    growing = [s for s in shifts if s["status"] in ["growing", "new"]]
    growing.sort(key=lambda s: s["absolute_change"], reverse=True)

    declining = [s for s in shifts if s["status"] in ["declining", "inactive"]]
    declining.sort(key=lambda s: s["absolute_change"])

    stable = [s for s in shifts if s["status"] == "stable"]

    return {
        "shifts": shifts,
        "growing_categories": growing,
        "declining_categories": declining,
        "stable_categories": stable,
        "top_growing_category": growing[0]["category"] if growing else None,
        "top_declining_category": declining[0]["category"] if declining else None,
    }


def analyze_weekend_behavior(transactions: Union[List[Dict[str, Any]], pd.DataFrame]) -> Dict[str, Any]:
    """Analyzes weekend vs weekday spending concentration and average transaction size."""
    df = _to_df(transactions)
    expense_df = df[df["type"] == "expense"]

    if expense_df.empty:
        return {
            "weekend_expense": 0.0,
            "weekday_expense": 0.0,
            "total_expense": 0.0,
            "weekend_spending_ratio": 0.0,
            "weekend_transaction_count": 0,
            "weekday_transaction_count": 0,
            "weekend_transaction_ratio": 0.0,
            "average_weekend_transaction": 0.0,
            "average_weekday_transaction": 0.0,
            "weekend_spending_premium": 1.0,
        }

    # Day of week: 5=Saturday, 6=Sunday in pandas dt.dayofweek
    is_weekend = expense_df["transaction_date"].dt.dayofweek.isin([5, 6])
    weekend_df = expense_df[is_weekend]
    weekday_df = expense_df[~is_weekend]

    weekend_expense = round(float(weekend_df["amount"].sum()), 2)
    weekday_expense = round(float(weekday_df["amount"].sum()), 2)
    total_expense = round(weekend_expense + weekday_expense, 2)

    weekend_count = int(len(weekend_df))
    weekday_count = int(len(weekday_df))
    total_count = weekend_count + weekday_count

    weekend_spending_ratio = round(weekend_expense / total_expense, 4) if total_expense > 0 else 0.0
    weekend_transaction_ratio = round(weekend_count / total_count, 4) if total_count > 0 else 0.0

    avg_weekend = round(weekend_expense / weekend_count, 2) if weekend_count > 0 else 0.0
    avg_weekday = round(weekday_expense / weekday_count, 2) if weekday_count > 0 else 0.0
    premium = round(avg_weekend / avg_weekday, 2) if avg_weekday > 0 else 1.0

    return {
        "weekend_expense": weekend_expense,
        "weekday_expense": weekday_expense,
        "total_expense": total_expense,
        "weekend_spending_ratio": weekend_spending_ratio,
        "weekend_transaction_count": weekend_count,
        "weekday_transaction_count": weekday_count,
        "weekend_transaction_ratio": weekend_transaction_ratio,
        "average_weekend_transaction": avg_weekend,
        "average_weekday_transaction": avg_weekday,
        "weekend_spending_premium": premium,
    }


def analyze_spending_volatility(amounts: List[float]) -> Dict[str, Any]:
    """Calculates volatility metrics and assigns qualitative rating."""
    base_vol = calculate_volatility(amounts)
    cv = base_vol.get("coefficientOfVariation", base_vol.get("coefficient_of_variation", 0.0))

    if cv >= 0.5:
        rating = "volatile"
    elif cv >= 0.3:
        rating = "high"
    elif cv >= 0.15:
        rating = "moderate"
    else:
        rating = "low"

    return {
        "mean": base_vol["mean"],
        "standardDeviation": base_vol.get("standardDeviation", base_vol.get("standard_deviation", 0.0)),
        "coefficientOfVariation": cv,
        "rating": rating,
    }


def analyze_transaction_frequency(transactions: Union[List[Dict[str, Any]], pd.DataFrame]) -> Dict[str, Any]:
    """Calculates transaction velocity, gaps, and burst flurry days."""
    df = _to_df(transactions)
    total_transactions = len(df)

    if total_transactions == 0:
        return {
            "total_transactions": 0,
            "active_days_count": 0,
            "span_days_count": 0,
            "daily_velocity": 0.0,
            "average_inter_transaction_days": 0.0,
            "max_daily_transaction_count": 0,
            "burst_days": [],
        }

    df["date_str"] = df["transaction_date"].dt.strftime("%Y-%m-%d")
    daily_groups = df.groupby("date_str").agg(
        count=("amount", "count"),
        total_amount=("amount", lambda s: float(s[df.loc[s.index, "type"] == "expense"].sum())),
    )

    active_dates = sorted(daily_groups.index.tolist())
    active_days_count = len(active_dates)

    min_date = df["transaction_date"].min()
    max_date = df["transaction_date"].max()
    span_days = max(1, (max_date - min_date).days + 1)

    daily_velocity = round(total_transactions / span_days, 2)

    # Inter-transaction days
    if active_days_count > 1:
        date_objs = [datetime.strptime(d, "%Y-%m-%d") for d in active_dates]
        diffs = [(date_objs[i] - date_objs[i - 1]).days for i in range(1, len(date_objs))]
        avg_inter_days = round(float(np.mean(diffs)), 2)
    else:
        avg_inter_days = 0.0

    max_daily_count = int(daily_groups["count"].max()) if not daily_groups.empty else 0
    burst_threshold = max(3.0, daily_velocity * 2.0)

    burst_df = daily_groups[daily_groups["count"] >= burst_threshold]
    burst_days = [
        {
            "date": str(idx),
            "transaction_count": int(row["count"]),
            "total_amount": round(float(row["total_amount"]), 2),
        }
        for idx, row in burst_df.iterrows()
    ]

    return {
        "total_transactions": total_transactions,
        "active_days_count": active_days_count,
        "span_days_count": span_days,
        "daily_velocity": daily_velocity,
        "average_inter_transaction_days": avg_inter_days,
        "max_daily_transaction_count": max_daily_count,
        "burst_days": burst_days,
    }


def generate_pattern_analysis_report(transactions: Union[List[Dict[str, Any]], pd.DataFrame]) -> Dict[str, Any]:
    """Assembles full pattern analysis report."""
    df = _to_df(transactions)
    monthly_spending = calculate_monthly_spending(df)
    monthly_savings = calculate_monthly_savings(df)

    spending_trend = analyze_spending_trend(monthly_spending)
    savings_trend = analyze_savings_trend(monthly_savings)
    category_dynamics = analyze_category_changes(df)
    weekend_behavior = analyze_weekend_behavior(df)

    expense_amounts = [float(m["totalExpense"]) for m in monthly_spending]
    spending_volatility = analyze_spending_volatility(expense_amounts)
    transaction_frequency = analyze_transaction_frequency(df)

    return {
        "spending_trend": spending_trend,
        "savings_trend": savings_trend,
        "category_dynamics": category_dynamics,
        "weekend_behavior": weekend_behavior,
        "spending_volatility": spending_volatility,
        "transaction_frequency": transaction_frequency,
    }
