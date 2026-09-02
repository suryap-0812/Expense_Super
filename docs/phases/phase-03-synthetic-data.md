# Phase 3: Synthetic Data Generator Report

## Objective
Implement a Python-based synthetic financial data generator modeling 10,000 users, 3–12 months of multi-transaction history per user, 10 distinct behavioral profiles, and controlled injected anomalies, producing reproducible datasets saved in both CSV and high-efficiency Parquet formats.

## Completed Artifacts

### 1. Environment & Dependencies
- `.venv`: Python 3.12 virtual environment initialized with `numpy>=1.26.0`, `pandas>=2.2.0`, `pyarrow>=15.0.0`, `scikit-learn>=1.4.0`, `scipy>=1.12.0`, `skl2onnx>=1.17.0`, `onnx>=1.16.0`, `onnxruntime>=1.18.0`, `pytest>=8.0.0`, `pytest-cov>=5.0.0`, `pydantic>=2.7.0`.
- Pinned in `ml/requirements.txt`.

### 2. Behavioral Profiles (`ml/src/generation/profiles.py`)
Modeled all 10 profiles specified in Section 18 of the Master Prompt:
1. **Good Saver**: ~50% savings rate, low discretionary expenses, disciplined bill payments.
2. **Overspender**: Negative savings rate (-18%), high shopping, dining, and travel expenses exceeding income.
3. **Food Heavy**: Food expenditures account for >40% of total expenses.
4. **Shopping Heavy**: Shopping expenditures account for >35% of total expenses.
5. **Irregular Spender**: High standard deviation in monthly spending, bursty purchases.
6. **Consistent Spender**: Low variance, steady recurring expenses and utilities.
7. **Weekend Spender**: Heavy concentration (>55%) of discretionary spending on Friday, Saturday, and Sunday.
8. **Impulse Spender**: Random high-value discretionary spikes.
9. **Variable Income**: Freelancer/consultant with fluctuating income payments and seasonal variations.
10. **Goal-Oriented Saver**: Disciplined planned recurring allocations (~38% savings).

### 3. Controlled Anomaly Injector (`ml/src/generation/anomalies.py`)
Implemented Section 21 controlled anomaly types with explicit ground-truth flags:
- `spending_anomaly`: Large 3x–6x single purchases.
- `category_increase`: Sudden surge in specific category (e.g. Shopping surge).
- `savings_decline`: Sudden collapse in savings rate within a pay cycle.
- `weekend_spike`: Extreme weekend spending surges.
- `frequency_burst`: High-velocity transaction flurry within 48 hours.

### 4. Generator Implementation (`ml/src/generation/generator.py`)
- Programmatic and CLI interface (`python ml/src/generation/generator.py --num-users 10000 --seed 42`).
- Generated dataset saved to `ml/data/raw/`:
  - `users.parquet` (151 KB) / `users.csv` (475 KB): 10,000 users.
  - `transactions.parquet` (32 MB) / `transactions.csv` (224 MB): 2,490,340 transactions.
  - `metadata.json`: Generation timestamp, seed, user and transaction metrics, profile counts, and anomaly statistics.

### 5. Automated Tests (`ml/tests/test_generator.py`)
- Deterministic reproducibility test (identical seeds yield exact identical data).
- Coverage of all 10 behavioral profiles.
- Validation of schema columns (`transaction_id`, `user_id`, `type`, `amount`, `category`, `payment_method`, `transaction_date`, `description`, `is_anomaly`, `anomaly_type`).
- Verification of positive amounts and active month bounds (3–12 months).
- Verification of anomaly injection and labeling integrity.
- Dataset persistence test.

## Dataset Summary (`ml/data/raw/metadata.json`)
- **Total Users**: 10,000
- **Total Transactions**: 2,490,340
- **Income Transactions**: 82,863
- **Expense Transactions**: 2,407,477
- **Total Anomalies**: 7,511 (0.302% of all transactions)
- **Profile Distribution**:
  - Consistent Spender: 1,035
  - Variable Income: 1,015
  - Goal-Oriented Saver: 1,012
  - Weekend Spender: 1,012
  - Overspender: 1,009
  - Impulse Spender: 993
  - Shopping Heavy: 992
  - Food Heavy: 986
  - Good Saver: 976
  - Irregular Spender: 970

## Validation Results
- **Pytest**: 7 passed tests in `ml/tests/`
- **TypeScript**: 0 errors (`pnpm run typecheck`)
- **ESLint**: 0 errors (`pnpm run lint`)
- **Prettier**: 0 issues (`pnpm run format:check`)
- **Vitest**: 55 passed tests (`pnpm run test`)
- **Full Pipeline**: `./scripts/validate.sh` PASSED.
