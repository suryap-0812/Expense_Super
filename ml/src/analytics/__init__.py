"""
Deterministic Financial Analytics Module
Implements Section 65 of the Master Technical Specification (No ML).
"""

from .financial_analytics import (
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
from .pattern_analysis import (
    calculate_linear_trend,
    analyze_spending_trend,
    analyze_savings_trend,
    analyze_category_changes,
    analyze_weekend_behavior,
    analyze_spending_volatility,
    analyze_transaction_frequency,
    generate_pattern_analysis_report,
)

__all__ = [
    "calculate_income",
    "calculate_expense",
    "calculate_savings",
    "calculate_savings_rate",
    "calculate_category_spending",
    "calculate_monthly_spending",
    "calculate_monthly_savings",
    "calculate_spending_change",
    "calculate_savings_change",
    "calculate_volatility",
    "generate_financial_analytics",
    "calculate_linear_trend",
    "analyze_spending_trend",
    "analyze_savings_trend",
    "analyze_category_changes",
    "analyze_weekend_behavior",
    "analyze_spending_volatility",
    "analyze_transaction_frequency",
    "generate_pattern_analysis_report",
]
