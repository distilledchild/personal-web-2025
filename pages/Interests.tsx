import React, { useState, useEffect } from 'react';
import { Plane, Dumbbell, Gamepad2, Trophy, ChevronLeft, ChevronRight, PersonStanding, Footprints, Bike } from 'lucide-react';
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
    ResponsiveContainer,
    BarChart,
    Cell
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

interface StravaActivity {
    id: number;
    name: string;
    distance: number;
    moving_time: number;
    elapsed_time: number;
    total_elevation_gain: number;
    type: string;
    sport_type: string;
    start_date: string;
    average_speed: number;
    max_speed: number;
}

interface MonthlyStats {
    walk: { distance: number; count: number };
    bike: { distance: number; count: number };
    run: { distance: number; count: number };
}

// Helper function to calculate monthly statistics
const calculateMonthlyStats = (activities: StravaActivity[]): MonthlyStats => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const stats: MonthlyStats = {
        walk: { distance: 0, count: 0 },
        bike: { distance: 0, count: 0 },
        run: { distance: 0, count: 0 }
    };

    activities.forEach(activity => {
        const activityDate = new Date(activity.start_date);
        if (activityDate.getMonth() === currentMonth && activityDate.getFullYear() === currentYear) {
            const sportType = activity.sport_type.toLowerCase();
            if (sportType === 'walk') {
                stats.walk.distance += activity.distance / 1000; // Convert to km
                stats.walk.count += 1;
            } else if (sportType === 'ride' || sportType === 'bike' || sportType === 'virtualride') {
                stats.bike.distance += activity.distance / 1000;
                stats.bike.count += 1;
            } else if (sportType === 'run' || sportType === 'running') {
                stats.run.distance += activity.distance / 1000;
                stats.run.count += 1;
            }
        }
    });

    return stats;
};

// Helper function to get workout days in current month
const getWorkoutDays = (activities: StravaActivity[]): Set<number> => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const workoutDays = new Set<number>();

    activities.forEach(activity => {
        const activityDate = new Date(activity.start_date);
        if (activityDate.getMonth() === currentMonth && activityDate.getFullYear() === currentYear) {
            workoutDays.add(activityDate.getDate());
        }
    });

    return workoutDays;
};

// Helper function to generate calendar days
const generateCalendarDays = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    // Get first day of month (0 = Sunday, 1 = Monday, etc.)
    const firstDay = new Date(year, month, 1).getDay();
    // Adjust so Monday = 0 (subtract 1, and handle Sunday)
    const firstDayAdjusted = firstDay === 0 ? 6 : firstDay - 1;

    // Get total days in month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (number | null)[] = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDayAdjusted; i++) {
        days.push(null);
    }

    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    return days;
};

export const Interests: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'travel' | 'workout' | 'games' | 'topic4'>('travel');
    const [stateData, setStateData] = useState<StateInfo[]>([]);
    const [stravaActivities, setStravaActivities] = useState<StravaActivity[]>([]);
    const [loadingStrava, setLoadingStrava] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const handleStravaAuth = async () => {
        const API_URL = window.location.hostname === 'localhost'
            ? 'http://localhost:4000'
            : 'https://personal-web-2025-production.up.railway.app';

        try {
            const response = await fetch(`${API_URL}/api/strava/auth`);
            const data = await response.json();

            // Redirect to Strava authorization page
            window.location.href = data.authUrl;
        } catch (error) {
            console.error('Failed to initiate Strava auth:', error);
        }
    };

    useEffect(() => {
        const API_URL = window.location.hostname === 'localhost'
            ? 'http://localhost:4000'
            : 'https://personal-web-2025-production.up.railway.app';

        const fetchStates = async () => {
            try {
                const response = await fetch(`${API_URL}/api/travel/states`);
                if (response.ok) {
                    const data = await response.json();
                    setStateData(data);
                }
            } catch (error) {
                console.error('Failed to fetch state data:', error);
            }
        };

        const loadStravaActivities = async () => {
            setLoadingStrava(true);
            try {
                // Try fetching from database first
                const response = await fetch(`${API_URL}/api/workouts`);
                if (response.ok) {
                    const data = await response.json();
                    // Map DB activity_id to id for frontend compatibility
                    const activities = data.map((activity: any) => ({
                        ...activity,
                        id: activity.activity_id || activity.id
                    }));
                    setStravaActivities(activities);
                } else {
                    // Fallback to localStorage if API fails
                    console.warn('Failed to fetch from DB, checking localStorage');
                    const storedActivities = localStorage.getItem('strava_activities');
                    if (storedActivities) {
                        setStravaActivities(JSON.parse(storedActivities));
                    }
                }
            } catch (error) {
                console.error('Failed to load Strava activities:', error);
                // Fallback to localStorage
                const storedActivities = localStorage.getItem('strava_activities');
                if (storedActivities) {
                    setStravaActivities(JSON.parse(storedActivities));
                }
            } finally {
                setLoadingStrava(false);
            }
        };

        if (activeTab === 'travel') {
            fetchStates();
        } else if (activeTab === 'workout') {
            loadStravaActivities();
        }
    }, [activeTab]);

    // Calculate monthly stats
    const monthlyStats = calculateMonthlyStats(stravaActivities);
    const workoutDays = getWorkoutDays(stravaActivities);
    const calendarDays = generateCalendarDays();
    const today = new Date().getDate();

    const chartData = [
        { name: 'Walk', distance: monthlyStats.walk.distance, fill: 'url(#walkGradient)' },
        { name: 'Run', distance: monthlyStats.run.distance, fill: 'url(#runGradient)' },
        { name: 'Bike', distance: monthlyStats.bike.distance, fill: 'url(#bikeGradient)' }
    ];

    // Pagination logic
    const totalPages = Math.ceil(stravaActivities.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentActivities = stravaActivities.slice(startIndex, endIndex);

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

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
                            onClick={() => setActiveTab('workout')}
                            className={`
                flex items-center gap-2 px-6 py-4 border-b-2 text-lg font-bold transition-all duration-300
                ${activeTab === 'workout'
                                    ? 'border-blue-500 text-blue-500'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
              `}
                        >
                            <Dumbbell size={20} />
                            <span>Workout</span>
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

                    {activeTab === 'workout' && (
                        <div className="animate-fadeIn space-y-8">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Workout Activities</h3>
                                    <p className="text-slate-500 text-lg">My workout activities from Strava</p>
                                </div>
                                {import.meta.env.DEV && (
                                    <button
                                        onClick={handleStravaAuth}
                                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                                    >
                                        Sync from Strava
                                    </button>
                                )}
                            </div>

                            {loadingStrava ? (
                                <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                                    <Dumbbell size={48} className="mx-auto mb-4 opacity-50 animate-pulse" />
                                    <p>Loading activities...</p>
                                </div>
                            ) : stravaActivities.length > 0 ? (
                                <>
                                    {/* Statistics Section */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* Bar Chart - Monthly Distance */}
                                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                                            <h4 className="text-lg font-bold text-slate-900 mb-4">This Month's Distance (km)</h4>
                                            <ResponsiveContainer width="100%" height={250}>
                                                <BarChart data={chartData}>
                                                    <defs>
                                                        <linearGradient id="walkGradient" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#93c5fd" stopOpacity={1} />
                                                            <stop offset="100%" stopColor="#60a5fa" stopOpacity={1} />
                                                        </linearGradient>
                                                        <linearGradient id="runGradient" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                                                            <stop offset="100%" stopColor="#2563eb" stopOpacity={1} />
                                                        </linearGradient>
                                                        <linearGradient id="bikeGradient" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#1d4ed8" stopOpacity={1} />
                                                            <stop offset="100%" stopColor="#1e3a8a" stopOpacity={1} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                                    />
                                                    <Bar dataKey="distance" radius={[8, 8, 0, 0]}>
                                                        {chartData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* Monthly Calendar */}
                                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                                            <h4 className="text-lg font-bold text-slate-900 mb-4">
                                                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                            </h4>
                                            <div className="grid grid-cols-7 gap-1">
                                                {/* Day headers */}
                                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                                    <div key={day} className="text-center text-xs font-bold text-slate-600 py-1">
                                                        {day}
                                                    </div>
                                                ))}
                                                {/* Calendar days */}
                                                {calendarDays.map((day, index) => (
                                                    <div
                                                        key={index}
                                                        className={`
                                                            aspect-square flex items-center justify-center text-sm rounded-lg
                                                            ${day === null ? '' :
                                                                workoutDays.has(day) ? 'bg-[#080C54] text-white font-bold' :
                                                                    day > today ? 'text-slate-400' :
                                                                        'text-black'}
                                                        `}
                                                    >
                                                        {day}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Activity Counters */}
                                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                                            <h4 className="text-lg font-bold text-slate-900 mb-4">
                                                Activity Count ({new Date().toLocaleDateString('en-US', { month: 'long' })})
                                            </h4>
                                            <div className="grid grid-cols-3 gap-4">
                                                {/* Walk Counter */}
                                                <div className="flex flex-col items-center">
                                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-300 to-blue-400 flex items-center justify-center shadow-lg">
                                                        <span className="text-2xl font-bold text-white">{monthlyStats.walk.count}</span>
                                                    </div>
                                                    <span className="text-xs font-medium text-slate-600 mt-2">Walk</span>
                                                </div>

                                                {/* Run Counter */}
                                                <div className="flex flex-col items-center">
                                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                                                        <span className="text-2xl font-bold text-white">{monthlyStats.run.count}</span>
                                                    </div>
                                                    <span className="text-xs font-medium text-slate-600 mt-2">Run</span>
                                                </div>

                                                {/* Bike Counter */}
                                                <div className="flex flex-col items-center">
                                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-700 to-blue-800 flex items-center justify-center shadow-lg">
                                                        <span className="text-2xl font-bold text-white">{monthlyStats.bike.count}</span>
                                                    </div>
                                                    <span className="text-xs font-medium text-slate-600 mt-2">Bike</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Activity Table with Pagination */}
                                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-gradient-to-r from-blue-50 to-slate-50">
                                                    <tr>
                                                        <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 border-b border-slate-200">Date</th>
                                                        <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 border-b border-slate-200">Activity Name</th>
                                                        <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 border-b border-slate-200">Type</th>
                                                        <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 border-b border-slate-200">Distance</th>
                                                        <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 border-b border-slate-200">Time</th>
                                                        <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 border-b border-slate-200">Elevation</th>
                                                        <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 border-b border-slate-200">Avg Speed</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentActivities.map((activity, index) => (
                                                        <tr
                                                            key={activity.id}
                                                            className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                                                        >
                                                            <td className="px-6 py-4 text-sm text-slate-600 border-b border-slate-100">
                                                                {new Date(activity.start_date).toLocaleDateString('en-US', {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    year: 'numeric'
                                                                })}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm font-medium text-slate-900 border-b border-slate-100">
                                                                {activity.name}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-slate-600 border-b border-slate-100">
                                                                {activity.sport_type.toLowerCase() === 'walk' ? (
                                                                    <PersonStanding size={24} className="text-blue-400" />
                                                                ) : activity.sport_type.toLowerCase().includes('ride') || activity.sport_type.toLowerCase() === 'bike' || activity.sport_type.toLowerCase() === 'virtualride' ? (
                                                                    <Bike size={24} className="text-blue-800" />
                                                                ) : activity.sport_type.toLowerCase() === 'run' || activity.sport_type.toLowerCase() === 'running' ? (
                                                                    <Footprints size={24} className="text-blue-600" />
                                                                ) : (
                                                                    <span className="text-xs text-gray-600">{activity.sport_type}</span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-slate-600 border-b border-slate-100">
                                                                {(activity.distance / 1000).toFixed(2)} km
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-slate-600 border-b border-slate-100">
                                                                {Math.floor(activity.moving_time / 3600)}h {Math.floor((activity.moving_time % 3600) / 60)}m
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-slate-600 border-b border-slate-100">
                                                                {activity.total_elevation_gain.toFixed(0)} m
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-slate-600 border-b border-slate-100">
                                                                {(activity.average_speed * 3.6).toFixed(1)} km/h
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Pagination Controls */}
                                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                                            <p className="text-sm text-slate-600">
                                                Showing <span className="font-bold text-slate-900">{startIndex + 1}</span> to{' '}
                                                <span className="font-bold text-slate-900">{Math.min(endIndex, stravaActivities.length)}</span> of{' '}
                                                <span className="font-bold text-slate-900">{stravaActivities.length}</span> activities
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={handlePrevPage}
                                                    disabled={currentPage === 1}
                                                    className={`px-4 py-2 rounded-lg font-medium transition-all ${currentPage === 1
                                                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                        : 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm hover:shadow-md'
                                                        }`}
                                                >
                                                    <ChevronLeft size={20} />
                                                </button>
                                                <span className="text-sm font-medium text-slate-700">
                                                    Page {currentPage} of {totalPages}
                                                </span>
                                                <button
                                                    onClick={handleNextPage}
                                                    disabled={currentPage === totalPages}
                                                    className={`px-4 py-2 rounded-lg font-medium transition-all ${currentPage === totalPages
                                                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                        : 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm hover:shadow-md'
                                                        }`}
                                                >
                                                    <ChevronRight size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                                    <Dumbbell size={48} className="mx-auto mb-4 opacity-50" />
                                    <p className="mb-4">No activities found</p>
                                    <p className="text-sm">Click "Sync from Strava" to authorize and load your activities</p>
                                </div>
                            )}
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
