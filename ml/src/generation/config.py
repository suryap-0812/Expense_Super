"""
Configuration and constants for synthetic data generation.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List


class BehavioralProfileType(str, Enum):
    GOOD_SAVER = "Good Saver"
    OVERSPENDER = "Overspender"
    FOOD_HEAVY = "Food Heavy"
    SHOPPING_HEAVY = "Shopping Heavy"
    IRREGULAR_SPENDER = "Irregular Spender"
    CONSISTENT_SPENDER = "Consistent Spender"
    WEEKEND_SPENDER = "Weekend Spender"
    IMPULSE_SPENDER = "Impulse Spender"
    VARIABLE_INCOME = "Variable Income"
    GOAL_ORIENTED_SAVER = "Goal-Oriented Saver"


INCOME_CATEGORIES: List[str] = [
    "Salary",
    "Freelance",
    "Allowance",
    "Refund",
    "Gift",
    "Other",
]

EXPENSE_CATEGORIES: List[str] = [
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

PAYMENT_METHODS: List[str] = [
    "UPI",
    "Cash",
    "Credit Card",
    "Debit Card",
    "Net Banking",
    "Bank Transfer",
]


@dataclass
class ProfileParameters:
    """Statistical distributions and behavioral ratios for a profile."""
    # Monthly base income distribution (mean, standard deviation) in INR
    income_mean: float
    income_std: float
    # Target expense-to-income ratio (mean, standard deviation)
    expense_ratio_mean: float
    expense_ratio_std: float
    # Category spending distribution weights
    category_weights: Dict[str, float]
    # Proportion of discretionary spending falling on Friday-Sunday [0.0, 1.0]
    weekend_bias: float
    # Average transaction count per month
    avg_tx_count_per_month: int
    # Probability of an injected anomaly in a given month [0.0, 1.0]
    anomaly_probability_per_month: float = 0.08


@dataclass
class GenerationConfig:
    """Global dataset generation settings."""
    num_users: int = 10000
    min_months: int = 3
    max_months: int = 12
    start_year: int = 2025
    start_month: int = 6
    seed: int = 42
    output_dir: str = "ml/data/raw"
    # Even distribution across 10 profiles by default
    profile_distribution: Dict[BehavioralProfileType, float] = field(
        default_factory=lambda: {p: 0.10 for p in BehavioralProfileType}
    )
