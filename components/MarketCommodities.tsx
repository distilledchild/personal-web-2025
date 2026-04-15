import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, ComposedChart, Line, YAxis } from 'recharts';

interface MarketData {
    name: string;
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    currency: string;
    history?: { date: string, close: number }[];
    error?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const MarketCommodities: React.FC = () => {
    const [marketData, setMarketData] = useState<MarketData[]>([]);
    const [loadingMarket, setLoadingMarket] = useState(false);

    useEffect(() => {
        if (marketData.length === 0) {
            setLoadingMarket(true);
            fetch(`${API_URL}/api/finance/market-data`)
                .then(res => res.json())
                .then(data => setMarketData(data))
                .catch(err => console.error('Failed to fetch market data:', err))
                .finally(() => setLoadingMarket(false));
        }
    }, [marketData.length]);

    const gold = marketData.find(item => item.symbol === 'GC=F');
    const silver = marketData.find(item => item.symbol === 'SI=F');
    const copper = marketData.find(item => item.symbol === 'HG=F');
    
    const gsRatio = gold && silver && silver.price > 0 ? (gold.price / silver.price).toFixed(2) : null;
    const cgRatio = copper && gold && gold.price > 0 ? (copper.price / gold.price).toFixed(4) : null;

    return (
        <>
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Market & Commodities</h3>
                    <p className="text-slate-500 text-lg">Real-time indicators & recent trends</p>
                </div>
                {loadingMarket && (
                    <div className="text-orange-500 font-medium flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                        Updating...
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {marketData.map((item, idx) => (
                    <div key={idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow relative overflow-hidden">
                        {item.error ? (
                            <div className="flex flex-col h-full justify-center text-center py-4">
                                <h4 className="font-bold text-slate-800 text-lg">{item.name}</h4>
                                <p className="text-red-500 text-sm mt-2">{item.error}</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-lg">{item.name}</h4>
                                        <p className="text-slate-400 text-xs font-mono">{item.symbol}</p>
                                    </div>
                                    <div className={`px-2 py-1 rounded-md text-xs font-bold ${item.change >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {item.change >= 0 ? '+' : ''}{item.changePercent?.toFixed(2)}%
                                    </div>
                                </div>
                                <div className="relative z-10">
                                    <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                                        {item.price?.toLocaleString()}
                                    </span>
                                    <span className="text-sm font-bold text-slate-400 ml-1">
                                        {item.currency}
                                    </span>
                                </div>
                                <div className="mt-6 h-[80px] w-full">
                                    {item.history && item.history.length > 0 && (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart data={item.history}>
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="close" 
                                                    stroke={item.change >= 0 ? '#10B981' : '#EF4444'} 
                                                    strokeWidth={2} 
                                                    dot={false} 
                                                    isAnimationActive={false}
                                                />
                                                <YAxis domain={['dataMin', 'dataMax']} hide />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Metal Ratios Block */}
            <div className="mt-8">
                <h4 className="text-xl font-bold text-slate-800 mb-4">Macro Indicators: Metal Ratios</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <h5 className="font-bold text-slate-800 text-lg mb-1">Gold / Silver Ratio</h5>
                                <p className="text-sm text-slate-500 mb-4">Exchange Ratio (Risk-Aversion Indicator)</p>
                            </div>
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <span className="text-yellow-700 font-bold">Safe-Haven</span>
                            </div>
                        </div>
                        <div className="text-3xl font-black text-slate-900 font-mono mb-3">
                            {gsRatio || 'Loading...'}
                        </div>
                        <div className="text-sm bg-orange-100 text-orange-800 px-3 py-2 rounded-lg font-medium inline-block">
                            💡 &gt; 80 indicates strong risk-off sentiment
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <h5 className="font-bold text-slate-800 text-lg mb-1">Copper / Gold Ratio</h5>
                                <p className="text-sm text-slate-500 mb-4">Exchange Ratio (Economic Expansion Indicator)</p>
                            </div>
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <span className="text-blue-700 font-bold">Expansion</span>
                            </div>
                        </div>
                        <div className="text-3xl font-black text-slate-900 font-mono mb-3">
                            {cgRatio || 'Loading...'}
                        </div>
                        <div className="text-sm bg-blue-100 text-blue-800 px-3 py-2 rounded-lg font-medium inline-block">
                            💡 Uptrend signals economic expansion &amp; rising industrial demand
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default MarketCommodities;
