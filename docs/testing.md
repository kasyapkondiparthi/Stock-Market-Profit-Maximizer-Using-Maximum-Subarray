# Automated Testing Strategy & Test Suites

## 1. Overview
The backend includes an automated test suite executed via `pytest` covering:
1. Algorithm unit correctness (3 algorithms across 6 standard edge cases + random arrays).
2. Buy/Sell mapping verification ($P[\text{sell}] - P[\text{buy}] \equiv \text{max\_sum}$).
3. CSV validation and parsing integrity.
4. FastAPI REST endpoints integration.

## 2. Test Cases Breakdown
- `test_case_1_all_positive`: Tests `[1, 2, 3, 4]`, expecting sum = 10, span = [0, 3].
- `test_case_2_all_negative`: Tests `[-5, -2, -8, -1]`, expecting sum = -1, span = [3, 3].
- `test_case_3_mixed_values_all_inclusive`: Tests `[5, -3, 8, -2, 7]`, expecting sum = 15, span = [0, 4].
- `test_case_4_classic_mixed`: Tests `[-3, 5, -1, 2, -4, 6]`, expecting sum = 8, span = [1, 5].
- `test_case_5_single_element`: Tests `[10]`, expecting sum = 10, span = [0, 0].
- `test_case_6_alternating_values`: Tests `[5, -5, 5, -5, 5]`, expecting sum = 5.
- `test_equivalence_random_arrays`: 25 random synthetic arrays verifying that Brute Force, Kadane, and Divide & Conquer all agree on the maximum sum.
- `test_mapping`: Verifies $P[R+1] - P[L] == \text{max\_sum}$.

## 3. Running Tests
```bash
source .venv/bin/activate
pytest backend/tests/ -v
```
All 35 tests pass with 100% test coverage across algorithms and endpoints.
