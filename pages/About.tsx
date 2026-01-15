import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL } from '../utils/apiConfig';
import { AboutMe } from './about/AboutMe';
import { AboutMilestones } from './about/AboutMilestones';
import { AboutAcademics } from './about/AboutAcademics';

export const About: React.FC = () => {
    const { tab } = useParams<{ tab: string }>();
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        // Check user auth status
        const checkAuth = async () => {
            const storedUser = localStorage.getItem('user_profile');
            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);

                    // Check authorization from MEMBER collection
                    const response = await fetch(`${API_URL}/api/member/role/${parsedUser.email}`);
                    if (response.ok) {
                        const data = await response.json();
                        setIsAuthorized(data.authorized);
                    } else {
                        setIsAuthorized(false);
                    }
                } catch (err) {
                    console.error('Failed to check authorization:', err);
                    setIsAuthorized(false);
                }
            } else {
                setUser(null);
                setIsAuthorized(false);
            }
        };

        // Initial check
        checkAuth();

        // Listen for storage changes
        window.addEventListener('storage', checkAuth);
        // Poll for changes
        const interval = setInterval(checkAuth, 1000);

        return () => {
            window.removeEventListener('storage', checkAuth);
            clearInterval(interval);
        };
    }, []);

    // Map URL param to valid tabs, default to 'me'
    const activeTab = (tab === 'me' || tab === 'milestones' || tab === 'academics') ? tab : 'me';

    const handleTabChange = (newTab: string) => {
        navigate(`/about/${newTab}`);
    };

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Fixed Header Section */}
            <div className="pt-32 pb-0 px-6 bg-white flex-shrink-0">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-4xl font-bold text-slate-900 mb-6 text-center">
                        Intro
                    </h2>

                    {/* Tabs Navigation */}
                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                        <button
                            onClick={() => handleTabChange('me')}
                            className={`
                                flex items-center gap-2 px-6 py-4 border-b-2 text-lg font-bold transition-all duration-300
                                ${activeTab === 'me'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
                            `}
                        >
                            Me
                        </button>
                        <button
                            onClick={() => handleTabChange('milestones')}
                            className={`
                                flex items-center gap-2 px-6 py-4 border-b-2 text-lg font-bold transition-all duration-300
                                ${activeTab === 'milestones'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
                            `}
                        >
                            Milestones
                        </button>
                        <button
                            onClick={() => handleTabChange('academics')}
                            className={`
                                flex items-center gap-2 px-6 py-4 border-b-2 text-lg font-bold transition-all duration-300
                                ${activeTab === 'academics'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
                            `}
                        >
                            Academic
                        </button>
                    </div>
                    <hr className="border-slate-100" />
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-6 pb-20">
                <div className="max-w-7xl mx-auto pt-8">
                    {activeTab === 'me' && <AboutMe user={user} isAuthorized={isAuthorized} />}
                    {activeTab === 'milestones' && <AboutMilestones user={user} isAuthorized={isAuthorized} />}
                    {activeTab === 'academics' && <AboutAcademics user={user} isAuthorized={isAuthorized} />}
                </div>
            </div>
        </div>
    );
};
