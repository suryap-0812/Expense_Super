"""
Deterministic Financial Analytics Engine (Python)
Implements Section 65 of the Master Technical Specification (No ML).
"""

from typing import Any, Dict, List, Optional, Union
import numpy as np
import pandas as pd


def round_currency(val: float) -> float:
    """Rounds to 2 decimal places."""
    return round(val, 2)


def calculate_income(df: pd.DataFrame) -> float:
    """Calculate total income: sum of all income transactions."""
    if df.empty or "type" not in df.columns or "amount" not in df.columns:
        return 0.0
    income_tx = df[df["type"].str.lower() == "income"]
    return round_currency(float(income_tx["amount"].sum()))


def calculate_expense(df: pd.DataFrame) -> float:
    """Calculate total expenses: sum of all expense transactions."""
    if df.empty or "type" not in df.columns or "amount" not in df.columns:
        return 0.0
    expense_tx = df[df["type"].str.lower() == "expense"]
    return round_currency(float(expense_tx["amount"].sum()))


def calculate_savings(income: float, expense: float) -> float:
    """Calculate net savings: income - expense."""
    return round_currency(income - expense)


def calculate_savings_rate(savings: float, income: float) -> Optional[float]:
    """
    Calculate savings rate: (savings / income) * 100.
    Returns None if income <= 0 (safe division guard).
    """
    if income <= 0:
        return None
    return round_currency((savings / income) * 100)


def calculate_category_spending(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Calculate category spending breakdown: amount, percentage share, count.
    Sorted descending by expenditure volume.
    """
    if df.empty or "type" not in df.columns or "amount" not in df.columns:
        return []

    expense_df = df[df["type"].str.lower() == "expense"]
    if expense_df.empty:
        return []

    total_expense = float(expense_df["amount"].sum())
    grouped = (
        expense_df.groupby("category")
        .agg(amount=("amount", "sum"), count=("amount", "count"))
        .reset_index()
    )

    items: List[Dict[str, Any]] = []
    for _, row in grouped.iterrows():
        amt = round_currency(float(row["amount"]))
        pct = round_currency((amt / total_expense) * 100) if total_expense > 0 else 0.0
        items.append({
            "category": str(row["category"]),
            "amount": amt,
            "percentage": pct,
            "transactionCount": int(row["count"]),
        })

    items.sort(key=lambda x: x["amount"], reverse=True)
    return items


def calculate_monthly_spending(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Computes monthly spending timeline (month YYYY-MM, totalExpense, count, averageTransactionAmount).
    Sorted chronologically.
    """
    if df.empty or "type" not in df.columns or "amount" not in df.columns:
        return []

    expense_df = df[df["type"].str.lower() == "expense"].copy()
    if expense_df.empty:
        return []

    date_col = "transaction_date" if "transaction_date" in expense_df.columns else "date"
    expense_df["year_month"] = expense_df[date_col].astype(str).str.slice(0, 7)

    grouped = (
        expense_df.groupby("year_month")
        .agg(total=("amount", "sum"), count=("amount", "count"))
        .reset_index()
        .sort_values("year_month")
    )

    points: List[Dict[str, Any]] = []
    for _, row in grouped.iterrows():
        total = round_currency(float(row["total"]))
        count = int(row["count"])
        avg = round_currency(total / count) if count > 0 else 0.0
        points.append({
            "month": str(row["year_month"]),
            "totalExpense": total,
            "transactionCount": count,
            "averageTransactionAmount": avg,
        })
    return points


def calculate_monthly_savings(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Computes monthly savings timeline (month YYYY-MM, income, expense, savings, savingsRate).
    Sorted chronologically.
    """
    if df.empty or "type" not in df.columns or "amount" not in df.columns:
        return []

    df_copy = df.copy()
    date_col = "transaction_date" if "transaction_date" in df_copy.columns else "date"
    df_copy["year_month"] = df_copy[date_col].astype(str).str.slice(0, 7)

    months = sorted(df_copy["year_month"].unique())
    points: List[Dict[str, Any]] = []

    for ym in months:
        month_slice = df_copy[df_copy["year_month"] == ym]
        inc = calculate_income(month_slice)
        exp = calculate_expense(month_slice)
        sav = calculate_savings(inc, exp)
        rate = calculate_savings_rate(sav, inc)

        points.append({
            "month": ym,
            "income": inc,
            "expense": exp,
            "savings": sav,
            "savingsRate": rate,
        })
    return points


def calculate_trend_change(previous_val: float, current_val: float) -> Dict[str, Any]:
    """Computes difference, percentage change, and trend direction."""
    abs_diff = round_currency(current_val - previous_val)
    pct_diff: Optional[float] = None

    if previous_val != 0:
        pct_diff = round_currency((abs_diff / abs(previous_val)) * 100)

    if abs_diff > 0.005:
        direction = "increase"
    elif abs_diff < -0.005:
        direction = "decrease"
    else:
        direction = "unchanged"

    return {
        "previousValue": round_currency(previous_val),
        "currentValue": round_currency(current_val),
        "absoluteChange": abs_diff,
        "percentageChange": pct_diff,
        "direction": direction,
    }


def calculate_spending_change(monthly_spending: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Calculates month-over-month spending change between the latest two months."""
    if len(monthly_spending) < 2:
        return None
    prev = float(monthly_spending[-2]["totalExpense"])
    curr = float(monthly_spending[-1]["totalExpense"])
    return calculate_trend_change(prev, curr)


def calculate_savings_change(monthly_savings: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Calculates month-over-month savings change between the latest two months."""
    if len(monthly_savings) < 2:
        return None
    prev = float(monthly_savings[-2]["savings"])
    curr = float(monthly_savings[-1]["savings"])
    return calculate_trend_change(prev, curr)


def calculate_volatility(series: Union[List[float], np.ndarray]) -> Dict[str, float]:
    """
    Computes mean, sample standard deviation (ddof=1), and coefficient of variation (CV).
    """
    arr = np.asarray(series, dtype=float)
    n = len(arr)
    if n == 0:
        return {"mean": 0.0, "standardDeviation": 0.0, "coefficientOfVariation": 0.0}

    mean = round_currency(float(np.mean(arr)))
    if n == 1:
        return {"mean": mean, "standardDeviation": 0.0, "coefficientOfVariation": 0.0}

    std = round_currency(float(np.std(arr, ddof=1)))
    cv = round(std / mean, 4) if mean > 0 else 0.0

    return {
        "mean": mean,
        "standardDeviation": std,
        "coefficientOfVariation": cv,
    }


def generate_financial_analytics(df: pd.DataFrame) -> Dict[str, Any]:
    """Generates complete aggregated deterministic analytics report."""
    total_inc = calculate_income(df)
    total_exp = calculate_expense(df)
    net_sav = calculate_savings(total_inc, total_exp)
    sav_rate = calculate_savings_rate(net_sav, total_inc)

    cat_spending = calculate_category_spending(df)
    monthly_spending = calculate_monthly_spending(df)
    monthly_savings = calculate_monthly_savings(df)

    spending_change = calculate_spending_change(monthly_spending)
    savings_change = calculate_savings_change(monthly_savings)

    exp_series = [m["totalExpense"] for m in monthly_spending]
    inc_series = [m["income"] for m in monthly_savings]

    exp_vol = calculate_volatility(exp_series)
    inc_vol = calculate_volatility(inc_series)

    return {
        "totalIncome": total_inc,
        "totalExpense": total_exp,
        "netSavings": net_sav,
        "savingsRate": sav_rate,
        "categorySpending": cat_spending,
        "monthlySpending": monthly_spending,
        "monthlySavings": monthly_savings,
        "spendingChange": spending_change,
        "savingsChange": savings_change,
        "expenseVolatility": exp_vol,
        "incomeVolatility": inc_vol,
    }
