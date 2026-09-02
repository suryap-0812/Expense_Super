"""
Deterministic Synthetic Financial Data Generator
Produces realistic transaction histories across 10 behavioral profiles with controlled anomalies.
"""

import argparse
import datetime
import json
import os
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
import pandas as pd

try:
    from .config import (
        BehavioralProfileType,
        EXPENSE_CATEGORIES,
        GenerationConfig,
        INCOME_CATEGORIES,
        PAYMENT_METHODS,
    )
    from .profiles import get_profile_parameters
    from .anomalies import AnomalyType, inject_transaction_anomaly
except ImportError:
    from ml.src.generation.config import (
        BehavioralProfileType,
        EXPENSE_CATEGORIES,
        GenerationConfig,
        INCOME_CATEGORIES,
        PAYMENT_METHODS,
    )
    from ml.src.generation.profiles import get_profile_parameters
    from ml.src.generation.anomalies import AnomalyType, inject_transaction_anomaly


CATEGORY_DESCRIPTIONS: Dict[str, List[str]] = {
    "Salary": ["Monthly corporate salary credit", "Direct deposit pay", "Monthly retainer"],
    "Freelance": ["Client design milestone", "Consulting invoice settlement", "Code review contract"],
    "Allowance": ["Monthly family allowance", "Monthly stipend"],
    "Refund": ["E-commerce return refund", "Cancelled flight refund", "Overpayment adjustment"],
    "Gift": ["Birthday gift transfer", "Festive cash gift"],
    "Other": ["Interest payout", "Miscellaneous credit"],
    "Food": ["Grocery store visit", "Supermarket essentials", "Dinner with friends", "Quick lunch", "Cafe coffee", "Food delivery order"],
    "Transport": ["Metro card top-up", "Uber ride", "Petrol / fuel refill", "Bus fare", "Auto-rickshaw"],
    "Shopping": ["Clothing apparel", "Online electronics purchase", "Home decor", "Footwear", "Personal care items"],
    "Bills": ["Electricity bill", "Broadband internet", "Mobile postpaid", "Water utility", "Piped cooking gas"],
    "Education": ["Online course subscription", "Books and reference materials", "Workshop fee"],
    "Entertainment": ["Movie tickets", "Streaming service", "Concert pass", "Gaming purchase"],
    "Healthcare": ["Pharmacy medicines", "Doctor consultation", "Health checkup lab tests"],
    "Travel": ["Train reservation", "Flight ticket booking", "Weekend stay booking"],
    "Subscriptions": ["Cloud storage plan", "Music streaming service", "Productivity app license"],
}


class SyntheticDataGenerator:
    """Generates synthetic users and their multi-month transaction histories."""

    def __init__(self, config: Optional[GenerationConfig] = None):
        self.config = config or GenerationConfig()
        self.rng = np.random.RandomState(self.config.seed)

    def generate(self) -> Tuple[pd.DataFrame, pd.DataFrame, Dict[str, Any]]:
        """
        Executes generation of all users and transactions.
        Returns: (users_df, transactions_df, metadata)
        """
        users_records: List[Dict[str, Any]] = []
        transactions_records: List[Dict[str, Any]] = []

        profile_choices = list(self.config.profile_distribution.keys())
        profile_probs = list(self.config.profile_distribution.values())

        tx_counter = 1

        for user_idx in range(1, self.config.num_users + 1):
            user_id = f"usr_{user_idx:06d}"
            profile_idx = self.rng.choice(len(profile_choices), p=profile_probs)
            profile_name: BehavioralProfileType = profile_choices[profile_idx]
            params = get_profile_parameters(profile_name)

            # Assign user baseline parameters
            income_base = max(15000.0, float(self.rng.normal(params.income_mean, params.income_std)))
            months_active = int(self.rng.randint(self.config.min_months, self.config.max_months + 1))

            start_date = datetime.date(self.config.start_year, self.config.start_month, 1)

            users_records.append({
                "user_id": user_id,
                "profile": profile_name.value,
                "income_base": round(income_base, 2),
                "months_active": months_active,
                "start_date": start_date.isoformat(),
            })

            # Generate monthly transaction timeline
            curr_year = start_date.year
            curr_month = start_date.month

            for month_offset in range(months_active):
                target_month = ((curr_month - 1 + month_offset) % 12) + 1
                year_offset = (curr_month - 1 + month_offset) // 12
                target_year = curr_year + year_offset

                # Number of days in target month
                if target_month in [1, 3, 5, 7, 8, 10, 12]:
                    days_in_month = 31
                elif target_month in [4, 6, 9, 11]:
                    days_in_month = 30
                else:
                    is_leap = (target_year % 4 == 0 and target_year % 100 != 0) or (target_year % 400 == 0)
                    days_in_month = 29 if is_leap else 28

                # Monthly income calculation
                if profile_name == BehavioralProfileType.VARIABLE_INCOME:
                    # Multi-payment freelance variability
                    num_incomes = self.rng.randint(1, 4)
                    monthly_income = max(10000.0, float(self.rng.normal(params.income_mean, params.income_std)))
                    for inc_idx in range(num_incomes):
                        inc_amt = round(monthly_income / num_incomes, 2)
                        day = self.rng.randint(1, days_in_month + 1)
                        tx_date = datetime.date(target_year, target_month, day)
                        transactions_records.append({
                            "transaction_id": f"txn_{tx_counter:09d}",
                            "user_id": user_id,
                            "type": "income",
                            "amount": inc_amt,
                            "category": "Freelance" if inc_idx == 0 else "Other",
                            "payment_method": "Bank Transfer",
                            "transaction_date": tx_date.isoformat(),
                            "description": self.rng.choice(CATEGORY_DESCRIPTIONS["Freelance"]),
                            "is_anomaly": False,
                            "anomaly_type": None,
                        })
                        tx_counter += 1
                else:
                    # Regular monthly salary (1st to 5th of the month)
                    day = self.rng.randint(1, 6)
                    tx_date = datetime.date(target_year, target_month, day)
                    monthly_income = round(income_base, 2)
                    transactions_records.append({
                        "transaction_id": f"txn_{tx_counter:09d}",
                        "user_id": user_id,
                        "type": "income",
                        "amount": monthly_income,
                        "category": "Salary",
                        "payment_method": "Bank Transfer",
                        "transaction_date": tx_date.isoformat(),
                        "description": self.rng.choice(CATEGORY_DESCRIPTIONS["Salary"]),
                        "is_anomaly": False,
                        "anomaly_type": None,
                    })
                    tx_counter += 1

                # Occasional supplementary income (Refund, Gift, Allowance, Other)
                if self.rng.random() < 0.15:
                    supp_cat = self.rng.choice(["Refund", "Gift", "Allowance", "Other"])
                    supp_amt = round(float(self.rng.uniform(500.0, 4000.0)), 2)
                    supp_day = self.rng.randint(5, days_in_month + 1)
                    supp_date = datetime.date(target_year, target_month, supp_day)
                    transactions_records.append({
                        "transaction_id": f"txn_{tx_counter:09d}",
                        "user_id": user_id,
                        "type": "income",
                        "amount": supp_amt,
                        "category": supp_cat,
                        "payment_method": "UPI" if supp_cat in ["Refund", "Gift"] else "Bank Transfer",
                        "transaction_date": supp_date.isoformat(),
                        "description": self.rng.choice(CATEGORY_DESCRIPTIONS.get(supp_cat, ["Income credit"])),
                        "is_anomaly": False,
                        "anomaly_type": None,
                    })
                    tx_counter += 1

                # Monthly expense budget calculation
                expense_ratio = max(0.20, float(self.rng.normal(params.expense_ratio_mean, params.expense_ratio_std)))
                monthly_expense_budget = monthly_income * expense_ratio

                # Determine whether an anomaly is injected this month
                inject_anomaly = (self.rng.uniform(0.0, 1.0) < params.anomaly_probability_per_month)
                chosen_anomaly_type: Optional[AnomalyType] = None
                if inject_anomaly:
                    anomaly_choices = list(AnomalyType)
                    anom_idx = self.rng.choice(len(anomaly_choices))
                    chosen_anomaly_type = anomaly_choices[anom_idx]

                # Number of expense transactions
                tx_count = max(10, int(self.rng.normal(params.avg_tx_count_per_month, 4)))
                if chosen_anomaly_type == AnomalyType.FREQUENCY_BURST:
                    tx_count += 20  # Spike in transaction density

                cat_list = list(params.category_weights.keys())
                cat_probs = np.array(list(params.category_weights.values()), dtype=float)
                cat_probs /= cat_probs.sum()

                # Generate regular expense transactions
                remaining_budget = monthly_expense_budget
                for tx_i in range(tx_count):
                    cat = self.rng.choice(cat_list, p=cat_probs)
                    pm = self.rng.choice(PAYMENT_METHODS)

                    # Date with weekend bias
                    is_weekend = (self.rng.uniform(0.0, 1.0) < params.weekend_bias)
                    day = self._choose_day(target_year, target_month, days_in_month, is_weekend)
                    tx_date = datetime.date(target_year, target_month, day)

                    # Expense amount allocation
                    if tx_i == tx_count - 1 and remaining_budget > 100.0:
                        amt = round(remaining_budget, 2)
                    else:
                        share = float(self.rng.exponential(1.0 / tx_count))
                        amt = round(max(20.0, share * monthly_expense_budget), 2)
                        remaining_budget = max(0.0, remaining_budget - amt)

                    desc_options = CATEGORY_DESCRIPTIONS.get(cat, ["Expense payment"])
                    desc = self.rng.choice(desc_options)

                    transactions_records.append({
                        "transaction_id": f"txn_{tx_counter:09d}",
                        "user_id": user_id,
                        "type": "expense",
                        "amount": amt,
                        "category": cat,
                        "payment_method": pm,
                        "transaction_date": tx_date.isoformat(),
                        "description": desc,
                        "is_anomaly": False,
                        "anomaly_type": None,
                    })
                    tx_counter += 1

                # Inject deliberate anomalous transaction if flagged
                if inject_anomaly and chosen_anomaly_type:
                    anom_cat = "Shopping" if chosen_anomaly_type in [AnomalyType.SPENDING_ANOMALY, AnomalyType.CATEGORY_INCREASE] else "Food"
                    anom_amount, anom_desc = inject_transaction_anomaly(
                        self.rng,
                        baseline_income=monthly_income,
                        category=anom_cat,
                        anomaly_type=chosen_anomaly_type,
                    )
                    anom_day = self.rng.randint(1, days_in_month + 1)
                    anom_date = datetime.date(target_year, target_month, anom_day)

                    transactions_records.append({
                        "transaction_id": f"txn_{tx_counter:09d}",
                        "user_id": user_id,
                        "type": "expense",
                        "amount": anom_amount,
                        "category": anom_cat,
                        "payment_method": "Credit Card" if self.rng.rand() > 0.5 else "UPI",
                        "transaction_date": anom_date.isoformat(),
                        "description": anom_desc,
                        "is_anomaly": True,
                        "anomaly_type": chosen_anomaly_type.value,
                    })
                    tx_counter += 1

        users_df = pd.DataFrame(users_records)
        tx_df = pd.DataFrame(transactions_records)

        # Sort transactions chronologically
        tx_df["tx_date_sort"] = pd.to_datetime(tx_df["transaction_date"])
        tx_df = tx_df.sort_values(by=["user_id", "tx_date_sort"]).drop(columns=["tx_date_sort"]).reset_index(drop=True)

        # Compute metadata summary
        total_anomalies = int(tx_df["is_anomaly"].sum())
        metadata = {
            "schema_version": "1.0",
            "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "seed": self.config.seed,
            "num_users": len(users_df),
            "total_transactions": len(tx_df),
            "total_income_transactions": int((tx_df["type"] == "income").sum()),
            "total_expense_transactions": int((tx_df["type"] == "expense").sum()),
            "total_anomalies": total_anomalies,
            "anomaly_rate_percent": round((total_anomalies / len(tx_df)) * 100, 3) if len(tx_df) > 0 else 0.0,
            "profile_distribution": users_df["profile"].value_counts().to_dict(),
            "anomaly_type_distribution": tx_df["anomaly_type"].dropna().value_counts().to_dict(),
        }

        return users_df, tx_df, metadata

    def _choose_day(self, year: int, month: int, days_in_month: int, prefer_weekend: bool) -> int:
        """Selects a calendar day according to weekend preference (Fri/Sat/Sun)."""
        days = list(range(1, days_in_month + 1))
        weekend_days = [d for d in days if datetime.date(year, month, d).weekday() in [4, 5, 6]]
        weekday_days = [d for d in days if datetime.date(year, month, d).weekday() not in [4, 5, 6]]

        if prefer_weekend and weekend_days:
            return int(self.rng.choice(weekend_days))
        elif not prefer_weekend and weekday_days:
            return int(self.rng.choice(weekday_days))
        return int(self.rng.choice(days))

    def save_dataset(
        self,
        users_df: pd.DataFrame,
        tx_df: pd.DataFrame,
        metadata: Dict[str, Any],
        output_dir: Optional[str] = None,
    ) -> None:
        """Saves generated dataset to CSV, Parquet, and metadata JSON."""
        target_dir = output_dir or self.config.output_dir
        os.makedirs(target_dir, exist_ok=True)

        users_csv = os.path.join(target_dir, "users.csv")
        tx_csv = os.path.join(target_dir, "transactions.csv")
        users_parquet = os.path.join(target_dir, "users.parquet")
        tx_parquet = os.path.join(target_dir, "transactions.parquet")
        meta_file = os.path.join(target_dir, "metadata.json")

        users_df.to_csv(users_csv, index=False)
        tx_df.to_csv(tx_csv, index=False)

        users_df.to_parquet(users_parquet, index=False)
        tx_df.to_parquet(tx_parquet, index=False)

        with open(meta_file, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)


def main():
    parser = argparse.ArgumentParser(description="Generate synthetic financial dataset.")
    parser.add_argument("--num-users", type=int, default=10000, help="Number of synthetic users to generate (default 10,000)")
    parser.add_argument("--min-months", type=int, default=3, help="Minimum months per user")
    parser.add_argument("--max-months", type=int, default=12, help="Maximum months per user")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for deterministic generation")
    parser.add_argument("--output-dir", type=str, default="ml/data/raw", help="Output directory")

    args = parser.parse_args()

    config = GenerationConfig(
        num_users=args.num_users,
        min_months=args.min_months,
        max_months=args.max_months,
        seed=args.seed,
        output_dir=args.output_dir,
    )

    print(f"Generating synthetic dataset for {config.num_users} users with seed {config.seed}...")
    generator = SyntheticDataGenerator(config)
    users_df, tx_df, meta = generator.generate()

    print(f"Generated {len(users_df)} users and {len(tx_df)} transactions.")
    print(f"Total anomalies injected: {meta['total_anomalies']} ({meta['anomaly_rate_percent']}%)")
    print(f"Saving dataset to '{config.output_dir}'...")

    generator.save_dataset(users_df, tx_df, meta)
    print("Dataset generation complete!")


if __name__ == "__main__":
    main()
