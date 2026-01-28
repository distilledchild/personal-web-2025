import React from 'react';
import { Plus, Bell } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    AnalogClock,
    WeatherWidget,
    KanbanBoard,
    sortTodos,
    formatDate,
    getPriorityColor,
    CreateTodoModal,
    TodoDetailModal,
    EditTodoModal,
    SuccessPopup,
    TodoFormData,
    FloatingActionButton
} from './TodoComponents';
import { API_URL } from '../utils/apiConfig';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';

interface TodoKanbanViewProps {
    user: any;
    isAuthorized: boolean;
    projects: any[];
    category: 'dev' | 'note';
    createModalTitle?: string;
}

export const TodoKanbanView: React.FC<TodoKanbanViewProps> = ({
    user,
    isAuthorized,
    projects: initialProjects,
    category,
    createModalTitle = 'Create New TODO'
}) => {
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
    }, [category]); // Re-fetch when category changes

    // Update local projects when props change
    React.useEffect(() => {
        setProjects(initialProjects);
    }, [initialProjects]);

    // Lock body scroll when modal is open
    useLockBodyScroll(!!selectedProject || showProjectModal);

    // ============================================================================
    // API FUNCTIONS
    // ============================================================================
    const fetchTodos = async () => {
        try {
            const response = await fetch(`${API_URL}/api/todos`);
            if (response.ok) {
                const data = await response.json();
                // Filter based on the provided category
                const filtered = data.filter((todo: any) => todo.category === category);
                setTodos(sortTodos(filtered));
            }
        } catch (error) {
            console.error('Failed to fetch todos:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProjects = async () => {
        try {
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
                // Only add if it matches current category
                if (createdTodo.category === category) {
                    setTodos(sortTodos([createdTodo, ...todos]));
                }
                setShowCreateModal(false);
                const itemName = category === 'note' ? 'Note' : 'TODO';
                setSuccessMessage(`${itemName} created successfully!`);
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
                // If category changed, remove from this list
                if (updatedTodo.category !== category) {
                    setTodos(sortTodos(todos.filter(t => t._id !== selectedTodo._id)));
                } else {
                    setTodos(sortTodos(todos.map(t => t._id === selectedTodo._id ? updatedTodo : t)));
                }
                setSelectedTodo(null);
                setIsEditMode(false);
                const itemName = category === 'note' ? 'Note' : 'TODO';
                setSuccessMessage(`${itemName} has been updated successfully!`);
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
            const response = await fetch(`${API_URL}/api/todos/${todoId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email })
            });

            if (response.ok) {
                setTodos(todos.filter(t => t._id !== todoId));
                setSelectedTodo(null);
                const itemName = category === 'note' ? 'Note' : 'TODO';
                setSuccessMessage(`${itemName} has been deleted successfully!`);
                setShowSuccessPopup(true);
            }
        } catch (error) {
            console.error('Failed to delete todo:', error);
        }
    };

    const handleUpdateStatus = async (todoId: string, newValue: string) => {
        if (!user || !user.email) return;
        try {
            const todo = todos.find(t => t._id === todoId);
            const isNote = category === 'note';

            // For note category, draggable columns represent the 'sort' field
            const updatePayload = isNote
                ? { ...todo, sort: newValue }
                : { ...todo, status: newValue };

            const response = await fetch(`${API_URL}/api/todos/${todoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    ...updatePayload
                })
            });

            if (response.ok) {
                const updatedTodo = await response.json();
                setTodos(sortTodos(todos.map(t => t._id === todoId ? updatedTodo : t)));
            }
        } catch (error) {
            console.error('Failed to update field:', error);
        }
    };

    const handlePinTodo = async (todoId: string, isPinned: boolean) => {
        if (!user || !user.email) return;
        try {
            const response = await fetch(`${API_URL}/api/todos/${todoId}/pin`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    pinned: isPinned
                })
            });

            if (response.ok) {
                const updatedTodo = await response.json();
                setTodos(sortTodos(todos.map(t => t._id === todoId ? updatedTodo : t)));
            }
        } catch (error) {
            console.error('Failed to pin todo:', error);
        }
    };

    const handleReorderTodos = async (reorderedTodos: any[]) => {
        // Optimistic update
        const updatedTodosMap = new Map(reorderedTodos.map(t => [t._id, t]));
        const newTodosState = todos.map(t => updatedTodosMap.get(t._id) || t);
        setTodos(sortTodos(newTodosState));

        if (!user || !user.email) return;

        try {
            const payload = reorderedTodos.map(t => ({ _id: t._id, priority_no: t.priority_no }));
            await fetch(`${API_URL}/api/todos/reorder`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    todos: payload
                })
            });
        } catch (error) {
            console.error('Failed to reorder todos:', error);
            fetchTodos(); // Revert on error
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
        setTechnologiesString('');
        setTagsString('');
        setIsProjectEditMode(true);
        setSelectedProject(null);
        setShowProjectModal(true);
    };

    const handleEditProjectClick = () => {
        if (selectedProject) {
            const techs = selectedProject.technologies || [];
            const projectTags = selectedProject.tags || [];
            setProjectFormData({
                project_name: selectedProject.project_name || '',
                github_url: selectedProject.github_url || '',
                web_url: selectedProject.web_url || '',
                expected_end_at: selectedProject.expected_end_at ? new Date(selectedProject.expected_end_at).toISOString().split('T')[0] : '',
                actual_end_at: selectedProject.actual_end_at ? new Date(selectedProject.actual_end_at).toISOString().split('T')[0] : '',
                description: selectedProject.description || '',
                status: selectedProject.status || 'ongoing',
                team_members: selectedProject.team_members || [],
                technologies: techs,
                tags: projectTags,
                budget: selectedProject.budget?.toString() || '',
                progress_percent: selectedProject.progress_percent || 0
            });
            setTechnologiesString(techs.join('; '));
            setTagsString(projectTags.join('; '));
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

    // Shared state for formatted inputs
    const [technologiesString, setTechnologiesString] = React.useState('');
    const [tagsString, setTagsString] = React.useState('');

    const handleTechnologiesInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val.endsWith(' ') && !val.endsWith('; ')) {
            setTechnologiesString(val.trim() + '; ');
        } else {
            setTechnologiesString(val);
        }
    };

    const handleTechnologiesBlur = () => {
        let val = technologiesString.trim();
        if (val.endsWith(';')) val = val.slice(0, -1).trim();
        setTechnologiesString(val);
        setProjectFormData({
            ...projectFormData,
            technologies: val.split(';').map((t: string) => t.trim()).filter(Boolean)
        });
    };

    const handleTagsInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val.endsWith(' ') && !val.endsWith('; ')) {
            setTagsString(val.trim() + '; ');
        } else {
            setTagsString(val);
        }
    };

    const handleTagsBlur = () => {
        let val = tagsString.trim();
        if (val.endsWith(';')) val = val.slice(0, -1).trim();
        setTagsString(val);
        setProjectFormData({
            ...projectFormData,
            tags: val.split(';').map((t: string) => t.trim()).filter(Boolean)
        });
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
                {/* Left: Calendar & Clocks */}
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
                            category={category}
                            onTodoClick={handleTodoClick}
                            onProjectClick={handleProjectClick}
                            onAddProjectClick={handleAddProjectClick}
                            onUpdateStatus={handleUpdateStatus}
                            getPriorityColor={getPriorityColor}
                            formatDate={formatDate}
                            isAuthorized={isAuthorized}
                            onPinClick={handlePinTodo}
                            onReorderTodos={handleReorderTodos}
                        />
                    </div>
                </div>
            </div>

            <WeatherWidget />

            {/* Action Buttons */}
            {isAuthorized && (
                <>
                    <FloatingActionButton
                        onClick={() => setFilterMode(prev => prev === 'today' ? 'all' : 'today')}
                        positionClassName="fixed bottom-64 left-6"
                        colorClassName={`${filterMode === 'today' ? 'bg-blue-600 text-white' : 'bg-gray-500 text-white hover:bg-gray-600'}`}
                        title="Show today's tasks"
                        badgeCount={todayCount}
                        className="todo-action-button"
                    >
                        <Bell size={24} />
                    </FloatingActionButton>

                    <FloatingActionButton
                        onClick={() => setShowCreateModal(true)}
                        positionClassName="fixed bottom-24 left-6"
                        colorClassName="bg-gray-500 text-white hover:bg-gray-600"
                        title="Create new TODO"
                        className="todo-action-button"
                    >
                        <Plus size={28} />
                    </FloatingActionButton>
                </>
            )}

            {/* Modals */}
            <CreateTodoModal
                show={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreate={handleCreateTodo}
                projects={projects}
                defaultCategory={category}
                title={createModalTitle}
            />

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

            {selectedTodo && isEditMode && (
                <EditTodoModal
                    todo={selectedTodo}
                    onClose={() => setIsEditMode(false)}
                    onSave={handleSaveEdit}
                    projects={projects}
                />
            )}

            {(selectedProject || showProjectModal) && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden" style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
                        {!isProjectEditMode && selectedProject ? (
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
                                                            h1: ({ ...props }) => <h1 className="text-2xl font-bold mb-3 mt-4 text-slate-900" {...props} />,
                                                            h2: ({ ...props }) => <h2 className="text-xl font-bold mb-2 mt-3 text-slate-900 border-b pb-1" {...props} />,
                                                            h3: ({ ...props }) => <h3 className="text-lg font-bold mb-2 mt-3 text-slate-900" {...props} />,
                                                            p: ({ ...props }) => <p className="mb-2 leading-6" {...props} />,
                                                            ul: ({ ...props }) => <ul className="list-disc list-inside mb-2 ml-2 space-y-1" {...props} />,
                                                            ol: ({ ...props }) => <ol className="list-decimal list-inside mb-2 ml-2 space-y-1" {...props} />,
                                                            li: ({ ...props }) => <li className="leading-6" {...props} />,
                                                            a: ({ ...props }) => <a className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer" {...props} />,
                                                            code: ({ inline, ...props }: any) =>
                                                                inline
                                                                    ? <code className="bg-slate-100 text-red-600 px-1 py-0.5 rounded text-xs font-mono" {...props} />
                                                                    : <code className="block bg-slate-900 text-green-400 p-3 rounded-lg overflow-x-auto text-xs font-mono mb-2" {...props} />,
                                                        }}
                                                    >
                                                        {selectedProject.description}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        )}
                                        {selectedProject.github_url && (
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">GitHub</label>
                                                <a href={selectedProject.github_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{selectedProject.github_url}</a>
                                            </div>
                                        )}
                                        {selectedProject.web_url && (
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Website</label>
                                                <a href={selectedProject.web_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{selectedProject.web_url}</a>
                                            </div>
                                        )}
                                        {selectedProject.technologies && selectedProject.technologies.length > 0 && (
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Technologies</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedProject.technologies.map((tech: string, idx: number) => (
                                                        <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">{tech}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {selectedProject.tags && selectedProject.tags.length > 0 && (
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Tags</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedProject.tags.map((tag: string, idx: number) => (
                                                        <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">{tag}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
                                                <span className={`px-3 py-1 rounded-full text-sm ${selectedProject.status === 'ongoing' ? 'bg-blue-100 text-blue-700' :
                                                    selectedProject.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {selectedProject.status}
                                                </span>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Progress</label>
                                                <p className="text-slate-600">{selectedProject.progress_percent}%</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8 pt-4 flex-shrink-0 border-t border-slate-100 bg-white">
                                    <div className="flex gap-4">
                                        <button onClick={() => setSelectedProject(null)} className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-full font-bold hover:bg-slate-300 transition-colors">Close</button>
                                        {isAuthorized && (
                                            <>
                                                <button onClick={handleEditProjectClick} className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-full font-bold hover:bg-purple-700 transition-colors">Edit</button>
                                                <button onClick={() => handleDeleteProject(selectedProject._id)} className="flex-1 px-6 py-3 bg-red-600 text-white rounded-full font-bold hover:bg-red-700 transition-colors">Delete</button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="p-8 pb-4 flex-shrink-0 border-b border-slate-100">
                                    <h3 className="text-2xl font-bold text-slate-900">{selectedProject ? 'Edit Project' : 'Create New Project'}</h3>
                                </div>
                                <div className="p-8 flex-1 overflow-y-auto scrollbar-hide" style={{ minHeight: 0 }}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Project Name *</label>
                                            <input type="text" value={projectFormData.project_name} onChange={(e) => setProjectFormData({ ...projectFormData, project_name: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Enter project name" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                                            <textarea value={projectFormData.description} onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" rows={3} placeholder="Markdown supported..." />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">GitHub URL</label>
                                                <input type="text" value={projectFormData.github_url} onChange={(e) => setProjectFormData({ ...projectFormData, github_url: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="https://github.com/..." />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Website URL</label>
                                                <input type="text" value={projectFormData.web_url} onChange={(e) => setProjectFormData({ ...projectFormData, web_url: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="https://..." />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Technologies (separate with ;)</label>
                                                <input type="text" value={technologiesString} onChange={handleTechnologiesInput} onBlur={handleTechnologiesBlur} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="React; TypeScript; Node.js" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Tags (separate with ;)</label>
                                                <input type="text" value={tagsString} onChange={handleTagsInput} onBlur={handleTagsBlur} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Web; Bio; Backend" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
                                                <select value={projectFormData.status} onChange={(e) => setProjectFormData({ ...projectFormData, status: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                                                    <option value="ongoing">Ongoing</option>
                                                    <option value="completed">Completed</option>
                                                    <option value="paused">Paused</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Progress (%)</label>
                                                <input type="number" value={projectFormData.progress_percent} onChange={(e) => setProjectFormData({ ...projectFormData, progress_percent: parseInt(e.target.value) })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8 pt-4 flex-shrink-0 border-t border-slate-100 bg-white">
                                    <div className="flex gap-4">
                                        <button onClick={() => { setShowProjectModal(false); setSelectedProject(null); setIsProjectEditMode(false); }} className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-full font-bold hover:bg-slate-300 transition-colors">Cancel</button>
                                        <button onClick={handleSaveProject} className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-full font-bold hover:bg-purple-700 transition-colors">Save Project</button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            <SuccessPopup
                show={showSuccessPopup}
                message={successMessage}
                onClose={() => setShowSuccessPopup(false)}
            />
        </>
    );
};
