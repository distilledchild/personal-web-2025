import React from 'react';
import { Plus, Bell } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    AnalogClock,
    WeatherWidget,
    KanbanBoard,
    getApiUrl,
    sortTodos,
    formatDate,
    getPriorityColor,
    CreateTodoModal,
    TodoDetailModal,
    EditTodoModal,
    SuccessPopup,
    TodoFormData
} from '../components/TodoComponents';

interface TodoDevProps {
    user: any;
    isAuthorized: boolean;
    projects: any[];
}

export const TodoDev: React.FC<TodoDevProps> = ({ user, isAuthorized, projects: initialProjects }) => {
    // ============================================================================
    // CORE STATE - Todos & Projects
    // ============================================================================
    const [todos, setTodos] = React.useState<any[]>([]);
    const [projects, setProjects] = React.useState<any[]>(initialProjects);
    const [loading, setLoading] = React.useState(true);

    // ============================================================================
    // TODO CREATION/EDIT STATE
    // ============================================================================
    const [showCreateModal, setShowCreateModal] = React.useState(false);
    const [selectedDate, setSelectedDate] = React.useState(new Date());
    const [selectedTodo, setSelectedTodo] = React.useState<any>(null);
    const [isEditMode, setIsEditMode] = React.useState(false);

    // ============================================================================
    // PROJECT STATE
    // ============================================================================
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

    // ============================================================================
    // UI STATE
    // ============================================================================
    const [showSuccessPopup, setShowSuccessPopup] = React.useState(false);
    const [successMessage, setSuccessMessage] = React.useState('');
    const [showDiscardDialog, setShowDiscardDialog] = React.useState(false);

    // ============================================================================
    // FILTER STATE
    // ============================================================================
    const [filterDate, setFilterDate] = React.useState<Date | null>(null);
    const [filterMode, setFilterMode] = React.useState<'all' | 'exact_date' | 'today'>('all');

    // ============================================================================
    // LOCATION & TIMEZONE STATE
    // ============================================================================
    const [locationTimezone, setLocationTimezone] = React.useState<string>('America/Chicago');
    const [locationLabel, setLocationLabel] = React.useState<string>('Location');

    React.useEffect(() => {
        fetchTodos();
        fetchProjects();
        fetchLocationTimezone();
    }, []);

    // Update local projects when props change
    React.useEffect(() => {
        setProjects(initialProjects);
    }, [initialProjects]);

    // Lock body scroll when modal is open
    React.useEffect(() => {
        if (selectedProject || showProjectModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [selectedProject, showProjectModal]);

    // ============================================================================
    // API FUNCTIONS
    // ============================================================================
    const fetchTodos = async () => {
        try {
            const API_URL = getApiUrl();
            const response = await fetch(`${API_URL}/api/todos`);
            if (response.ok) {
                const data = await response.json();
                // Filter only dev category todos
                const devTodos = data.filter((todo: any) => todo.category === 'dev');
                setTodos(sortTodos(devTodos));
            }
        } catch (error) {
            console.error('Failed to fetch todos:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProjects = async () => {
        try {
            const API_URL = getApiUrl();
            const response = await fetch(`${API_URL}/api/projects`);
            if (response.ok) {
                const data = await response.json();
                setProjects(data);
            }
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        }
    };

    const fetchLocationTimezone = async () => {
        try {
            const API_URL = getApiUrl();
            const response = await fetch(`${API_URL}/api/contact`);
            if (response.ok) {
                const data = await response.json();
                if (data?.Location) {
                    const { city, state, country } = data.Location;
                    let timezone = 'America/Chicago';
                    let label = 'Location';

                    const locationParts = [city, state, country].filter(Boolean);
                    if (locationParts.length > 0) {
                        label = locationParts[0];
                    }

                    if (country === 'South Korea' || country === 'Korea') {
                        timezone = 'Asia/Seoul';
                    } else if (country === 'United States' || country === 'USA') {
                        const stateTimezones: { [key: string]: string } = {
                            'Illinois': 'America/Chicago',
                            'Texas': 'America/Chicago',
                            'Wisconsin': 'America/Chicago',
                            'California': 'America/Los_Angeles',
                            'New York': 'America/New_York',
                            'Florida': 'America/New_York',
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

    // ============================================================================
    // TODO HANDLERS
    // ============================================================================
    const handleCreateTodo = async (formData: TodoFormData) => {
        if (!user || !user.email) {
            alert('Please login to create a TODO');
            return;
        }

        let finalDueDate = formData.due_date;
        if (!finalDueDate) {
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            finalDueDate = nextWeek.toISOString().split('T')[0];
        }

        try {
            const API_URL = getApiUrl();
            const todoData = {
                ...formData,
                due_date: finalDueDate,
                email: user.email
            };

            const response = await fetch(`${API_URL}/api/todos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(todoData)
            });

            if (response.ok) {
                const createdTodo = await response.json();
                // Only add if it matches current tab's category
                if (createdTodo.category === 'dev') {
                    setTodos(sortTodos([createdTodo, ...todos]));
                }
                setShowCreateModal(false);
                setSuccessMessage('TODO created successfully!');
                setShowSuccessPopup(true);
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
        setIsEditMode(true);
    };

    const handleSaveEdit = async (formData: TodoFormData) => {
        if (!selectedTodo || !user || !user.email) return;

        try {
            const API_URL = getApiUrl();
            const response = await fetch(`${API_URL}/api/todos/${selectedTodo._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    ...formData
                })
            });

            if (response.ok) {
                const updatedTodo = await response.json();
                // If category changed to personal, remove from this list
                if (updatedTodo.category === 'personal' || !updatedTodo.category) {
                    setTodos(sortTodos(todos.filter(t => t._id !== selectedTodo._id)));
                } else {
                    setTodos(sortTodos(todos.map(t => t._id === selectedTodo._id ? updatedTodo : t)));
                }
                setSelectedTodo(null);
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
            const API_URL = getApiUrl();
            const response = await fetch(`${API_URL}/api/todos/${todoId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email })
            });

            if (response.ok) {
                setTodos(todos.filter(t => t._id !== todoId));
                setSelectedTodo(null);
                setSuccessMessage('TODO has been deleted successfully!');
                setShowSuccessPopup(true);
            }
        } catch (error) {
            console.error('Failed to delete todo:', error);
        }
    };

    const handleUpdateStatus = async (todoId: string, newStatus: string) => {
        if (!user || !user.email) return;
        try {
            const API_URL = getApiUrl();
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
    };

    // ============================================================================
    // PROJECT HANDLERS
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
            const API_URL = getApiUrl();
            const projectData = {
                ...projectFormData,
                email: user.email,
                budget: projectFormData.budget ? parseFloat(projectFormData.budget) : undefined
            };

            const url = selectedProject
                ? `${API_URL}/api/projects/${selectedProject._id}`
                : `${API_URL}/api/projects`;

            const response = await fetch(url, {
                method: selectedProject ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(projectData)
            });

            if (response.ok) {
                await fetchProjects();
                setShowProjectModal(false);
                setSelectedProject(null);
                setIsProjectEditMode(false);
                setSuccessMessage(selectedProject ? 'Project updated successfully!' : 'Project created successfully!');
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
            const API_URL = getApiUrl();
            const response = await fetch(`${API_URL}/api/projects/${projectId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email })
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

    // ============================================================================
    // FILTER & CALENDAR
    // ============================================================================
    const handleDateClick = (date: Date) => {
        if (filterDate && filterDate.toDateString() === date.toDateString() && filterMode === 'exact_date') {
            setFilterDate(null);
            setFilterMode('all');
        } else {
            setFilterDate(date);
            setFilterMode('exact_date');
        }
    };

    const filteredTodos = React.useMemo(() => {
        let result = todos;

        if (filterMode === 'today') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            result = result.filter(todo => {
                if (!todo.due_date) return false;
                const dueDate = new Date(todo.due_date);
                dueDate.setHours(0, 0, 0, 0);
                return dueDate >= today && dueDate < tomorrow;
            });
        } else if (filterMode === 'exact_date' && filterDate) {
            // Exact date matching - show only todos with this deadline
            const targetDate = new Date(filterDate);
            targetDate.setHours(0, 0, 0, 0);
            const nextDay = new Date(targetDate);
            nextDay.setDate(nextDay.getDate() + 1);
            result = result.filter(todo => {
                if (!todo.due_date) return false;
                const dueDate = new Date(todo.due_date);
                dueDate.setHours(0, 0, 0, 0);
                return dueDate >= targetDate && dueDate < nextDay;
            });
        }

        return result;
    }, [todos, filterMode, filterDate]);

    const todayCount = React.useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return todos.filter(todo => {
            if (!todo.due_date) return false;
            const dueDate = new Date(todo.due_date);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate >= today && dueDate < tomorrow;
        }).length;
    }, [todos]);

    // Get dates that have todos with deadlines
    const deadlineDates = React.useMemo(() => {
        const dates = new Set<string>();
        todos.forEach(todo => {
            if (todo.due_date) {
                const date = new Date(todo.due_date);
                dates.add(date.toDateString());
            }
        });
        return dates;
    }, [todos]);

    const renderCalendar = () => {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isToday = new Date().toDateString() === date.toDateString();
            const isSelected = filterDate && filterDate.toDateString() === date.toDateString();
            const hasDeadline = deadlineDates.has(date.toDateString());

            days.push(
                <button
                    key={day}
                    onClick={() => handleDateClick(date)}
                    className={`w-8 h-8 flex items-center justify-center text-sm rounded-full transition-colors relative
                        ${isToday ? 'bg-blue-500 text-white font-bold' : ''}
                        ${isSelected ? 'ring-2 ring-blue-400' : ''}
                        ${!isToday ? 'hover:bg-slate-100' : ''}`}
                >
                    {day}
                    {hasDeadline && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-red-500" />
                    )}
                </button>
            );
        }

        return days;
    };

    if (loading) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-500">Loading...</p>
            </div>
        );
    }

    return (
        <>
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
                        <KanbanBoard
                            todos={filteredTodos}
                            projects={projects}
                            onTodoClick={handleTodoClick}
                            onProjectClick={handleProjectClick}
                            onAddProjectClick={handleAddProjectClick}
                            onUpdateStatus={handleUpdateStatus}
                            getPriorityColor={getPriorityColor}
                            formatDate={formatDate}
                            isAuthorized={isAuthorized}
                        />
                    </div>
                </div>
            </div>

            {/* Weather Widget */}
            <WeatherWidget />

            {/* Fixed Action Buttons */}
            {isAuthorized && (
                <>
                    <button
                        onClick={() => setFilterMode(prev => prev === 'today' ? 'all' : 'today')}
                        className={`fixed bottom-64 left-6 w-14 h-14 rounded-full transition-all hover:scale-110 flex items-center justify-center z-40 todo-action-button
                            ${filterMode === 'today' ? 'bg-blue-600 text-white' : 'bg-gray-500 text-white hover:bg-gray-600'}`}
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
                        className="fixed bottom-24 left-6 w-14 h-14 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-all hover:scale-110 flex items-center justify-center z-40 todo-action-button"
                        title="Create new TODO"
                    >
                        <Plus size={28} />
                    </button>
                </>
            )}

            {/* Shared Create Modal */}
            <CreateTodoModal
                show={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreate={handleCreateTodo}
                projects={projects}
                defaultCategory="dev"
            />

            {/* Shared Detail Modal */}
            {selectedTodo && !isEditMode && (
                <TodoDetailModal
                    todo={selectedTodo}
                    onClose={() => setSelectedTodo(null)}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteTodo}
                    isAuthorized={isAuthorized}
                    projects={projects}
                />
            )}

            {/* Shared Edit Modal */}
            {selectedTodo && isEditMode && (
                <EditTodoModal
                    todo={selectedTodo}
                    onClose={() => setIsEditMode(false)}
                    onSave={handleSaveEdit}
                    projects={projects}
                />
            )}

            {/* Project Detail/Edit Modal */}
            {(selectedProject || showProjectModal) && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden" style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
                        {!isProjectEditMode && selectedProject ? (
                            // Detail View
                            <>
                                <div className="p-8 pb-4 flex-shrink-0 border-b border-slate-100">
                                    <h3 className="text-3xl font-bold text-slate-900">{selectedProject.project_name}</h3>
                                </div>

                                <div className="p-8 flex-1 overflow-y-auto scrollbar-hide" style={{ minHeight: 0 }}>
                                    <div className="space-y-6">
                                        {selectedProject.description && (
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                                                <div className="markdown-content text-slate-600 leading-relaxed">
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkGfm]}
                                                        components={{
                                                            // Headings
                                                            h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-3 mt-4 text-slate-900" {...props} />,
                                                            h2: ({ node, ...props }) => <h2 className="text-xl font-bold mb-2 mt-3 text-slate-900 border-b pb-1" {...props} />,
                                                            h3: ({ node, ...props }) => <h3 className="text-lg font-bold mb-2 mt-3 text-slate-900" {...props} />,
                                                            h4: ({ node, ...props }) => <h4 className="text-base font-bold mb-1 mt-2 text-slate-900" {...props} />,
                                                            h5: ({ node, ...props }) => <h5 className="text-sm font-bold mb-1 mt-2 text-slate-900" {...props} />,
                                                            h6: ({ node, ...props }) => <h6 className="text-xs font-bold mb-1 mt-2 text-slate-900" {...props} />,
                                                            // Paragraphs
                                                            p: ({ node, ...props }) => <p className="mb-2 leading-6" {...props} />,
                                                            // Lists
                                                            ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2 ml-2 space-y-1" {...props} />,
                                                            ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2 ml-2 space-y-1" {...props} />,
                                                            li: ({ node, ...props }) => <li className="leading-6" {...props} />,
                                                            // Links
                                                            a: ({ node, ...props }) => <a className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer" {...props} />,
                                                            // Code
                                                            code: ({ node, inline, ...props }: any) =>
                                                                inline
                                                                    ? <code className="bg-slate-100 text-red-600 px-1 py-0.5 rounded text-xs font-mono" {...props} />
                                                                    : <code className="block bg-slate-900 text-green-400 p-3 rounded-lg overflow-x-auto text-xs font-mono mb-2" {...props} />,
                                                            pre: ({ node, ...props }) => <pre className="mb-2" {...props} />,
                                                            // Blockquotes
                                                            blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-slate-300 pl-3 italic my-2 text-slate-600" {...props} />,
                                                            // Horizontal rule
                                                            hr: ({ node, ...props }) => <hr className="my-4 border-slate-300" {...props} />,
                                                            // Tables
                                                            table: ({ node, ...props }) => <table className="min-w-full border-collapse border border-slate-300 mb-2" {...props} />,
                                                            thead: ({ node, ...props }) => <thead className="bg-slate-100" {...props} />,
                                                            tbody: ({ node, ...props }) => <tbody {...props} />,
                                                            tr: ({ node, ...props }) => <tr className="border-b border-slate-300" {...props} />,
                                                            th: ({ node, ...props }) => <th className="border border-slate-300 px-3 py-1 text-left font-bold" {...props} />,
                                                            td: ({ node, ...props }) => <td className="border border-slate-300 px-3 py-1" {...props} />,
                                                            // Images
                                                            img: ({ node, ...props }) => <img className="max-w-full h-auto rounded-lg my-2" {...props} />,
                                                            // Strong and emphasis
                                                            strong: ({ node, ...props }) => <strong className="font-bold text-slate-900" {...props} />,
                                                            em: ({ node, ...props }) => <em className="italic" {...props} />,
                                                        }}
                                                    >
                                                        {selectedProject.description}
                                                    </ReactMarkdown>
                                                </div>
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
                                </div>

                                <div className="p-8 pt-4 flex-shrink-0 border-t border-slate-100 bg-white">
                                    <div className="flex gap-4">
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
                            </>
                        ) : (
                            // Edit/Create Form
                            <>
                                <div className="p-8 pb-4 flex-shrink-0 border-b border-slate-100">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-2xl font-bold text-slate-900">
                                            {selectedProject ? 'Edit Project' : 'Create New Project'}
                                        </h3>
                                        <button
                                            onClick={() => setShowDiscardDialog(true)}
                                            className="text-slate-400 hover:text-slate-600 text-xl font-bold"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>

                                <div className="p-8 flex-1 overflow-y-auto scrollbar-hide" style={{ minHeight: 0 }}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Project Name *</label>
                                            <input
                                                type="text"
                                                value={projectFormData.project_name}
                                                onChange={(e) => setProjectFormData({ ...projectFormData, project_name: e.target.value })}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                placeholder="Enter project name"
                                                aria-label="Project name"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                                            <textarea
                                                value={projectFormData.description}
                                                onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                rows={3}
                                                placeholder="Enter project description"
                                                aria-label="Project description"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
                                                <select
                                                    value={projectFormData.status}
                                                    onChange={(e) => setProjectFormData({ ...projectFormData, status: e.target.value as any })}
                                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    aria-label="Project status"
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
                                                    placeholder="0-100"
                                                    aria-label="Progress percentage"
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
                                                aria-label="GitHub URL"
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
                                                aria-label="Website URL"
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
                                                    aria-label="Expected end date"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Actual End Date</label>
                                                <input
                                                    type="date"
                                                    value={projectFormData.actual_end_at}
                                                    onChange={(e) => setProjectFormData({ ...projectFormData, actual_end_at: e.target.value })}
                                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    aria-label="Actual end date"
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
                                                aria-label="Technologies"
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
                                                aria-label="Tags"
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
                                                aria-label="Budget"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 pt-4 flex-shrink-0 border-t border-slate-100 bg-white">
                                    <div className="flex gap-4">
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
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Discard Confirmation Dialog */}
            {showDiscardDialog && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                    onKeyDown={(e: React.KeyboardEvent) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setShowDiscardDialog(false);
                            setShowProjectModal(false);
                            setSelectedProject(null);
                            setIsProjectEditMode(false);
                        }
                    }}
                    tabIndex={0}
                    ref={(el) => el?.focus()}
                >
                    <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl relative">
                        <button
                            onClick={() => setShowDiscardDialog(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xl font-bold"
                        >
                            ✕
                        </button>
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Unsaved Changes</h3>
                        <p className="text-slate-600 mb-6">
                            {selectedProject
                                ? 'Your changes will not be saved. Are you sure you want to discard them?'
                                : 'Your new project will not be saved. Are you sure you want to discard it?'}
                        </p>
                        <div className="flex gap-4 justify-end">
                            <button
                                onClick={() => setShowDiscardDialog(false)}
                                className="px-6 py-2 bg-slate-200 text-slate-700 rounded-full font-bold hover:bg-slate-300 transition-colors"
                            >
                                Continue Editing
                            </button>
                            <button
                                onClick={() => {
                                    setShowDiscardDialog(false);
                                    setShowProjectModal(false);
                                    setSelectedProject(null);
                                    setIsProjectEditMode(false);
                                }}
                                className="px-6 py-2 bg-red-600 text-white rounded-full font-bold hover:bg-red-700 transition-colors"
                            >
                                Discard
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Shared Success Popup */}
            <SuccessPopup
                show={showSuccessPopup}
                message={successMessage}
                onClose={() => setShowSuccessPopup(false)}
            />
        </>
    );
};
