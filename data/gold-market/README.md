# Gold Market Dataset

This folder stores the source and processed data used for gold timing, risk, and correlation modeling.

## Layout

- `raw/yahoo/`: market indices, commodities, rates proxy, DXY, VIX, GLD, and IAU from Yahoo Finance.
- `raw/fred/`: macro indicators from FRED.
- `raw/dbnomics/`: top central bank gold reserve series from DBnomics IMF IFS.
- `raw/fomc/`: FOMC release dates from FRED.
- `processed/gold_feature_table_daily.csv`: daily feature table for correlation analysis, backtesting, and ML.
- `metadata/manifest.json`: generation timestamp, row counts, source status, and warnings.

## Refresh

Run:

```bash
npm run data:gold
```

By default the downloader starts at `2004-01-01`, which gives roughly two decades of observations and covers GLD/IAU history. Override with:

```bash
GOLD_MARKET_DATA_START=2010-01-01 npm run data:gold
```

## Analyze

Run:

```bash
npm run data:gold:analyze
```

This writes correlation, bucket backtest, and data quality outputs to `analysis/`.
