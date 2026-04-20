import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YahooFinance from 'yahoo-finance2';
import { config as loadEnv } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

loadEnv({ path: path.join(rootDir, '.env') });

const startDate = process.env.GOLD_MARKET_DATA_START || '2004-01-01';
const endDate = process.env.GOLD_MARKET_DATA_END || new Date().toISOString().slice(0, 10);
const datasetDir = path.join(rootDir, 'data', 'gold-market');
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

const dirs = {
  raw: path.join(datasetDir, 'raw'),
  yahoo: path.join(datasetDir, 'raw', 'yahoo'),
  fred: path.join(datasetDir, 'raw', 'fred'),
  dbnomics: path.join(datasetDir, 'raw', 'dbnomics'),
  fomc: path.join(datasetDir, 'raw', 'fomc'),
  processed: path.join(datasetDir, 'processed'),
  metadata: path.join(datasetDir, 'metadata'),
};

const marketSeries = [
  { id: 'sp500', name: 'S&P 500 Index', symbol: '^GSPC', source: 'Yahoo Finance' },
  { id: 'nasdaq', name: 'NASDAQ Composite', symbol: '^IXIC', source: 'Yahoo Finance' },
  { id: 'vix', name: 'VIX Volatility Index', symbol: '^VIX', source: 'Yahoo Finance' },
  { id: 'gold_futures', name: 'Gold Futures', symbol: 'GC=F', source: 'Yahoo Finance' },
  { id: 'wti_crude_oil', name: 'WTI Crude Oil Futures', symbol: 'CL=F', source: 'Yahoo Finance' },
  { id: 'silver_futures', name: 'Silver Futures', symbol: 'SI=F', source: 'Yahoo Finance' },
  { id: 'copper_futures', name: 'Copper Futures', symbol: 'HG=F', source: 'Yahoo Finance' },
  { id: 'dxy', name: 'US Dollar Index', symbol: 'DX-Y.NYB', source: 'Yahoo Finance' },
  { id: 'tnx', name: '10-Year Treasury Yield', symbol: '^TNX', source: 'Yahoo Finance' },
  { id: 'gld', name: 'SPDR Gold Shares ETF', symbol: 'GLD', source: 'Yahoo Finance' },
  { id: 'iau', name: 'iShares Gold Trust ETF', symbol: 'IAU', source: 'Yahoo Finance' },
];

const fredSeries = [
  { id: 'GDPC1', name: 'Real GDP', units: 'lin' },
  { id: 'CPIAUCSL', name: 'Consumer Price Index' },
  { id: 'PCEPI', name: 'Personal Consumption Expenditures Price Index' },
  { id: 'FEDFUNDS', name: 'Federal Funds Rate' },
  { id: 'DFII10', name: '10-Year TIPS Real Yield' },
  { id: 'RRPONTSYD', name: 'Overnight Reverse Repo' },
  { id: 'PAYEMS', name: 'Nonfarm Payrolls' },
  { id: 'M2SL', name: 'M2 Money Supply' },
  { id: 'T10Y2Y', name: '10Y-2Y Treasury Spread' },
  { id: 'T10YIE', name: '10-Year Breakeven Inflation Rate' },
];

const goldReserveSeries = [
  { code: 'US', id: 'M.US.RAFAGOLDV_OZT', name: 'USA' },
  { code: 'DE', id: 'M.DE.RAFAGOLDV_OZT', name: 'Germany' },
  { code: 'IT', id: 'M.IT.RAFAGOLDV_OZT', name: 'Italy' },
  { code: 'FR', id: 'M.FR.RAFAGOLDV_OZT', name: 'France' },
  { code: 'RU', id: 'M.RU.RAFAGOLDV_OZT', name: 'Russia' },
  { code: 'CN', id: 'M.CN.RAFAGOLDV_OZT', name: 'China' },
  { code: 'CH', id: 'M.CH.RAFAGOLDV_OZT', name: 'Switzerland' },
  { code: 'IN', id: 'M.IN.RAFAGOLDV_OZT', name: 'India' },
  { code: 'JP', id: 'M.JP.RAFAGOLDV_OZT', name: 'Japan' },
  { code: 'NL', id: 'M.NL.RAFAGOLDV_OZT', name: 'Netherlands' },
  { code: 'TR', id: 'M.TR.RAFAGOLDV_OZT', name: 'Turkey' },
  { code: 'PL', id: 'M.PL.RAFAGOLDV_OZT', name: 'Poland' },
  { code: 'TW', id: 'M.TW.RAFAGOLDV_OZT', name: 'Taiwan' },
  { code: 'PT', id: 'M.PT.RAFAGOLDV_OZT', name: 'Portugal' },
  { code: 'UZ', id: 'M.UZ.RAFAGOLDV_OZT', name: 'Uzbekistan' },
];

const columnName = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

const ensureDirs = async () => {
  await Promise.all(Object.values(dirs).map((dir) => fs.mkdir(dir, { recursive: true })));
};

const writeJson = async (filePath, data) => {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
};

const csvEscape = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '';
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replaceAll('"', '""')}"` : str;
};

const writeCsv = async (filePath, rows) => {
  if (!rows.length) {
    await fs.writeFile(filePath, '');
    return;
  }

  const headers = Array.from(rows.reduce((set, row) => {
    Object.keys(row).forEach((key) => set.add(key));
    return set;
  }, new Set()));

  const csv = [
    headers.map(csvEscape).join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')),
  ].join('\n');

  await fs.writeFile(filePath, `${csv}\n`);
};

const parseNumber = (value) => {
  if (value === null || value === undefined || value === '.') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const toDateKey = (date) => new Date(date).toISOString().slice(0, 10);

const fetchYahooSeries = async (series) => {
  const chart = await yahooFinance.chart(series.symbol, {
    period1: startDate,
    period2: endDate,
    interval: '1d',
  });

  const rows = (chart.quotes || [])
    .filter((quote) => quote.close !== null && quote.close !== undefined)
    .map((quote) => ({
      date: toDateKey(quote.date),
      open: parseNumber(quote.open),
      high: parseNumber(quote.high),
      low: parseNumber(quote.low),
      close: parseNumber(quote.close),
      volume: parseNumber(quote.volume),
    }));

  await writeJson(path.join(dirs.yahoo, `${series.id}.json`), {
    ...series,
    startDate,
    endDate,
    observations: rows,
  });
  await writeCsv(path.join(dirs.yahoo, `${series.id}.csv`), rows);

  return { ...series, observations: rows };
};

const fetchFredSeries = async (series) => {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) throw new Error('FRED_API_KEY is missing');

  const params = new URLSearchParams({
    series_id: series.id,
    api_key: apiKey,
    file_type: 'json',
    observation_start: startDate,
    sort_order: 'asc',
  });

  if (series.units) params.set('units', series.units);

  const response = await fetch(`https://api.stlouisfed.org/fred/series/observations?${params}`);
  if (!response.ok) throw new Error(`FRED ${series.id} failed with ${response.status}`);

  const data = await response.json();
  const rows = (data.observations || [])
    .map((obs) => ({
      date: obs.date,
      value: parseNumber(obs.value),
      realtime_start: obs.realtime_start,
      realtime_end: obs.realtime_end,
    }))
    .filter((obs) => obs.value !== null);

  await writeJson(path.join(dirs.fred, `${series.id}.json`), {
    ...series,
    source: 'FRED',
    observations: rows,
  });
  await writeCsv(path.join(dirs.fred, `${series.id}.csv`), rows);

  return { ...series, source: 'FRED', observations: rows };
};

const fetchFomcSchedule = async () => {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) throw new Error('FRED_API_KEY is missing');

  const params = new URLSearchParams({
    release_id: '52',
    api_key: apiKey,
    file_type: 'json',
    sort_order: 'asc',
  });

  const response = await fetch(`https://api.stlouisfed.org/fred/release/dates?${params}`);
  if (!response.ok) throw new Error(`FOMC release dates failed with ${response.status}`);

  const data = await response.json();
  const rows = (data.release_dates || [])
    .map((item) => ({ date: item.date, release_id: item.release_id, release_name: item.release_name }))
    .filter((item) => item.date >= startDate);

  await writeJson(path.join(dirs.fomc, 'fomc_release_dates.json'), {
    source: 'FRED release_id=52',
    observations: rows,
  });
  await writeCsv(path.join(dirs.fomc, 'fomc_release_dates.csv'), rows);

  return rows;
};

const decodeHtml = (html) => html
  .replaceAll('&amp;', '&')
  .replaceAll('&nbsp;', ' ')
  .replaceAll('&#8211;', '-')
  .replaceAll('&ndash;', '-')
  .replaceAll('&mdash;', '-');

const normalizeFedDate = ({ year, monthLabel, dayRange }) => {
  const monthMap = {
    January: 1,
    February: 2,
    March: 3,
    April: 4,
    May: 5,
    June: 6,
    July: 7,
    August: 8,
    September: 9,
    October: 10,
    November: 11,
    December: 12,
  };

  const [startMonthLabel, endMonthLabel] = monthLabel.includes('/')
    ? monthLabel.split('/')
    : [monthLabel, monthLabel];
  const [, startDayRaw, endDayRaw, sepMarkerRaw] = dayRange.match(/^(\d{1,2})(?:-(\d{1,2}))?(\*)?/) || [];
  if (!startDayRaw) return null;

  const startMonth = monthMap[startMonthLabel === 'Apr' ? 'April' : startMonthLabel];
  const endMonth = monthMap[endMonthLabel === 'Apr' ? 'April' : endMonthLabel];
  const startDay = Number(startDayRaw);
  const endDay = Number(endDayRaw || startDayRaw);
  const date = (month, day) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return {
    year,
    month: monthLabel,
    start_date: date(startMonth, startDay),
    end_date: date(endMonth, endDay),
    date: date(endMonth, endDay),
    has_summary_of_economic_projections: Boolean(sepMarkerRaw || dayRange.includes('*')),
    is_notation_vote: /notation vote/i.test(dayRange),
  };
};

const fetchOfficialFomcCalendar = async () => {
  const response = await fetch('https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm');
  if (!response.ok) throw new Error(`Federal Reserve FOMC calendar failed with ${response.status}`);

  const html = await response.text();
  const lines = decodeHtml(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '\n')
    .replace(/<style[\s\S]*?<\/style>/gi, '\n')
    .replace(/<[^>]+>/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const monthPattern = /^(January|February|March|April|May|June|July|August|September|October|November|December|Apr\/May)$/;
  const datePattern = /^\d{1,2}(?:-\d{1,2})?\*?(?:\s+\(notation vote\))?$/i;
  const today = new Date().toISOString().slice(0, 10);
  const rows = [];
  let year = null;

  for (let i = 0; i < lines.length - 1; i += 1) {
    const yearMatch = lines[i].match(/^(\d{4}) FOMC Meetings$/);
    if (yearMatch) {
      year = Number(yearMatch[1]);
      continue;
    }

    if (!year || !monthPattern.test(lines[i]) || !datePattern.test(lines[i + 1])) continue;

    const normalized = normalizeFedDate({ year, monthLabel: lines[i], dayRange: lines[i + 1] });
    if (!normalized) continue;

    rows.push({
      ...normalized,
      status: normalized.date < today ? 'past' : 'upcoming',
      source: 'Federal Reserve',
    });
  }

  const deduped = Array.from(new Map(rows.map((row) => [`${row.date}-${row.month}`, row])).values())
    .filter((row) => row.date >= startDate)
    .sort((a, b) => a.date.localeCompare(b.date));

  await writeJson(path.join(dirs.fomc, 'official_fomc_meetings.json'), {
    source: 'Federal Reserve FOMC calendar',
    sourceUrl: 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm',
    observations: deduped,
  });
  await writeCsv(path.join(dirs.fomc, 'official_fomc_meetings.csv'), deduped);

  return deduped;
};

const fetchGoldReserveSeries = async (series) => {
  const response = await fetch(`https://api.db.nomics.world/v22/series/IMF/IFS/${series.id}?observations=1`);
  if (!response.ok) throw new Error(`DBnomics ${series.name} failed with ${response.status}`);

  const data = await response.json();
  const doc = data?.series?.docs?.[0];
  const rows = doc && Array.isArray(doc.period) && Array.isArray(doc.value)
    ? doc.period.map((period, index) => {
      const value = parseNumber(doc.value[index]);
      return {
        date: period.length === 7 ? `${period}-01` : period,
        tonnes: value === null ? null : value * 31.1035,
        million_troy_ounces: value,
      };
    }).filter((row) => row.tonnes !== null && row.date >= startDate)
    : [];

  await writeJson(path.join(dirs.dbnomics, `${series.code}_gold_reserves.json`), {
    ...series,
    source: 'DBnomics IMF IFS',
    observations: rows,
  });
  await writeCsv(path.join(dirs.dbnomics, `${series.code}_gold_reserves.csv`), rows);

  return { ...series, observations: rows };
};

const valueOnOrBefore = (series, date, key = 'value') => {
  if (!series?.length) return null;
  let lo = 0;
  let hi = series.length - 1;
  let best = -1;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (series[mid].date <= date) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return best >= 0 ? series[best][key] : null;
};

const pctChange = (values, index, lag) => {
  if (index < lag) return null;
  const current = values[index];
  const previous = values[index - lag];
  if (!current || !previous) return null;
  return current / previous - 1;
};

const futureReturn = (values, index, horizon) => {
  if (index + horizon >= values.length) return null;
  const current = values[index];
  const future = values[index + horizon];
  if (!current || !future) return null;
  return future / current - 1;
};

const futureMaxDrawdown = (values, index, horizon) => {
  const current = values[index];
  if (!current || index + 1 >= values.length) return null;
  const end = Math.min(values.length - 1, index + horizon);
  let minReturn = 0;
  for (let i = index + 1; i <= end; i += 1) {
    if (!values[i]) continue;
    minReturn = Math.min(minReturn, values[i] / current - 1);
  }
  return minReturn;
};

const rollingPercentile = (values, index, window) => {
  if (index < window - 1 || values[index] === null || values[index] === undefined) return null;
  const sample = values.slice(index - window + 1, index + 1).filter((value) => value !== null && value !== undefined);
  if (!sample.length) return null;
  const belowOrEqual = sample.filter((value) => value <= values[index]).length;
  return belowOrEqual / sample.length;
};

const daysBetween = (from, to) => Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000);

const buildFeatureTable = async ({ yahooResults, fredResults, fomcDates, officialFomcMeetings, reserveResults }) => {
  const yahooById = Object.fromEntries(yahooResults.map((series) => [series.id, series.observations]));
  const fredById = Object.fromEntries(fredResults.map((series) => [series.id.toLowerCase(), series.observations]));
  const reserveByName = Object.fromEntries(reserveResults.map((series) => [series.name, series.observations]));
  const goldRows = yahooById.gold_futures || [];
  const dates = goldRows.map((row) => row.date);

  const closeById = Object.fromEntries(
    Object.entries(yahooById).map(([id, rows]) => [id, Object.fromEntries(rows.map((row) => [row.date, row.close]))]),
  );

  const closes = Object.fromEntries(
    Object.keys(yahooById).map((id) => {
      let last = null;
      return [id, dates.map((date) => {
        if (closeById[id]?.[date] !== undefined && closeById[id]?.[date] !== null) {
          last = closeById[id][date];
        }
        return last;
      })];
    }),
  );

  const fomcDateList = Array.from(new Set([
    ...fomcDates.map((row) => row.date),
    ...officialFomcMeetings.map((row) => row.date),
  ]))
    .sort();
  const featureRows = dates.map((date, index) => {
    const row = { date };

    for (const series of marketSeries) {
      const id = series.id;
      row[`${id}_close`] = closes[id]?.[index] ?? null;
      row[`${id}_return_1m`] = pctChange(closes[id] || [], index, 21);
      row[`${id}_return_3m`] = pctChange(closes[id] || [], index, 63);
    }

    row.vix_percentile_1y = rollingPercentile(closes.vix || [], index, 252);
    row.gold_drawdown_from_252d_high = (() => {
      const sample = (closes.gold_futures || []).slice(Math.max(0, index - 251), index + 1).filter(Boolean);
      const high = sample.length ? Math.max(...sample) : null;
      return high ? row.gold_futures_close / high - 1 : null;
    })();

    for (const [id, observations] of Object.entries(fredById)) {
      row[`${id}_value`] = valueOnOrBefore(observations, date);
    }

    const reserveTotal = Object.entries(reserveByName).reduce((sum, [, observations]) => {
      const value = valueOnOrBefore(observations, date, 'tonnes');
      return sum + (value || 0);
    }, 0);
    row.central_bank_gold_reserves_top15_tonnes = reserveTotal || null;

    const previousFomc = [...fomcDateList].reverse().find((fomcDate) => fomcDate <= date);
    const nextFomc = fomcDateList.find((fomcDate) => fomcDate >= date);
    row.days_since_last_fomc = previousFomc ? daysBetween(previousFomc, date) : null;
    row.days_to_next_fomc = nextFomc ? daysBetween(date, nextFomc) : null;

    return row;
  });

  const featureRowsValueCache = featureRows.map((row) => row.central_bank_gold_reserves_top15_tonnes);
  featureRows.forEach((row, index) => {
    row.central_bank_gold_reserves_top15_change_3m = index >= 63 && row.central_bank_gold_reserves_top15_tonnes
      ? row.central_bank_gold_reserves_top15_tonnes - featureRowsValueCache[index - 63]
      : null;
  });

  const goldCloses = closes.gold_futures || [];
  featureRows.forEach((row, index) => {
    row.target_gold_return_next_1m = futureReturn(goldCloses, index, 21);
    row.target_gold_return_next_3m = futureReturn(goldCloses, index, 63);
    row.target_gold_max_drawdown_next_3m = futureMaxDrawdown(goldCloses, index, 63);
    row.target_good_entry_3m = row.target_gold_return_next_3m === null ? null : Number(row.target_gold_return_next_3m >= 0.05);
    row.target_bad_entry_3m = row.target_gold_max_drawdown_next_3m === null ? null : Number(row.target_gold_max_drawdown_next_3m <= -0.07);
  });

  await writeCsv(path.join(dirs.processed, 'gold_feature_table_daily.csv'), featureRows);
  await writeJson(path.join(dirs.processed, 'gold_feature_table_daily.json'), featureRows);

  return featureRows;
};

const main = async () => {
  await ensureDirs();

  const status = {
    generatedAt: new Date().toISOString(),
    startDate,
    endDate,
    datasetDir,
    yahoo: [],
    fred: [],
    dbnomicsGoldReserves: [],
    fomc: null,
    officialFomc: null,
    warnings: [],
  };

  const yahooResults = [];
  for (const series of marketSeries) {
    try {
      const result = await fetchYahooSeries(series);
      yahooResults.push(result);
      status.yahoo.push({ id: series.id, symbol: series.symbol, rows: result.observations.length });
      console.log(`[yahoo] ${series.id}: ${result.observations.length} rows`);
    } catch (error) {
      status.warnings.push({ source: 'Yahoo Finance', id: series.id, message: error.message });
      console.warn(`[yahoo] ${series.id}: ${error.message}`);
    }
  }

  const fredResults = [];
  for (const series of fredSeries) {
    try {
      const result = await fetchFredSeries(series);
      fredResults.push(result);
      status.fred.push({ id: series.id, rows: result.observations.length });
      console.log(`[fred] ${series.id}: ${result.observations.length} rows`);
    } catch (error) {
      status.warnings.push({ source: 'FRED', id: series.id, message: error.message });
      console.warn(`[fred] ${series.id}: ${error.message}`);
    }
  }

  let fomcDates = [];
  try {
    fomcDates = await fetchFomcSchedule();
    status.fomc = { rows: fomcDates.length };
    console.log(`[fomc] release dates: ${fomcDates.length} rows`);
  } catch (error) {
    status.warnings.push({ source: 'FRED FOMC', id: 'release_52', message: error.message });
    console.warn(`[fomc] ${error.message}`);
  }

  let officialFomcMeetings = [];
  try {
    officialFomcMeetings = await fetchOfficialFomcCalendar();
    status.officialFomc = { rows: officialFomcMeetings.length };
    console.log(`[fed] official FOMC meetings: ${officialFomcMeetings.length} rows`);
  } catch (error) {
    status.warnings.push({ source: 'Federal Reserve', id: 'official_fomc_calendar', message: error.message });
    console.warn(`[fed] official FOMC calendar: ${error.message}`);
  }

  const reserveResults = [];
  for (const series of goldReserveSeries) {
    try {
      const result = await fetchGoldReserveSeries(series);
      reserveResults.push(result);
      status.dbnomicsGoldReserves.push({ code: series.code, name: series.name, rows: result.observations.length });
      console.log(`[dbnomics] ${series.name}: ${result.observations.length} rows`);
    } catch (error) {
      status.warnings.push({ source: 'DBnomics IMF IFS', id: series.id, message: error.message });
      console.warn(`[dbnomics] ${series.name}: ${error.message}`);
    }
  }

  if (yahooResults.some((series) => series.id === 'gold_futures')) {
    const featureRows = await buildFeatureTable({ yahooResults, fredResults, fomcDates, officialFomcMeetings, reserveResults });
    status.processed = {
      featureTable: 'processed/gold_feature_table_daily.csv',
      rows: featureRows.length,
      columns: featureRows.length ? Object.keys(featureRows[0]).length : 0,
    };
    console.log(`[processed] feature table: ${featureRows.length} rows`);
  } else {
    status.warnings.push({ source: 'processed', id: 'gold_feature_table_daily', message: 'Skipped because gold futures data is missing' });
  }

  await writeJson(path.join(dirs.metadata, 'manifest.json'), status);
  console.log(`[done] wrote manifest to ${path.relative(rootDir, path.join(dirs.metadata, 'manifest.json'))}`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
