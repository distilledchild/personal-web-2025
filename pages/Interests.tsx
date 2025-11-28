import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plane, Dumbbell, Gamepad2, BarChart3, ChevronLeft, ChevronRight, PersonStanding, Footprints, Bike, Palette, MapPin, X } from 'lucide-react';
import { ComposableMap, Geographies, Geography, Marker, Annotation } from 'react-simple-maps';
import { geoCentroid, geoAlbersUsa } from 'd3-geo';
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

// Mock Data for Visualizations (Topic 4)
const mockInteractionData = Array.from({ length: 50 }, (_, i) => ({
    pos: i * 1000,
    enhancer: Math.abs(Math.sin(i * 0.1) * 100) + Math.random() * 20,
    interaction: Math.abs(Math.cos(i * 0.1) * 0.8) + Math.random() * 0.1,
    ctcf: Math.random() > 0.8 ? 1 : 0
}));

// State capitals coordinates (for test)
// const stateCapitals: { [key: string]: { name: string; coordinates: [number, number] } } = {
//     "NY": { name: "Albany", coordinates: [-73.7562, 42.6526] },
//     "MA": { name: "Boston", coordinates: [-71.0589, 42.3601] },
//     "PA": { name: "Harrisburg", coordinates: [-76.8867, 40.2732] },
//     "CA": { name: "Sacramento", coordinates: [-121.4944, 38.5816] },
//     "TX": { name: "Austin", coordinates: [-97.7431, 30.2672] },
// };

// Art museums interface and data
interface ArtMuseum {
    id: number;
    city: string;
    city_name?: string;
    museum_code: string;
    museum_name: string;
    state: string;
    coordinates?: [number, number];
    fips_code?: string;
    artworks?: string[];
}

// State info interface and data
interface StateInfo {
    code: string;
    name: string;
    status: 'NOT_VISITED' | 'VISITED' | 'STAYED';
    fips_code: string;
}

// Strava activity interface and data
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
    const { submenu } = useParams<{ submenu?: string }>();
    const navigate = useNavigate();

    // Determine active tab from URL, default to 'travel'
    const activeTab = (submenu as 'travel' | 'workout' | 'art' | 'data') || 'travel';

    const projection = useMemo(() => {
        return geoAlbersUsa()
            .scale(1000)
            .translate([400, 300]);
    }, []);

    const [hoveredState, setHoveredState] = useState<string | null>(null);
    const [expandedState, setExpandedState] = useState<string | null>(null);
    const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null);
    const [expandedCentroid, setExpandedCentroid] = useState<{ x: number, y: number } | null>(null);
    const [hoveredPin, setHoveredPin] = useState<number | null>(null);
    const [selectedMuseum, setSelectedMuseum] = useState<ArtMuseum | null>(null);
    const [selectedArtwork, setSelectedArtwork] = useState<string | null>(null);
    const [stateData, setStateData] = useState<StateInfo[]>([]);
    const [stravaActivities, setStravaActivities] = useState<StravaActivity[]>([]);
    const [loadingStrava, setLoadingStrava] = useState(false);
    const [currentMonthName, setCurrentMonthName] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const [artMuseums, setArtMuseums] = useState<ArtMuseum[]>([]);

    useEffect(() => {
        const API_URL = window.location.hostname === 'localhost'
            ? 'http://localhost:4000'
            : 'https://personal-web-2025-production.up.railway.app';

        if (activeTab === 'art') {
            // Reset expanded state when entering Art submenu
            setExpandedState(null);
            setClickPosition(null);
            setExpandedCentroid(null);
            setHoveredState(null);
            setSelectedMuseum(null);
            setSelectedArtwork(null);

            fetch(`${API_URL}/api/interests/art-museums`)
                .then(res => res.json())
                .then(data => setArtMuseums(data))
                .catch(err => console.error('Failed to fetch art museums:', err));
        }
    }, [activeTab]);

    const handleStravaAuth = async () => {
        try {
            const response = await fetch('/api/strava/auth');
            const data = await response.json();

            // Redirect to Strava authorization page
            window.location.href = data.authUrl;
        } catch (error) {
            console.error('Failed to initiate Strava auth:', error);
        }
    };

    // Function to load artworks from public/art-images/{museum_code} folder
    const loadArtworksForMuseum = async (museum: ArtMuseum): Promise<ArtMuseum> => {
        const museumCode = museum.museum_code;
        const basePath = `/art-images/${museumCode}`;

        try {
            // We can't directly list files in a static folder from the frontend,
            // so we'll try to load images by convention (e.g., NOMA1.JPG, NOMA2.JPG, etc.)
            // We'll try up to 50 images and filter out the ones that don't exist
            const artworkPromises: Promise<string | null>[] = [];

            // Try loading images with common naming patterns
            for (let i = 1; i <= 50; i++) {
                // Try both .JPG and .jpg extensions
                const imagePathJPG = `${basePath}/${museumCode}${i}.JPG`;
                const imagePathJpg = `${basePath}/${museumCode}${i}.jpg`;
                const imagePathPNG = `${basePath}/${museumCode}${i}.PNG`;
                const imagePathPng = `${basePath}/${museumCode}${i}.png`;

                // Create a promise that resolves to the path if image exists, null otherwise
                const checkImage = async (path: string): Promise<string | null> => {
                    return new Promise((resolve) => {
                        const img = new Image();
                        img.onload = () => resolve(path);
                        img.onerror = () => resolve(null);
                        img.src = path;
                    });
                };

                artworkPromises.push(
                    checkImage(imagePathJPG).then(result => result || checkImage(imagePathJpg)).then(result => result || checkImage(imagePathPNG)).then(result => result || checkImage(imagePathPng))
                );
            }

            const results = await Promise.all(artworkPromises);
            const artworks = results.filter((path): path is string => path !== null);

            return {
                ...museum,
                artworks
            };
        } catch (error) {
            console.error('Failed to load artworks for museum:', museum.museum_name, error);
            return museum;
        }
    };

    // Handler for museum pin click
    const handleMuseumClick = async (museum: ArtMuseum) => {
        const museumWithArtworks = await loadArtworksForMuseum(museum);
        setSelectedMuseum(museumWithArtworks);
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
                    // alert("It's frontend:::::::::::::::: DEBUG " + JSON.stringify(data, null, 2));
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
                    // Map DB activity_id to id for frontend compatibility and sort by date (newest first)
                    const activities = data
                        .map((activity: any) => ({
                            ...activity,
                            id: activity.activity_id || activity.id
                        }))
                        .sort((a: any, b: any) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
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

        if (activeTab === 'travel' || activeTab === 'art') {
            fetchStates();
        } else if (activeTab === 'workout') {
            loadStravaActivities();
        }
    }, [activeTab]);

    // test for fetching data from backend
    // useEffect(() => {
    //     if (activeTab === 'travel' && stateData.length > 0) {
    //         const stayedStates = stateData.filter(s => s.status === 'STAYED');
    //         // alert("It's here " + JSON.stringify(stayedStates, null, 2));
    //         // const fipsCodes = stayedStates.map(s => s.fips_code).filter(Boolean);
    //         // if (fipsCodes.length > 0) {
    //         //     alert(`FIPS codes for 'STAYED' states: ${fipsCodes.join(', ')}`);
    //         // } else {
    //         //     alert("No 'STAYED' states found in the data.");
    //         // }
    //     }
    // }, [stateData, activeTab]);

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
                            onClick={() => navigate('/interests/travel')}
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
                            onClick={() => navigate('/interests/workout')}
                            className={`
                flex items-center gap-2 px-6 py-4 border-b-2 text-lg font-bold transition-all duration-300
                ${activeTab === 'workout'
                                    ? 'border-[#FFA300] text-[#FFA300]'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
              `}
                        >
                            <Dumbbell size={20} />
                            <span>Workout</span>
                        </button>
                        <button
                            onClick={() => navigate('/interests/art')}
                            className={`
                flex items-center gap-2 px-6 py-4 border-b-2 text-lg font-bold transition-all duration-300
                ${activeTab === 'art'
                                    ? 'border-[#FFA300] text-[#FFA300]'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
              `}
                        >
                            <Palette size={20} />
                            <span>Art</span>
                        </button>
                        <button
                            onClick={() => navigate('/interests/data')}
                            className={`
                flex items-center gap-2 px-6 py-4 border-b-2 text-lg font-bold transition-all duration-300
                ${activeTab === 'data'
                                    ? 'border-[#FFA300] text-[#FFA300]'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
              `}
                        >
                            <BarChart3 size={20} />
                            <span>Data</span>
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
                                                            const stateInfo = stateData.find(s => s.fips_code === geo.id);
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
                                                            const stateInfo = stateData.find(s => s.fips_code === geo.id);
                                                            const cur = stateInfo?.code;
                                                            if (!cur) return null;

                                                            const centroid = geoCentroid(geo);
                                                            const smallStates = ["RI", "DE", "VT", "NH", "MA", "CT", "NJ", "MD", "DC"];

                                                            // Offsets for small states (approximate)
                                                            const offsets: { [key: string]: [number, number] } = {
                                                                "RI": [30, 0], "DE": [30, 0], "VT": [-10, -40], "NH": [20, 0],
                                                                "MA": [30, -5], "CT": [30, 10], "NJ": [30, 0], "MD": [30, 10], "DC": [30, 20]
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
                                        className="px-6 py-3 bg-gradient-to-r from-[#FFA300] to-[#FF8C00] text-white font-bold rounded-xl hover:from-[#FF8C00] hover:to-[#FF7700] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
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
                                                            <stop offset="0%" stopColor="#FFCC80" stopOpacity={1} />
                                                            <stop offset="100%" stopColor="#FFB84D" stopOpacity={1} />
                                                        </linearGradient>
                                                        <linearGradient id="runGradient" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#FFA300" stopOpacity={1} />
                                                            <stop offset="100%" stopColor="#FF8C00" stopOpacity={1} />
                                                        </linearGradient>
                                                        <linearGradient id="bikeGradient" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#FF8C00" stopOpacity={1} />
                                                            <stop offset="100%" stopColor="#FF7700" stopOpacity={1} />
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
                                                                workoutDays.has(day) ? 'text-white font-bold' :
                                                                    day > today ? 'text-slate-400' :
                                                                        'text-black'}
                                                        `}
                                                        style={
                                                            day !== null && workoutDays.has(day)
                                                                ? { background: 'linear-gradient(135deg, #FFCC80 0%, #FFA300 50%, #FF6600 100%)' }
                                                                : {}
                                                        }
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
                                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FFCC80] to-[#FFB84D] flex items-center justify-center shadow-lg">
                                                        <span className="text-2xl font-bold text-white">{monthlyStats.walk.count}</span>
                                                    </div>
                                                    <span className="text-xs font-medium text-slate-600 mt-2">Walk</span>
                                                </div>

                                                {/* Run Counter */}
                                                <div className="flex flex-col items-center">
                                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FFA300] to-[#FF8C00] flex items-center justify-center shadow-lg">
                                                        <span className="text-2xl font-bold text-white">{monthlyStats.run.count}</span>
                                                    </div>
                                                    <span className="text-xs font-medium text-slate-600 mt-2">Run</span>
                                                </div>

                                                {/* Bike Counter */}
                                                <div className="flex flex-col items-center">
                                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF8C00] to-[#FF7700] flex items-center justify-center shadow-lg">
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
                                            <table className="w-full table-fixed">
                                                <thead className="bg-gradient-to-r from-orange-50 to-slate-50">
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
                                                            className={`hover:bg-orange-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
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
                                                                    <PersonStanding size={24} className="text-[#FFCC80]" />
                                                                ) : activity.sport_type.toLowerCase().includes('ride') || activity.sport_type.toLowerCase() === 'bike' || activity.sport_type.toLowerCase() === 'virtualride' ? (
                                                                    <Bike size={24} className="text-[#FF7700]" />
                                                                ) : activity.sport_type.toLowerCase() === 'run' || activity.sport_type.toLowerCase() === 'running' ? (
                                                                    <Footprints size={24} className="text-[#FFA300]" />
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
                                                    {/* Fill empty rows to maintain 5-row height */}
                                                    {Array.from({ length: Math.max(0, itemsPerPage - currentActivities.length) }).map((_, index) => (
                                                        <tr
                                                            key={`empty-${index}`}
                                                            className={`${(currentActivities.length + index) % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                                                        >
                                                            <td className="px-6 py-4 text-sm text-slate-600 border-b border-slate-100">&nbsp;</td>
                                                            <td className="px-6 py-4 text-sm text-slate-600 border-b border-slate-100">&nbsp;</td>
                                                            <td className="px-6 py-4 text-sm text-slate-600 border-b border-slate-100">&nbsp;</td>
                                                            <td className="px-6 py-4 text-sm text-slate-600 border-b border-slate-100">&nbsp;</td>
                                                            <td className="px-6 py-4 text-sm text-slate-600 border-b border-slate-100">&nbsp;</td>
                                                            <td className="px-6 py-4 text-sm text-slate-600 border-b border-slate-100">&nbsp;</td>
                                                            <td className="px-6 py-4 text-sm text-slate-600 border-b border-slate-100">&nbsp;</td>
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
                                                        : 'bg-[#FFA300] text-white hover:bg-[#FF8C00] shadow-sm hover:shadow-md'
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
                                                        : 'bg-[#FFA300] text-white hover:bg-[#FF8C00] shadow-sm hover:shadow-md'
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

                    {activeTab === 'art' && (
                        <div className="animate-fadeIn space-y-8">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Art Museums</h3>
                                    <p className="text-slate-500 text-lg">Explore art collections across the United States</p>
                                </div>
                            </div>

                            <div className="w-full flex flex-col md:flex-row items-start justify-center bg-slate-50 rounded-2xl border border-slate-100 p-8 overflow-visible relative gap-8" onClick={(e) => {
                                if (expandedState) {
                                    // Get mouse position and find if it's over a state with museums
                                    const target = e.target as Element;
                                    const geography = target.closest('[data-state-code]');

                                    if (geography) {
                                        const stateCode = geography.getAttribute('data-state-code');
                                        const hasMuseum = stateCode && artMuseums.some(m => m.state === stateCode);

                                        if (hasMuseum && stateCode) {
                                            setHoveredState(stateCode);
                                        } else {
                                            setHoveredState(null);
                                        }
                                    } else {
                                        setHoveredState(null);
                                    }

                                    setExpandedState(null);
                                    setClickPosition(null);
                                    setExpandedCentroid(null);
                                }
                            }}>
                                <div className="flex-1 w-full max-w-4xl h-[600px] overflow-visible">
                                    <ComposableMap
                                        projection="geoAlbersUsa"
                                        style={{ overflow: 'visible' }}
                                        onClick={() => {
                                            if (expandedState) {
                                                setExpandedState(null);
                                                setClickPosition(null);
                                                setHoveredState(null);
                                            }
                                        }}
                                    >
                                        <defs>
                                            <filter id="state-shadow" x="-50%" y="-50%" width="200%" height="200%">
                                                <feDropShadow dx="0" dy="0" stdDeviation="15" floodOpacity="0.5" />
                                            </filter>
                                        </defs>
                                        <Geographies geography={geoUrl}>
                                            {({ geographies }) => {
                                                const activeStateId = expandedState || hoveredState;
                                                const activeGeo = geographies.find(geo => {
                                                    const hasMuseum = artMuseums.some(m => m.fips_code === geo.id);
                                                    return hasMuseum && artMuseums.find(m => m.fips_code === geo.id)?.state === activeStateId;
                                                });
                                                const otherGeos = geographies.filter(geo => geo !== activeGeo);

                                                return (
                                                    <>
                                                        {/* Background layer: all non-active states */}
                                                        {otherGeos.map(geo => {
                                                            const hasMuseum = artMuseums.some(m => m.fips_code === geo.id);
                                                            const museum = artMuseums.find(m => m.fips_code === geo.id);
                                                            const stateCode = museum?.state;
                                                            const isHovered = hoveredState === stateCode && !expandedState;

                                                            return (
                                                                <Geography
                                                                    key={geo.rsmKey}
                                                                    geography={geo}
                                                                    fill={hasMuseum ? (isHovered ? "#FFA300" : "#FFCC80") : "#FFFFFF"}
                                                                    stroke="#CBD5E1"
                                                                    strokeWidth={0.5}
                                                                    data-state-code={stateCode || ''}
                                                                    onMouseEnter={() => {
                                                                        if (hasMuseum && !expandedState && stateCode) {
                                                                            setHoveredState(stateCode);
                                                                        }
                                                                    }}
                                                                    onMouseLeave={() => {
                                                                        if (!expandedState) setHoveredState(null);
                                                                    }}
                                                                    onClick={(e) => {
                                                                        if (hasMuseum && !expandedState && stateCode) {
                                                                            e.stopPropagation();
                                                                            const svg = e.currentTarget.ownerSVGElement;
                                                                            if (svg) {
                                                                                const pt = svg.createSVGPoint();
                                                                                pt.x = e.clientX;
                                                                                pt.y = e.clientY;
                                                                                const svgP = pt.matrixTransform(svg.getScreenCTM()!.inverse());
                                                                                setClickPosition({ x: svgP.x, y: svgP.y });
                                                                            }
                                                                            setExpandedState(stateCode);

                                                                            const centroid = geoCentroid(geo);
                                                                            const projCentroid = projection(centroid);
                                                                            if (projCentroid) {
                                                                                setExpandedCentroid({ x: projCentroid[0], y: projCentroid[1] });
                                                                            }
                                                                        }
                                                                    }}
                                                                    style={{
                                                                        default: {
                                                                            outline: "none",
                                                                            filter: isHovered ? "url(#state-shadow)" : "none",
                                                                            transition: "fill 0.5s ease",
                                                                            cursor: hasMuseum ? "pointer" : "default"
                                                                        },
                                                                        hover: {
                                                                            outline: "none",
                                                                            filter: hasMuseum && !expandedState ? "url(#state-shadow)" : "none",
                                                                            transition: "fill 0.5s ease",
                                                                            cursor: hasMuseum ? "pointer" : "default"
                                                                        },
                                                                        pressed: { outline: "none" }
                                                                    }}
                                                                />
                                                            );
                                                        })}

                                                        {/* Foreground layer: active/expanded state */}
                                                        {activeGeo && (() => {
                                                            const museum = artMuseums.find(m => m.fips_code === activeGeo.id);
                                                            const stateCode = museum?.state;
                                                            const stateMuseums = artMuseums.filter(m => m.state === stateCode);
                                                            const isExpanded = expandedState === stateCode;
                                                            const isHovered = hoveredState === stateCode && !expandedState;

                                                            // Use stored expandedCentroid if available (for consistency), otherwise calculate
                                                            let cx = 0, cy = 0;
                                                            if (isExpanded && expandedCentroid) {
                                                                cx = expandedCentroid.x;
                                                                cy = expandedCentroid.y;
                                                            } else {
                                                                const centroid = geoCentroid(activeGeo);
                                                                const proj = projection(centroid);
                                                                if (proj) {
                                                                    cx = proj[0];
                                                                    cy = proj[1];
                                                                }
                                                            }

                                                            let transform = "";
                                                            let opacity = 1;

                                                            if (isExpanded && clickPosition && (cx !== 0 || cy !== 0)) {
                                                                const { x, y } = clickPosition;
                                                                // Move centroid to cursor position (x,y), then scale 2x
                                                                transform = `translate(${x}px, ${y}px) scale(2) translate(${-cx}px, ${-cy}px)`;
                                                            } else if (!isExpanded && !isHovered) {
                                                                // Fade out when collapsing
                                                                opacity = 0;
                                                            }

                                                            return (
                                                                <g style={{
                                                                    transform,
                                                                    opacity,
                                                                    transition: isExpanded ? 'transform 0.5s ease-out, opacity 0.3s ease-out' : 'opacity 0.3s ease-out',
                                                                    pointerEvents: 'auto'
                                                                }}>
                                                                    <Geography
                                                                        key={activeGeo.rsmKey + "-active"}
                                                                        geography={activeGeo}
                                                                        fill={isExpanded ? "#FFA300" : (isHovered ? "#FFA300" : "#FFCC80")}
                                                                        stroke="#CBD5E1"
                                                                        strokeWidth={isExpanded ? 0.25 : 0.5}
                                                                        data-state-code={stateCode || ''}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (!expandedState && stateCode) {
                                                                                const svg = e.currentTarget.ownerSVGElement;
                                                                                let clickX = 0;
                                                                                let clickY = 0;

                                                                                if (svg) {
                                                                                    const pt = svg.createSVGPoint();
                                                                                    pt.x = e.clientX;
                                                                                    pt.y = e.clientY;
                                                                                    const svgP = pt.matrixTransform(svg.getScreenCTM()!.inverse());
                                                                                    clickX = svgP.x;
                                                                                    clickY = svgP.y;
                                                                                    setClickPosition({
                                                                                        x: clickX,
                                                                                        y: clickY
                                                                                    });
                                                                                }
                                                                                setExpandedState(stateCode);

                                                                                // Calculate and store centroid for consistency
                                                                                const centroid = geoCentroid(activeGeo);
                                                                                const projCentroid = projection(centroid);
                                                                                if (projCentroid) {
                                                                                    const [cx, cy] = projCentroid;
                                                                                    setExpandedCentroid({ x: cx, y: cy });

                                                                                    // Alert for Expanded Coordinates (after animation)
                                                                                    setTimeout(() => {
                                                                                        let msg = `[Expanded State: ${stateCode}]\n`;
                                                                                        msg += `New Centroid (Click Pos): (${clickX.toFixed(1)}, ${clickY.toFixed(1)})\n`;

                                                                                        stateMuseums.forEach(m => {
                                                                                            if (m.coordinates) {
                                                                                                const proj = projection(m.coordinates);
                                                                                                if (proj) {
                                                                                                    const [mx, my] = proj;
                                                                                                    // Calculate transformed position: Click + (City - Centroid) * 2
                                                                                                    const exX = clickX + (mx - cx) * 2;
                                                                                                    const exY = clickY + (my - cy) * 2;
                                                                                                    msg += `City ${m.city}: (${exX.toFixed(1)}, ${exY.toFixed(1)})\n`;
                                                                                                }
                                                                                            }
                                                                                        });
                                                                                    }, 550); // Wait for 0.5s transition
                                                                                }
                                                                            }
                                                                        }}
                                                                        onMouseEnter={() => {
                                                                            if (!expandedState && stateCode) {
                                                                                setHoveredState(stateCode);

                                                                                // Alert for Hover Coordinates
                                                                                // Use current centroid calculation for hover
                                                                                const centroid = geoCentroid(activeGeo);
                                                                                const projCentroid = projection(centroid);
                                                                                if (projCentroid) {
                                                                                    const [cx, cy] = projCentroid;
                                                                                    let msg = `[Hover State: ${stateCode}]\n`;
                                                                                    msg += `Centroid: (${cx.toFixed(1)}, ${cy.toFixed(1)})\n`;

                                                                                    stateMuseums.forEach(m => {
                                                                                        if (m.coordinates) {
                                                                                            const proj = projection(m.coordinates);
                                                                                            if (proj) {
                                                                                                const [mx, my] = proj;
                                                                                                msg += `City ${m.city}: (${mx.toFixed(1)}, ${my.toFixed(1)})\n`;
                                                                                            }
                                                                                        }
                                                                                    });
                                                                                }
                                                                            }
                                                                        }}
                                                                        onMouseLeave={() => {
                                                                            if (!expandedState) setHoveredState(null);
                                                                        }}
                                                                        style={{
                                                                            default: {
                                                                                outline: "none",
                                                                                filter: (isHovered || isExpanded) ? "url(#state-shadow)" : "none",
                                                                                transition: "fill 0.5s ease, filter 0.3s ease",
                                                                                cursor: isExpanded ? "default" : "pointer"
                                                                            },
                                                                            hover: {
                                                                                outline: "none",
                                                                                filter: "url(#state-shadow)",
                                                                                transition: "fill 0.5s ease, filter 0.3s ease",
                                                                                cursor: isExpanded ? "default" : "pointer"
                                                                            },
                                                                            pressed: { outline: "none" }
                                                                        }}
                                                                    />

                                                                    {/* Museum Pins - only show when expanded */}
                                                                    {isExpanded && (() => {
                                                                        // Group museums by coordinates to avoid duplicate pins
                                                                        const groupedMuseums = stateMuseums.reduce((acc: Record<string, ArtMuseum[]>, museum: ArtMuseum) => {
                                                                            if (!museum.coordinates) return acc;
                                                                            const key = `${museum.coordinates[0]},${museum.coordinates[1]}`;
                                                                            if (!acc[key]) {
                                                                                acc[key] = [];
                                                                            }
                                                                            acc[key].push(museum);
                                                                            return acc;
                                                                        }, {});

                                                                        return Object.entries(groupedMuseums).map(([coordKey, museums], idx) => {
                                                                            const museum = museums[0]; // Use first museum for pin location

                                                                            // Use coordKey as hover identifier
                                                                            const pinId = coordKey;
                                                                            // Click on museum with artworks, or first one if none have artworks
                                                                            const museumToOpen = museums.find((m: ArtMuseum) => m.artworks && m.artworks.length > 0) || museums[0];

                                                                            return (
                                                                            <Marker key={`pin-${coordKey}-${idx}`} coordinates={museum.coordinates}>
                                                                                <g
                                                                                    transform="scale(0.5) translate(-12, -24)"
                                                                                    onMouseEnter={() => setHoveredPin(pinId)}
                                                                                    onMouseLeave={() => setHoveredPin(null)}
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setSelectedMuseum(museumToOpen);
                                                                                    }}
                                                                                    style={{ cursor: 'pointer' }}
                                                                                >
                                                                                    <path
                                                                                        d="M12 0C7.31 0 3.5 3.81 3.5 8.5c0 6.12 8.5 15.5 8.5 15.5s8.5-9.38 8.5-15.5C20.5 3.81 16.69 0 12 0zm0 11.75c-1.79 0-3.25-1.46-3.25-3.25S10.21 5.25 12 5.25s3.25 1.46 3.25 3.25-1.46 3.25-3.25 3.25z"
                                                                                        fill="#DC2626"
                                                                                        stroke="#FFFFFF"
                                                                                        strokeWidth="1"
                                                                                        style={{ pointerEvents: 'auto' }}
                                                                                    />
                                                                                </g>
                                                                                {/* Tooltips - show first museum only */}
                                                                                {hoveredPin === pinId && (
                                                                                    <g transform="translate(0, -35)">
                                                                                        <foreignObject x="-100" y="-40" width="200" height="50">
                                                                                            <div style={{
                                                                                                background: 'transparent',
                                                                                                padding: '6px 10px',
                                                                                                borderRadius: '8px',
                                                                                                fontSize: '11px',
                                                                                                textAlign: 'center',
                                                                                                pointerEvents: 'none',
                                                                                                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                                                                                lineHeight: '1.3'
                                                                                            }}>
                                                                                                <div style={{ color: '#000', fontWeight: '600' }}>
                                                                                                    {museumToOpen.museum_name}
                                                                                                </div>
                                                                                                <div style={{ fontSize: '10px', color: '#64748b' }}>
                                                                                                    {museum.city_name || museum.city}
                                                                                                </div>
                                                                                            </div>
                                                                                        </foreignObject>
                                                                                    </g>
                                                                                )}
                                                                            </Marker>
                                                                            );
                                                                        });
                                                                    })()}
                                                                </g>
                                                            );
                                                        })()}
                                                    </>
                                                );
                                            }}
                                        </Geographies>
                                    </ComposableMap>
                                </div>
                            </div>

                            {/* Museum Modal - Single Plate with Masonry Layout */}
                            {selectedMuseum && !selectedArtwork && (
                                <div
                                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-500"
                                    onClick={() => setSelectedMuseum(null)}
                                    style={{ animation: 'fadeIn 0.5s ease-out' }}
                                >
                                    <div
                                        className="relative w-full max-w-5xl h-[80vh] bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-500"
                                        onClick={e => e.stopPropagation()}
                                        style={{ animation: 'scaleIn 0.5s ease-out' }}
                                    >
                                        {/* Close button - inside the plate */}
                                        <button
                                            onClick={() => setSelectedMuseum(null)}
                                            className="absolute top-4 right-4 z-10 text-slate-600 hover:text-slate-900 transition-colors bg-white/80 rounded-full p-2 shadow-lg"
                                        >
                                            <X size={24} />
                                        </button>

                                        {/* Masonry Layout - overflow visible to show cropped effect */}
                                        <div className="w-full h-full overflow-y-auto scrollbar-hide p-6 pt-16">
                                            <div className="columns-4 gap-1">
                                                {selectedMuseum.artworks && selectedMuseum.artworks.length > 0 ? selectedMuseum.artworks.map((artwork, index) => {
                                                    // Generate random scale between 0.6 and 1.0 for variety
                                                    const randomScale = 0.6 + (Math.sin(index * 12345) * 0.5 + 0.5) * 0.4;
                                                    // Generate random X-axis offset for staggered effect
                                                    const randomOffsetX = (Math.sin(index * 7890) * 0.5 + 0.5) * 30 - 15; // -15px to +15px

                                                    return (
                                                        <div key={index} className="break-inside-avoid mb-1">
                                                            <div
                                                                className="rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedArtwork(artwork);
                                                                }}
                                                                style={{
                                                                    transform: `translateX(${randomOffsetX}px) scale(${randomScale})`,
                                                                    transformOrigin: 'center'
                                                                }}
                                                            >
                                                                <img
                                                                    src={artwork}
                                                                    alt={`Artwork ${index + 1}`}
                                                                    className="w-full h-auto object-cover"
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                }) : (
                                                    <p className="text-slate-500">No artworks available</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Single Artwork Zoom Modal with 360° rotation */}
                            {selectedArtwork && (
                                <div
                                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                                    onClick={() => setSelectedArtwork(null)}
                                    style={{ animation: 'fadeIn 0.5s ease-out' }}
                                >
                                    <div className="relative w-full h-full flex items-center justify-center p-16" onClick={(e) => e.stopPropagation()}>
                                        {/* Close button - fixed position inside viewport */}
                                        <button
                                            onClick={() => setSelectedArtwork(null)}
                                            className="fixed top-8 right-8 z-10 text-white hover:text-slate-300 transition-colors bg-black/50 rounded-full p-3 shadow-lg"
                                        >
                                            <X size={28} />
                                        </button>

                                        {/* Artwork Image with Y-axis 180° rotation and fade effects */}
                                        <img
                                            src={selectedArtwork}
                                            alt="Artwork"
                                            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                                            style={{
                                                animation: 'rotateY360 1s ease-out forwards, fadeInFinal 0.2s ease-out 1s forwards',
                                                transform: 'perspective(1000px) rotateY(180deg)'
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'data' && (
                        <div className="animate-fadeIn space-y-8">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Data Analysis</h3>
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
