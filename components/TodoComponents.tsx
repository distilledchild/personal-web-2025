import React from 'react';
import { Plus, Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog } from 'lucide-react';

// ============================================================================
// ANALOG CLOCK COMPONENT
// ============================================================================
export const AnalogClock: React.FC<{ timezone: string; label: string }> = ({ timezone, label }) => {
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

// ============================================================================
// WEATHER WIDGET COMPONENT
// ============================================================================
export const WeatherWidget: React.FC = () => {
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
                        : 'https://api.distilledchild.space';

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

// ============================================================================
// KANBAN BOARD COMPONENT
// ============================================================================
export interface KanbanBoardProps {
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

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
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
                                        ? (projects || []).filter(p => p.status === 'ongoing' || p.status === 'paused').length
                                        : getTodosByStatus(column.id).length}
                                </span>
                            </h3>
                        </div>

                        <div className="flex-1 space-y-3 p-2">
                            {column.isProject ? (
                                // Project Column
                                <>
                                    {(projects || []).filter(p => p.status === 'ongoing' || p.status === 'paused').map(project => (
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

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
export const getApiUrl = () => {
    return window.location.hostname === 'localhost'
        ? 'http://localhost:4000'
        : 'https://api.distilledchild.space';
};

export const sortTodos = (todosToSort: any[]) => {
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

export const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const getPriorityColor = (priority: string) => {
    if (priority === 'high') return 'text-red-500';
    if (priority === 'medium') return 'text-yellow-500';
    return 'text-green-500';
};

export const getStatusColor = (status: string) => {
    if (status === 'completed') return 'bg-green-50/50';
    if (status === 'cancelled') return 'bg-red-50/50';
    if (status === 'in_progress') return 'bg-blue-50/50';
    return '';
};

// ============================================================================
// TODO FORM DATA INTERFACE
// ============================================================================
export interface TodoFormData {
    title: string;
    description: string;
    priority: string;
    status: string;
    due_date: string;
    category: string;
    sort: string;
}

// ============================================================================
// CREATE TODO MODAL
// ============================================================================
export interface CreateTodoModalProps {
    show: boolean;
    onClose: () => void;
    onCreate: (formData: TodoFormData) => void;
    projects: any[];
    defaultCategory?: 'personal' | 'dev';
}

export const CreateTodoModal: React.FC<CreateTodoModalProps> = ({
    show,
    onClose,
    onCreate,
    projects,
    defaultCategory = 'personal'
}) => {
    const [formData, setFormData] = React.useState<TodoFormData>({
        title: '',
        description: '',
        priority: 'medium',
        status: 'pending',
        due_date: '',
        category: defaultCategory,
        sort: ''
    });

    // Reset form when modal opens
    React.useEffect(() => {
        if (show) {
            setFormData({
                title: '',
                description: '',
                priority: 'medium',
                status: 'pending',
                due_date: '',
                category: defaultCategory,
                sort: ''
            });
        }
    }, [show, defaultCategory]);

    if (!show) return null;

    const handleSubmit = () => {
        if (!formData.title.trim() || !formData.description.trim()) {
            alert('Title and Description are required');
            return;
        }
        onCreate(formData);
    };

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden"
                style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-8 pb-4 flex-shrink-0 border-b border-slate-100">
                    <h3 className="text-2xl font-bold text-slate-900">Create New TODO</h3>
                </div>

                {/* Scrollable Content */}
                <div className="p-8 flex-1 overflow-y-auto scrollbar-hide" style={{ minHeight: 0 }}>
                    <div className="space-y-4">
                        {/* Category Select */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value, sort: '' })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                aria-label="Select category"
                            >
                                <option value="personal">Personal</option>
                                <option value="dev">Dev</option>
                            </select>
                        </div>

                        {/* Sort Select */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                {formData.category === 'dev' ? 'Project' : 'Sort'}
                            </label>
                            <select
                                value={formData.sort}
                                onChange={(e) => setFormData({ ...formData, sort: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                aria-label="Select sort"
                            >
                                <option value="">Select...</option>
                                {formData.category === 'personal' ? (
                                    <>
                                        <option value="Academy">Academy</option>
                                        <option value="Personal">Personal</option>
                                        <option value="Work">Work</option>
                                    </>
                                ) : (
                                    <>
                                        {(projects || []).filter(p => p.status === 'ongoing' || p.status === 'paused').map(project => (
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
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter title"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Description *</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                                placeholder="Enter description"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Priority</label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                aria-label="Select priority"
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
                                value={formData.due_date}
                                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                aria-label="Select deadline"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 pt-4 flex-shrink-0 border-t border-slate-100 bg-white">
                    <div className="flex justify-end gap-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-slate-200 text-slate-700 rounded-full font-bold hover:bg-slate-300 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-colors"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// TODO DETAIL MODAL
// ============================================================================
export interface TodoDetailModalProps {
    todo: any;
    onClose: () => void;
    onEdit: () => void;
    onDelete: (todoId: string) => void;
    isAuthorized: boolean;
    projects: any[];
}

export const TodoDetailModal: React.FC<TodoDetailModalProps> = ({
    todo,
    onClose,
    onEdit,
    onDelete,
    isAuthorized,
    projects
}) => {
    if (!todo) return null;

    const getSortDisplay = () => {
        if (!todo.sort) return null;
        if (todo.category === 'dev') {
            return projects.find(p => p._id === todo.sort)?.project_name || 'Unknown Project';
        }
        return todo.sort;
    };

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden"
                style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-8 pb-4 flex-shrink-0 border-b border-slate-100">
                    <div className="flex justify-between items-start">
                        <h3 className="text-2xl font-bold text-slate-900">{todo.title}</h3>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 text-xl font-bold"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="p-8 flex-1 overflow-y-auto scrollbar-hide" style={{ minHeight: 0 }}>
                    <div className="space-y-6">
                        {/* Category Badge */}
                        <div>
                            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Category</h4>
                            <span className={`px-3 py-1 rounded-full text-sm font-bold capitalize inline-block ${todo.category === 'dev' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                {todo.category || 'personal'}
                            </span>
                        </div>

                        {getSortDisplay() && (
                            <div>
                                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    {todo.category === 'dev' ? 'Project' : 'Sort'}
                                </h4>
                                <span className="text-slate-700 font-medium">{getSortDisplay()}</span>
                            </div>
                        )}

                        <div>
                            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Description</h4>
                            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{todo.description}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Status</h4>
                                <span className={`px-3 py-1 rounded-full text-sm font-bold capitalize inline-block ${todo.status === 'completed' ? 'bg-green-100 text-green-700' :
                                    todo.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                        todo.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                            'bg-slate-100 text-slate-700'
                                    }`}>
                                    {todo.status?.replace('_', ' ')}
                                </span>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Priority</h4>
                                <span className={`text-sm font-bold capitalize ${getPriorityColor(todo.priority)}`}>
                                    {todo.priority}
                                </span>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Deadline</h4>
                                <span className="text-slate-700 font-medium">
                                    {formatDate(todo.due_date)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 pt-4 flex-shrink-0 border-t border-slate-100 bg-white">
                    <div className="flex justify-between gap-4">
                        <div className="flex gap-4">
                            {isAuthorized && (
                                <button
                                    onClick={onEdit}
                                    className="px-6 py-3 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-700 transition-colors"
                                >
                                    Update
                                </button>
                            )}
                        </div>

                        <div className="flex gap-4">
                            {isAuthorized && (
                                <button
                                    onClick={() => onDelete(todo._id)}
                                    className="px-6 py-3 bg-red-100 text-red-600 rounded-full font-bold hover:bg-red-200 transition-colors"
                                >
                                    Delete
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="px-6 py-3 bg-slate-200 text-slate-700 rounded-full font-bold hover:bg-slate-300 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// TODO EDIT MODAL
// ============================================================================
export interface EditTodoModalProps {
    todo: any;
    onClose: () => void;
    onSave: (formData: TodoFormData) => void;
    projects: any[];
}

export const EditTodoModal: React.FC<EditTodoModalProps> = ({
    todo,
    onClose,
    onSave,
    projects
}) => {
    const [formData, setFormData] = React.useState<TodoFormData>({
        title: '',
        description: '',
        priority: 'medium',
        status: 'pending',
        due_date: '',
        category: 'personal',
        sort: ''
    });

    React.useEffect(() => {
        if (todo) {
            setFormData({
                title: todo.title || '',
                description: todo.description || '',
                priority: todo.priority || 'medium',
                status: todo.status || 'pending',
                due_date: todo.due_date || '',
                category: todo.category || 'personal',
                sort: todo.sort || ''
            });
        }
    }, [todo]);

    if (!todo) return null;

    const handleSubmit = () => {
        if (!formData.title.trim() || !formData.description.trim()) {
            alert('Title and Description are required');
            return;
        }
        onSave(formData);
    };

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden"
                style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-8 pb-4 flex-shrink-0 border-b border-slate-100">
                    <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-bold text-slate-900">Edit TODO</h3>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 text-xl font-bold"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="p-8 flex-1 overflow-y-auto scrollbar-hide" style={{ minHeight: 0 }}>
                    <div className="space-y-4">
                        {/* Category Select */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value, sort: '' })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                aria-label="Edit category"
                            >
                                <option value="personal">Personal</option>
                                <option value="dev">Dev</option>
                            </select>
                        </div>

                        {/* Sort Select */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                {formData.category === 'dev' ? 'Project' : 'Sort'}
                            </label>
                            <select
                                value={formData.sort}
                                onChange={(e) => setFormData({ ...formData, sort: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                aria-label="Edit sort"
                            >
                                <option value="">Select...</option>
                                {formData.category === 'personal' ? (
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
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                aria-label="Edit title"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Description *</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                                aria-label="Edit description"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
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
                                value={formData.due_date ? new Date(formData.due_date).toISOString().split('T')[0] : ''}
                                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                aria-label="Edit deadline"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 pt-4 flex-shrink-0 border-t border-slate-100 bg-white">
                    <div className="flex justify-end gap-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-slate-200 text-slate-700 rounded-full font-bold hover:bg-slate-300 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-colors"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// SUCCESS POPUP
// ============================================================================
export interface SuccessPopupProps {
    show: boolean;
    message: string;
    onClose: () => void;
}

export const SuccessPopup: React.FC<SuccessPopupProps> = ({ show, message, onClose }) => {
    React.useEffect(() => {
        if (show) {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClose();
                }
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [show, onClose]);

    if (!show) return null;

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Success</h3>
                <p className="text-slate-600 mb-6">{message}</p>
                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-colors"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};
