import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL } from '../utils/apiConfig';
import { AboutMe } from './about/AboutMe';
import { AboutMilestones } from './about/AboutMilestones';
import { AboutAcademics } from './about/AboutAcademics';
import { PageHeader } from '../components/PageHeader';

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
            <PageHeader
                title="Intro"
                tabs={[
                    { id: 'me', label: 'Me' },
                    { id: 'milestones', label: 'Milestones' },
                    { id: 'academics', label: 'Academic' }
                ]}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                activeColor="border-blue-600 text-blue-600"
            />

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-6 pb-20">
                <div className="max-w-7xl mx-auto">
                    {activeTab === 'me' && <AboutMe user={user} isAuthorized={isAuthorized} />}
                    {activeTab === 'milestones' && <AboutMilestones user={user} isAuthorized={isAuthorized} />}
                    {activeTab === 'academics' && <AboutAcademics user={user} isAuthorized={isAuthorized} />}
                </div>
            </div>
        </div>
    );
};
