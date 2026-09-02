"""
Automated unit tests for Python Statistical Pattern Analysis module.
Verifies mathematical parity with TypeScript implementation.
"""

import pandas as pd
import pytest

from ml.src.analytics.pattern_analysis import (
    calculate_linear_trend,
    analyze_spending_trend,
    analyze_savings_trend,
    analyze_category_changes,
    analyze_weekend_behavior,
    analyze_spending_volatility,
    analyze_transaction_frequency,
    generate_pattern_analysis_report,
)


def test_calculate_linear_trend():
    """Verifies OLS slope, intercept, R^2, and direction."""
    assert calculate_linear_trend([]) is None
    assert calculate_linear_trend([500.0]) is None

    # Upward trend
    vals_up = [10000.0, 12000.0, 14000.0, 16000.0]
    trend_up = calculate_linear_trend(vals_up)
    assert trend_up is not None
    assert trend_up["slope"] == 2000.0
    assert trend_up["intercept"] == 10000.0
    assert trend_up["r_squared"] == 1.0
    assert trend_up["direction"] == "increasing"
    assert trend_up["percentage_growth"] == 60.0

    # Downward trend
    vals_down = [20000.0, 16000.0, 12000.0, 8000.0]
    trend_down = calculate_linear_trend(vals_down)
    assert trend_down is not None
    assert trend_down["slope"] == -4000.0
    assert trend_down["direction"] == "decreasing"
    assert trend_down["percentage_growth"] == -60.0

    # Stable trend
    vals_stable = [50000.0, 50100.0, 49950.0, 50050.0]
    trend_stable = calculate_linear_trend(vals_stable)
    assert trend_stable is not None
    assert trend_stable["direction"] == "stable"


def test_spending_and_savings_trend():
    """Verifies spending and savings trend wrappers."""
    spending_points = [
        {"month": "2026-01", "total_expense": 30000.0},
        {"month": "2026-02", "total_expense": 35000.0},
        {"month": "2026-03", "total_expense": 40000.0},
    ]
    savings_points = [
        {"month": "2026-01", "savings": 20000.0},
        {"month": "2026-02", "savings": 15000.0},
        {"month": "2026-03", "savings": 10000.0},
    ]

    sp_trend = analyze_spending_trend(spending_points)
    sv_trend = analyze_savings_trend(savings_points)

    assert sp_trend is not None
    assert sp_trend["direction"] == "increasing"
    assert sv_trend is not None
    assert sv_trend["direction"] == "decreasing"


def test_category_dynamics():
    """Verifies category growth, decline, new, and inactive statuses."""
    txs = [
        {"type": "expense", "amount": 5000.0, "category": "Food", "transaction_date": "2026-01-10"},
        {"type": "expense", "amount": 8000.0, "category": "Shopping", "transaction_date": "2026-01-15"},
        {"type": "expense", "amount": 2000.0, "category": "Entertainment", "transaction_date": "2026-01-20"},
        {"type": "expense", "amount": 9000.0, "category": "Food", "transaction_date": "2026-02-05"},
        {"type": "expense", "amount": 3000.0, "category": "Shopping", "transaction_date": "2026-02-12"},
        {"type": "expense", "amount": 4000.0, "category": "Travel", "transaction_date": "2026-02-18"},
    ]

    res = analyze_category_changes(txs)
    assert res["top_growing_category"] == "Food"
    assert res["top_declining_category"] == "Shopping"

    shifts = {s["category"]: s for s in res["shifts"]}
    assert shifts["Travel"]["status"] == "new"
    assert shifts["Entertainment"]["status"] == "inactive"


def test_weekend_behavior():
    """Verifies weekend vs weekday ratio and premium calculations."""
    txs = [
        {"type": "expense", "amount": 1000.0, "category": "Food", "transaction_date": "2026-05-01"},  # Fri
        {"type": "expense", "amount": 3000.0, "category": "Dining", "transaction_date": "2026-05-02"},  # Sat
        {"type": "expense", "amount": 2000.0, "category": "Movie", "transaction_date": "2026-05-03"},  # Sun
        {"type": "expense", "amount": 1000.0, "category": "Fuel", "transaction_date": "2026-05-04"},  # Mon
    ]

    res = analyze_weekend_behavior(txs)
    assert res["weekend_expense"] == 5000.0
    assert res["weekday_expense"] == 2000.0
    assert res["total_expense"] == 7000.0
    assert res["weekend_transaction_count"] == 2
    assert res["weekday_transaction_count"] == 2
    assert res["average_weekend_transaction"] == 2500.0
    assert res["average_weekday_transaction"] == 1000.0
    assert res["weekend_spending_premium"] == 2.5


def test_spending_volatility_ratings():
    """Verifies qualitative rating thresholds."""
    low = analyze_spending_volatility([10000.0, 10200.0, 9800.0, 10100.0])
    assert low["rating"] == "low"

    mod = analyze_spending_volatility([10000.0, 12500.0, 8000.0, 13000.0])
    assert mod["rating"] == "moderate"

    vol = analyze_spending_volatility([5000.0, 35000.0, 2000.0, 40000.0])
    assert vol["rating"] == "volatile"


def test_transaction_frequency_and_burst_days():
    """Verifies velocity and burst flurry detection."""
    txs = [
        {"type": "expense", "amount": 500.0, "category": "Food", "transaction_date": "2026-06-01"},
        {"type": "expense", "amount": 600.0, "category": "Food", "transaction_date": "2026-06-02"},
        {"type": "expense", "amount": 1200.0, "category": "Shopping", "transaction_date": "2026-06-03"},
        {"type": "expense", "amount": 1500.0, "category": "Shopping", "transaction_date": "2026-06-03"},
        {"type": "expense", "amount": 2500.0, "category": "Dining", "transaction_date": "2026-06-03"},
        {"type": "expense", "amount": 800.0, "category": "Entertainment", "transaction_date": "2026-06-03"},
        {"type": "expense", "amount": 400.0, "category": "Transport", "transaction_date": "2026-06-03"},
    ]

    freq = analyze_transaction_frequency(txs)
    assert freq["total_transactions"] == 7
    assert freq["active_days_count"] == 3
    assert freq["span_days_count"] == 3
    assert freq["daily_velocity"] == 2.33
    assert freq["max_daily_transaction_count"] == 5
    assert len(freq["burst_days"]) == 1
    assert freq["burst_days"][0]["date"] == "2026-06-03"
    assert freq["burst_days"][0]["transaction_count"] == 5


def test_generate_pattern_analysis_report():
    """Verifies combined report generation."""
    txs = [
        {"type": "income", "amount": 50000.0, "category": "Salary", "transaction_date": "2026-01-01"},
        {"type": "expense", "amount": 25000.0, "category": "Rent", "transaction_date": "2026-01-05"},
        {"type": "income", "amount": 50000.0, "category": "Salary", "transaction_date": "2026-02-01"},
        {"type": "expense", "amount": 30000.0, "category": "Rent", "transaction_date": "2026-02-05"},
    ]

    report = generate_pattern_analysis_report(txs)
    assert report["spending_trend"] is not None
    assert report["savings_trend"] is not None
    assert report["category_dynamics"] is not None
    assert report["weekend_behavior"] is not None
    assert report["spending_volatility"] is not None
    assert report["transaction_frequency"]["total_transactions"] == 4
