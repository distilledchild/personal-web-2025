import React, { useState, useEffect } from 'react';
import { Plane, Bike, Gamepad2, Trophy } from 'lucide-react';
import { ComposableMap, Geographies, Geography, Marker, Annotation } from 'react-simple-maps';
import { geoCentroid } from 'd3-geo';
import {
    ComposedChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

// FIPS to Abbreviation Mapping
const stateAbbreviations: { [key: string]: string } = {
    "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO", "09": "CT", "10": "DE", "11": "DC",
    "12": "FL", "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN", "19": "IA", "20": "KS", "21": "KY",
    "22": "LA", "23": "ME", "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS", "29": "MO", "30": "MT",
    "31": "NE", "32": "NV", "33": "NH", "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND", "39": "OH",
    "40": "OK", "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
    "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI", "56": "WY"
};

// Mock Data for Visualizations (Topic 4)
const mockInteractionData = Array.from({ length: 50 }, (_, i) => ({
    pos: i * 1000,
    enhancer: Math.abs(Math.sin(i * 0.1) * 100) + Math.random() * 20,
    interaction: Math.abs(Math.cos(i * 0.1) * 0.8) + Math.random() * 0.1,
    ctcf: Math.random() > 0.8 ? 1 : 0
}));

interface StateInfo {
    code: string;
    name: string;
    status: 'NOT_VISITED' | 'VISITED' | 'STAYED';
}

export const Interests: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'travel' | 'bike' | 'games' | 'topic4'>('travel');
    const [stateData, setStateData] = useState<StateInfo[]>([]);

    useEffect(() => {
        const fetchStates = async () => {
            try {
                // Determine API URL based on environment
                const API_URL = window.location.hostname === 'localhost'
                    ? 'http://localhost:4000'
                    : 'https://personal-web-2025-production.up.railway.app';

                const response = await fetch(`${API_URL}/api/travel/states`);
                if (response.ok) {
                    const data = await response.json();
                    setStateData(data);
                }
            } catch (error) {
                console.error('Failed to fetch state data:', error);
            }
        };

        if (activeTab === 'travel') {
            fetchStates();
        }
    }, [activeTab]);

    // Removed unused mapHandler and statesCustomConfig

    // Removed unused tooltip handlers

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Fixed Header Section */}
            <div className="pt-32 pb-6 px-6 bg-white border-b border-slate-100">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-4xl font-bold text-slate-900 mb-8 text-center">
                        Topics
                    </h2>

                    {/* Tabs Navigation */}
                    <div className="flex flex-wrap justify-center gap-2">
                        <button
                            onClick={() => setActiveTab('travel')}
                            className={`
                flex items-center gap-2 px-6 py-4 border-b-2 text-lg font-bold transition-all duration-300
                ${activeTab === 'travel'
                                    ? 'border-[#FFA300] text-[#FFA300]'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
              `}
                        >
                            <Plane size={20} />
                            <span>Travel</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('bike')}
                            className={`
                flex items-center gap-2 px-6 py-4 border-b-2 text-lg font-bold transition-all duration-300
                ${activeTab === 'bike'
                                    ? 'border-blue-500 text-blue-500'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
              `}
                        >
                            <Bike size={20} />
                            <span>Bike</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('games')}
                            className={`
                flex items-center gap-2 px-6 py-4 border-b-2 text-lg font-bold transition-all duration-300
                ${activeTab === 'games'
                                    ? 'border-purple-500 text-purple-500'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
              `}
                        >
                            <Gamepad2 size={20} />
                            <span>Games</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('topic4')}
                            className={`
                flex items-center gap-2 px-6 py-4 border-b-2 text-lg font-bold transition-all duration-300
                ${activeTab === 'topic4'
                                    ? 'border-green-600 text-green-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
              `}
                        >
                            <Trophy size={20} />
                            <span>Sports</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-6 pb-20">
                <div className="max-w-7xl mx-auto pt-8">
                    {activeTab === 'travel' && (
                        <div className="animate-fadeIn space-y-8">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Travel Map</h3>
                                </div>
                            </div>

                            <div className="w-full flex flex-col md:flex-row items-start justify-center bg-slate-50 rounded-2xl border border-slate-100 p-8 overflow-hidden relative gap-8">
                                <div className="flex-1 w-full max-w-4xl h-[600px]">
                                    <ComposableMap projection="geoAlbersUsa">
                                        <Geographies geography={geoUrl}>
                                            {({ geographies }) => {
                                                if (!geographies) return null;
                                                return (
                                                    <>
                                                        {geographies.map(geo => {
                                                            const cur = stateAbbreviations[geo.id];
                                                            if (!cur) return null;

                                                            const stateInfo = stateData.find(s => s.code === cur);
                                                            let fillColor = "#FFFFFF";
                                                            if (stateInfo?.status === 'STAYED') fillColor = "#FFA300";
                                                            else if (stateInfo?.status === 'VISITED') fillColor = "#FFCC80";

                                                            return (
                                                                <Geography
                                                                    key={geo.rsmKey}
                                                                    geography={geo}
                                                                    fill={fillColor}
                                                                    stroke="#CBD5E1"
                                                                    strokeWidth={0.5}
                                                                    style={{
                                                                        default: { outline: "none" },
                                                                        hover: { outline: "none" },
                                                                        pressed: { outline: "none" }
                                                                    }}
                                                                />
                                                            );
                                                        })}
                                                        {geographies.map(geo => {
                                                            const cur = stateAbbreviations[geo.id];
                                                            if (!cur) return null;

                                                            const centroid = geoCentroid(geo);
                                                            const smallStates = ["RI", "DE", "VT", "NH", "MA", "CT", "NJ", "MD", "DC"];

                                                            // Offsets for small states (approximate)
                                                            const offsets: { [key: string]: [number, number] } = {
                                                                "RI": [30, 0], "DE": [30, 0], "VT": [0, -20], "NH": [20, 0],
                                                                "MA": [30, 0], "CT": [30, 10], "NJ": [30, 0], "MD": [30, 10], "DC": [30, 20]
                                                            };

                                                            if (smallStates.includes(cur)) {
                                                                return (
                                                                    <Annotation
                                                                        key={geo.rsmKey + "-anno"}
                                                                        subject={centroid}
                                                                        dx={offsets[cur][0]}
                                                                        dy={offsets[cur][1]}
                                                                        connectorProps={{
                                                                            stroke: "#64748B",
                                                                            strokeWidth: 1,
                                                                            strokeLinecap: "round"
                                                                        }}
                                                                    >
                                                                        <text x="4" fontSize={10} alignmentBaseline="middle" fill="#64748B" fontWeight="500">
                                                                            {cur}
                                                                        </text>
                                                                    </Annotation>
                                                                );
                                                            } else {
                                                                return (
                                                                    <Marker key={geo.rsmKey + "-marker"} coordinates={centroid}>
                                                                        <text y="2" fontSize={10} textAnchor="middle" fill="#64748B" fontWeight="500">
                                                                            {cur}
                                                                        </text>
                                                                    </Marker>
                                                                );
                                                            }
                                                        })}
                                                    </>
                                                );
                                            }}
                                        </Geographies>
                                    </ComposableMap>
                                </div>

                                {/* Legend - Right Side */}
                                <div className="flex flex-col gap-4 min-w-[120px] pt-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-[#FFA300] border border-slate-200"></div>
                                        <span className="text-slate-600 font-medium">Stayed</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-[#FFCC80] border border-slate-200"></div>
                                        <span className="text-slate-600 font-medium">Visited</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'bike' && (
                        <div className="animate-fadeIn space-y-8">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Cycling Adventures</h3>
                                    <p className="text-slate-500 text-lg">My favorite routes and rides.</p>
                                </div>
                            </div>
                            <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                                <Bike size={48} className="mx-auto mb-4 opacity-50" />
                                <p>Content coming soon...</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'games' && (
                        <div className="animate-fadeIn space-y-8">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Gaming</h3>
                                    <p className="text-slate-500 text-lg">What I'm playing currently.</p>
                                </div>
                            </div>
                            <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                                <Gamepad2 size={48} className="mx-auto mb-4 opacity-50" />
                                <p>Content coming soon...</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'topic4' && (
                        <div className="animate-fadeIn space-y-8">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Sports Analysis</h3>
                                    <p className="text-slate-500 text-lg">Detailed analysis and visualization (formerly Topic 1).</p>
                                </div>
                                <div className="flex gap-3">
                                    <select className="bg-slate-50 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg border border-slate-200 outline-none cursor-pointer hover:bg-slate-100 transition-colors">
                                        <option>Option A</option>
                                        <option>Option B</option>
                                        <option>Option C</option>
                                    </select>
                                </div>
                            </div>

                            <div className="h-[400px] w-full bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={mockInteractionData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                        <XAxis dataKey="pos" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                        <Bar dataKey="enhancer" barSize={30} fill="#FFE0B2" name="Metric A" radius={[4, 4, 0, 0]} />
                                        <Line type="monotone" dataKey="interaction" stroke="#FFA300" strokeWidth={4} name="Metric B" dot={false} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-6 bg-orange-50 rounded-2xl border border-orange-100">
                                    <h4 className="font-bold text-orange-900 mb-2">Key Insight 1</h4>
                                    <p className="text-sm text-orange-800/80">Description of the first key insight derived from the data analysis.</p>
                                </div>
                                <div className="p-6 bg-orange-50 rounded-2xl border border-orange-100">
                                    <h4 className="font-bold text-orange-900 mb-2">Key Insight 2</h4>
                                    <p className="text-sm text-orange-800/80">Description of the second key insight derived from the data analysis.</p>
                                </div>
                                <div className="p-6 bg-orange-50 rounded-2xl border border-orange-100">
                                    <h4 className="font-bold text-orange-900 mb-2">Key Insight 3</h4>
                                    <p className="text-sm text-orange-800/80">Description of the third key insight derived from the data analysis.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
