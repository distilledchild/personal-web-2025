import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Bell, Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog } from 'lucide-react';

const AnalogClock: React.FC<{ timezone: string; label: string }> = ({ timezone, label }) => {
    const [time, setTime] = React.useState(new Date());

    React.useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const dateInTimezone = new Date(time.toLocaleString('en-US', { timeZone: timezone }));
    const hours = dateInTimezone.getHours();
    const minutes = dateInTimezone.getMinutes();

    const hourDeg = (hours % 12) * 30 + minutes * 0.5;
    const minuteDeg = minutes * 6;

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-24 h-24 border-4 border-slate-200 rounded-full bg-white shadow-inner">
                {/* Markers */}
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-2 bg-slate-300" />
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-2 bg-slate-300" />
                <div className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-1 bg-slate-300" />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 w-2 h-1 bg-slate-300" />

                {/* Hour Hand */}
                <div
                    className="absolute w-1.5 h-6 bg-slate-800 left-1/2 top-1/2 origin-bottom rounded-full"
                    style={{
                        transform: `translateX(-50%) translateY(-100%) rotate(${hourDeg}deg)`
                    }}
                />

                {/* Minute Hand */}
                <div
                    className="absolute w-1 h-8 bg-slate-500 left-1/2 top-1/2 origin-bottom rounded-full"
                    style={{
                        transform: `translateX(-50%) translateY(-100%) rotate(${minuteDeg}deg)`
                    }}
                />

                {/* Center Dot */}
                <div className="absolute w-2 h-2 bg-slate-800 rounded-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="mt-3 text-center">
                <div className="text-sm font-bold text-slate-700">{label}</div>
                <div className="text-xs text-slate-500 font-mono">
                    {dateInTimezone.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </div>
            </div>
        </div>
    );
};



const WeatherWidget: React.FC = () => {
    const [weather, setWeather] = React.useState<any>(null);
    const [locationName, setLocationName] = React.useState('Loading...');
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchWeather = async () => {
            try {
                let lat = 37.5665;
                let lon = 126.9780;
                let name = 'Seoul';

                try {
                    // 1. Get location from Contact API
                    const API_URL = window.location.hostname === 'localhost'
                        ? 'http://localhost:4000'
                        : 'https://personal-web-2025-production.up.railway.app';

                    const contactResponse = await fetch(`${API_URL}/api/contact`);
                    if (contactResponse.ok) {
                        const contactData = await contactResponse.json();
                        if (contactData?.Location) {
                            // Prefer explicit coordinates if available
                            if (contactData.Location.latitude && contactData.Location.longitude) {
                                lat = contactData.Location.latitude;
                                lon = contactData.Location.longitude;
                            }
                            // Construct location name
                            const parts = [contactData.Location.city, contactData.Location.state].filter(Boolean);
                            if (parts.length > 0) {
                                name = parts.join(', ');
                            } else if (contactData.Location.country) {
                                name = contactData.Location.country;
                            }
                        }
                    }
                } catch (e) {
                    console.warn('Failed to get contact location, defaulting to Seoul');
                }

                setLocationName(name);

                // 2. Fetch weather
                const response = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`
                );
                const data = await response.json();
                setWeather(data.daily);
            } catch (error) {
                console.error('Failed to fetch weather:', error);
                setLocationName('Error');
            } finally {
                setLoading(false);
            }
        };

        // Fetch weather immediately
        fetchWeather();

        // Refresh weather every 10 minutes (600000 ms)
        const weatherInterval = setInterval(fetchWeather, 600000);

        // Cleanup interval on unmount
        return () => clearInterval(weatherInterval);
    }, []);

    const fixedClass = "fixed bottom-[21rem] left-6 w-14 h-14 bg-white rounded-full transition-all hover:scale-110 flex items-center justify-center z-[100] cursor-pointer group";
    const strongShadow = { boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.5), 0 10px 20px -8px rgba(0, 0, 0, 0.4)' };

    if (loading) return (
        <div className={fixedClass} style={strongShadow}>
            <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
    );

    if (!weather) return null;

    const code = weather.weather_code[0];
    const maxTemp = Math.round(weather.temperature_2m_max[0]);
    const minTemp = Math.round(weather.temperature_2m_min[0]);

    const getWeatherIcon = (code: number) => {
        if (code === 0) return <Sun className="w-6 h-6 text-yellow-500" />;
        if (code >= 1 && code <= 3) return <Cloud className="w-6 h-6 text-slate-500" />;
        if (code >= 45 && code <= 48) return <CloudFog className="w-6 h-6 text-slate-400" />;
        if (code >= 51 && code <= 67) return <CloudRain className="w-6 h-6 text-blue-500" />;
        if (code >= 71 && code <= 77) return <CloudSnow className="w-6 h-6 text-blue-300" />;
        if (code >= 80 && code <= 82) return <CloudRain className="w-6 h-6 text-blue-600" />;
        if (code >= 85 && code <= 86) return <CloudSnow className="w-6 h-6 text-blue-400" />;
        if (code >= 95) return <CloudLightning className="w-6 h-6 text-purple-500" />;
        return <Sun className="w-6 h-6 text-yellow-500" />;
    };

    return (
        <div
            className={fixedClass}
            style={strongShadow}
            title={`${locationName} Weather`}
        >
            <div className="flex flex-col items-center justify-center">
                {getWeatherIcon(code)}
                <span className="text-[10px] font-bold text-slate-700 mt-[-2px]">{maxTemp}°</span>
            </div>

            {/* Tooltip */}
            <div className="absolute left-16 bg-slate-800 text-white text-xs font-bold py-1 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {locationName}: {maxTemp}° / {minTemp}°
            </div>
        </div>
    );
};

// Kanban Board Component
interface KanbanBoardProps {
    todos: any[];
    projects: any[];
    onTodoClick: (todo: any) => void;
    onProjectClick: (project: any) => void;
    onAddProjectClick: () => void;
    onUpdateStatus: (todoId: string, newStatus: string) => void;
    getPriorityColor: (priority: string) => string;
    formatDate: (dateString: string) => string;
    isAuthorized: boolean;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
    todos,
    projects,
    onTodoClick,
    onProjectClick,
    onAddProjectClick,
    onUpdateStatus,
    getPriorityColor,
    formatDate,
    isAuthorized
}) => {
    const [draggedTodoId, setDraggedTodoId] = React.useState<string | null>(null);
    const [dragOverColumn, setDragOverColumn] = React.useState<string | null>(null);

    // Changed "cancelled" to "project" as first column
    const columns = [
        { id: 'project', title: 'Project', color: 'bg-purple-50 border-purple-200', isProject: true },
        { id: 'pending', title: 'Pending', color: 'bg-slate-50 border-slate-200', isProject: false },
        { id: 'in_progress', title: 'In Progress', color: 'bg-blue-50 border-blue-200', isProject: false },
        { id: 'completed', title: 'Completed', color: 'bg-green-50 border-green-200', isProject: false }
    ];

    const getTodosByStatus = (status: string) => {
        return todos.filter(todo => todo.status === status);
    };

    const handleDragStart = (e: React.DragEvent, todoId: string) => {
        setDraggedTodoId(todoId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', todoId);
    };

    const handleDragOver = (e: React.DragEvent, columnId: string) => {
        e.preventDefault();
        // Don't allow dropping on project column
        if (columnId !== 'project') {
            setDragOverColumn(columnId);
        }
    };

    const handleDrop = (e: React.DragEvent, status: string) => {
        e.preventDefault();
        setDragOverColumn(null);
        // Don't allow dropping on project column
        if (status === 'project') return;

        const todoId = draggedTodoId;
        if (todoId) {
            onUpdateStatus(todoId, status);
        }
        setDraggedTodoId(null);
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-h-full">
            {columns.map(column => {
                const isDragOver = dragOverColumn === column.id;

                return (
                    <div
                        key={column.id}
                        className={`flex flex-col rounded-xl transition-colors duration-200 ${!column.isProject && isDragOver ? 'bg-slate-100 ring-2 ring-blue-400 ring-opacity-50' : ''}`}
                        onDragOver={(e) => handleDragOver(e, column.id)}
                        onDrop={(e) => handleDrop(e, column.id)}
                    >
                        <div className={`${column.color} border-2 rounded-xl p-4 mb-3`}>
                            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center justify-between flex-wrap gap-2">
                                <span>{column.title}</span>
                                <span className="text-xs bg-white px-2 py-0.5 rounded-full whitespace-nowrap">
                                    {column.isProject
                                        ? projects.filter(p => p.status === 'ongoing' || p.status === 'paused').length
                                        : getTodosByStatus(column.id).length}
                                </span>
                            </h3>
                        </div>

                        <div className="flex-1 space-y-3 p-2">
                            {column.isProject ? (
                                // Project Column
                                <>
                                    {projects.filter(p => p.status === 'ongoing' || p.status === 'paused').map(project => (
                                        <div
                                            key={project._id}
                                            onClick={() => onProjectClick(project)}
                                            className={`
                                                ${column.color} border rounded-xl p-4 cursor-pointer
                                                hover:shadow-md transition-all duration-200 hover:scale-[1.02]
                                            `}
                                        >
                                            <h4 className="font-bold text-slate-900 text-sm break-all">
                                                {project.project_name}
                                            </h4>
                                        </div>
                                    ))}
                                    {/* Add Project Button - Always visible for authorized users */}
                                    {isAuthorized && (
                                        <div
                                            onClick={onAddProjectClick}
                                            className={`
                                                ${column.color} border-2 border-dashed rounded-xl p-4 cursor-pointer
                                                hover:shadow-md transition-all duration-200 hover:scale-[1.02]
                                                flex items-center justify-center min-h-[100px]
                                            `}
                                        >
                                            <Plus className="w-8 h-8 text-purple-400" />
                                        </div>
                                    )}
                                </>
                            ) : (
                                // TODO Columns
                                <>
                                    {getTodosByStatus(column.id).map(todo => {
                                        const isStrikethrough = todo.status === 'completed' || todo.status === 'cancelled';
                                        const isDragging = draggedTodoId === todo._id;

                                        return (
                                            <div
                                                key={todo._id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, todo._id)}
                                                onClick={() => onTodoClick(todo)}
                                                className={`
                                                    ${column.color} border rounded-xl p-4 cursor-grab active:cursor-grabbing 
                                                    hover:shadow-md transition-all duration-200 hover:scale-[1.02]
                                                    ${isDragging ? 'opacity-50 scale-95' : 'opacity-100'}
                                                `}
                                            >
                                                <h4 className={`font-bold text-slate-900 mb-2 text-sm break-all ${isStrikethrough ? 'line-through text-slate-400' : ''}`}>
                                                    {todo.title}
                                                </h4>
                                                <p className={`text-xs text-slate-600 mb-3 line-clamp-2 ${isStrikethrough ? 'line-through text-slate-400' : ''}`}>
                                                    {todo.description}
                                                </p>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className={`font-bold capitalize ${getPriorityColor(todo.priority)}`}>
                                                        {todo.priority}
                                                    </span>
                                                    <span className="text-slate-500">
                                                        {formatDate(todo.due_date)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {getTodosByStatus(column.id).length === 0 && (
                                        <div className="text-center text-slate-400 text-sm py-8 border-2 border-dashed border-slate-200 rounded-xl">
                                            Drop items here
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                );
            })}
        </div >
    );
};


export const Todo: React.FC = () => {
    // ============================================================================
    // ROUTER & URL PARAMETERS
    // ============================================================================
    const navigate = useNavigate();
    const { tab } = useParams<{ tab: string }>();

    // ============================================================================
    // CORE STATE - Todos, User, Authorization
    // ============================================================================
    const [todos, setTodos] = React.useState<any[]>([]);
    const [user, setUser] = React.useState<any>(null);
    const [isAuthorized, setIsAuthorized] = React.useState(false);
    const [loading, setLoading] = React.useState(true);
    const [authLoading, setAuthLoading] = React.useState(true);

    // ============================================================================
    // TODO CREATION/EDIT STATE
    // ============================================================================
    const [showCreateModal, setShowCreateModal] = React.useState(false);
    const [newTodo, setNewTodo] = React.useState({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
        category: 'personal',
        sort: ''
    });
    const [selectedDate, setSelectedDate] = React.useState(new Date());
    const [selectedTodo, setSelectedTodo] = React.useState<any>(null);
    const [isEditMode, setIsEditMode] = React.useState(false);
    const [editFormData, setEditFormData] = React.useState({
        title: '',
        description: '',
        priority: 'medium',
        status: 'pending',
        due_date: '',
        category: 'personal',
        sort: ''
    });

    // ============================================================================
    // UI STATE - Popups, Pagination
    // ============================================================================
    const [showSuccessPopup, setShowSuccessPopup] = React.useState(false);
    const [successMessage, setSuccessMessage] = React.useState('');
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 10;

    // ============================================================================
    // FILTER & SEARCH STATE
    // ============================================================================
    const [filterDate, setFilterDate] = React.useState<Date | null>(null);
    const [filterMode, setFilterMode] = React.useState<'all' | 'until_date' | 'today'>('all');
    const [searchQuery, setSearchQuery] = React.useState('');
    const [isSearching, setIsSearching] = React.useState(false);

    // ============================================================================
    // LOCATION & TIMEZONE STATE
    // ============================================================================
    const [locationTimezone, setLocationTimezone] = React.useState<string>('America/Chicago');
    const [locationLabel, setLocationLabel] = React.useState<string>('Location');

    // ============================================================================
    // PROJECT STATE (Dev Tab)
    // ============================================================================
    const [projects, setProjects] = React.useState<any[]>([]);
    const [selectedProject, setSelectedProject] = React.useState<any>(null);
    const [showProjectModal, setShowProjectModal] = React.useState(false);
    const [isProjectEditMode, setIsProjectEditMode] = React.useState(false);
    const [projectFormData, setProjectFormData] = React.useState({
        project_name: '',
        github_url: '',
        web_url: '',
        expected_end_at: '',
        actual_end_at: '',
        description: '',
        status: 'ongoing',
        team_members: [] as any[],
        technologies: [] as string[],
        tags: [] as string[],
        budget: '',
        progress_percent: 0
    });

    // Derive activeTab from URL parameter
    const activeTab = (tab === 'dev' ? 'dev' : 'personal') as 'personal' | 'dev';

    // Handle keyboard shortcuts for success popup
    React.useEffect(() => {
        if (showSuccessPopup) {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setShowSuccessPopup(false);
                }
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [showSuccessPopup]);

    const sortTodos = (todosToSort: any[]) => {
        return [...todosToSort].sort((a, b) => {
            // 1. Priority: High > Medium > Low
            const priorityOrder: { [key: string]: number } = { high: 3, medium: 2, low: 1 };
            const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
            if (priorityDiff !== 0) return priorityDiff;

            // 2. Deadline: Closest date first (ascending)
            // Treat missing deadline as far future
            const dateA = a.due_date ? new Date(a.due_date).getTime() : Number.MAX_SAFE_INTEGER;
            const dateB = b.due_date ? new Date(b.due_date).getTime() : Number.MAX_SAFE_INTEGER;
            if (dateA !== dateB) return dateA - dateB;

            // 3. Status: In Progress > Pending > Completed > Cancelled
            const statusOrder: { [key: string]: number } = { in_progress: 1, pending: 2, completed: 3, cancelled: 4 };
            const statusDiff = (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5);
            return statusDiff;
        });
    };

    React.useEffect(() => {
        const checkAuth = async () => {
            // Get user data
            const userData = localStorage.getItem('user_profile');
            if (userData) {
                try {
                    const parsedUser = JSON.parse(userData);
                    setUser(parsedUser);

                    // Check authorization
                    const API_URL = window.location.hostname === 'localhost'
                        ? 'http://localhost:4000'
                        : 'https://personal-web-2025-production.up.railway.app';

                    const response = await fetch(`${API_URL}/api/member/role/${parsedUser.email}`);
                    const data = await response.json();
                    setIsAuthorized(data.authorized);
                } catch (e) {
                    console.error('Failed to parse user data', e);
                }
            }
            setAuthLoading(false);
        };

        const fetchLocationTimezone = async () => {
            try {
                const API_URL = window.location.hostname === 'localhost'
                    ? 'http://localhost:4000'
                    : 'https://personal-web-2025-production.up.railway.app';

                const response = await fetch(`${API_URL}/api/contact`);
                if (response.ok) {
                    const data = await response.json();
                    if (data?.Location) {
                        // Determine timezone based on location
                        const { city, state, country, latitude, longitude } = data.Location;

                        // Try to determine timezone from coordinates or location name
                        let timezone = 'America/Chicago'; // default
                        let label = 'Location';

                        // Build location label
                        const locationParts = [city, state, country].filter(Boolean);
                        if (locationParts.length > 0) {
                            label = locationParts[0]; // Use first available part (usually city)
                        }

                        // Simple timezone mapping based on country/state
                        if (country === 'South Korea' || country === 'Korea') {
                            timezone = 'Asia/Seoul';
                        } else if (country === 'United States' || country === 'USA') {
                            // Map US states to timezones
                            const stateTimezones: { [key: string]: string } = {
                                'Illinois': 'America/Chicago',
                                'Texas': 'America/Chicago',
                                'Wisconsin': 'America/Chicago',
                                'California': 'America/Los_Angeles',
                                'New York': 'America/New_York',
                                'Florida': 'America/New_York',
                                // Add more as needed
                            };
                            timezone = stateTimezones[state] || 'America/Chicago';
                        } else if (country === 'United Kingdom' || country === 'UK') {
                            timezone = 'Europe/London';
                        } else if (country === 'Japan') {
                            timezone = 'Asia/Tokyo';
                        } else if (country === 'China') {
                            timezone = 'Asia/Shanghai';
                        }

                        setLocationTimezone(timezone);
                        setLocationLabel(label);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch location timezone:', error);
            }
        };

        checkAuth();
        fetchTodos();
        fetchLocationTimezone();
        fetchProjects(); // Always fetch projects for both personal and dev tabs
    }, [activeTab]);

    React.useEffect(() => {
        if (!authLoading && !isAuthorized) {
            navigate('/');
        }
    }, [authLoading, isAuthorized, navigate]);

    // ============================================================================
    // API FUNCTIONS - Data Fetching
    // ============================================================================

    const fetchTodos = async () => {
        try {
            const API_URL = window.location.hostname === 'localhost'
                ? 'http://localhost:4000'
                : 'https://personal-web-2025-production.up.railway.app';

            const response = await fetch(`${API_URL}/api/todos`);
            if (response.ok) {
                const data = await response.json();
                setTodos(sortTodos(data));
            }
        } catch (error) {
            console.error('Failed to fetch todos:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProjects = async () => {
        try {
            const API_URL = window.location.hostname === 'localhost'
                ? 'http://localhost:4000'
                : 'https://personal-web-2025-production.up.railway.app';

            console.log('[TODO] Fetching projects from:', `${API_URL}/api/projects`);
            const response = await fetch(`${API_URL}/api/projects`);
            if (response.ok) {
                const data = await response.json();
                console.log('[TODO] Fetched projects:', data);
                console.log('[TODO] Projects with ongoing/paused status:', data.filter((p: any) => p.status === 'ongoing' || p.status === 'paused'));
                setProjects(data);
            } else {
                console.error('[TODO] Failed to fetch projects, status:', response.status);
            }
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        }
    };

    // ============================================================================
    // TODO HANDLERS - Create, Edit, Delete
    // ============================================================================

    const handleCreateTodo = async () => {
        if (!user || !user.email) {
            alert('Please login to create a TODO');
            return;
        }

        if (!newTodo.title.trim() || !newTodo.description.trim()) {
            alert('Title and Description are required');
            return;
        }

        try {
            const API_URL = window.location.hostname === 'localhost'
                ? 'http://localhost:4000'
                : 'https://personal-web-2025-production.up.railway.app';

            const todoData = {
                ...newTodo,
                email: user.email
            };

            console.log('[TODO CREATE] Sending data:', todoData);
            console.log('[TODO CREATE] Sort value:', newTodo.sort);

            const response = await fetch(`${API_URL}/api/todos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(todoData)
            });

            if (response.ok) {
                const createdTodo = await response.json();
                setTodos(sortTodos([createdTodo, ...todos]));
                setShowCreateModal(false);
                setNewTodo({ title: '', description: '', priority: 'medium', due_date: '', category: 'personal', sort: '' });
            }
        } catch (error) {
            console.error('Failed to create todo:', error);
        }
    };

    const handleTodoClick = (todo: any) => {
        setSelectedTodo(todo);
        setIsEditMode(false);
    };

    const handleEditClick = () => {
        if (selectedTodo) {
            setEditFormData({
                title: selectedTodo.title,
                description: selectedTodo.description,
                priority: selectedTodo.priority,
                status: selectedTodo.status,
                due_date: selectedTodo.due_date || '',
                category: selectedTodo.category || 'personal',
                sort: selectedTodo.sort || ''
            });
            setIsEditMode(true);
        }
    };

    const handleSaveEdit = async () => {
        if (!selectedTodo || !user || !user.email) return;

        try {
            const API_URL = window.location.hostname === 'localhost'
                ? 'http://localhost:4000'
                : 'https://personal-web-2025-production.up.railway.app';

            const response = await fetch(`${API_URL}/api/todos/${selectedTodo._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    ...editFormData
                })
            });

            if (response.ok) {
                const updatedTodo = await response.json();
                setTodos(sortTodos(todos.map(t => t._id === selectedTodo._id ? updatedTodo : t)));
                setSelectedTodo(updatedTodo);
                setIsEditMode(false);
                setSuccessMessage('TODO has been updated successfully!');
                setShowSuccessPopup(true);
            }
        } catch (error) {
            console.error('Failed to update todo:', error);
        }
    };

    const handleDeleteTodo = async (todoId: string) => {
        if (!user || !user.email) {
            alert('Please login to delete TODO');
            return;
        }

        if (!confirm('Are you sure you want to delete this TODO?')) {
            return;
        }

        try {
            const API_URL = window.location.hostname === 'localhost'
                ? 'http://localhost:4000'
                : 'https://personal-web-2025-production.up.railway.app';

            const response = await fetch(`${API_URL}/api/todos/${todoId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email
                })
            });

            if (response.ok) {
                setTodos(todos.filter(t => t._id !== todoId));
                setSelectedTodo(null);
                // Show success message
                setSuccessMessage('TODO has been deleted successfully!');
                setShowSuccessPopup(true);
            }
        } catch (error) {
            console.error('Failed to delete todo:', error);
        }
    };

    // ============================================================================
    // PROJECT HANDLERS (Dev Tab)
    // ============================================================================

    const handleProjectClick = (project: any) => {
        setSelectedProject(project);
        setIsProjectEditMode(false);
    };

    const handleAddProjectClick = () => {
        setProjectFormData({
            project_name: '',
            github_url: '',
            web_url: '',
            expected_end_at: '',
            actual_end_at: '',
            description: '',
            status: 'ongoing',
            team_members: [],
            technologies: [],
            tags: [],
            budget: '',
            progress_percent: 0
        });
        setIsProjectEditMode(true);
        setSelectedProject(null);
        setShowProjectModal(true);
    };

    const handleEditProjectClick = () => {
        if (selectedProject) {
            setProjectFormData({
                project_name: selectedProject.project_name || '',
                github_url: selectedProject.github_url || '',
                web_url: selectedProject.web_url || '',
                expected_end_at: selectedProject.expected_end_at ? new Date(selectedProject.expected_end_at).toISOString().split('T')[0] : '',
                actual_end_at: selectedProject.actual_end_at ? new Date(selectedProject.actual_end_at).toISOString().split('T')[0] : '',
                description: selectedProject.description || '',
                status: selectedProject.status || 'ongoing',
                team_members: selectedProject.team_members || [],
                technologies: selectedProject.technologies || [],
                tags: selectedProject.tags || [],
                budget: selectedProject.budget?.toString() || '',
                progress_percent: selectedProject.progress_percent || 0
            });
            setIsProjectEditMode(true);
            setShowProjectModal(true);
        }
    };

    const handleSaveProject = async () => {
        if (!user || !user.email) {
            alert('Please login to save project');
            return;
        }

        if (!projectFormData.project_name.trim()) {
            alert('Project name is required');
            return;
        }

        try {
            const API_URL = window.location.hostname === 'localhost'
                ? 'http://localhost:4000'
                : 'https://personal-web-2025-production.up.railway.app';

            const method = selectedProject ? 'PUT' : 'POST';
            const url = selectedProject
                ? `${API_URL}/api/projects/${selectedProject._id}`
                : `${API_URL}/api/projects`;

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    ...projectFormData,
                    budget: projectFormData.budget ? parseFloat(projectFormData.budget) : undefined
                })
            });

            if (response.ok) {
                await fetchProjects();
                setShowProjectModal(false);
                setSelectedProject(null);
                setSuccessMessage(!selectedProject ? 'Project created successfully!' : 'Project updated successfully!');
                setShowSuccessPopup(true);
            }
        } catch (error) {
            console.error('Failed to save project:', error);
        }
    };

    const handleDeleteProject = async (projectId: string) => {
        if (!user || !user.email) {
            alert('Please login to delete project');
            return;
        }

        if (!confirm('Are you sure you want to delete this project?')) {
            return;
        }

        try {
            const API_URL = window.location.hostname === 'localhost'
                ? 'http://localhost:4000'
                : 'https://personal-web-2025-production.up.railway.app';

            const response = await fetch(`${API_URL}/api/projects/${projectId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email
                })
            });

            if (response.ok) {
                setProjects(projects.filter(p => p._id !== projectId));
                setSelectedProject(null);
                setSuccessMessage('Project deleted successfully!');
                setShowSuccessPopup(true);
            }
        } catch (error) {
            console.error('Failed to delete project:', error);
        }
    };


    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Filter Logic
    // Filter Logic
    const filteredTodos = React.useMemo(() => {
        let result = todos;

        // Filter by Category based on Active Tab
        if (activeTab === 'personal') {
            result = result.filter(todo => !todo.category || todo.category === 'personal');
        } else if (activeTab === 'dev') {
            result = result.filter(todo => todo.category === 'dev');
        }

        // 1. Apply Search Filter if active
        if (isSearching && searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(todo =>
                todo.title.toLowerCase().includes(query) ||
                todo.description.toLowerCase().includes(query)
            );
        }

        // 2. Apply Date/Mode Filters
        if (filterMode !== 'all') {
            result = result.filter(todo => {
                if (!todo.due_date) return false;
                const todoDate = new Date(todo.due_date);

                if (filterMode === 'until_date' && filterDate) {
                    return todoDate.toDateString() === filterDate.toDateString();
                }

                if (filterMode === 'today') {
                    const today = new Date();
                    return todoDate.toDateString() === today.toDateString();
                }

                return true;
            });
        }

        // 3. Sort Results
        // If searching, prioritize deadline (closest first)
        if (isSearching) {
            return [...result].sort((a, b) => {
                const dateA = a.due_date ? new Date(a.due_date).getTime() : Number.MAX_SAFE_INTEGER;
                const dateB = b.due_date ? new Date(b.due_date).getTime() : Number.MAX_SAFE_INTEGER;
                return dateA - dateB;
            });
        }

        // Otherwise use default sorting (Priority > Deadline > Status)
        // Note: 'todos' is already sorted by default fetch, but filtering might need re-sort if we want strict order
        // However, filter preserves order, so we can just return result
        return result;
    }, [todos, filterMode, filterDate, isSearching, searchQuery, activeTab]);

    // Handle Search
    const handleSearch = () => {
        if (searchQuery.trim()) {
            setIsSearching(true);
            setCurrentPage(1);
        } else {
            setIsSearching(false);
            setCurrentPage(1);
        }
    };

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTodos = filteredTodos.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredTodos.length / itemsPerPage);

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    // Calendar Click Handler
    const handleDateClick = (date: Date) => {
        if (filterMode === 'until_date' && filterDate && date.toDateString() === filterDate.toDateString()) {
            setFilterMode('all');
            setFilterDate(null);
        } else {
            setFilterMode('until_date');
            setFilterDate(date);
        }
    };

    // Today's Count
    const todayCount = todos.filter(t => t.due_date && new Date(t.due_date).toDateString() === new Date().toDateString()).length;

    // Get dates with todos for calendar highlighting
    const todoDates = todos.map(todo => {
        if (todo.due_date) {
            const date = new Date(todo.due_date);
            return date.toDateString();
        }
        return null;
    }).filter(Boolean);

    const renderCalendar = () => {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const today = new Date();
        const todayString = today.toDateString();

        const days = [];
        // Empty cells before first day
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(<div key={`empty-${i}`} className="h-12"></div>);
        }
        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(year, month, day);
            const dateString = currentDate.toDateString();
            const hasTodo = todoDates.includes(dateString);
            const isToday = dateString === todayString;
            const isSelected = filterMode === 'until_date' && filterDate?.toDateString() === dateString;

            days.push(
                <div
                    key={day}
                    onClick={() => handleDateClick(currentDate)}
                    className={`h-12 flex items-center justify-center rounded-lg cursor-pointer transition-colors 
                        ${isSelected ? 'bg-slate-800 text-white font-bold' :
                            hasTodo ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-slate-100'} 
                        ${isToday && !isSelected ? 'border-2 border-gray-500 rounded-full' : ''}`}
                >
                    {day}
                </div>
            );
        }

        return days;
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'text-red-600 font-bold';
            case 'medium': return 'text-yellow-600 font-medium';
            case 'low': return 'text-green-600';
            default: return 'text-slate-600';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-50 border-green-200';
            case 'in_progress': return 'bg-blue-50 border-blue-200';
            case 'cancelled': return 'bg-red-50 border-red-200';
            default: return 'bg-slate-50 border-slate-200';
        }
    };

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Fixed Header Section */}
            <div className="pt-32 pb-6 px-6 bg-white border-b border-slate-100">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="text-4xl font-bold text-slate-900 mb-4">
                            TODO
                        </h2>
                    </div>

                    {/* Tabs */}
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => navigate('/todo/personal')}
                            className={`
                                flex items-center gap-2 px-8 py-4 border-b-2 text-lg font-bold transition-all duration-300
                                ${activeTab === 'personal'
                                    ? 'border-slate-900 text-slate-900'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
                            `}
                        >
                            Personal
                        </button>
                        <button
                            onClick={() => navigate('/todo/dev')}
                            className={`
                                flex items-center gap-2 px-8 py-4 border-b-2 text-lg font-bold transition-all duration-300
                                ${activeTab === 'dev'
                                    ? 'border-slate-900 text-slate-900'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
                            `}
                        >
                            Dev
                        </button>
                    </div>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-6 pb-20 pt-8 scrollbar-hide">
                <div className="max-w-7xl mx-auto w-full min-h-full">
                    {/* ================================================================ */}
                    {/* PERSONAL TAB - Table View                                        */}
                    {/* ================================================================ */}
                    {activeTab === 'personal' ? (
                        <div className="flex gap-8">
                            {/* Left: Calendar */}
                            <div className="w-1/3 flex flex-col gap-6">
                                {isAuthorized && (
                                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <button
                                                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
                                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                            >
                                                ←
                                            </button>
                                            <h3 className="text-lg font-bold text-slate-900">
                                                {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                            </h3>
                                            <button
                                                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
                                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                            >
                                                →
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-7 gap-2 mb-2">
                                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                                <div key={day} className="text-xs font-bold text-slate-500 text-center">
                                                    {day}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-7 gap-2">
                                            {renderCalendar()}
                                        </div>
                                    </div>
                                )}



                                {/* World Clocks */}
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                    <div className="grid grid-cols-2 gap-4 justify-items-center">
                                        <AnalogClock timezone={locationTimezone} label={locationLabel} />
                                        <AnalogClock timezone="Asia/Seoul" label="Seoul" />
                                    </div>
                                </div>
                            </div>

                            {/* Right: TODO Table */}
                            <div className="flex-1 max-w-6xl">
                                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">Title</th>
                                                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">Description</th>
                                                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">Status</th>
                                                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">Priority</th>
                                                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">Deadline</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredTodos.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                                                        {filterMode === 'all' ? 'No TODO items found' :
                                                            filterMode === 'today' ? 'No tasks due today' :
                                                                'No tasks found for selected period'}
                                                    </td>
                                                </tr>
                                            ) : (
                                                currentTodos.map((todo) => {
                                                    const isStrikethrough = todo.status === 'completed' || todo.status === 'cancelled';

                                                    return (
                                                        <tr key={todo._id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${getStatusColor(todo.status)}`}>
                                                            <td
                                                                className={`px-4 py-3 ${isStrikethrough ? 'line-through text-slate-400' : 'text-slate-900'} cursor-pointer hover:text-blue-600 font-medium`}
                                                                onClick={() => handleTodoClick(todo)}
                                                            >
                                                                {todo.title}
                                                            </td>
                                                            <td
                                                                className={`px-4 py-3 ${isStrikethrough ? 'line-through text-slate-400' : 'text-slate-600'} text-sm cursor-pointer hover:text-blue-600`}
                                                                onClick={() => handleTodoClick(todo)}
                                                            >
                                                                {todo.description}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${todo.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                                    todo.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                                        todo.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                                            'bg-slate-100 text-slate-700'
                                                                    }`}>
                                                                    {todo.status.replace('_', ' ')}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className={`text-sm font-bold capitalize ${getPriorityColor(todo.priority)}`}>
                                                                    {todo.priority}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                                                                {formatDate(todo.due_date)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination and Search Section - Always show */}
                                <div className="flex justify-between items-center gap-4 mt-4">
                                    {/* Empty spacer for alignment */}
                                    <div className="flex-1 max-w-sm"></div>

                                    {/* Pagination Controls */}
                                    <div className="flex justify-center items-center gap-2">
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-50"
                                        >
                                            Previous
                                        </button>

                                        {Array.from({ length: totalPages || 1 }, (_, i) => i + 1).map((page) => (
                                            <button
                                                key={page}
                                                onClick={() => handlePageChange(page)}
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${currentPage === page
                                                    ? 'bg-gray-500 text-white'
                                                    : 'text-slate-600 hover:bg-slate-100'
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        ))}

                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === (totalPages || 1)}
                                            className="px-3 py-1 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-50"
                                        >
                                            Next
                                        </button>
                                    </div>

                                    {/* Search Section */}
                                    <div className="flex items-center gap-2 flex-1 max-w-sm justify-end">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleSearch();
                                                }
                                            }}
                                            placeholder="Search..."
                                            className="w-48 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 text-sm"
                                        />
                                        <button
                                            onClick={handleSearch}
                                            className="w-10 h-10 rounded-lg bg-white border border-slate-300 hover:border-slate-400 transition-all flex items-center justify-center group"
                                            title="Search"
                                        >
                                            <svg
                                                className="w-5 h-5 text-slate-500"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                </div>


                            </div>
                        </div>
                    ) : (
                        /* ================================================================ */
                        /* DEV TAB - Kanban Board                                           */
                        /* ================================================================ */
                        <div className="flex gap-8 min-h-full">
                            {/* Left: Calendar */}
                            <div className="w-1/3 flex flex-col gap-6">
                                {isAuthorized && (
                                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <button
                                                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
                                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                            >
                                                ←
                                            </button>
                                            <h3 className="text-lg font-bold text-slate-900">
                                                {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                            </h3>
                                            <button
                                                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
                                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                            >
                                                →
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-7 gap-2 mb-2">
                                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                                <div key={day} className="text-xs font-bold text-slate-500 text-center">
                                                    {day}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-7 gap-2">
                                            {renderCalendar()}
                                        </div>
                                    </div>
                                )}

                                {/* World Clocks */}
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                    <div className="grid grid-cols-2 gap-4 justify-items-center">
                                        <AnalogClock timezone={locationTimezone} label={locationLabel} />
                                        <AnalogClock timezone="Asia/Seoul" label="Seoul" />
                                    </div>
                                </div>
                            </div>

                            {/* Right: Kanban Board */}
                            <div className="flex-1">
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-h-full">
                                    {loading ? (
                                        <div className="text-center py-12">
                                            <p className="text-slate-500">Loading...</p>
                                        </div>
                                    ) : (
                                        <KanbanBoard
                                            todos={filteredTodos}
                                            projects={projects}
                                            onTodoClick={handleTodoClick}
                                            onProjectClick={handleProjectClick}
                                            onAddProjectClick={handleAddProjectClick}
                                            onUpdateStatus={async (todoId, newStatus) => {
                                                if (!user || !user.email) return;
                                                try {
                                                    const API_URL = window.location.hostname === 'localhost'
                                                        ? 'http://localhost:4000'
                                                        : 'https://personal-web-2025-production.up.railway.app';

                                                    const todo = todos.find(t => t._id === todoId);
                                                    const response = await fetch(`${API_URL}/api/todos/${todoId}`, {
                                                        method: 'PUT',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            email: user.email,
                                                            ...todo,
                                                            status: newStatus
                                                        })
                                                    });

                                                    if (response.ok) {
                                                        const updatedTodo = await response.json();
                                                        setTodos(sortTodos(todos.map(t => t._id === todoId ? updatedTodo : t)));
                                                    }
                                                } catch (error) {
                                                    console.error('Failed to update status:', error);
                                                }
                                            }}
                                            getPriorityColor={getPriorityColor}
                                            formatDate={formatDate}
                                            isAuthorized={isAuthorized}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Weather Widget (Always visible) */}
            <WeatherWidget />

            {/* Create Button (Admin/Editor only) */}
            {isAuthorized && (
                <>
                    {/* Notification Bell Button - Above Cal.com (bottom-64 approx) */}
                    <button
                        onClick={() => setFilterMode(prev => prev === 'today' ? 'all' : 'today')}
                        className={`fixed bottom-64 left-6 w-14 h-14 rounded-full transition-all hover:scale-110 flex items-center justify-center z-40
                                ${filterMode === 'today' ? 'bg-blue-600 text-white' : 'bg-gray-500 text-white hover:bg-gray-600'}`}
                        style={{ boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.5), 0 10px 20px -8px rgba(0, 0, 0, 0.4)' }}
                        title="Show today's tasks"
                    >
                        <div className="relative">
                            <Bell size={24} />
                            {todayCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-gray-500">
                                    {todayCount}
                                </span>
                            )}
                        </div>
                    </button>

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="fixed bottom-24 left-6 w-14 h-14 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-all hover:scale-110 flex items-center justify-center z-40"
                        style={{ boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.5), 0 10px 20px -8px rgba(0, 0, 0, 0.4)' }}
                        title="Create new TODO"
                    >
                        <Plus size={28} />
                    </button>
                </>
            )}

            {/* ================================================================ */}
            {/* MODALS - Create TODO                                             */}
            {/* ================================================================ */}
            {showCreateModal && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setShowCreateModal(false)}
                >
                    <div
                        className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-2xl font-bold text-slate-900 mb-6">Create New TODO</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                                <select
                                    value={newTodo.category}
                                    onChange={(e) => setNewTodo({ ...newTodo, category: e.target.value, sort: '' })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    aria-label="Select category"
                                >
                                    <option value="personal">Personal</option>
                                    <option value="dev">Dev</option>
                                </select>
                            </div>

                            {/* Sort Select - Always visible */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Sort</label>
                                <select
                                    value={newTodo.sort}
                                    onChange={(e) => {
                                        console.log('[SORT CHANGE] Selected value:', e.target.value);
                                        setNewTodo({ ...newTodo, sort: e.target.value });
                                    }}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    aria-label="Select sort"
                                >
                                    <option value="">Select...</option>
                                    {newTodo.category === 'personal' ? (
                                        <>
                                            <option value="Academy">Academy</option>
                                            <option value="Personal">Personal</option>
                                            <option value="Work">Work</option>
                                        </>
                                    ) : (
                                        <>
                                            {projects.filter(p => p.status === 'ongoing' || p.status === 'paused').map(project => (
                                                <option key={project._id} value={project._id}>
                                                    {project.project_name}
                                                </option>
                                            ))}
                                        </>
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Title *</label>
                                <input
                                    type="text"
                                    value={newTodo.title}
                                    onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter title"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Description *</label>
                                <textarea
                                    value={newTodo.description}
                                    onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                                    placeholder="Enter description"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Priority</label>
                                <select
                                    value={newTodo.priority}
                                    onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    aria-label="Select priority"
                                    title="Select priority"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Deadline</label>
                                <input
                                    type="date"
                                    value={newTodo.due_date}
                                    onChange={(e) => setNewTodo({ ...newTodo, due_date: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    aria-label="Select deadline"
                                    title="Select deadline"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 mt-8">
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setNewTodo({ title: '', description: '', priority: 'medium', due_date: '', category: 'personal', sort: '' });
                                }}
                                className="px-6 py-3 bg-slate-200 text-slate-700 rounded-full font-bold hover:bg-slate-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateTodo}
                                className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-colors"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {selectedTodo && !isEditMode && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedTodo(null)}
                >
                    <div
                        className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-start mb-6">
                            <h3 className="text-2xl font-bold text-slate-900">{selectedTodo.title}</h3>
                            <button
                                onClick={() => setSelectedTodo(null)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-6">
                            {selectedTodo.sort && (
                                <div>
                                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">
                                        {selectedTodo.category === 'dev' ? 'Project' : 'Sort'}
                                    </h4>
                                    <span className="text-slate-700 font-medium">
                                        {selectedTodo.category === 'dev'
                                            ? projects.find(p => p._id === selectedTodo.sort)?.project_name || 'Unknown Project'
                                            : selectedTodo.sort
                                        }
                                    </span>
                                </div>
                            )}

                            <div>
                                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Description</h4>
                                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedTodo.description}</p>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Status</h4>
                                    <span className={`px-3 py-1 rounded-full text-sm font-bold capitalize inline-block ${selectedTodo.status === 'completed' ? 'bg-green-100 text-green-700' :
                                        selectedTodo.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                            selectedTodo.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                'bg-slate-100 text-slate-700'
                                        }`}>
                                        {selectedTodo.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Priority</h4>
                                    <span className={`text-sm font-bold capitalize ${getPriorityColor(selectedTodo.priority)}`}>
                                        {selectedTodo.priority}
                                    </span>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Deadline</h4>
                                    <span className="text-slate-700 font-medium">
                                        {formatDate(selectedTodo.due_date)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between gap-4 mt-8 pt-6 border-t border-slate-100">
                            {/* Left side: Update button (admin only) */}
                            <div className="flex gap-4">
                                {isAuthorized && (
                                    <button
                                        onClick={handleEditClick}
                                        className="px-6 py-3 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-700 transition-colors"
                                    >
                                        Update
                                    </button>
                                )}
                            </div>

                            {/* Right side: Delete and Close buttons */}
                            <div className="flex gap-4">
                                {isAuthorized && (
                                    <button
                                        onClick={() => handleDeleteTodo(selectedTodo._id)}
                                        className="px-6 py-3 bg-red-100 text-red-600 rounded-full font-bold hover:bg-red-200 transition-colors"
                                    >
                                        Delete
                                    </button>
                                )}
                                <button
                                    onClick={() => setSelectedTodo(null)}
                                    className="px-6 py-3 bg-slate-200 text-slate-700 rounded-full font-bold hover:bg-slate-300 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {selectedTodo && isEditMode && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setIsEditMode(false)}
                >
                    <div
                        className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-2xl font-bold text-slate-900 mb-6">Edit TODO</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                                <select
                                    value={editFormData.category}
                                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value, sort: '' })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    aria-label="Edit category"
                                >
                                    <option value="personal">Personal</option>
                                    <option value="dev">Dev</option>
                                </select>
                            </div>

                            {/* Sort Select - Always visible */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Sort</label>
                                <select
                                    value={editFormData.sort}
                                    onChange={(e) => setEditFormData({ ...editFormData, sort: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    aria-label="Edit sort"
                                >
                                    <option value="">Select...</option>
                                    {editFormData.category === 'personal' ? (
                                        <>
                                            <option value="Academy">Academy</option>
                                            <option value="Personal">Personal</option>
                                            <option value="Work">Work</option>
                                        </>
                                    ) : (
                                        <>
                                            {projects.filter(p => p.status === 'ongoing' || p.status === 'paused').map(project => (
                                                <option key={project._id} value={project._id}>
                                                    {project.project_name}
                                                </option>
                                            ))}
                                        </>
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Title *</label>
                                <input
                                    type="text"
                                    value={editFormData.title}
                                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    aria-label="Edit title"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Description *</label>
                                <textarea
                                    value={editFormData.description}
                                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                                    aria-label="Edit description"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
                                    <select
                                        value={editFormData.status}
                                        onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        aria-label="Edit status"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Priority</label>
                                    <select
                                        value={editFormData.priority}
                                        onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        aria-label="Edit priority"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Deadline</label>
                                <input
                                    type="date"
                                    value={editFormData.due_date ? new Date(editFormData.due_date).toISOString().split('T')[0] : ''}
                                    onChange={(e) => setEditFormData({ ...editFormData, due_date: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    aria-label="Edit deadline"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 mt-8">
                            <button
                                onClick={() => setIsEditMode(false)}
                                className="px-6 py-3 bg-slate-200 text-slate-700 rounded-full font-bold hover:bg-slate-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Popup */}
            {showSuccessPopup && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setShowSuccessPopup(false)}
                >
                    <div
                        className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-2xl font-bold text-slate-900 mb-4">Success</h3>
                        <p className="text-slate-600 mb-6">{successMessage}</p>
                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowSuccessPopup(false)}
                                className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-colors"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Success Popup */}
            {showSuccessPopup && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setShowSuccessPopup(false)}
                >
                    <div
                        className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-2xl font-bold text-slate-900 mb-4">Success</h3>
                        <p className="text-slate-600 mb-6">{successMessage}</p>
                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowSuccessPopup(false)}
                                className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-colors"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Project Detail/Edit Modal */}
            {(selectedProject || showProjectModal) && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl my-8">
                        {!isProjectEditMode && selectedProject ? (
                            // Detail View
                            <div>
                                <h3 className="text-3xl font-bold text-slate-900 mb-6">{selectedProject.project_name}</h3>

                                <div className="space-y-4 mb-6">
                                    {selectedProject.description && (
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                                            <p className="text-slate-600">{selectedProject.description}</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
                                            <span className={`px-3 py-1 rounded-full text-sm ${selectedProject.status === 'ongoing' ? 'bg-blue-100 text-blue-700' :
                                                selectedProject.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {selectedProject.status}
                                            </span>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Progress</label>
                                            <p className="text-slate-600">{selectedProject.progress_percent}%</p>
                                        </div>
                                    </div>

                                    {selectedProject.github_url && (
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">GitHub</label>
                                            <a href={selectedProject.github_url} target="_blank" rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline break-all">
                                                {selectedProject.github_url}
                                            </a>
                                        </div>
                                    )}

                                    {selectedProject.web_url && (
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Website</label>
                                            <a href={selectedProject.web_url} target="_blank" rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline break-all">
                                                {selectedProject.web_url}
                                            </a>
                                        </div>
                                    )}

                                    {selectedProject.technologies && selectedProject.technologies.length > 0 && (
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Technologies</label>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedProject.technologies.map((tech: string, idx: number) => (
                                                    <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                                                        {tech}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {selectedProject.tags && selectedProject.tags.length > 0 && (
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Tags</label>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedProject.tags.map((tag: string, idx: number) => (
                                                    <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4 mt-6">
                                    <button
                                        onClick={() => setSelectedProject(null)}
                                        className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-full font-bold hover:bg-slate-300 transition-colors"
                                    >
                                        Close
                                    </button>
                                    {isAuthorized && (
                                        <>
                                            <button
                                                onClick={handleEditProjectClick}
                                                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-full font-bold hover:bg-purple-700 transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteProject(selectedProject._id)}
                                                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-full font-bold hover:bg-red-700 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : (
                            // Edit/Create Form
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-6">
                                    {selectedProject ? 'Edit Project' : 'Create New Project'}
                                </h3>

                                <div className="space-y-4 max-h-[60vh] overflow-y-auto scrollbar-hide p-1">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Project Name *</label>
                                        <input
                                            type="text"
                                            value={projectFormData.project_name}
                                            onChange={(e) => setProjectFormData({ ...projectFormData, project_name: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                                        <textarea
                                            value={projectFormData.description}
                                            onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            rows={3}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
                                            <select
                                                value={projectFormData.status}
                                                onChange={(e) => setProjectFormData({ ...projectFormData, status: e.target.value as any })}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            >
                                                <option value="ongoing">Ongoing</option>
                                                <option value="completed">Completed</option>
                                                <option value="paused">Paused</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Progress (%)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={projectFormData.progress_percent}
                                                onChange={(e) => setProjectFormData({ ...projectFormData, progress_percent: parseInt(e.target.value) || 0 })}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">GitHub URL</label>
                                        <input
                                            type="url"
                                            value={projectFormData.github_url}
                                            onChange={(e) => setProjectFormData({ ...projectFormData, github_url: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="https://github.com/username/repo"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Website URL</label>
                                        <input
                                            type="url"
                                            value={projectFormData.web_url}
                                            onChange={(e) => setProjectFormData({ ...projectFormData, web_url: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="https://example.com"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Expected End Date</label>
                                            <input
                                                type="date"
                                                value={projectFormData.expected_end_at}
                                                onChange={(e) => setProjectFormData({ ...projectFormData, expected_end_at: e.target.value })}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Actual End Date</label>
                                            <input
                                                type="date"
                                                value={projectFormData.actual_end_at}
                                                onChange={(e) => setProjectFormData({ ...projectFormData, actual_end_at: e.target.value })}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Technologies (comma-separated)</label>
                                        <input
                                            type="text"
                                            value={projectFormData.technologies.join(', ')}
                                            onChange={(e) => setProjectFormData({
                                                ...projectFormData,
                                                technologies: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                                            })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="React, Node.js, MongoDB"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Tags (comma-separated)</label>
                                        <input
                                            type="text"
                                            value={projectFormData.tags.join(', ')}
                                            onChange={(e) => setProjectFormData({
                                                ...projectFormData,
                                                tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                                            })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="web, frontend, backend"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Budget</label>
                                        <input
                                            type="number"
                                            value={projectFormData.budget}
                                            onChange={(e) => setProjectFormData({ ...projectFormData, budget: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 mt-6">
                                    <button
                                        onClick={() => {
                                            setShowProjectModal(false);
                                            setSelectedProject(null);
                                            setIsProjectEditMode(false);
                                        }}
                                        className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-full font-bold hover:bg-slate-300 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveProject}
                                        className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-full font-bold hover:bg-purple-700 transition-colors"
                                    >
                                        {selectedProject ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
