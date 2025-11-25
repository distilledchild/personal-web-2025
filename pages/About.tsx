import React, { useState, useEffect } from 'react';
import { Dna, Plus, X, Trash2, Edit2 } from 'lucide-react';

interface Milestone {
    _id: string;
    date: string;
    title: string;
    description: string;
    category: 'ME' | 'WEB';
    createdAt: string;
}

export const About: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'me' | 'website'>('me');
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [user, setUser] = useState<any>(null);
    const [isAuthorized, setIsAuthorized] = useState(false);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
    const [formData, setFormData] = useState({
        date: '',
        title: '',
        description: '',
        category: 'WEB' as 'ME' | 'WEB'
    });

    useEffect(() => {
        // Get user from local storage
        const storedUser = localStorage.getItem('user_profile');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            const authorizedEmails = ['distilledchild@gmail.com', 'wellclouder@gmail.com'];
            if (authorizedEmails.includes(parsedUser.email)) {
                setIsAuthorized(true);
            }
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'website') {
            fetchMilestones();
        }
    }, [activeTab]);

    const fetchMilestones = async () => {
        try {
            const API_URL = window.location.hostname === 'localhost'
                ? 'http://localhost:4000'
                : 'https://personal-web-2025-production.up.railway.app';

            const response = await fetch(`${API_URL}/api/milestones`);
            if (response.ok) {
                const data = await response.json();
                setMilestones(data);
            }
        } catch (error) {
            console.error('Failed to fetch milestones:', error);
        }
    };

    const handleSave = async () => {
        if (!user) return;

        try {
            const API_URL = window.location.hostname === 'localhost'
                ? 'http://localhost:4000'
                : 'https://personal-web-2025-production.up.railway.app';

            const method = editingMilestone ? 'PUT' : 'POST';
            const url = editingMilestone
                ? `${API_URL}/api/milestones/${editingMilestone._id}`
                : `${API_URL}/api/milestones`;

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    email: user.email
                })
            });

            if (response.ok) {
                fetchMilestones();
                closeModal();
            }
        } catch (error) {
            console.error('Failed to save milestone:', error);
        }
    };

    const handleDelete = async () => {
        if (!editingMilestone || !user) return;

        if (!confirm('Are you sure you want to delete this milestone?')) return;

        try {
            const API_URL = window.location.hostname === 'localhost'
                ? 'http://localhost:4000'
                : 'https://personal-web-2025-production.up.railway.app';

            const response = await fetch(`${API_URL}/api/milestones/${editingMilestone._id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email })
            });

            if (response.ok) {
                fetchMilestones();
                closeModal();
            }
        } catch (error) {
            console.error('Failed to delete milestone:', error);
        }
    };

    const openModal = (milestone?: Milestone) => {
        if (milestone) {
            setEditingMilestone(milestone);
            setFormData({
                date: new Date(milestone.date).toISOString().split('T')[0],
                title: milestone.title,
                description: milestone.description,
                category: milestone.category
            });
        } else {
            setEditingMilestone(null);
            setFormData({
                date: new Date().toISOString().split('T')[0],
                title: '',
                description: '',
                category: 'WEB'
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingMilestone(null);
    };

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Fixed Header Section */}
            <div className="pt-32 pb-6 px-6 bg-white border-b border-slate-100">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="text-4xl font-bold text-slate-900 mb-4">
                            Intro
                        </h2>
                    </div>

                    {/* Tabs */}
                    <div className="flex justify-center gap-2">
                        <button
                            onClick={() => setActiveTab('me')}
                            className={`
                                flex items-center gap-2 px-8 py-4 border-b-2 text-lg font-bold transition-all duration-300
                                ${activeTab === 'me'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
                            `}
                        >
                            Me
                        </button>
                        <button
                            onClick={() => setActiveTab('website')}
                            className={`
                                flex items-center gap-2 px-8 py-4 border-b-2 text-lg font-bold transition-all duration-300
                                ${activeTab === 'website'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
                            `}
                        >
                            Milestones
                        </button>
                    </div>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-6 pb-20">
                <div className="max-w-4xl mx-auto pt-8">
                    {/* Content */}
                    {activeTab === 'me' ? (
                        <div className="animate-fadeIn space-y-8 text-slate-700 leading-relaxed text-lg">
                            <p>
                                I am a <strong>Computational Biologist</strong> with a deep passion for understanding the intricate architecture of the genome. My research focuses on <strong>3D genomics</strong>, exploring how chromatin organization influences gene regulation and cellular function.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-12">
                                <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
                                    <h3 className="text-xl font-bold text-slate-900 mb-4">Research Interests</h3>
                                    <ul className="space-y-3 text-base">
                                        <li>• 3D Genomics </li>
                                        <li>• Single-cell sequencing for cancer research</li>
                                        <li>• Structural Variant Analysis</li>
                                    </ul>
                                </div>
                                <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
                                    <h3 className="text-xl font-bold text-slate-900 mb-4">Hobbies</h3>
                                    <ul className="space-y-3 text-base">
                                        <li>• Riding a bike</li>
                                        <li>• Camping</li>
                                        <li>• Traveling</li>
                                        <li>• Playing Baduk (Go)</li>
                                    </ul>
                                </div>
                            </div>

                            <p>
                                Looking forward, I aspire to leverage my expertise in a dynamic environment within the <strong>Pharmaceutical or IT industry</strong>, contributing to drug discovery and precision medicine through advanced computational strategies.
                            </p>
                        </div>
                    ) : (
                        <div className="animate-fadeIn relative min-h-[400px]">
                            {/* Admin Add Button - Fixed above Login */}
                            {isAuthorized && (
                                <div className="fixed bottom-24 left-6 z-50">
                                    <button
                                        onClick={() => openModal()}
                                        className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-600 transition-all hover:scale-110"
                                        title="Add Milestone"
                                    >
                                        <Plus size={28} />
                                    </button>
                                </div>
                            )}

                            {/* Vertical Line */}
                            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-300 -translate-x-1/2"></div>

                            {/* Milestones - Reversed to show most recent first */}
                            <div className="space-y-12 py-12">
                                {[...milestones].reverse().map((milestone) => (
                                    <div key={milestone._id} className="relative flex items-center justify-center w-full group">
                                        {/* Center Dot */}
                                        <div className={`
                                            absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-4 border-white z-10
                                            ${milestone.category === 'ME' ? 'bg-slate-300' : 'bg-slate-300'}
                                        `}></div>

                                        {/* Left Side (ME) */}
                                        <div className="w-1/2 pr-12 flex justify-end">
                                            {milestone.category === 'ME' && (
                                                <div
                                                    onClick={() => isAuthorized && openModal(milestone)}
                                                    className={`
                                                        relative bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-md w-full
                                                        ${isAuthorized ? 'cursor-pointer hover:border-blue-300 hover:shadow-md transition-all' : ''}
                                                    `}
                                                >
                                                    {/* Horizontal Connector */}
                                                    <div className="absolute top-1/2 -right-12 w-12 h-0.5 bg-slate-300 -translate-y-1/2"></div>

                                                    {/* Responsive Content Layout */}
                                                    <div className="flex flex-col lg:flex-row lg:items-center lg:gap-4">
                                                        <span className="text-xs font-bold text-slate-400 mb-2 lg:mb-0 lg:whitespace-nowrap">
                                                            {new Date(milestone.date).toLocaleDateString()}
                                                        </span>
                                                        <div className="lg:border-l lg:border-slate-300 lg:pl-4 flex-1">
                                                            <h3 className="text-lg font-bold text-slate-800 mb-2">{milestone.title}</h3>
                                                            <p className="text-slate-600 text-sm">{milestone.description}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Right Side (WEB) */}
                                        <div className="w-1/2 pl-12 flex justify-start">
                                            {milestone.category === 'WEB' && (
                                                <div
                                                    onClick={() => isAuthorized && openModal(milestone)}
                                                    className={`
                                                        relative bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-md w-full
                                                        ${isAuthorized ? 'cursor-pointer hover:border-blue-300 hover:shadow-md transition-all' : ''}
                                                    `}
                                                >
                                                    {/* Horizontal Connector */}
                                                    <div className="absolute top-1/2 -left-12 w-12 h-0.5 bg-slate-300 -translate-y-1/2"></div>

                                                    {/* Responsive Content Layout */}
                                                    <div className="flex flex-col lg:flex-row lg:items-center lg:gap-4">
                                                        <span className="text-xs font-bold text-slate-400 mb-2 lg:mb-0 lg:whitespace-nowrap">
                                                            {new Date(milestone.date).toLocaleDateString()}
                                                        </span>
                                                        <div className="lg:border-l lg:border-slate-300 lg:pl-4 flex-1">
                                                            <h3 className="text-lg font-bold text-slate-800 mb-2">{milestone.title}</h3>
                                                            <p className="text-slate-600 text-sm">{milestone.description}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl relative">
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                        >
                            <X size={24} />
                        </button>

                        <h3 className="text-2xl font-bold text-slate-900 mb-6">
                            {editingMilestone ? 'Edit Milestone' : 'Add Milestone'}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Date</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value as 'ME' | 'WEB' })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="ME">Me</option>
                                    <option value="WEB">Website</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                                />
                            </div>
                        </div>

                        <div className="flex justify-between mt-8">
                            {editingMilestone && (
                                <button
                                    onClick={handleDelete}
                                    className="px-4 py-2 text-red-600 font-bold hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <Trash2 size={18} /> Delete
                                </button>
                            )}
                            <div className="flex gap-4 ml-auto">
                                <button
                                    onClick={closeModal}
                                    className="px-6 py-2 bg-slate-100 text-slate-600 rounded-full font-bold hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-colors"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
