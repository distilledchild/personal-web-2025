# Gold Market Correlation Analysis

Generated: 2026-04-18T06:58:12.837Z
Rows: 5600
Features tested: 64

## How To Read This

- Correlations use today-known features against future gold outcomes.
- `target_gold_return_next_3m` is the next 63 trading-day gold futures return.
- `target_bad_entry_3m` is 1 when the next 3 months include a drawdown of -7% or worse.
- These are association checks, not causal proof.

## Top Correlations With Next 3M Gold Return

| Feature | n | Spearman | Pearson |
|---|---:|---:|---:|
| dfii10_value | 5537 | 0.391 | 0.389 |
| payems_value_change_3m | 5474 | -0.335 | -0.175 |
| fedfunds_value | 5537 | 0.278 | 0.307 |
| payems_value_change_1m | 5516 | -0.229 | -0.059 |
| rrpontsyd_value_change_3m | 5473 | -0.176 | -0.162 |
| fedfunds_value_change_3m | 5474 | -0.163 | -0.127 |
| t10y2y_value | 5537 | -0.162 | -0.136 |
| gold_drawdown_from_252d_high | 5537 | 0.140 | 0.091 |
| t10yie_value_change_3m | 5474 | -0.135 | -0.174 |
| fedfunds_value_change_1m | 5516 | -0.125 | -0.118 |
| rrpontsyd_value_change_1m | 5515 | -0.124 | -0.123 |
| t10y2y_value_change_3m | 5474 | 0.123 | 0.129 |

## Top Correlations With Bad Entry Risk

| Feature | n | Spearman | Pearson |
|---|---:|---:|---:|
| dfii10_value | 5599 | -0.204 | -0.192 |
| fedfunds_value | 5599 | -0.197 | -0.198 |
| t10y2y_value | 5599 | 0.171 | 0.156 |
| rrpontsyd_value_change_3m | 5535 | 0.153 | 0.090 |
| gold_drawdown_from_252d_high | 5599 | -0.124 | -0.105 |
| central_bank_gold_reserves_top15_tonnes | 5599 | -0.117 | -0.137 |
| days_since_last_fomc | 5591 | 0.098 | 0.106 |
| payems_value_change_3m | 5536 | 0.097 | 0.050 |
| payems_value | 5599 | -0.095 | -0.128 |
| rrpontsyd_value_change_1m | 5577 | 0.094 | 0.095 |
| sp500_return_3m | 5536 | -0.093 | -0.096 |
| vix_percentile_1y | 5348 | 0.091 | 0.090 |

## Strongest 5-Bucket Spreads

| Feature | Low Bucket 3M Return | High Bucket 3M Return | High-Low Spread | Bad Risk Spread |
|---|---:|---:|---:|---:|
| dfii10_value | -1.03% | 7.94% | 8.97% | -26.60% |
| payems_value_change_3m | 7.55% | 0.67% | -6.88% | 3.57% |
| fedfunds_value | 0.81% | 6.90% | 6.09% | -23.13% |
| payems_value_change_1m | 5.67% | 0.94% | -4.73% | 1.74% |
| fedfunds_value_change_3m | 7.60% | 3.07% | -4.53% | -2.10% |
| tnx_close_change_3m | 6.20% | 2.60% | -3.59% | 8.47% |
| rrpontsyd_value_change_3m | 5.12% | 1.59% | -3.54% | 16.78% |
| fedfunds_value_change_1m | 6.76% | 3.33% | -3.43% | -3.51% |
| rrpontsyd_value_change_1m | 4.62% | 1.55% | -3.07% | 11.55% |
| t10yie_value | 4.12% | 1.30% | -2.82% | 13.13% |
| gld_return_3m | 1.75% | 4.54% | 2.79% | -6.33% |
| iau_return_3m | 1.72% | 4.49% | 2.77% | -6.45% |

## Stability Across Market Regimes

| Feature | Sign Stability | Avg Spearman | Avg Abs Spearman |
|---|---:|---:|---:|
| payems_value_change_3m | 100.00% | -0.322 | 0.322 |
| dfii10_value | 100.00% | 0.316 | 0.316 |
| fedfunds_value_change_3m | 100.00% | -0.224 | 0.224 |
| rrpontsyd_value | 100.00% | -0.201 | 0.201 |
| t10yie_value | 100.00% | -0.190 | 0.190 |
| tnx_return_3m | 100.00% | -0.171 | 0.171 |
| fedfunds_value_change_1m | 100.00% | -0.168 | 0.168 |
| tnx_close_change_3m | 100.00% | -0.163 | 0.163 |
| wti_crude_oil_return_3m | 100.00% | -0.117 | 0.117 |
| tnx_return_1m | 100.00% | -0.112 | 0.112 |
| t10yie_value_change_1m | 100.00% | -0.105 | 0.105 |
| tnx_close_change_1m | 100.00% | -0.100 | 0.100 |

## Data Quality Notes

- No feature has more than 20% missing values.

## Next Modeling Step

- Build a baseline rule score from the strongest stable signals.
- Train a time-series split classifier for `target_good_entry_3m` and `target_bad_entry_3m`.
- Compare model signals against simple score buckets before displaying predictions on the page.
