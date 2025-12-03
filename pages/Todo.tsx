import React from 'react';
import { useNavigate } from 'react-router-dom';
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

        fetchWeather();
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

export const Todo: React.FC = () => {
    const navigate = useNavigate();
    const [todos, setTodos] = React.useState<any[]>([]);
    const [user, setUser] = React.useState<any>(null);
    const [isAuthorized, setIsAuthorized] = React.useState(false);
    const [loading, setLoading] = React.useState(true);
    const [authLoading, setAuthLoading] = React.useState(true);
    const [showCreateModal, setShowCreateModal] = React.useState(false);
    const [newTodo, setNewTodo] = React.useState({
        title: '',
        description: '',
        priority: 'medium',
        due_date: ''
    });
    const [selectedDate, setSelectedDate] = React.useState(new Date());
    const [selectedTodo, setSelectedTodo] = React.useState<any>(null);
    const [isEditMode, setIsEditMode] = React.useState(false);
    const [editFormData, setEditFormData] = React.useState({
        title: '',
        description: '',
        priority: 'medium',
        status: 'pending',
        due_date: ''
    });
    const [showSuccessPopup, setShowSuccessPopup] = React.useState(false);
    const [successMessage, setSuccessMessage] = React.useState('');
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 10;

    // Filter State
    const [filterDate, setFilterDate] = React.useState<Date | null>(null);
    const [filterMode, setFilterMode] = React.useState<'all' | 'until_date' | 'today'>('all');
    const [searchQuery, setSearchQuery] = React.useState('');
    const [isSearching, setIsSearching] = React.useState(false);

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

        checkAuth();
        // Fetch todos
        fetchTodos();
    }, []);

    React.useEffect(() => {
        if (!authLoading && !isAuthorized) {
            navigate('/');
        }
    }, [authLoading, isAuthorized, navigate]);

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

            const response = await fetch(`${API_URL}/api/todos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newTodo,
                    email: user.email
                })
            });

            if (response.ok) {
                const createdTodo = await response.json();
                setTodos(sortTodos([createdTodo, ...todos]));
                setShowCreateModal(false);
                setNewTodo({ title: '', description: '', priority: 'medium', due_date: '' });
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
                due_date: selectedTodo.due_date || ''
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

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Filter Logic
    // Filter Logic
    const filteredTodos = React.useMemo(() => {
        let result = todos;

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
    }, [todos, filterMode, filterDate, isSearching, searchQuery]);

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
        <div className="h-screen bg-white pt-32 pb-0 px-6 animate-fadeIn flex flex-col overflow-hidden">
            <div className="max-w-7xl mx-auto w-full flex flex-col h-full">
                <h2 className="text-4xl font-bold text-black mb-6 text-center border-b border-slate-100 pb-6 flex-shrink-0">
                    TODO
                </h2>

                <div className="flex-1 overflow-y-auto min-h-0 pb-20 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                    {loading ? (
                        <div className="text-center py-12">
                            <p className="text-slate-500">Loading...</p>
                        </div>
                    ) : (
                        <div className="flex gap-8">
                            {/* Left: Calendar */}
                            <div className="w-1/3 flex flex-col gap-6">
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



                                {/* World Clocks */}
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                    <div className="grid grid-cols-2 gap-4 justify-items-center">
                                        <AnalogClock timezone="America/Chicago" label="Chicago" />
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
                                                            <td className={`px-4 py-3 ${isStrikethrough ? 'line-through text-slate-400' : 'text-slate-600'} text-sm`}>
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

                                {filteredTodos.length > itemsPerPage && (
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

                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
                                                disabled={currentPage === totalPages}
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
                                )}

                                {/* Search Section (Visible even if no pagination, but only if there are items or searching) */}
                                {filteredTodos.length <= itemsPerPage && (todos.length > 0 || isSearching) && (
                                    <div className="flex justify-end items-center gap-2 mt-4">
                                        <div className="flex items-center gap-2">
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
                                )}
                            </div>
                        </div>
                    )}
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

                {/* Create Modal */}
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
                                        setNewTodo({ title: '', description: '', priority: 'medium', due_date: '' });
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

                            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-slate-100">
                                {isAuthorized && (
                                    <>
                                        <button
                                            onClick={() => handleDeleteTodo(selectedTodo._id)}
                                            className="px-6 py-3 bg-red-100 text-red-600 rounded-full font-bold hover:bg-red-200 transition-colors"
                                        >
                                            Delete
                                        </button>
                                        <button
                                            onClick={handleEditClick}
                                            className="px-6 py-3 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-700 transition-colors"
                                        >
                                            Update
                                        </button>
                                    </>
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
            </div>
        </div>
    );
};
