"""
Structured ML Output Generator (Python Parity)
Generates versioned, evidence-backed ML output payloads (Section 29 & 69).
Maintains 100% parity with TypeScript generator in @expense-tracker/ml-contract.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Union
import numpy as np
import pandas as pd

from ml.src.analytics.financial_analytics import (
    calculate_income,
    calculate_expense,
    calculate_savings,
    calculate_savings_rate,
    calculate_category_spending,
    calculate_monthly_spending,
    calculate_monthly_savings,
)
from ml.src.analytics.pattern_analysis import (
    analyze_category_changes,
    analyze_spending_trend,
    analyze_savings_trend,
    analyze_weekend_behavior,
    analyze_spending_volatility,
    analyze_transaction_frequency,
)


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


def generate_structured_ml_output(
    transactions: Union[List[Dict[str, Any]], pd.DataFrame],
    period: str = "all-time",
    anomaly_inference: Optional[Dict[str, Any]] = None,
    cluster_inference: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Constructs versioned structured ML output payload with quantitative evidence.
    """
    df = _to_df(transactions)
    tx_count = len(df)

    # 1. Deterministic Analytics
    total_income = calculate_income(df)
    total_expense = calculate_expense(df)
    net_savings = calculate_savings(total_income, total_expense)
    savings_rate = calculate_savings_rate(net_savings, total_income)
    category_spending = calculate_category_spending(df)
    monthly_spending = calculate_monthly_spending(df)
    monthly_savings = calculate_monthly_savings(df)

    # 2. Pattern Analysis
    category_dynamics = analyze_category_changes(df)
    spending_trend = analyze_spending_trend(monthly_spending)
    savings_trend = analyze_savings_trend(monthly_savings)
    weekend_behavior = analyze_weekend_behavior(df)
    expense_amounts = [float(m["totalExpense"]) for m in monthly_spending]
    spending_volatility = analyze_spending_volatility(expense_amounts)
    transaction_frequency = analyze_transaction_frequency(df)

    # 3. Data Quality Evaluation
    active_days = transaction_frequency["active_days_count"]
    coverage_months = len(monthly_spending)
    sufficient_data = tx_count >= 10
    data_quality_score = min(
        100,
        int(round((min(tx_count, 50) / 50.0) * 60.0 + (min(coverage_months, 3) / 3.0) * 40.0)),
    )

    data_quality = {
        "transaction_count": tx_count,
        "active_days": active_days,
        "coverage_months": coverage_months,
        "sufficient_data": sufficient_data,
        "data_quality_score": data_quality_score,
    }

    # 4. Deterministic Summary
    top_cat = category_spending[0]["category"] if category_spending else None
    trend_dir = spending_trend["direction"] if spending_trend else None

    summary = {
        "total_income": total_income,
        "total_expense": total_expense,
        "net_savings": net_savings,
        "savings_rate": savings_rate,
        "volatility_rating": spending_volatility["rating"],
        "top_spending_category": top_cat,
        "spending_trend_direction": trend_dir,
    }

    # 5. Evidence-Backed Insights
    insights: List[Dict[str, Any]] = []

    # A. Anomaly Detection Insight
    if anomaly_inference and anomaly_inference.get("is_anomaly"):
        contribs = anomaly_inference.get("contributing_features", [])
        top_feat = contribs[0] if contribs else None
        driver_name = top_feat["feature"] if top_feat else "spending_volatility"
        z_score = top_feat["z_score"] if top_feat else 2.5
        severity = anomaly_inference.get("severity", "medium")
        score = anomaly_inference.get("anomaly_score", 0.5)

        insights.append({
            "type": "spending_anomaly",
            "category": driver_name.replace("_ratio", "") if "ratio" in driver_name else None,
            "severity": severity,
            "score": score,
            "title": "Unusual Financial Activity Detected",
            "explanation": f"Machine learning detected an unusual behavioral pattern (severity: {severity}, score: {score:.2f}) primarily driven by '{driver_name}'.",
            "evidence": {
                "metric_name": driver_name,
                "observed_value": top_feat["value"] if top_feat else score,
                "baseline_value": top_feat.get("baseline_mean") if top_feat else None,
                "z_score": z_score,
                "sample_size": tx_count,
            },
        })

    # B. Category Increase & Decline Insights
    growing_cats = category_dynamics.get("growing_categories", [])
    if growing_cats:
        top_g = growing_cats[0]
        pct = top_g["percentage_change"]
        abs_ch = top_g["absolute_change"]
        if (pct is None or pct >= 15.0) and abs_ch >= 1000.0:
            pct_str = f"+{pct}%" if pct is not None else "new spend"
            growth_severity = "low"
            if (pct is not None and pct >= 80.0 and abs_ch >= 4000.0) or abs_ch >= 10000.0:
                growth_severity = "high"
            elif (pct is not None and pct >= 35.0) or abs_ch >= 2500.0:
                growth_severity = "medium"

            insights.append({
                "type": "category_increase",
                "category": top_g["category"],
                "value": pct,
                "amount": abs_ch,
                "unit": "INR",
                "severity": growth_severity,
                "score": min(1.0, pct / 100.0) if pct else 0.8,
                "title": f"Significant Spending Surge in {top_g['category']}",
                "explanation": f"Expenditure in {top_g['category']} increased by ₹{abs_ch:,.2f} ({pct_str}) compared to previous period.",
                "evidence": {
                    "metric_name": "category_expenditure_growth",
                    "observed_value": top_g["current_amount"],
                    "baseline_value": top_g["previous_amount"],
                    "delta_percentage": pct,
                    "unit": "INR",
                },
            })

    declining_cats = category_dynamics.get("declining_categories", [])
    if declining_cats:
        top_d = declining_cats[0]
        pct_d = top_d["percentage_change"]
        abs_d = top_d["absolute_change"]
        if pct_d is not None and pct_d <= -15.0 and abs_d <= -1000.0:
            insights.append({
                "type": "category_decline",
                "category": top_d["category"],
                "value": pct_d,
                "amount": abs(abs_d),
                "unit": "INR",
                "severity": "low",
                "score": min(1.0, abs(pct_d) / 100.0),
                "title": f"Spending Reduction in {top_d['category']}",
                "explanation": f"Expenditure in {top_d['category']} reduced by ₹{abs(abs_d):,.2f} ({pct_d}%) compared to previous period.",
                "evidence": {
                    "metric_name": "category_expenditure_decline",
                    "observed_value": top_d["current_amount"],
                    "baseline_value": top_d["previous_amount"],
                    "delta_percentage": pct_d,
                    "unit": "INR",
                },
            })

    # C. Savings Trend Insight
    if savings_trend:
        s_dir = savings_trend["direction"]
        slope = savings_trend["slope"]
        growth = savings_trend["percentage_growth"]
        if s_dir == "decreasing" and slope <= -1000.0:
            savings_severity = "high" if slope <= -3500.0 else "medium"
            insights.append({
                "type": "savings_decline",
                "value": growth,
                "amount": abs(slope),
                "unit": "INR/month",
                "severity": savings_severity,
                "score": min(1.0, abs(slope) / 10000.0),
                "title": "Downtrend in Net Monthly Savings",
                "explanation": f"Net monthly savings is decreasing at an average rate of ₹{abs(slope):,.2f} per month.",
                "evidence": {
                    "metric_name": "savings_ols_slope",
                    "observed_value": slope,
                    "delta_percentage": growth,
                    "sample_size": coverage_months,
                },
            })
        elif s_dir == "increasing" and slope >= 1000.0:
            insights.append({
                "type": "savings_growth",
                "value": growth,
                "amount": slope,
                "unit": "INR/month",
                "severity": "info",
                "score": min(1.0, slope / 10000.0),
                "title": "Healthy Upward Trend in Savings",
                "explanation": f"Net monthly savings is accelerating at an average pace of ₹{slope:,.2f} per month.",
                "evidence": {
                    "metric_name": "savings_ols_slope",
                    "observed_value": slope,
                    "delta_percentage": growth,
                    "sample_size": coverage_months,
                },
            })

    # D. Weekend Concentration Insight
    w_ratio = weekend_behavior["weekend_spending_ratio"]
    if w_ratio >= 0.45 and weekend_behavior["total_expense"] >= 2000.0:
        w_pct = round(w_ratio * 100)
        weekend_severity = "high" if w_ratio >= 0.70 else ("medium" if w_ratio >= 0.52 else "low")
        insights.append({
            "type": "weekend_concentration",
            "value": w_pct,
            "unit": "percent",
            "severity": weekend_severity,
            "score": w_ratio,
            "title": "High Weekend Spending Concentration",
            "explanation": f"{w_pct}% of total expenditures occur on weekends.",
            "evidence": {
                "metric_name": "weekend_spending_ratio",
                "observed_value": w_ratio,
                "baseline_value": 0.2857,
                "delta_percentage": round(((w_ratio - 0.2857) / 0.2857) * 100),
                "unit": "ratio",
            },
        })

    # E. Volatility Insight
    vol_rating = spending_volatility["rating"]
    if vol_rating in ["volatile", "high"]:
        cv_val = spending_volatility["coefficientOfVariation"]
        insights.append({
            "type": "high_volatility",
            "value": cv_val,
            "severity": "high" if vol_rating == "volatile" else "medium",
            "score": min(1.0, cv_val),
            "title": "High Month-over-Month Spending Volatility",
            "explanation": f"Monthly expenditure exhibits significant fluctuations with a coefficient of variation of {cv_val:.2f}.",
            "evidence": {
                "metric_name": "coefficient_of_variation",
                "observed_value": cv_val,
                "baseline_value": 0.15,
                "unit": "CV",
            },
        })

    # F. Transaction Burst Insight
    burst_days = transaction_frequency.get("burst_days", [])
    if burst_days:
        top_burst = burst_days[0]
        burst_sev = "high" if top_burst["transaction_count"] >= 8 else ("medium" if top_burst["transaction_count"] >= 5 else "low")
        insights.append({
            "type": "transaction_burst",
            "amount": top_burst["total_amount"],
            "value": top_burst["transaction_count"],
            "unit": "count",
            "severity": burst_sev,
            "score": min(1.0, top_burst["transaction_count"] / 10.0),
            "title": "High-Frequency Transaction Flurry Detected",
            "explanation": f"Recorded a flurry of {top_burst['transaction_count']} transactions totaling ₹{top_burst['total_amount']:,.2f} on {top_burst['date']}.",
            "evidence": {
                "metric_name": "daily_burst_count",
                "observed_value": top_burst["transaction_count"],
                "baseline_value": transaction_frequency["daily_velocity"],
                "unit": "transactions",
            },
        })

    # 6. Behavioral Persona (from K-Means clustering if provided)
    persona = None
    if cluster_inference:
        persona = {
            "archetype": cluster_inference["archetype"],
            "cluster_id": cluster_inference.get("cluster_id"),
            "description": cluster_inference.get("description", ""),
            "confidence": cluster_inference.get("confidence", 0.9),
        }

    return {
        "schema_version": "1.0",
        "period": period,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "data_quality": data_quality,
        "summary": summary,
        "persona": persona,
        "insights": insights,
    }
