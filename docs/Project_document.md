# Expense Tracker — V1 Project Specification

## 1. Project Overview

**Project Name:** Expense Tracker
**Version:** V1
**Platform:** Android + iOS + Web
**Architecture:** Local-first / serverless application
**Users:** Single user
**Data Entry:** 100% manual in V1
**AI:** ML-based financial behavior analysis + external LLM explanation
**Primary Interface:** Single dashboard
**Backend Server:** None

The application is a personal finance management system designed to help a user understand:

* How much money they currently have
* How much money they receive
* How much they spend
* How much they save
* Where their money is being spent
* How much money is allocated toward specific goals
* How much money is actually available to spend
* What patterns exist in their spending and saving behavior
* What actions could improve their saving behavior

The system should be **simple, refined, information-dense, and Excel-inspired**, while remaining a modern application rather than an actual spreadsheet.

---

# 2. Core Product Concept

The application revolves around five primary financial concepts.

### 2.1 Bank Balance

The amount of money currently available in the user's bank account.

The user manually enters and updates this value.

```text
Bank Balance = ₹50,000
```

This is treated as the application's **authoritative current balance**.

The application should not assume:

```text
Initial Balance + Transactions = Current Bank Balance
```

because the user may have:

* unrecorded transactions
* cash transactions
* bank charges
* transfers
* external income
* other accounts
* corrections

---

### 2.2 Money Received

Money entering the user's tracked finances.

Internally:

```text
transaction.type = income
```

The UI can display this as:

> Debit / Money Received

Examples:

* Salary
* Allowance
* Freelance payment
* Refund
* Gift
* Other income

---

### 2.3 Money Spent

Money leaving the user's tracked finances.

Internally:

```text
transaction.type = expense
```

The UI can display this as:

> Credit / Money Spent

Examples:

* Food
* Shopping
* Transport
* Bills
* Education
* Entertainment

**Important:** Internally, `income` and `expense` should be used instead of relying on Debit/Credit terminology because accounting systems can interpret debit/credit differently.

---

### 2.4 Savings

For a selected period:

```text
Savings = Total Income - Total Expenses
```

Example:

```text
Income   = ₹30,000
Expenses = ₹22,000

Savings  = ₹8,000
```

Savings should be displayed for:

* Daily
* Weekly
* Monthly
* Annual
* Custom period

---

### 2.5 Goals / Allocations

Goals represent **money reserved for a purpose**.

Example:

```text
Bank Balance = ₹50,000

No-Touch Money       ₹10,000
New Smartphone       ₹15,000
Emergency Fund       ₹10,000
------------------------------
Allocated            ₹35,000
```

The allocations are **not expenses**.

The money has not been spent.

It has simply been reserved.

---

# 3. Available to Spend

This is a core V1 feature.

```text
Available to Spend
=
Bank Balance - Total Goal Allocations
```

Example:

```text
Bank Balance       ₹50,000
Goal Allocations   ₹35,000
---------------------------
Available to Spend ₹15,000
```

This should be displayed separately from:

* Savings
* Bank Balance
* Goal allocations

This distinction prevents the user from thinking that all money in the bank is freely spendable.

---

# 4. Product Objectives

V1 must accomplish the following:

1. Record income manually.
2. Record expenses manually.
3. Categorize transactions.
4. Track the current bank balance.
5. Calculate savings.
6. Calculate savings rate.
7. Track spending by category.
8. Track multiple financial goals.
9. Allocate money to goals.
10. Calculate available-to-spend.
11. Analyze spending patterns.
12. Analyze saving behavior.
13. Detect unusual spending.
14. Detect changes in financial behavior.
15. Generate evidence-based financial insights.
16. Use an LLM to explain those insights.
17. Provide practical saving guidance.
18. Keep core financial data local.
19. Work without a backend server.
20. Provide a single unified dashboard.

---

# 5. V1 Scope

## Included

### Financial Management

* Bank balance
* Income
* Expenses
* Categories
* Payment methods
* Transaction dates
* Notes
* Descriptions
* Transaction history
* Search
* Filtering
* Sorting

### Savings

* Daily savings
* Weekly savings
* Monthly savings
* Annual savings
* Custom-period savings
* Savings rate
* Savings trends

### Goals

* Create goals
* Edit goals
* Delete goals
* Target amount
* Current allocation
* Progress
* Optional deadline
* Goal description
* Allocation history

### Analytics

* Income vs expenses
* Spending by category
* Monthly spending
* Spending trends
* Savings trends
* Spending volatility
* Transaction frequency
* Category changes

### ML

* Spending anomaly detection
* Spending pattern detection
* Saving behavior analysis
* Behavioral profiling
* Trend detection

### LLM

* Explain ML findings
* Summarize financial behavior
* Generate practical recommendations
* Prioritize important findings
* Convert technical ML results into human-readable language

### Infrastructure

* Local database
* Local financial data
* Secure API-key storage
* Export/backup
* Cross-platform UI

---

# 6. Explicitly Out of Scope for V1

The following should **not** be implemented initially:

* Bank API integration
* Automatic bank transaction retrieval
* Bank scraping
* Automatic transaction synchronization
* Multi-user support
* Social features
* Investments
* Stocks
* Cryptocurrency
* Loans
* Credit scores
* Insurance
* Tax management
* Bill payment
* Financial product recommendations
* Automatic money transfers
* Complex accounting
* Server-side financial database
* Deep-learning financial prediction
* Autonomous financial actions

---

# 7. User Interface

## 7.1 Single Dashboard

There should be **no navbar and no multi-page application structure** for V1.

The main screen is one dashboard containing all major modules.

Detailed information can be displayed through:

* Modals
* Drawers
* Expandable sections
* Dialogs
* Inline editing

---

# 8. Dashboard Structure

## Section A — Financial Summary

Top-level cards:

```text
┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│ Bank Balance   │ │ Available      │ │ Savings        │
│ ₹50,000        │ │ ₹15,000        │ │ ₹8,000         │
└────────────────┘ └────────────────┘ └────────────────┘

┌────────────────┐ ┌────────────────┐
│ Received       │ │ Spent          │
│ ₹30,000        │ │ ₹22,000        │
└────────────────┘ └────────────────┘
```

---

## Section B — Financial Overview

Display:

* Income vs expense
* Savings
* Savings rate
* Period selector

Example:

```text
Period: May 2026

Income      ₹30,000
Expenses    ₹22,000
Savings      ₹8,000
Savings Rate    26.7%
```

---

# 9. Transaction System

Each transaction should contain:

```text
Transaction
├── ID
├── Type
├── Amount
├── Category
├── Description
├── Payment Method
├── Date
├── Notes
├── Created At
└── Updated At
```

### Example

```text
ID: TXN_00123
Type: expense
Amount: ₹850
Category: Food
Payment Method: UPI
Date: 2026-05-14
Description: Lunch
```

---

# 10. Transaction Categories

Initial categories can include:

### Income

* Salary
* Freelance
* Allowance
* Refund
* Gift
* Other

### Expenses

* Food
* Transport
* Shopping
* Bills
* Education
* Entertainment
* Healthcare
* Travel
* Subscriptions
* Other

Categories should be configurable in the future.

---

# 11. Goal System

Each goal should have:

```text
Goal
├── ID
├── Name
├── Target Amount
├── Allocated Amount
├── Deadline
├── Description
├── Status
├── Created At
└── Updated At
```

Production implementation should preferably use a separate allocation history:

```text
goals
goal_allocations
```

rather than storing only a single `allocated_amount`.

This preserves the history of:

* allocations
* reductions
* changes
* dates

---

# 12. Financial Calculations

These calculations must be **deterministic**.

ML and LLM must not be responsible for them.

### Total Income

```text
Σ income transactions
```

### Total Expenses

```text
Σ expense transactions
```

### Savings

```text
Income - Expenses
```

### Savings Rate

```text
Savings Rate =
(Savings / Income) × 100
```

If income is zero:

```text
Savings Rate = undefined / N/A
```

Do not divide by zero.

### Available to Spend

```text
Bank Balance - Total Goal Allocations
```

### Goal Progress

```text
Allocated Amount / Target Amount × 100
```

---

# 13. AI Architecture

The AI system is deliberately separated into two components.

```text
             USER DATA
                 │
                 ▼
        ┌─────────────────┐
        │ Feature          │
        │ Engineering      │
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ Statistics + ML │
        └────────┬────────┘
                 │
                 ▼
        Structured Evidence
                 │
                 ▼
        ┌─────────────────┐
        │      LLM        │
        └────────┬────────┘
                 │
                 ▼
        Human-readable
        financial guidance
```

---

# 14. ML Responsibilities

The ML system should **not give generic financial advice**.

Its job is to identify evidence from the user's behavior.

### ML analyzes:

* Spending patterns
* Spending anomalies
* Category changes
* Spending volatility
* Transaction frequency
* Saving consistency
* Spending trends
* Behavioral characteristics

### ML does NOT determine:

* Bank balance
* Savings amount
* Available-to-spend
* Goal balance
* Authoritative financial totals

Those are deterministic calculations.

---

# 15. LLM Responsibilities

The LLM receives structured ML results.

For example:

```json
{
  "period": "monthly",
  "insights": [
    {
      "type": "category_increase",
      "category": "Shopping",
      "change_percent": 31.4,
      "severity": "medium"
    },
    {
      "type": "savings_decline",
      "change_percent": -8.7,
      "severity": "medium"
    },
    {
      "type": "spending_anomaly",
      "category": "Shopping",
      "amount": 8500,
      "severity": "high"
    }
  ]
}
```

The LLM converts this into something like:

> Shopping expenditure increased significantly compared with your recent baseline. Your savings rate also declined. Consider reviewing recent discretionary purchases and setting a temporary shopping limit.

The LLM should **never invent values**.

---

# 16. LLM Constraints

The LLM must:

* Only use supplied financial evidence.
* Never invent transactions.
* Never invent income.
* Never invent expenses.
* Never invent goals.
* Never override deterministic calculations.
* Never override ML results without evidence.
* Clearly identify insufficient data.
* Avoid pretending to provide professional financial advice.
* Never execute financial transactions.

---

# 17. Synthetic Dataset Strategy

Because there is initially **no real user dataset**, V1 ML development begins with synthetic data.

The synthetic dataset should mimic the actual application.

Instead of generating only random transactions, we generate **synthetic users with different financial behaviors**.

---

# 18. Synthetic User Profiles

The generator should create behavioral profiles such as:

### Profile 1 — Good Saver

Characteristics:

* High savings rate
* Controlled discretionary spending
* Low volatility
* Regular income

### Profile 2 — Overspender

Characteristics:

* High expense-to-income ratio
* Low savings
* Frequent discretionary spending

### Profile 3 — Food Heavy

Characteristics:

* High Food expenditure
* Frequent food transactions

### Profile 4 — Shopping Heavy

Characteristics:

* High Shopping expenditure
* Periodic large transactions

### Profile 5 — Irregular Spender

Characteristics:

* High spending volatility
* Unpredictable expenses

### Profile 6 — Consistent Spender

Characteristics:

* Stable expenses
* Low volatility
* Predictable behavior

### Profile 7 — Weekend Spender

Characteristics:

* High percentage of expenses during weekends

### Profile 8 — Impulse Spender

Characteristics:

* Many small discretionary transactions
* High transaction frequency

### Profile 9 — Variable Income

Characteristics:

* Income changes significantly between months

### Profile 10 — Goal-Oriented Saver

Characteristics:

* Consistent saving
* Regular goal allocations
* Controlled discretionary spending

---

# 19. Synthetic Dataset Size

Initial target:

```text
10,000 synthetic users
×
3–12 months of history
×
multiple transactions per month
```

This should generate a sufficiently large dataset for experimentation.

The exact size can be adjusted based on computational requirements.

---

# 20. Synthetic Transaction Schema

Example:

```text
transaction_id
user_id
type
amount
category
payment_method
transaction_date
description
```

Example:

```text
TXN_000001
USER_00042
expense
850
Food
UPI
2026-05-14
Lunch
```

---

# 21. Synthetic Data Generation

The generator should not produce completely uniform random data.

Instead:

```text
User Profile
     ↓
Income Distribution
     ↓
Expense Distribution
     ↓
Category Preferences
     ↓
Transaction Frequency
     ↓
Temporal Behavior
     ↓
Synthetic Transactions
```

For example, a weekend spender should have a significantly higher probability of transactions on:

```text
Saturday
Sunday
```

A shopping-heavy user should have larger and more frequent shopping transactions.

---

# 22. Important Synthetic Anomalies

The dataset should deliberately contain known anomalies.

Example:

```text
Normal Shopping:
₹2,000–₹4,000/month

Injected anomaly:
₹12,000 in one month
```

Expected ML result:

```text
Shopping spending anomaly detected
```

Other injected anomalies:

* unusually large transaction
* sudden category increase
* sudden savings decline
* unusual transaction frequency
* abnormal weekend spending

This gives us **known ground truth for validation**.

---

# 23. ML Feature Engineering

Raw transactions are not directly suitable for all analysis.

We convert them into behavioral features.

Example:

```text
average_monthly_income
average_monthly_expense
savings_rate
average_transaction_amount
expense_volatility
transaction_frequency
food_ratio
shopping_ratio
transport_ratio
weekend_spending_ratio
monthly_expense_change
monthly_income_change
```

Additional features can include:

```text
largest_transaction
median_transaction
number_of_expenses
number_of_income_transactions
category_entropy
monthly_savings_variance
category_spending_variance
```

---

# 24. ML Models

## Model 1 — Isolation Forest

Primary V1 ML model.

Purpose:

> Detect unusual spending behavior.

Example:

```text
Normal transactions
       ↓
Feature extraction
       ↓
Isolation Forest
       ↓
Anomaly score
       ↓
Anomaly detected
```

Isolation Forest is appropriate because V1 does not naturally have labeled examples of every possible financial anomaly.

---

# 25. Statistical Analysis

Not everything needs machine learning.

Some analyses should use deterministic statistics.

Examples:

### Spending Trend

```text
Month 1 → ₹15,000
Month 2 → ₹17,000
Month 3 → ₹19,000
Month 4 → ₹22,000
```

Detect:

> Spending is increasing.

### Savings Trend

```text
35%
31%
27%
21%
```

Detect:

> Savings rate is declining.

### Category Change

```text
Previous Food spending = ₹3,000
Current Food spending  = ₹4,200

Change = +40%
```

These can be calculated statistically.

---

# 26. Optional Behavioral Clustering

Later in V1:

**K-Means**

could cluster users according to financial behavior.

Example:

```text
Cluster A → Strong savers
Cluster B → High discretionary spending
Cluster C → Highly variable spending
Cluster D → Consistent spending
```

This should be considered an enhancement rather than a core dependency.

---

# 27. ML Output Schema

The ML system should not directly return prose.

It should return structured data.

Example:

```json
{
  "period": "2026-05",
  "data_quality": {
    "transaction_count": 87,
    "sufficient_data": true
  },
  "insights": [
    {
      "type": "category_increase",
      "category": "Shopping",
      "value": 31.4,
      "unit": "percent",
      "severity": "medium"
    },
    {
      "type": "spending_anomaly",
      "category": "Shopping",
      "amount": 8500,
      "severity": "high"
    },
    {
      "type": "savings_decline",
      "value": -8.7,
      "unit": "percent",
      "severity": "medium"
    }
  ]
}
```

This structured layer is the contract between ML and the LLM.

---

# 28. Cold-Start Strategy

A new user will have little or no historical data.

Therefore the system should adapt its analysis to data availability.

### Very little data

Use:

* basic statistics
* transaction summaries
* category totals

Avoid strong behavioral conclusions.

### Moderate history

Use:

* category trends
* basic anomaly detection
* spending patterns

### Longer history

Use:

* personal baselines
* behavioral trends
* volatility
* stronger anomaly detection
* behavioral profiling

The exact thresholds should be validated experimentally rather than treated as universal scientific rules.

---

# 29. Critical ML Principle

We are **not** building:

```text
Dataset
   ↓
Train neural network
   ↓
Predict financial advice
```

We are building:

```text
Transactions
      ↓
Feature Engineering
      ↓
Statistics
      +
ML
      ↓
Evidence
      ↓
Insight Schema
      ↓
LLM
      ↓
Explanation
      ↓
Guidance
```

This is much more appropriate for a personal finance application with limited personalized data.

---

# 30. ML Development Environment

Recommended:

```text
Python
pandas
NumPy
scikit-learn
matplotlib
joblib
```

Optional:

```text
Jupyter Notebook
```

For V1, **PyTorch and TensorFlow are unnecessary**.

---

# 31. ML Project Structure

```text
expense-tracker-ml/
│
├── data/
│   ├── raw/
│   │   └── synthetic_transactions.csv
│   │
│   ├── processed/
│   │
│   └── features/
│
├── src/
│   │
│   ├── data_generation/
│   │   └── generator.py
│   │
│   ├── preprocessing/
│   │   └── preprocessing.py
│   │
│   ├── features/
│   │   └── feature_engineering.py
│   │
│   ├── analysis/
│   │   ├── spending_analysis.py
│   │   └── saving_analysis.py
│   │
│   ├── models/
│   │   ├── anomaly_detector.py
│   │   └── behavior_cluster.py
│   │
│   ├── output/
│   │   └── insight_schema.py
│   │
│   └── pipeline.py
│
├── models/
│   └── trained/
│
├── notebooks/
│   └── exploration.ipynb
│
├── tests/
│
├── requirements.txt
└── README.md
```

---

# 32. Application Architecture

The eventual application should follow:

```text
┌─────────────────────────────────────────┐
│              DASHBOARD UI               │
│                                         │
│ Balance │ Available │ Savings │ Income  │
│                                         │
│ Charts / Transactions / Goals / Insights│
└───────────────────┬─────────────────────┘
                    │
                    ▼
          ┌───────────────────┐
          │ Application Logic │
          └─────────┬─────────┘
                    │
        ┌───────────┴────────────┐
        ▼                        ▼
┌───────────────┐        ┌────────────────┐
│ Local SQLite  │        │ Analytics / ML │
│ Database      │        │ Engine         │
└───────────────┘        └───────┬────────┘
                                 │
                                 ▼
                         Structured Results
                                 │
                                 ▼
                          ┌────────────┐
                          │ External   │
                          │ LLM API    │
                          └────────────┘
```

---

# 33. Local-First Architecture

The financial application should not require a traditional backend server.

Core data is stored locally.

```text
Application
    │
    ├── UI
    ├── Local SQLite
    ├── Financial calculations
    ├── Analytics
    └── ML
```

The only external dependency for AI explanation is the user's chosen LLM API.

---

# 34. LLM API

The user provides their own API key.

The application can use an external provider such as OpenRouter.

Conceptually:

```text
User
 │
 └── API Key
       │
       ▼
Application
       │
       ▼
LLM Provider
       │
       ▼
LLM Response
```

The API key should **not be stored as a normal database field**.

It should be stored using secure platform storage appropriate to Android/iOS/Web.

---

# 35. Privacy Architecture

The system should follow a privacy-first design.

Financial data should remain local wherever possible.

The LLM request should contain only the minimum information required to explain the ML results.

Prefer:

```text
ML result:
"Shopping spending increased 31.4%"
```

instead of sending the user's entire transaction history.

The application should not unnecessarily send:

* complete transaction databases
* private notes
* unrelated descriptions
* unnecessary personal information

to the LLM.

---

# 36. Database Design

Recommended tables:

```text
users
transactions
categories
goals
goal_allocations
balance_history
ai_insights
settings
```

Even though V1 is single-user, keeping a lightweight `users` abstraction can make future migration easier.

---

# 37. Transaction Table

```text
transactions
----------------------
id
type
amount
category_id
description
payment_method
transaction_date
notes
created_at
updated_at
```

---

# 38. Goals

```text
goals
----------------------
id
name
target_amount
deadline
description
status
created_at
updated_at
```

And:

```text
goal_allocations
----------------------
id
goal_id
amount
allocation_date
note
created_at
```

---

# 39. Balance History

```text
balance_history
----------------------
id
balance
recorded_at
note
```

This allows future analysis of how the manually entered bank balance changes over time.

---

# 40. AI Insights

```text
ai_insights
----------------------
id
generated_at
period
insight_type
severity
ml_result
llm_explanation
```

The exact schema can evolve during implementation.

---

# 41. Recommended Application Stack

For the cross-platform application:

### Frontend

**Flutter**

Reason:

* Android
* iOS
* Web
* Single codebase
* Strong UI capabilities
* Suitable for dashboard-style applications

### Local Database

**SQLite**

Reason:

* Local
* Structured relational data
* Good for transaction records
* No backend required
* Reliable querying
* Suitable for financial records

### ML

**Python + scikit-learn**

Initially developed independently from the application.

### LLM

External API such as OpenRouter.

### Secure Storage

Platform-specific secure storage for:

* API keys
* sensitive configuration

---

# 42. Why SQLite

SQLite is preferable to browser-only storage because the application contains structured relational data:

```text
Transactions
     ↓
Categories

Goals
     ↓
Goal Allocations

Insights
     ↓
Transactions / Periods
```

SQLite also gives us:

* SQL queries
* indexes
* transactions
* constraints
* structured persistence
* easier export/backup

For this application, it is substantially more appropriate than relying purely on browser local storage.

---

# 43. ML Model Deployment

During development:

```text
Python ML project
      ↓
Train models
      ↓
Save model
```

For example:

```text
models/trained/anomaly_model.joblib
```

The final integration strategy should then be selected based on the target platform.

Possible approaches include:

* embedding the model into the application
* converting the model to a portable format
* implementing lightweight inference directly in the application
* maintaining a local Python inference process if the desktop/web environment permits it

The exact deployment mechanism should be decided after the model itself is validated.

---

# 44. Validation Strategy

Synthetic data gives us controlled experiments.

Example:

```text
Synthetic User
     ↓
Normal behavior
     ↓
Inject anomaly
     ↓
Run ML
     ↓
Check detection
```

We should evaluate:

### Anomaly Detection

* Precision
* Recall
* False-positive rate
* Detection rate on injected anomalies

### Pattern Detection

Compare system output against known synthetic behavior.

Example:

```text
Generated:
Shopping +40%

Detected:
Shopping increase ✓
```

### Saving Analysis

Generated:

```text
Savings:
35% → 30% → 25% → 20%
```

Expected:

```text
Declining savings trend ✓
```

---

# 45. Model Validation Principle

We should not rely solely on:

```text
accuracy = 95%
```

because synthetic data is generated by our own assumptions.

Instead we need:

1. Statistical validation
2. Known-behavior validation
3. Anomaly injection testing
4. Edge-case testing
5. False-positive testing
6. Sensitivity analysis
7. Different synthetic user profiles

---

# 46. Testing Strategy

## Unit Tests

Test:

* Income calculation
* Expense calculation
* Savings calculation
* Savings rate
* Goal allocation
* Available-to-spend
* Feature calculations

## ML Tests

Test:

* Feature generation
* Missing values
* Anomaly detection
* Trend detection
* Behavioral profiles
* Structured output

## Integration Tests

Test:

```text
Transactions
→ Analytics
→ ML
→ Structured JSON
→ LLM
```

## UI Tests

Test:

* Transaction creation
* Editing
* Deletion
* Goal creation
* Allocation
* Dashboard calculations
* Responsive layouts

---

# 47. Error Handling

The application should continue functioning if the LLM fails.

For example:

```text
LLM unavailable
     ↓
Financial calculations still work
     ↓
ML analysis still works
     ↓
Structured insights remain available
```

The LLM is an enhancement, not a core dependency.

---

# 48. Data Backup

V1 should support:

* Data export
* Local backup
* Restore

Possible formats:

```text
JSON
CSV
```

The export should include relevant financial records.

---

# 49. Security Requirements

The application must:

* Avoid logging financial information
* Avoid logging API keys
* Secure API keys
* Validate all user inputs
* Validate LLM responses
* Use HTTPS for external API calls
* Avoid unnecessary external data transmission
* Protect local database access where platform capabilities allow
* Never expose API keys in application logs

---

# 50. Complete ML Development Roadmap

This is the **new priority order** for V1.

### Phase 1 — Define Data Model

Create:

```text
transactions
categories
users
```

Define exact fields and constraints.

### Phase 2 — Build Synthetic Generator

Generate:

```text
10,000 users
multiple months
different financial profiles
```

### Phase 3 — Validate Synthetic Dataset

Check:

* distributions
* category proportions
* income ranges
* transaction frequency
* savings rates
* behavioral profiles

### Phase 4 — Feature Engineering

Convert raw transactions into behavioral features.

### Phase 5 — Baseline Analytics

Implement statistical analysis before ML.

### Phase 6 — Anomaly Detection

Implement Isolation Forest.

### Phase 7 — Pattern Detection

Implement:

* category changes
* spending trends
* savings trends
* volatility

### Phase 8 — Behavioral Clustering

Experiment with K-Means.

### Phase 9 — Structured ML Output

Create a stable JSON schema.

### Phase 10 — Validation

Use known synthetic behavior and injected anomalies.

### Phase 11 — Model Packaging

Save validated models and define inference interface.

### Phase 12 — Application Integration

Connect ML with the local application.

### Phase 13 — LLM Integration

Send structured ML results to the external LLM.

### Phase 14 — Guidance Engine

Generate:

* explanations
* priorities
* saving suggestions
* warnings

### Phase 15 — Production Hardening

Test:

* privacy
* security
* performance
* edge cases
* API failures
* database failures
* corrupted data

---

# 51. Final V1 Architecture

```text
                         ┌──────────────┐
                         │    USER      │
                         └──────┬───────┘
                                │
                                ▼
                    ┌─────────────────────┐
                    │   SINGLE DASHBOARD  │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
        Transactions        Goals         Bank Balance
              │                │                │
              └────────────────┼────────────────┘
                               ▼
                       ┌───────────────┐
                       │  SQLite DB    │
                       └───────┬───────┘
                               │
                               ▼
                    ┌────────────────────┐
                    │ Financial Engine   │
                    │                    │
                    │ Income             │
                    │ Expenses           │
                    │ Savings             │
                    │ Savings Rate       │
                    │ Available-to-Spend │
                    │ Goal Progress      │
                    └─────────┬──────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │ Feature Engineering│
                    └─────────┬──────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │ Statistics + ML    │
                    │                    │
                    │ Anomalies          │
                    │ Patterns            │
                    │ Trends              │
                    │ Behavior            │
                    └─────────┬──────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │ Structured Insights│
                    │       JSON         │
                    └─────────┬──────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │ External LLM       │
                    │   via API          │
                    └─────────┬──────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │ Human-readable     │
                    │ Financial Guidance │
                    └────────────────────┘
```

# 52. V1 Definition of Done

V1 is complete when:

* [ ] User can manually enter income.
* [ ] User can manually enter expenses.
* [ ] User can manually update bank balance.
* [ ] User can create multiple goals.
* [ ] User can allocate money to goals.
* [ ] Available-to-spend is calculated correctly.
* [ ] Savings are calculated correctly.
* [ ] Dashboard displays all major financial information.
* [ ] Transaction history works.
* [ ] Spending analytics work.
* [ ] Synthetic dataset generator works.
* [ ] Multiple synthetic financial behaviors are generated.
* [ ] ML feature pipeline works.
* [ ] Anomaly detection works.
* [ ] Spending pattern detection works.
* [ ] Saving pattern detection works.
* [ ] ML output follows a structured schema.
* [ ] Synthetic anomalies are successfully detected.
* [ ] Validated ML model is packaged for application integration.
* [ ] LLM can explain ML results.
* [ ] LLM does not invent financial information.
* [ ] Core application works without the LLM.
* [ ] Financial data remains local.
* [ ] API key is securely stored.
* [ ] Data can be exported/backed up.
* [ ] Android, iOS, and Web builds function correctly.
* [ ] Production-level error handling and testing are completed.

---

## Final Development Philosophy

The most important architectural decision for this project is:

> **The ML model is an analytical engine, not a financial-advice generator.**

The system should therefore remain:

```text
                 DATA
                   ↓
            DETERMINISTIC
             CALCULATIONS
                   ↓
              FEATURES
                   ↓
           STATISTICS + ML
                   ↓
              EVIDENCE
                   ↓
                 LLM
                   ↓
             EXPLANATION
                   ↓
              GUIDANCE
```

And for the initial ML development:

```text
Synthetic Users
      ↓
Synthetic Transactions
      ↓
Feature Engineering
      ↓
Statistics
      ↓
Isolation Forest
      ↓
Pattern Detection
      ↓
Behavioral Analysis
      ↓
Structured JSON
```
