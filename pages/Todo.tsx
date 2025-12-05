import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TodoPersonal } from './TodoPersonal';
import { TodoDev } from './TodoDev';
import { getApiUrl } from '../components/TodoComponents';

export const Todo: React.FC = () => {
    // ============================================================================
    // ROUTER & URL PARAMETERS
    // ============================================================================
    const navigate = useNavigate();
    const { tab } = useParams<{ tab: string }>();

    // ============================================================================
    // CORE STATE - User, Authorization
    // ============================================================================
    const [user, setUser] = React.useState<any>(null);
    const [isAuthorized, setIsAuthorized] = React.useState(false);
    const [authLoading, setAuthLoading] = React.useState(true);

    // ============================================================================
    // PROJECT STATE (shared for both tabs)
    // ============================================================================
    const [projects, setProjects] = React.useState<any[]>([]);

    // Derive activeTab from URL parameter
    const activeTab = (tab === 'dev' ? 'dev' : 'personal') as 'personal' | 'dev';

    React.useEffect(() => {
        const checkAuth = async () => {
            // Get user data
            const userData = localStorage.getItem('user_profile');
            if (userData) {
                try {
                    const parsedUser = JSON.parse(userData);
                    setUser(parsedUser);

                    // Check authorization
                    const API_URL = getApiUrl();
                    const response = await fetch(`${API_URL}/api/member/role/${parsedUser.email}`);
                    const data = await response.json();
                    setIsAuthorized(data.authorized);
                } catch (e) {
                    console.error('Failed to parse user data', e);
                }
            }
            setAuthLoading(false);
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

        checkAuth();
        fetchProjects();
    }, []);

    React.useEffect(() => {
        if (!authLoading && !isAuthorized) {
            navigate('/');
        }
    }, [authLoading, isAuthorized, navigate]);

    if (authLoading) {
        return (
            <div className="flex flex-col h-screen bg-white items-center justify-center">
                <p className="text-slate-500">Loading...</p>
            </div>
        );
    }

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
                    {activeTab === 'personal' ? (
                        <TodoPersonal
                            user={user}
                            isAuthorized={isAuthorized}
                            projects={projects}
                        />
                    ) : (
                        <TodoDev
                            user={user}
                            isAuthorized={isAuthorized}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
