"""
Behavioral profile definitions and parameter matrices.
"""

from typing import Dict
from .config import BehavioralProfileType, ProfileParameters

BASE_CATEGORY_WEIGHTS: Dict[str, float] = {
    "Food": 0.25,
    "Transport": 0.12,
    "Shopping": 0.15,
    "Bills": 0.20,
    "Education": 0.05,
    "Entertainment": 0.08,
    "Healthcare": 0.05,
    "Travel": 0.04,
    "Subscriptions": 0.05,
    "Other": 0.06,
}


def get_profile_parameters(profile: BehavioralProfileType) -> ProfileParameters:
    """Returns tailored statistical distribution parameters for the specified profile."""
    if profile == BehavioralProfileType.GOOD_SAVER:
        # High savings rate (~50%), disciplined, low discretionary
        weights = dict(BASE_CATEGORY_WEIGHTS)
        weights.update({"Shopping": 0.08, "Entertainment": 0.04, "Bills": 0.25, "Food": 0.25})
        return ProfileParameters(
            income_mean=60000.0,
            income_std=5000.0,
            expense_ratio_mean=0.48,  # ~52% savings rate
            expense_ratio_std=0.05,
            category_weights=weights,
            weekend_bias=0.28,
            avg_tx_count_per_month=25,
            anomaly_probability_per_month=0.04,
        )

    elif profile == BehavioralProfileType.OVERSPENDER:
        # Spends more than income (~115%), high shopping and entertainment
        weights = dict(BASE_CATEGORY_WEIGHTS)
        weights.update({"Shopping": 0.32, "Entertainment": 0.16, "Travel": 0.10})
        return ProfileParameters(
            income_mean=45000.0,
            income_std=6000.0,
            expense_ratio_mean=1.18,  # negative savings rate (-18%)
            expense_ratio_std=0.10,
            category_weights=weights,
            weekend_bias=0.45,
            avg_tx_count_per_month=42,
            anomaly_probability_per_month=0.15,
        )

    elif profile == BehavioralProfileType.FOOD_HEAVY:
        # Food category takes 40%+ of total expenditure
        weights = dict(BASE_CATEGORY_WEIGHTS)
        weights.update({"Food": 0.44, "Shopping": 0.08, "Entertainment": 0.06})
        return ProfileParameters(
            income_mean=50000.0,
            income_std=5000.0,
            expense_ratio_mean=0.75,
            expense_ratio_std=0.06,
            category_weights=weights,
            weekend_bias=0.36,
            avg_tx_count_per_month=38,
            anomaly_probability_per_month=0.08,
        )

    elif profile == BehavioralProfileType.SHOPPING_HEAVY:
        # Shopping takes 35%+ of total expenses
        weights = dict(BASE_CATEGORY_WEIGHTS)
        weights.update({"Shopping": 0.38, "Food": 0.18, "Bills": 0.15})
        return ProfileParameters(
            income_mean=55000.0,
            income_std=7000.0,
            expense_ratio_mean=0.82,
            expense_ratio_std=0.08,
            category_weights=weights,
            weekend_bias=0.42,
            avg_tx_count_per_month=35,
            anomaly_probability_per_month=0.12,
        )

    elif profile == BehavioralProfileType.IRREGULAR_SPENDER:
        # High volatility in monthly spending
        return ProfileParameters(
            income_mean=52000.0,
            income_std=8000.0,
            expense_ratio_mean=0.78,
            expense_ratio_std=0.24,  # High variance across months
            category_weights=BASE_CATEGORY_WEIGHTS,
            weekend_bias=0.35,
            avg_tx_count_per_month=30,
            anomaly_probability_per_month=0.16,
        )

    elif profile == BehavioralProfileType.CONSISTENT_SPENDER:
        # Low volatility, predictable monthly routine
        return ProfileParameters(
            income_mean=50000.0,
            income_std=2000.0,
            expense_ratio_mean=0.68,
            expense_ratio_std=0.03,  # Very low variance
            category_weights=BASE_CATEGORY_WEIGHTS,
            weekend_bias=0.29,
            avg_tx_count_per_month=28,
            anomaly_probability_per_month=0.03,
        )

    elif profile == BehavioralProfileType.WEEKEND_SPENDER:
        # Spends heavily on Friday, Saturday, Sunday
        weights = dict(BASE_CATEGORY_WEIGHTS)
        weights.update({"Entertainment": 0.16, "Food": 0.30, "Shopping": 0.20})
        return ProfileParameters(
            income_mean=52000.0,
            income_std=5000.0,
            expense_ratio_mean=0.76,
            expense_ratio_std=0.07,
            category_weights=weights,
            weekend_bias=0.58,  # >55% on weekends
            avg_tx_count_per_month=32,
            anomaly_probability_per_month=0.09,
        )

    elif profile == BehavioralProfileType.IMPULSE_SPENDER:
        # Unpredictable high discretionary spikes
        weights = dict(BASE_CATEGORY_WEIGHTS)
        weights.update({"Shopping": 0.28, "Entertainment": 0.15, "Travel": 0.12})
        return ProfileParameters(
            income_mean=48000.0,
            income_std=6000.0,
            expense_ratio_mean=0.88,
            expense_ratio_std=0.18,
            category_weights=weights,
            weekend_bias=0.40,
            avg_tx_count_per_month=36,
            anomaly_probability_per_month=0.20,
        )

    elif profile == BehavioralProfileType.VARIABLE_INCOME:
        # Freelancer / consultant: income fluctuates widely
        return ProfileParameters(
            income_mean=55000.0,
            income_std=24000.0,  # High income volatility
            expense_ratio_mean=0.70,
            expense_ratio_std=0.15,
            category_weights=BASE_CATEGORY_WEIGHTS,
            weekend_bias=0.32,
            avg_tx_count_per_month=29,
            anomaly_probability_per_month=0.10,
        )

    elif profile == BehavioralProfileType.GOAL_ORIENTED_SAVER:
        # Disciplined recurring savings allocations
        weights = dict(BASE_CATEGORY_WEIGHTS)
        weights.update({"Bills": 0.28, "Food": 0.22, "Shopping": 0.08, "Subscriptions": 0.04})
        return ProfileParameters(
            income_mean=65000.0,
            income_std=4000.0,
            expense_ratio_mean=0.62,  # Consistent ~38% savings
            expense_ratio_std=0.04,
            category_weights=weights,
            weekend_bias=0.27,
            avg_tx_count_per_month=24,
            anomaly_probability_per_month=0.05,
        )

    raise ValueError(f"Unknown profile: {profile}")
