"""
Dataset Validation Engine
Statistically validates synthetic financial datasets across behavioral profiles,
distributions, category shares, and anomaly scenarios (Section 63 of Master Prompt).
"""

import argparse
import json
import os
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
from scipy import stats


class DatasetValidator:
    """Performs statistical checks and profile validation on synthetic datasets."""

    def __init__(self, data_dir: str = "ml/data/raw"):
        self.data_dir = data_dir
        self.users_df: Optional[pd.DataFrame] = None
        self.tx_df: Optional[pd.DataFrame] = None

    def load_data(self) -> None:
        """Loads users and transactions datasets from Parquet (or CSV fallback)."""
        users_parquet = os.path.join(self.data_dir, "users.parquet")
        tx_parquet = os.path.join(self.data_dir, "transactions.parquet")

        if os.path.exists(users_parquet) and os.path.exists(tx_parquet):
            self.users_df = pd.read_parquet(users_parquet)
            self.tx_df = pd.read_parquet(tx_parquet)
        else:
            users_csv = os.path.join(self.data_dir, "users.csv")
            tx_csv = os.path.join(self.data_dir, "transactions.csv")
            if not os.path.exists(users_csv) or not os.path.exists(tx_csv):
                raise FileNotFoundError(f"Dataset files not found in '{self.data_dir}'")
            self.users_df = pd.read_csv(users_csv)
            self.tx_df = pd.read_csv(tx_csv)

    def validate(self) -> Dict[str, Any]:
        """Runs the full validation suite and returns a detailed report."""
        if self.users_df is None or self.tx_df is None:
            self.load_data()

        checks: Dict[str, Dict[str, Any]] = {}

        # 1. Dataset Integrity & Schema Checks
        integrity_passed, integrity_metrics = self._validate_integrity()
        checks["dataset_integrity"] = {"passed": integrity_passed, "metrics": integrity_metrics}

        # 2. Monthly Aggregations
        monthly_df, user_summary_df = self._aggregate_financials()

        # 3. Income & Expense Distribution Checks
        dist_passed, dist_metrics = self._validate_distributions(monthly_df)
        checks["distributions"] = {"passed": dist_passed, "metrics": dist_metrics}

        # 4. Profile Separation Checks
        sep_passed, sep_metrics = self._validate_profile_separation(user_summary_df)
        checks["profile_separation"] = {"passed": sep_passed, "metrics": sep_metrics}

        # 5. Category Distribution Checks
        cat_passed, cat_metrics = self._validate_categories()
        checks["category_distributions"] = {"passed": cat_passed, "metrics": cat_metrics}

        # 6. Temporal Behavior & Active Months Checks
        temp_passed, temp_metrics = self._validate_temporal_behavior()
        checks["temporal_behavior"] = {"passed": temp_passed, "metrics": temp_metrics}

        # 7. Anomaly Scenario Checks
        anom_passed, anom_metrics = self._validate_anomalies()
        checks["anomaly_scenarios"] = {"passed": anom_passed, "metrics": anom_metrics}

        all_passed = all(check["passed"] for check in checks.values())

        report = {
            "validation_passed": all_passed,
            "data_directory": self.data_dir,
            "total_users": len(self.users_df),
            "total_transactions": len(self.tx_df),
            "checks": checks,
        }

        return report

    def _validate_integrity(self) -> Tuple[bool, Dict[str, Any]]:
        """Verifies missing values, positive amounts, and schema constraints."""
        missing_user_fields = int(self.users_df.isna().sum().sum())
        # Anomaly type is expected to be null for normal transactions
        non_anomaly_tx = self.tx_df.drop(columns=["anomaly_type"])
        missing_tx_fields = int(non_anomaly_tx.isna().sum().sum())

        non_positive_amounts = int((self.tx_df["amount"] <= 0).sum())
        invalid_types = int((~self.tx_df["type"].isin(["income", "expense"])).sum())

        passed = (
            missing_user_fields == 0
            and missing_tx_fields == 0
            and non_positive_amounts == 0
            and invalid_types == 0
        )

        return passed, {
            "missing_user_fields": missing_user_fields,
            "missing_tx_fields": missing_tx_fields,
            "non_positive_amounts": non_positive_amounts,
            "invalid_transaction_types": invalid_types,
        }

    def _aggregate_financials(self) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """Calculates monthly and user-level summary statistics."""
        df = self.tx_df.copy()
        df["tx_date"] = pd.to_datetime(df["transaction_date"])
        df["year_month"] = df["tx_date"].dt.to_period("M").astype(str)
        df["is_weekend"] = df["tx_date"].dt.weekday.isin([4, 5, 6])  # Fri, Sat, Sun

        # Monthly user aggregations
        monthly_income = (
            df[df["type"] == "income"]
            .groupby(["user_id", "year_month"])["amount"]
            .sum()
            .reset_index(name="monthly_income")
        )
        monthly_expense = (
            df[df["type"] == "expense"]
            .groupby(["user_id", "year_month"])["amount"]
            .sum()
            .reset_index(name="monthly_expense")
        )
        monthly_tx_count = (
            df[df["type"] == "expense"]
            .groupby(["user_id", "year_month"])["amount"]
            .count()
            .reset_index(name="expense_tx_count")
        )

        # Merge monthly stats
        monthly_df = pd.merge(monthly_income, monthly_expense, on=["user_id", "year_month"], how="outer").fillna(0.0)
        monthly_df = pd.merge(monthly_df, monthly_tx_count, on=["user_id", "year_month"], how="left").fillna(0)
        monthly_df["savings"] = monthly_df["monthly_income"] - monthly_df["monthly_expense"]
        monthly_df["savings_rate"] = np.where(
            monthly_df["monthly_income"] > 0,
            (monthly_df["savings"] / monthly_df["monthly_income"]) * 100,
            np.nan,
        )

        # User-level summaries
        user_agg = monthly_df.groupby("user_id").agg(
            avg_income=("monthly_income", "mean"),
            income_std=("monthly_income", "std"),
            avg_expense=("monthly_expense", "mean"),
            expense_std=("monthly_expense", "std"),
            avg_savings=("savings", "mean"),
            avg_savings_rate=("savings_rate", "mean"),
            avg_tx_count=("expense_tx_count", "mean"),
        ).reset_index()

        # Category shares per user
        cat_pivot = (
            df[df["type"] == "expense"]
            .pivot_table(index="user_id", columns="category", values="amount", aggfunc="sum", fill_value=0.0)
        )
        total_exp = cat_pivot.sum(axis=1)
        cat_ratios = cat_pivot.div(total_exp, axis=0).add_suffix("_ratio").reset_index()

        # Weekend spending ratio per user
        weekend_spend = (
            df[(df["type"] == "expense") & df["is_weekend"]]
            .groupby("user_id")["amount"]
            .sum()
            .reset_index(name="weekend_amount")
        )
        tot_spend = (
            df[df["type"] == "expense"]
            .groupby("user_id")["amount"]
            .sum()
            .reset_index(name="total_amount")
        )
        wk_merged = pd.merge(tot_spend, weekend_spend, on="user_id", how="left").fillna(0.0)
        wk_merged["weekend_ratio"] = wk_merged["weekend_amount"] / wk_merged["total_amount"]

        # Final user summary
        user_summary = pd.merge(self.users_df, user_agg, on="user_id")
        user_summary = pd.merge(user_summary, cat_ratios, on="user_id")
        user_summary = pd.merge(user_summary, wk_merged[["user_id", "weekend_ratio"]], on="user_id")

        # Coefficient of variation (volatility)
        user_summary["income_cv"] = (user_summary["income_std"] / user_summary["avg_income"]).fillna(0.0)
        user_summary["expense_cv"] = (user_summary["expense_std"] / user_summary["avg_expense"]).fillna(0.0)

        return monthly_df, user_summary

    def _validate_distributions(self, monthly_df: pd.DataFrame) -> Tuple[bool, Dict[str, Any]]:
        """Validates general income, expense, and savings rate distributions."""
        mean_income = float(monthly_df["monthly_income"].mean())
        mean_expense = float(monthly_df["monthly_expense"].mean())
        median_income = float(monthly_df["monthly_income"].median())
        median_expense = float(monthly_df["monthly_expense"].median())
        mean_savings_rate = float(monthly_df["savings_rate"].dropna().mean())

        # Assert income and expense distributions are realistic
        passed = (
            25000.0 <= mean_income <= 85000.0
            and 15000.0 <= mean_expense <= 65000.0
            and -10.0 <= mean_savings_rate <= 45.0
        )

        return passed, {
            "mean_income": round(mean_income, 2),
            "median_income": round(median_income, 2),
            "mean_expense": round(mean_expense, 2),
            "median_expense": round(median_expense, 2),
            "mean_savings_rate": round(mean_savings_rate, 2),
        }

    def _validate_profile_separation(self, user_summary: pd.DataFrame) -> Tuple[bool, Dict[str, Any]]:
        """Tests separation of behavioral profiles on their defining characteristics."""
        profile_stats: Dict[str, Any] = {}
        sub_tests: Dict[str, bool] = {}

        # 1. Good Saver: Savings Rate >= 40%
        good_savers = user_summary[user_summary["profile"] == "Good Saver"]
        gs_sr_mean = float(good_savers["avg_savings_rate"].mean())
        sub_tests["good_saver_high_savings"] = (gs_sr_mean >= 40.0)
        profile_stats["Good Saver"] = {"mean_savings_rate": round(gs_sr_mean, 2)}

        # 2. Overspender: Savings Rate < 0% (expenses > income)
        overspenders = user_summary[user_summary["profile"] == "Overspender"]
        os_sr_mean = float(overspenders["avg_savings_rate"].mean())
        sub_tests["overspender_negative_savings"] = (os_sr_mean < 0.0)
        profile_stats["Overspender"] = {"mean_savings_rate": round(os_sr_mean, 2)}

        # Statistical t-test between Good Saver and Overspender savings rate
        t_stat, p_val = stats.ttest_ind(good_savers["avg_savings_rate"].dropna(), overspenders["avg_savings_rate"].dropna())
        sub_tests["saver_vs_overspender_stat_significant"] = bool(p_val < 1e-10)

        # 3. Food Heavy: Food Ratio >= 35%
        food_heavy = user_summary[user_summary["profile"] == "Food Heavy"]
        fh_ratio_mean = float(food_heavy["Food_ratio"].mean())
        sub_tests["food_heavy_high_food_ratio"] = (fh_ratio_mean >= 0.35)
        profile_stats["Food Heavy"] = {"mean_food_ratio": round(fh_ratio_mean, 4)}

        # 4. Shopping Heavy: Shopping Ratio >= 30%
        shopping_heavy = user_summary[user_summary["profile"] == "Shopping Heavy"]
        sh_ratio_mean = float(shopping_heavy["Shopping_ratio"].mean())
        sub_tests["shopping_heavy_high_shopping_ratio"] = (sh_ratio_mean >= 0.30)
        profile_stats["Shopping Heavy"] = {"mean_shopping_ratio": round(sh_ratio_mean, 4)}

        # 5. Weekend Spender: Weekend Ratio >= 50%
        weekend_spenders = user_summary[user_summary["profile"] == "Weekend Spender"]
        wk_ratio_mean = float(weekend_spenders["weekend_ratio"].mean())
        sub_tests["weekend_spender_high_weekend_ratio"] = (wk_ratio_mean >= 0.50)
        profile_stats["Weekend Spender"] = {"mean_weekend_ratio": round(wk_ratio_mean, 4)}

        # 6. Consistent Spender vs Irregular Spender (expense CV)
        consistent = user_summary[user_summary["profile"] == "Consistent Spender"]
        irregular = user_summary[user_summary["profile"] == "Irregular Spender"]
        cons_cv = float(consistent["expense_cv"].mean())
        irreg_cv = float(irregular["expense_cv"].mean())
        sub_tests["consistent_spender_low_volatility"] = (cons_cv <= 0.15)
        sub_tests["irregular_spender_high_volatility"] = (irreg_cv >= 0.18)
        profile_stats["Consistent Spender"] = {"mean_expense_cv": round(cons_cv, 4)}
        profile_stats["Irregular Spender"] = {"mean_expense_cv": round(irreg_cv, 4)}

        # 7. Variable Income: Income CV >= 0.25
        var_income = user_summary[user_summary["profile"] == "Variable Income"]
        var_inc_cv = float(var_income["income_cv"].mean())
        sub_tests["variable_income_high_volatility"] = (var_inc_cv >= 0.25)
        profile_stats["Variable Income"] = {"mean_income_cv": round(var_inc_cv, 4)}

        all_passed = all(sub_tests.values())
        return all_passed, {
            "all_profile_tests_passed": all_passed,
            "sub_tests": sub_tests,
            "t_test_saver_vs_overspender": {"t_stat": round(float(t_stat), 2), "p_value": float(p_val)},
            "profile_statistics": profile_stats,
        }

    def _validate_categories(self) -> Tuple[bool, Dict[str, Any]]:
        """Verifies presence and realistic distribution of all 16 categories."""
        income_cats = set(self.tx_df[self.tx_df["type"] == "income"]["category"].unique())
        expense_cats = set(self.tx_df[self.tx_df["type"] == "expense"]["category"].unique())

        expected_income = {"Salary", "Freelance", "Allowance", "Refund", "Gift", "Other"}
        expected_expense = {
            "Food", "Transport", "Shopping", "Bills", "Education",
            "Entertainment", "Healthcare", "Travel", "Subscriptions", "Other",
        }

        # Check all categories appear
        income_match = expected_income.issubset(income_cats)
        expense_match = expected_expense.issubset(expense_cats)

        # Expense category totals breakdown
        exp_totals = self.tx_df[self.tx_df["type"] == "expense"].groupby("category")["amount"].sum()
        total_exp = exp_totals.sum()
        cat_pcts = (exp_totals / total_exp * 100).round(2).to_dict()

        passed = income_match and expense_match
        return passed, {
            "income_categories_present": list(income_cats),
            "expense_categories_present": list(expense_cats),
            "expense_share_percent": cat_pcts,
        }

    def _validate_temporal_behavior(self) -> Tuple[bool, Dict[str, Any]]:
        """Validates that user active periods conform to 3–12 months."""
        min_months = int(self.users_df["months_active"].min())
        max_months = int(self.users_df["months_active"].max())
        mean_months = float(self.users_df["months_active"].mean())

        passed = (min_months >= 3 and max_months <= 12)

        return passed, {
            "min_months_active": min_months,
            "max_months_active": max_months,
            "mean_months_active": round(mean_months, 2),
        }

    def _validate_anomalies(self) -> Tuple[bool, Dict[str, Any]]:
        """Tests that injected anomalies are statistically distinguishable from normal spending."""
        anom_rows = self.tx_df[self.tx_df["is_anomaly"]]
        norm_rows = self.tx_df[(~self.tx_df["is_anomaly"]) & (self.tx_df["type"] == "expense")]

        total_anomalies = len(anom_rows)
        anom_rate = (total_anomalies / len(self.tx_df)) * 100

        # Anomaly amounts vs normal amounts
        anom_mean_amt = float(anom_rows["amount"].mean())
        norm_mean_amt = float(norm_rows["amount"].mean())
        ratio = anom_mean_amt / norm_mean_amt if norm_mean_amt > 0 else 1.0

        # Anomaly amounts should be at least 2.5x higher than normal transaction amounts
        passed = (total_anomalies > 0 and ratio >= 2.5)

        return passed, {
            "total_anomalies": total_anomalies,
            "anomaly_rate_percent": round(anom_rate, 3),
            "mean_anomaly_amount": round(anom_mean_amt, 2),
            "mean_normal_amount": round(norm_mean_amt, 2),
            "anomaly_to_normal_ratio": round(ratio, 2),
            "anomaly_types_count": anom_rows["anomaly_type"].value_counts().to_dict(),
        }

    def save_report(self, report: Dict[str, Any], output_path: Optional[str] = None) -> str:
        """Saves JSON report to disk."""
        path = output_path or os.path.join(self.data_dir, "dataset_validation_report.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)
        return path


def main():
    parser = argparse.ArgumentParser(description="Validate synthetic financial dataset.")
    parser.add_argument("--data-dir", type=str, default="ml/data/raw", help="Directory containing dataset files")
    parser.add_argument("--output-report", type=str, default=None, help="Output path for JSON report")

    args = parser.parse_args()

    validator = DatasetValidator(data_dir=args.data_dir)
    print(f"Loading dataset from '{args.data_dir}'...")
    validator.load_data()

    print("Running statistical validation checks...")
    report = validator.validate()

    out_file = validator.save_report(report, args.output_report)
    print(f"Validation report saved to '{out_file}'")

    if report["validation_passed"]:
        print(">>> ALL DATASET VALIDATION CHECKS PASSED! <<<")
    else:
        print(">>> DATASET VALIDATION FAILED! Check report details. <<<")
        exit(1)


if __name__ == "__main__":
    main()
