import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mail, BookOpen } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { API_URL } from '../utils/apiConfig';
import { ContactInfo } from './contact/ContactInfo';
import { Guestbook } from './contact/Guestbook';

export const Contact: React.FC = () => {
    const { tab } = useParams<{ tab?: string }>();
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [isAuthorized, setIsAuthorized] = useState(false);

    // Determine active tab from URL, default to 'contactinfo'
    const activeTab = (tab === 'contactinfo' || tab === 'guestbook') ? tab : 'contactinfo';

    const handleTabChange = (newTab: string) => {
        navigate(`/contact/${newTab}`);
    };

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

    return (
        <div className="flex flex-col h-screen bg-white overflow-hidden">
            <PageHeader
                title="Get in Touch"
                tabs={[
                    { id: 'contactinfo', label: 'Contact Info', icon: Mail },
                    { id: 'guestbook', label: 'Guestbook', icon: BookOpen }
                ]}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                activeColor="border-purple-600 text-purple-600"
            />

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto scrollbar-hide px-6 pb-20">
                <div className="max-w-7xl mx-auto">
                    {activeTab === 'contactinfo' && <ContactInfo user={user} isAuthorized={isAuthorized} />}
                    {activeTab === 'guestbook' && <Guestbook user={user} isAuthorized={isAuthorized} />}
                </div>
            </div>
        </div>
    );
};