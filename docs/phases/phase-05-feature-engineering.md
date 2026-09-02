# Phase 5: Feature Engineering Report

## Objective
Implement a reproducible, deterministic, leakage-free feature engineering pipeline transforming raw transaction streams into behavioral financial feature matrices for anomaly detection, clustering, and pattern analysis (Section 22 & Section 64 of the Master Technical Specification).

## Architecture & Flow
```text
raw transactions (transactions.parquet)
       ↓
preprocessing (TransactionPreprocessor)
- ISO date validation
- Temporal extraction (year_month, day_of_week, is_weekend, day_of_month)
- Chronological per-user sorting
- Output: transactions_processed.parquet
       ↓
aggregations & behavioral features (FeatureEngineer)
- Monthly financial series (income, expense, savings)
- Category allocations (10 expense categories + discretionary)
- Volatility & trend metrics (CV, slopes, variance)
- Transaction size & velocity metrics
- Weekend spend ratio & Shannon category entropy
       ↓
feature matrix output
- user_features.parquet (10,000 rows x 31 columns)
- user_features.csv
- feature_metadata.json
```

---

## 1. Feature Catalog (28 Extracted Features)

| Feature Name | Description | Master Prompt Ref | Mean (10k Users) |
| :--- | :--- | :--- | :--- |
| `average_monthly_income` | Average monthly total income | Section 22 | ₹53,334.01 |
| `average_monthly_expense` | Average monthly total expenditure | Section 22 | ₹43,955.16 |
| `savings_rate` | Net monthly savings / monthly income * 100 | Section 22 | 16.05% |
| `average_transaction_amount` | Mean expense transaction magnitude | Section 22 | ₹1,395.17 |
| `median_transaction_amount` | Median expense transaction magnitude | Section 22 | ₹880.60 |
| `expense_volatility` | Coeff. of variation ($std / mean$) of monthly expenses | Section 22 | 0.1986 |
| `income_volatility` | Coeff. of variation of monthly income | Section 22 | 0.0515 |
| `transaction_frequency` | Average expense transaction count per active month | Section 22 | 32.05 |
| `food_ratio` | Food expenditure share of total expenses | Section 22 | 0.2404 |
| `shopping_ratio` | Shopping expenditure share of total expenses | Section 22 | 0.1798 |
| `transport_ratio` | Transport expenditure share of total expenses | Section 22 | 0.1039 |
| `bills_ratio` | Utility and recurring bills share of total expenses | Section 22 | 0.1802 |
| `discretionary_ratio` | Food + Shopping + Entertainment + Travel share | Section 22 | 0.5513 |
| `weekend_spending_ratio` | Expense volume on Fri, Sat, Sun / total expenses | Section 22 | 0.4439 |
| `monthly_expense_change` | Normalized slope of monthly expense trajectory | Section 22 | 0.0034 |
| `monthly_income_change` | Normalized slope of monthly income trajectory | Section 22 | 0.0001 |
| `largest_transaction` | Single largest expense transaction amount | Section 22 | ₹10,477.58 |
| `largest_transaction_ratio` | Largest transaction amount / total expense volume | Section 22 | 0.0381 |
| `number_of_expenses` | Total count of expense transactions | Section 22 | 240.75 |
| `number_of_income_transactions` | Total count of income transactions | Section 22 | 9.29 |
| `monthly_savings_variance` | Sample variance of net monthly savings | Section 22 | ₹37,562,398 |
| `category_spending_entropy` | Shannon entropy across 10 expense categories | Section 22 | 1.9472 |
| `education_ratio` | Education spending share | Section 22 | 0.0436 |
| `entertainment_ratio` | Entertainment spending share | Section 22 | 0.0850 |
| `healthcare_ratio` | Healthcare & medical spending share | Section 22 | 0.0435 |
| `travel_ratio` | Travel & accommodation spending share | Section 22 | 0.0461 |
| `subscriptions_ratio` | Digital subscriptions spending share | Section 22 | 0.0423 |
| `other_ratio` | Miscellaneous expenses spending share | Section 22 | 0.0519 |

---

## 2. Determinism & Leakage Prevention
- **Leakage Prevention**: All features are calculated on per-user basis strictly within user history slices; no cross-user contamination or future time-horizon information is incorporated.
- **Reproducibility**: Tested with automated assertions verifying identical input transactions always yield bit-for-bit identical feature dictionaries.
- **Edge-Case Resilience**: Zero-income, zero-expense, and single-transaction users produce bounded numeric defaults with zero division-by-zero errors or NaNs.

---

## 3. Storage & Artifacts
- Preprocessed stream: `ml/data/processed/transactions_processed.parquet` (2,500,438 rows)
- Feature matrix: `ml/data/features/user_features.parquet` (10,000 rows x 31 columns)
- Feature metadata: [`ml/data/features/feature_metadata.json`](file:///home/surya/Project_dir/Expense_super/ml/data/features/feature_metadata.json)

---

## 4. Quality & Testing Verification
- **Automated Python Pytest Suite**: 15 passed tests in `ml/tests/` (6 feature engineering tests, 2 validation tests, 6 generator tests, 1 placeholder).
- **TypeScript Vitest Suite**: 55 passed tests in `packages/`.
- **TypeScript Typecheck**: 0 errors across all 8 workspace projects.
- **ESLint & Prettier**: 0 issues.
- **Validation Script**: `./scripts/validate.sh` PASSED.
