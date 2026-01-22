import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { API_URL } from '../../utils/apiConfig';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

interface AboutMeData {
    _id?: string;
    introduction: string;
    research_interests: string[];
    hobbies: string[];
    future_goal: string;
}

interface AboutMeProps {
    user: any;
    isAuthorized: boolean;
}

export const AboutMe: React.FC<AboutMeProps> = ({ user, isAuthorized }) => {
    const [aboutMe, setAboutMe] = useState<AboutMeData | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [aboutMeForm, setAboutMeForm] = useState({
        introduction: '',
        research_interests: '',
        hobbies: '',
        future_goal: ''
    });

    useLockBodyScroll(isModalOpen);

    useEffect(() => {
        fetchAboutMe();
    }, []);

    const fetchAboutMe = async () => {
        try {
            const response = await fetch(`${API_URL}/api/about-me`);
            if (response.ok) {
                const data = await response.json();
                setAboutMe(data);
            }
        } catch (error) {
            console.error('Failed to fetch about me:', error);
        }
    };

    const handleSaveAboutMe = async () => {
        if (!user) return;

        try {
            const isCreating = !aboutMe?._id;
            const url = isCreating
                ? `${API_URL}/api/about-me`
                : `${API_URL}/api/about-me/${aboutMe._id}`;
            const method = isCreating ? 'POST' : 'PUT';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    introduction: aboutMeForm.introduction,
                    research_interests: aboutMeForm.research_interests.split('\n').filter(i => i.trim()),
                    hobbies: aboutMeForm.hobbies.split('\n').filter(h => h.trim()),
                    future_goal: aboutMeForm.future_goal,
                    email: user.email
                })
            });

            if (response.ok) {
                fetchAboutMe();
                closeModal();
            }
        } catch (error) {
            console.error('Failed to save about me:', error);
        }
    };

    const openAboutMeModal = () => {
        if (aboutMe) {
            setAboutMeForm({
                introduction: aboutMe.introduction || '',
                research_interests: aboutMe.research_interests?.join('\n') || '',
                hobbies: aboutMe.hobbies?.join('\n') || '',
                future_goal: aboutMe.future_goal || ''
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    return (
        <div className="animate-fadeIn space-y-8 text-slate-700 leading-relaxed text-lg relative" style={{ textAlign: 'justify' }}>
            <p dangerouslySetInnerHTML={{ __html: aboutMe?.introduction || '' }} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-12">
                <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100" style={{ textAlign: 'left' }}>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">Research Interests</h3>
                    <ul className="space-y-3 text-base">
                        {aboutMe?.research_interests?.map((interest, idx) => (
                            <li key={idx}>• {interest}</li>
                        ))}
                    </ul>
                </div>
                <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100" style={{ textAlign: 'left' }}>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">Hobbies</h3>
                    <ul className="space-y-3 text-base">
                        {aboutMe?.hobbies?.map((hobby, idx) => (
                            <li key={idx}>• {hobby}</li>
                        ))}
                    </ul>
                </div>
            </div>

            <p dangerouslySetInnerHTML={{ __html: aboutMe?.future_goal || '' }} />

            {/* Admin Add Button */}
            {isAuthorized && (
                <div className="fixed bottom-24 left-6 z-50">
                    <button
                        onClick={openAboutMeModal}
                        className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-600 transition-all hover:scale-110"
                        title="Edit About Me"
                    >
                        <Plus size={28} />
                    </button>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <h3 className="text-2xl font-bold text-slate-900 mb-6">Edit About Me</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Introduction (HTML supported)</label>
                                <textarea
                                    value={aboutMeForm.introduction}
                                    onChange={e => setAboutMeForm({ ...aboutMeForm, introduction: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px]"
                                    placeholder="Enter introduction..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Research Interests (One per line)</label>
                                <textarea
                                    value={aboutMeForm.research_interests}
                                    onChange={e => setAboutMeForm({ ...aboutMeForm, research_interests: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                                    placeholder="Enter research interests..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Hobbies (One per line)</label>
                                <textarea
                                    value={aboutMeForm.hobbies}
                                    onChange={e => setAboutMeForm({ ...aboutMeForm, hobbies: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                                    placeholder="Enter hobbies..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Future Goal (HTML supported)</label>
                                <textarea
                                    value={aboutMeForm.future_goal}
                                    onChange={e => setAboutMeForm({ ...aboutMeForm, future_goal: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                                    placeholder="Enter future goal..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleSaveAboutMe}
                                    className="flex-1 px-6 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
