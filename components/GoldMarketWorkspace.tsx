import React, { useMemo, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ComposedChart,
    Legend,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import MarketCommodities from './MarketCommodities';
import laggedCorrelationsRaw from '../data/gold-market/analysis/lagged_correlations.json';
import bucketSpreadsRaw from '../data/gold-market/analysis/feature_bucket_spreads.json';
import stabilityRaw from '../data/gold-market/analysis/correlation_stability.json';
import manifestRaw from '../data/gold-market/metadata/manifest.json';

type WorkspaceTab = 'data' | 'analysis' | 'model';

interface CorrelationRow {
    feature: string;
    target: string;
    n: number;
    pearson: number | null;
    spearman: number | null;
    abs_spearman: number | null;
}

interface BucketSpreadRow {
    feature: string;
    high_minus_low_avg_return_3m: number;
    high_minus_low_good_entry_rate_3m: number;
    high_minus_low_bad_entry_rate_3m: number;
    low_bucket_return_3m: number;
    high_bucket_return_3m: number;
    low_bad_entry_rate_3m: number;
    high_bad_entry_rate_3m: number;
}

interface StabilityRow {
    feature: string;
    windows_with_signal: number;
    sign_stability: number;
    avg_abs_spearman: number;
    avg_spearman: number;
    '2004_2010_spearman': number | null;
    '2011_2016_spearman': number | null;
    '2017_2021_spearman': number | null;
    '2022_present_spearman': number | null;
}

const laggedCorrelations = laggedCorrelationsRaw as CorrelationRow[];
const bucketSpreads = bucketSpreadsRaw as BucketSpreadRow[];
const stability = stabilityRaw as StabilityRow[];
const manifest = manifestRaw as {
    startDate: string;
    endDate: string;
    yahoo: unknown[];
    fred: unknown[];
    dbnomicsGoldReserves: unknown[];
    processed?: { rows: number; columns: number };
};

const featureLabels: Record<string, string> = {
    dfii10_value: '10Y TIPS Real Yield',
    payems_value_change_3m: 'Payrolls 3M Change',
    payems_value_change_1m: 'Payrolls 1M Change',
    fedfunds_value: 'Fed Funds Level',
    fedfunds_value_change_3m: 'Fed Funds 3M Change',
    fedfunds_value_change_1m: 'Fed Funds 1M Change',
    rrpontsyd_value: 'Reverse Repo Level',
    rrpontsyd_value_change_3m: 'Reverse Repo 3M Change',
    rrpontsyd_value_change_1m: 'Reverse Repo 1M Change',
    t10y2y_value: '10Y-2Y Spread',
    t10yie_value: '10Y Inflation Expectation',
    t10yie_value_change_3m: 'Inflation Expect. 3M Change',
    tnx_return_3m: '10Y Yield 3M Return',
    tnx_return_1m: '10Y Yield 1M Return',
    tnx_close_change_3m: '10Y Yield 3M Change',
    wti_crude_oil_return_3m: 'WTI 3M Return',
    gld_return_3m: 'GLD 3M Return',
    iau_return_3m: 'IAU 3M Return',
    gold_futures_return_3m: 'Gold 3M Momentum',
    gold_drawdown_from_252d_high: 'Gold 52W Drawdown',
    vix_percentile_1y: 'VIX 1Y Percentile',
    sp500_return_3m: 'S&P 500 3M Return',
    central_bank_gold_reserves_top15_tonnes: 'Central Bank Gold Reserves',
};

const formatFeature = (feature: string) => featureLabels[feature] || feature.replaceAll('_', ' ');
const formatPct = (value: number | null | undefined) => value === null || value === undefined ? 'n/a' : `${(value * 100).toFixed(1)}%`;
const formatNum = (value: number | null | undefined) => value === null || value === undefined ? 'n/a' : value.toFixed(3);

const compactFeature = (feature: string) => {
    const label = formatFeature(feature);
    return label.length > 26 ? `${label.slice(0, 24)}...` : label;
};

const SectionHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div>
        <h3 className="text-2xl font-black tracking-tight text-slate-950">{title}</h3>
        <p className="mt-1 max-w-3xl text-sm font-medium leading-relaxed text-slate-500">{subtitle}</p>
    </div>
);

const MetricTile = ({ label, value, tone = 'slate' }: { label: string; value: string; tone?: 'slate' | 'orange' | 'green' }) => {
    const toneClass = {
        slate: 'border-slate-200 bg-slate-50 text-slate-900',
        orange: 'border-orange-200 bg-orange-50 text-orange-900',
        green: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    }[tone];

    return (
        <div className={`rounded-lg border px-4 py-3 ${toneClass}`}>
            <p className="text-[11px] font-black uppercase tracking-wider opacity-60">{label}</p>
            <p className="mt-1 font-mono text-xl font-black">{value}</p>
        </div>
    );
};

const AnalysisTab = () => {
    const returnCorrelations = useMemo(() => (
        laggedCorrelations
            .filter(row => row.target === 'target_gold_return_next_3m')
            .slice(0, 10)
            .map(row => ({
                feature: compactFeature(row.feature),
                fullFeature: formatFeature(row.feature),
                spearman: row.spearman ?? 0,
                pearson: row.pearson ?? 0,
            }))
    ), []);

    const riskCorrelations = useMemo(() => (
        laggedCorrelations
            .filter(row => row.target === 'target_bad_entry_3m')
            .slice(0, 10)
            .map(row => ({
                feature: compactFeature(row.feature),
                fullFeature: formatFeature(row.feature),
                spearman: row.spearman ?? 0,
            }))
    ), []);

    const bucketData = useMemo(() => (
        bucketSpreads.slice(0, 10).map(row => ({
            feature: compactFeature(row.feature),
            fullFeature: formatFeature(row.feature),
            spread: row.high_minus_low_avg_return_3m,
            badRiskSpread: row.high_minus_low_bad_entry_rate_3m,
        }))
    ), []);

    const stabilityData = useMemo(() => (
        stability.slice(0, 8).map(row => ({
            feature: compactFeature(row.feature),
            fullFeature: formatFeature(row.feature),
            '2004-10': row['2004_2010_spearman'] ?? 0,
            '2011-16': row['2011_2016_spearman'] ?? 0,
            '2017-21': row['2017_2021_spearman'] ?? 0,
            '2022+': row['2022_present_spearman'] ?? 0,
        }))
    ), []);

    return (
        <div className="space-y-8">
            <SectionHeader
                title="Gold Signal Analysis"
                subtitle="This view checks how market and macro features known today relate to future 1-month returns, future 3-month returns, and 3-month drawdown risk for gold."
            />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <MetricTile label="Rows" value={manifest.processed?.rows?.toLocaleString() || '5,600'} tone="orange" />
                <MetricTile label="Features Tested" value="64" />
                <MetricTile label="Correlation Rows" value="320" />
                <MetricTile label="Date Range" value={`${manifest.startDate.slice(0, 4)}-${manifest.endDate.slice(0, 4)}`} tone="green" />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <h4 className="mb-1 text-lg font-black text-slate-900">Next 3M Return Correlation</h4>
                    <p className="mb-5 text-sm text-slate-500">Spearman correlation with future 63-trading-day gold return.</p>
                    <div className="h-[360px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={returnCorrelations} layout="vertical" margin={{ top: 0, right: 24, left: 78, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                <XAxis type="number" domain={[-0.45, 0.45]} tick={{ fontSize: 11, fill: '#64748b' }} />
                                <YAxis type="category" dataKey="feature" tick={{ fontSize: 11, fill: '#334155' }} width={92} />
                                <Tooltip formatter={(value: number) => [value.toFixed(3), 'Spearman']} labelFormatter={(_, payload) => payload?.[0]?.payload?.fullFeature || ''} />
                                <Bar dataKey="spearman" radius={[0, 6, 6, 0]}>
                                    {returnCorrelations.map((entry) => (
                                        <Cell key={entry.feature} fill={entry.spearman >= 0 ? '#16a34a' : '#f97316'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <h4 className="mb-1 text-lg font-black text-slate-900">Bucket Spread</h4>
                    <p className="mb-5 text-sm text-slate-500">Difference between highest and lowest feature buckets for next 3M gold return.</p>
                    <div className="h-[360px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={bucketData} layout="vertical" margin={{ top: 0, right: 24, left: 78, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                <XAxis type="number" tickFormatter={(value) => `${(Number(value) * 100).toFixed(0)}%`} tick={{ fontSize: 11, fill: '#64748b' }} />
                                <YAxis type="category" dataKey="feature" tick={{ fontSize: 11, fill: '#334155' }} width={92} />
                                <Tooltip formatter={(value: number) => [formatPct(value), 'High - Low']} labelFormatter={(_, payload) => payload?.[0]?.payload?.fullFeature || ''} />
                                <Bar dataKey="spread" radius={[0, 6, 6, 0]}>
                                    {bucketData.map((entry) => (
                                        <Cell key={entry.feature} fill={entry.spread >= 0 ? '#16a34a' : '#f97316'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <h4 className="mb-1 text-lg font-black text-slate-900">Bad Entry Risk Correlation</h4>
                    <p className="mb-5 text-sm text-slate-500">Association with a -7% or worse drawdown within the next 3 months.</p>
                    <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={riskCorrelations} layout="vertical" margin={{ top: 0, right: 24, left: 78, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                <XAxis type="number" domain={[-0.25, 0.25]} tick={{ fontSize: 11, fill: '#64748b' }} />
                                <YAxis type="category" dataKey="feature" tick={{ fontSize: 11, fill: '#334155' }} width={92} />
                                <Tooltip formatter={(value: number) => [value.toFixed(3), 'Spearman']} labelFormatter={(_, payload) => payload?.[0]?.payload?.fullFeature || ''} />
                                <Bar dataKey="spearman" radius={[0, 6, 6, 0]}>
                                    {riskCorrelations.map((entry) => (
                                        <Cell key={entry.feature} fill={entry.spearman >= 0 ? '#ef4444' : '#16a34a'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <h4 className="mb-1 text-lg font-black text-slate-900">Regime Stability</h4>
                    <p className="mb-5 text-sm text-slate-500">Signals that keep the same direction across historical regimes are safer model inputs.</p>
                    <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={stabilityData} margin={{ top: 12, right: 10, left: 0, bottom: 35 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="feature" angle={-30} textAnchor="end" interval={0} tick={{ fontSize: 10, fill: '#64748b' }} height={80} />
                                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                                <Tooltip labelFormatter={(_, payload) => payload?.[0]?.payload?.fullFeature || ''} />
                                <Legend />
                                <Line type="monotone" dataKey="2004-10" stroke="#334155" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="2011-16" stroke="#16a34a" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="2017-21" stroke="#f97316" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="2022+" stroke="#0f766e" strokeWidth={2} dot={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="rounded-lg border border-orange-200 bg-orange-50 p-5">
                <h4 className="mb-3 text-lg font-black text-orange-950">Readable Findings</h4>
                <div className="grid gap-3 text-sm font-semibold leading-relaxed text-orange-900 md:grid-cols-2">
                    <p>Payroll growth slowing over 3 months had one of the strongest relationships with better next-3-month gold returns.</p>
                    <p>Rising 10-year yield pressure and rising inflation expectation levels generally weakened the forward gold setup.</p>
                    <p>Gold, GLD, and IAU momentum still mattered, but the macro regime signals were stronger than simple price momentum.</p>
                    <p>Level variables like TIPS yield are useful, but should be treated carefully because regime effects can inflate correlation.</p>
                </div>
            </div>
        </div>
    );
};

const ModelTab = () => {
    const selectedFeatures = useMemo(() => (
        stability
            .filter(row => row.windows_with_signal >= 4 && row.sign_stability >= 1 && row.avg_abs_spearman >= 0.1)
            .slice(0, 10)
    ), []);

    const totalWeight = selectedFeatures.reduce((sum, row) => sum + row.avg_abs_spearman, 0);
    const weights = selectedFeatures.map(row => ({
        feature: compactFeature(row.feature),
        fullFeature: formatFeature(row.feature),
        direction: row.avg_spearman >= 0 ? 'Higher = bullish' : 'Lower = bullish',
        weight: totalWeight ? row.avg_abs_spearman / totalWeight : 0,
        score: row.avg_spearman,
    }));

    const modelSteps = [
        { step: 'Stable feature selection', status: 'Ready', detail: 'Use sign-stable features from regime tests.' },
        { step: 'Gold Timing Score', status: 'Next', detail: 'Normalize selected features and combine with direction-aware weights.' },
        { step: 'Score bucket backtest', status: 'Next', detail: 'Compare low/mid/high score buckets against forward 3M returns.' },
        { step: 'ML classifiers', status: 'Next', detail: 'Train good_entry_3m and bad_entry_3m classifiers with time-series splits.' },
        { step: 'Contribution chart', status: 'Next', detail: 'Show which signals push the current score up or down.' },
    ];

    return (
        <div className="space-y-8">
            <SectionHeader
                title="Gold Timing Model"
                subtitle="A workspace for selecting stable features from the analysis, building a rule-based timing score, and extending it into ML probability models."
            />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                {modelSteps.map((item, index) => (
                    <div key={item.step} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="font-mono text-xs font-black text-slate-400">{String(index + 1).padStart(2, '0')}</span>
                            <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${item.status === 'Ready' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                                {item.status}
                            </span>
                        </div>
                        <h4 className="text-sm font-black text-slate-900">{item.step}</h4>
                        <p className="mt-2 text-xs font-medium leading-relaxed text-slate-500">{item.detail}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <h4 className="mb-1 text-lg font-black text-slate-900">Draft Rule Weights</h4>
                    <p className="mb-5 text-sm text-slate-500">Weights are normalized from stable average absolute Spearman strength.</p>
                    <div className="h-[380px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weights} layout="vertical" margin={{ top: 0, right: 24, left: 88, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                <XAxis type="number" tickFormatter={(value) => `${(Number(value) * 100).toFixed(0)}%`} />
                                <YAxis type="category" dataKey="feature" width={104} tick={{ fontSize: 11, fill: '#334155' }} />
                                <Tooltip formatter={(value: number) => [formatPct(value), 'Weight']} labelFormatter={(_, payload) => payload?.[0]?.payload?.fullFeature || ''} />
                                <Bar dataKey="weight" fill="#16a34a" radius={[0, 6, 6, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <h4 className="mb-1 text-lg font-black text-slate-900">Model Inputs</h4>
                    <p className="mb-5 text-sm text-slate-500">The first model should be readable before it becomes clever.</p>
                    <div className="space-y-3">
                        {weights.map(row => (
                            <div key={row.fullFeature} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                                <div>
                                    <p className="text-sm font-black text-slate-900">{row.fullFeature}</p>
                                    <p className="text-xs font-semibold text-slate-500">{row.direction}</p>
                                </div>
                                <span className="font-mono text-sm font-black text-emerald-700">{formatPct(row.weight)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
                    <h4 className="text-sm font-black uppercase tracking-wider text-emerald-800">Score Output</h4>
                    <p className="mt-2 text-2xl font-black text-emerald-950">0-100</p>
                    <p className="mt-2 text-sm font-semibold text-emerald-800">Accumulation, Neutral, Caution, or Avoid zone.</p>
                </div>
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-5">
                    <h4 className="text-sm font-black uppercase tracking-wider text-orange-800">Good Entry Target</h4>
                    <p className="mt-2 text-2xl font-black text-orange-950">3M +5%</p>
                    <p className="mt-2 text-sm font-semibold text-orange-800">Probability that gold rises at least 5% over 63 trading days.</p>
                </div>
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-5">
                    <h4 className="text-sm font-black uppercase tracking-wider text-rose-800">Bad Entry Target</h4>
                    <p className="mt-2 text-2xl font-black text-rose-950">3M -7%</p>
                    <p className="mt-2 text-sm font-semibold text-rose-800">Probability of a 7% or worse drawdown within 63 trading days.</p>
                </div>
            </div>
        </div>
    );
};

const GoldMarketWorkspace: React.FC = () => {
    const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<WorkspaceTab>('data');

    const tabs: { id: WorkspaceTab; label: string }[] = [
        { id: 'data', label: 'Data' },
        { id: 'analysis', label: 'Analysis' },
        { id: 'model', label: 'Model' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveWorkspaceTab(tab.id)}
                        className={`rounded-lg px-4 py-2 text-sm font-black transition-colors ${
                            activeWorkspaceTab === tab.id
                                ? 'bg-orange-500 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-500 hover:bg-orange-50 hover:text-orange-700'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeWorkspaceTab === 'data' && <MarketCommodities />}
            {activeWorkspaceTab === 'analysis' && <AnalysisTab />}
            {activeWorkspaceTab === 'model' && <ModelTab />}
        </div>
    );
};

export default GoldMarketWorkspace;
