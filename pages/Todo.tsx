import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

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
    const [editingTodos, setEditingTodos] = React.useState<{ [key: string]: any }>({});
    const [showSuccessPopup, setShowSuccessPopup] = React.useState(false);
    const [successMessage, setSuccessMessage] = React.useState('');

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
                setTodos(data);
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
                setTodos([createdTodo, ...todos]);
                setShowCreateModal(false);
                setNewTodo({ title: '', description: '', priority: 'medium', due_date: '' });
            }
        } catch (error) {
            console.error('Failed to create todo:', error);
        }
    };

    const handleStatusChange = (todoId: string, newStatus: string) => {
        setEditingTodos({
            ...editingTodos,
            [todoId]: {
                ...editingTodos[todoId],
                status: newStatus
            }
        });
    };

    const handlePriorityChange = (todoId: string, newPriority: string) => {
        setEditingTodos({
            ...editingTodos,
            [todoId]: {
                ...editingTodos[todoId],
                priority: newPriority
            }
        });
    };

    const handleDeadlineChange = (todoId: string, newDeadline: string) => {
        setEditingTodos({
            ...editingTodos,
            [todoId]: {
                ...editingTodos[todoId],
                due_date: newDeadline
            }
        });
    };

    const handleUpdateTodo = async (todoId: string) => {
        if (!user || !user.email) {
            alert('Please login to update TODO');
            return;
        }

        try {
            const API_URL = window.location.hostname === 'localhost'
                ? 'http://localhost:4000'
                : 'https://personal-web-2025-production.up.railway.app';

            const editedData = editingTodos[todoId] || {};
            const response = await fetch(`${API_URL}/api/todos/${todoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    ...editedData
                })
            });

            if (response.ok) {
                const updatedTodo = await response.json();
                setTodos(todos.map(t => t._id === todoId ? updatedTodo : t));
                // Clear editing state for this todo
                const newEditingTodos = { ...editingTodos };
                delete newEditingTodos[todoId];
                setEditingTodos(newEditingTodos);
                // Show success message
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

            days.push(
                <div
                    key={day}
                    className={`h-12 flex items-center justify-center rounded-lg cursor-pointer transition-colors ${hasTodo ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-slate-100'
                        } ${isToday ? 'border-2 border-gray-500 rounded-full' : ''}`}
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
        <div className="min-h-screen bg-white pt-32 pb-20 px-6 animate-fadeIn">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-4xl font-bold text-slate-900 mb-12 text-center border-b border-slate-100 pb-6">
                    TODO
                </h2>

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
                                <h3 className="text-lg font-bold text-slate-900 mb-4 text-center border-b border-slate-100 pb-2">World Time</h3>
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
                                            <th className="px-4 py-3 text-center text-sm font-bold text-slate-700">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {todos.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                                                    No TODO items found
                                                </td>
                                            </tr>
                                        ) : (
                                            todos.map((todo) => {
                                                const editedTodo = editingTodos[todo._id] || {};
                                                const currentStatus = editedTodo.status !== undefined ? editedTodo.status : todo.status;
                                                const currentPriority = editedTodo.priority !== undefined ? editedTodo.priority : todo.priority;
                                                const currentDueDate = editedTodo.due_date !== undefined ? editedTodo.due_date : todo.due_date;
                                                const isStrikethrough = currentStatus === 'completed' || currentStatus === 'cancelled';

                                                // Check if there are any changes
                                                const hasChanges = (
                                                    (editedTodo.status !== undefined && editedTodo.status !== todo.status) ||
                                                    (editedTodo.priority !== undefined && editedTodo.priority !== todo.priority) ||
                                                    (editedTodo.due_date !== undefined && editedTodo.due_date !== todo.due_date)
                                                );

                                                return (
                                                    <tr key={todo._id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${getStatusColor(currentStatus)}`}>
                                                        <td className={`px-4 py-3 ${isStrikethrough ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                                            {todo.title}
                                                        </td>
                                                        <td className={`px-4 py-3 ${isStrikethrough ? 'line-through text-slate-400' : 'text-slate-600'} text-sm`}>
                                                            {todo.description}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <select
                                                                value={currentStatus}
                                                                onChange={(e) => handleStatusChange(todo._id, e.target.value)}
                                                                className="px-3 py-1 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                aria-label="Change status"
                                                                title="Change status"
                                                            >
                                                                <option value="pending">Pending</option>
                                                                <option value="in_progress">In Progress</option>
                                                                <option value="completed">Completed</option>
                                                                <option value="cancelled">Cancelled</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <select
                                                                value={currentPriority}
                                                                onChange={(e) => handlePriorityChange(todo._id, e.target.value)}
                                                                className={`px-3 py-1 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${getPriorityColor(currentPriority)}`}
                                                                aria-label="Change priority"
                                                                title="Change priority"
                                                            >
                                                                <option value="low">Low</option>
                                                                <option value="medium">Medium</option>
                                                                <option value="high">High</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="date"
                                                                value={currentDueDate ? new Date(currentDueDate).toISOString().split('T')[0] : ''}
                                                                onChange={(e) => handleDeadlineChange(todo._id, e.target.value)}
                                                                className="px-3 py-1 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                aria-label="Change deadline"
                                                                title="Change deadline"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex gap-2 justify-center">
                                                                <button
                                                                    onClick={() => handleUpdateTodo(todo._id)}
                                                                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${hasChanges
                                                                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                                                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                                        }`}
                                                                    title="Update TODO"
                                                                    disabled={!hasChanges}
                                                                >
                                                                    Update
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteTodo(todo._id)}
                                                                    className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
                                                                    title="Delete TODO"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Create Button (Admin/Editor only) */}
                {isAuthorized && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="fixed bottom-24 left-6 w-14 h-14 bg-gray-500 text-white rounded-full shadow-lg hover:bg-gray-600 transition-all hover:scale-110 flex items-center justify-center z-40"
                        title="Create new TODO"
                    >
                        <Plus size={28} />
                    </button>
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
