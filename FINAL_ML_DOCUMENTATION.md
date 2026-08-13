# VoltHive AI - Production Machine Learning Architecture & Defense

> [!NOTE]
> This document details the final, production-grade machine learning pipeline powering the VoltHive platform. It outlines the practical data variables used, the exact hyperparameter values tested during Phase 1 (The Search), the parameters applied in Phase 2 (The Final Train), and the empirical metrics that defend the final model selection.

## 1. Executive Summary

To achieve production-level precision in predicting EV charging station utilization, we developed a custom **Two-Phase Hybrid Pipeline** analyzing **1,317,750 real-world charging records**. 

By evaluating three distinct algorithmic architectures—Random Forest, HistGradientBoosting, and Ridge Linear Baseline—and ruthlessly optimizing them via Grid Search Cross-Validation, the final pipeline achieved a **Mean Absolute Error (MAE) of 0.0565** (≈5.65 percentage points) and an **R² score of 0.9276** on 263,550 unseen test records. Under the honest threshold-based metric, **59.38% of predictions fall within ±5 percentage points** and **79.87% within ±10 percentage points** of the actual utilization. The entire automated optimization and training process completed in **1 hour, 50 minutes, and 21 seconds**.

---

## 2. Practical Data Inputs (Variable Mapping)

A critical requirement for this model was ensuring that the data it learns from can actually be provided in a real-world, live production scenario. We eliminated impractical variables (like real-time traffic index) to ensure the model remains robust and scalable.

The AI utilizes **12 Practical Variables**, mapped seamlessly between the training dataset and the real-world backend API:

| Variable Concept | Training Data Column | Real-World Source (In Production) |
| :--- | :--- | :--- |
| **Time Context** | `hour_of_day`, `day_of_week`, `month`, `is_weekend`, `is_peak_hour` | Calculated automatically by the NodeJS backend using `new Date()` when a prediction is requested. |
| **Weather** | `temperature_f`, `precipitation_mm`, `weather_condition` | Fetched dynamically via the **Open-Meteo Weather API** using the station's geographic coordinates. |
| **Station Specs** | `location_type`, `charger_type`, `power_output_kw` | Read directly from the `Station` collection in MongoDB. |
| **Local Environment** | `local_event` | Manually added by the Station Owner at the start of the week/month via the VoltHive Dashboard. |

---

## 3. Phase 1 Details: The Hyperparameter Search

To train on over 1.3 million records without computationally crashing, we split the process. **Phase 1** isolated a mathematically secure **300,000-row sample** from the training set. 

Its sole job was to run a **Grid Search Cross-Validation**, meaning it tested dozens of different configurations (values) for each algorithm to see which mathematically performed the best. 

**Here are the exact values tested in Phase 1:**

### A. Random Forest Regressor (Total: 81 Fits)
* **`n_estimators` (Number of Trees Tested):** [100, 200, 300]
* **`max_depth` (Depth of Trees Tested):** [15, 25, None (Infinite)]
* **`min_samples_split` (Leaf split threshold):** [2, 10, 20]

### B. HistGradientBoosting (Total: 162 Fits)
* **`learning_rate` (Step Size Tested):** [0.01, 0.05, 0.1]
* **`max_iter` (Boosting Stages Tested):** [200, 500]
* **`max_depth` (Depth of Trees Tested):** [10, 20, 30]
* **`l2_regularization` (Penalty Tested):** [0.0, 0.5, 1.0]

### C. Ridge Linear Baseline (Total: 15 Fits)
* **`alpha` (Regularization Strength Tested):** [0.01, 0.1, 1.0, 10.0, 100.0]

---

## 4. Phase 2 Details: The Final Production Train

Once Phase 1 discovered the "perfect" combination of values for each model, the script shifted to **Phase 2**. 

In Phase 2, the AI loaded the massive **1,054,200 row Master Training Set**. It applied the winning values from Phase 1, trained the models on the millions of records, and then scored them against a completely unseen **263,550 row Test Set**.

**Here are the final, optimal values applied during Phase 2 training:**

* **Random Forest Regressor:** `max_depth = 25`, `min_samples_split = 20`, `n_estimators = 300`
* **HistGradientBoosting:** `l2_regularization = 1.0`, `learning_rate = 0.1`, `max_depth = 20`, `max_iter = 500`
* **Ridge Linear Baseline:** `alpha = 0.01`

---

## 5. Final Benchmark & Champion Selection

By testing these optimal configurations against the massive unseen Test Set (263,550 rows), we generated the final evaluation matrix:

| Algorithm Name | MAE | RMSE | R² Score | Accuracy (within ±5%) |
| :--- | :--- | :--- | :--- | :--- |
| **Random Forest Regressor** | 0.0567 | 0.0823 | 0.9245 | — |
| **HistGradientBoosting (WINNER)** | **0.0565** | **0.0806** | **0.9276** | **59.38 %** |
| **Ridge Linear Baseline** | 0.2005 | 0.2472 | 0.3190 | — |

> [!NOTE]
> **Accuracy metric:** "within ±5%" = the percentage of test predictions falling within ±5 percentage points of the actual utilization. This is the statistically honest threshold metric and replaces the earlier misleading `(1 − MAE) × 100` "accuracy" figure (which reported 94.35%). The `within ±10%` hit rate is **79.87%**. Within-±5% for Random Forest and Ridge is not listed because only the champion model is serialized to `surge_model.pkl`.

> [!IMPORTANT]
> **Champion Architecture Selected:** HistGradientBoosting
> 
> **Why it won:** While Random Forest and HistGradientBoosting achieved nearly identical error (MAE 0.0567 vs 0.0565), **HistGradientBoosting** edged out the Random Forest with a slightly lower error rate and a superior R² score (0.9276). 
> 
> Furthermore, Gradient Boosting is significantly faster and less memory-intensive during live API inference, making it the mathematically and practically superior choice for a scalable web platform.

The champion model has been serialized to `models/surge_model.pkl` and is deployed to the VoltHive backend.
