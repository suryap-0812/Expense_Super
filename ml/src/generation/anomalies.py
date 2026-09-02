"""
Controlled anomaly generation and injection mechanisms.
In accordance with Section 21 of the Master Prompt.
"""

from enum import Enum
from typing import Dict, List, Tuple
import numpy as np


class AnomalyType(str, Enum):
    SPENDING_ANOMALY = "spending_anomaly"        # Unusually large single transaction
    CATEGORY_INCREASE = "category_increase"      # Sudden spike in specific category
    SAVINGS_DECLINE = "savings_decline"          # Sudden collapse in savings rate
    WEEKEND_SPIKE = "weekend_spike"              # Extreme surge in weekend spending
    FREQUENCY_BURST = "frequency_burst"          # Unnatural flurry of transactions in short window


ANOMALY_DESCRIPTIONS: Dict[AnomalyType, List[str]] = {
    AnomalyType.SPENDING_ANOMALY: [
        "Unplanned major electronics purchase",
        "Emergency car repair bill",
        "Large jewellery purchase",
        "Unplanned home appliance replacement",
    ],
    AnomalyType.CATEGORY_INCREASE: [
        "Sudden dining & food delivery surge",
        "High-frequency shopping spree",
        "Unplanned domestic flight bookings",
    ],
    AnomalyType.SAVINGS_DECLINE: [
        "Discretionary expenditure exceeded budget",
        "Multiple high-ticket purchases in same pay cycle",
    ],
    AnomalyType.WEEKEND_SPIKE: [
        "Major weekend trip & hospitality spending",
        "Weekend luxury dining and event tickets",
    ],
    AnomalyType.FREQUENCY_BURST: [
        "Consecutive rapid online micro-transactions",
        "Multiple burst transactions within 24 hours",
    ],
}


def inject_transaction_anomaly(
    rng: np.random.RandomState,
    baseline_income: float,
    category: str,
    anomaly_type: AnomalyType,
) -> Tuple[float, str]:
    """
    Generates an anomalous transaction amount and description.
    Example: Normal shopping ₹2,000-₹4,000; Injected: ₹12,000 - ₹25,000.
    """
    if anomaly_type == AnomalyType.SPENDING_ANOMALY:
        # 3x to 6x typical baseline transaction or 25%-45% of entire monthly income
        amount = float(rng.uniform(0.25, 0.45) * baseline_income)
        desc = rng.choice(ANOMALY_DESCRIPTIONS[AnomalyType.SPENDING_ANOMALY])
        return round(max(amount, 12000.0), 2), desc

    elif anomaly_type == AnomalyType.CATEGORY_INCREASE:
        amount = float(rng.uniform(0.12, 0.22) * baseline_income)
        desc = rng.choice(ANOMALY_DESCRIPTIONS[AnomalyType.CATEGORY_INCREASE])
        return round(max(amount, 7500.0), 2), desc

    elif anomaly_type == AnomalyType.WEEKEND_SPIKE:
        amount = float(rng.uniform(0.15, 0.28) * baseline_income)
        desc = rng.choice(ANOMALY_DESCRIPTIONS[AnomalyType.WEEKEND_SPIKE])
        return round(max(amount, 9000.0), 2), desc

    elif anomaly_type == AnomalyType.SAVINGS_DECLINE:
        amount = float(rng.uniform(0.20, 0.35) * baseline_income)
        desc = rng.choice(ANOMALY_DESCRIPTIONS[AnomalyType.SAVINGS_DECLINE])
        return round(max(amount, 10000.0), 2), desc

    else:  # FREQUENCY_BURST
        amount = float(rng.uniform(1500.0, 4500.0))
        desc = rng.choice(ANOMALY_DESCRIPTIONS[AnomalyType.FREQUENCY_BURST])
        return round(amount, 2), desc
