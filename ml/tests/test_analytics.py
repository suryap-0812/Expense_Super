"""
Automated unit tests for Python Deterministic Financial Analytics module.
"""

import pandas as pd
import pytest
from ml.src.analytics.financial_analytics import (
    calculate_income,
    calculate_expense,
    calculate_savings,
    calculate_savings_rate,
    calculate_category_spending,
    calculate_monthly_spending,
    calculate_monthly_savings,
    calculate_spending_change,
    calculate_savings_change,
    calculate_volatility,
    generate_financial_analytics,
)


@pytest.fixture
def sample_df():
    data = [
        {"transaction_id": "t1", "amount": 60000.0, "type": "income", "category": "Salary", "transaction_date": "2026-01-01"},
        {"transaction_id": "t2", "amount": 15000.0, "type": "expense", "category": "Food", "transaction_date": "2026-01-05"},
        {"transaction_id": "t3", "amount": 10000.0, "type": "expense", "category": "Bills", "transaction_date": "2026-01-15"},
        {"transaction_id": "t4", "amount": 5000.0, "type": "expense", "category": "Food", "transaction_date": "2026-01-20"},
        {"transaction_id": "t5", "amount": 60000.0, "type": "income", "category": "Salary", "transaction_date": "2026-02-01"},
        {"transaction_id": "t6", "amount": 18000.0, "type": "expense", "category": "Food", "transaction_date": "2026-02-10"},
        {"transaction_id": "t7", "amount": 12000.0, "type": "expense", "category": "Shopping", "transaction_date": "2026-02-18"},
        {"transaction_id": "t8", "amount": 10000.0, "type": "expense", "category": "Bills", "transaction_date": "2026-02-25"},
    ]
    return pd.DataFrame(data)


def test_income_expense_savings(sample_df):
    inc = calculate_income(sample_df)
    exp = calculate_expense(sample_df)
    sav = calculate_savings(inc, exp)
    rate = calculate_savings_rate(sav, inc)

    assert inc == 120000.0
    assert exp == 70000.0
    assert sav == 50000.0
    assert rate == 41.67


def test_savings_rate_zero_income():
    assert calculate_savings_rate(-500.0, 0.0) is None
    assert calculate_savings_rate(-500.0, -100.0) is None


def test_category_spending(sample_df):
    breakdown = calculate_category_spending(sample_df)
    assert len(breakdown) == 3

    assert breakdown[0]["category"] == "Food"
    assert breakdown[0]["amount"] == 38000.0
    assert breakdown[0]["percentage"] == 54.29
    assert breakdown[0]["transactionCount"] == 3

    assert breakdown[1]["category"] == "Bills"
    assert breakdown[1]["amount"] == 20000.0
    assert breakdown[1]["percentage"] == 28.57

    assert breakdown[2]["category"] == "Shopping"
    assert breakdown[2]["amount"] == 12000.0
    assert breakdown[2]["percentage"] == 17.14


def test_monthly_spending_and_changes(sample_df):
    monthly_exp = calculate_monthly_spending(sample_df)
    assert len(monthly_exp) == 2
    assert monthly_exp[0]["totalExpense"] == 30000.0
    assert monthly_exp[1]["totalExpense"] == 40000.0

    change = calculate_spending_change(monthly_exp)
    assert change is not None
    assert change["previousValue"] == 30000.0
    assert change["currentValue"] == 40000.0
    assert change["absoluteChange"] == 10000.0
    assert change["percentageChange"] == 33.33
    assert change["direction"] == "increase"


def test_monthly_savings_and_changes(sample_df):
    monthly_sav = calculate_monthly_savings(sample_df)
    assert len(monthly_sav) == 2
    assert monthly_sav[0]["savings"] == 30000.0
    assert monthly_sav[1]["savings"] == 20000.0

    change = calculate_savings_change(monthly_sav)
    assert change is not None
    assert change["previousValue"] == 30000.0
    assert change["currentValue"] == 20000.0
    assert change["absoluteChange"] == -10000.0
    assert change["percentageChange"] == -33.33
    assert change["direction"] == "decrease"


def test_volatility():
    vol = calculate_volatility([30000.0, 40000.0])
    assert vol["mean"] == 35000.0
    assert vol["standardDeviation"] == 7071.07
    assert vol["coefficientOfVariation"] == 0.202

    empty_vol = calculate_volatility([])
    assert empty_vol["mean"] == 0.0
    assert empty_vol["coefficientOfVariation"] == 0.0


def test_comprehensive_report(sample_df):
    report = generate_financial_analytics(sample_df)
    assert report["totalIncome"] == 120000.0
    assert report["totalExpense"] == 70000.0
    assert report["netSavings"] == 50000.0
    assert report["savingsRate"] == 41.67
    assert len(report["categorySpending"]) == 3
    assert len(report["monthlySpending"]) == 2
    assert len(report["monthlySavings"]) == 2
    assert report["spendingChange"]["direction"] == "increase"
    assert report["savingsChange"]["direction"] == "decrease"
