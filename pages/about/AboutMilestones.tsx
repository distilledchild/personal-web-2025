import React, { useState, useEffect } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';
import { API_URL } from '../../utils/apiConfig';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

interface Milestone {
    _id: string;
    date: string;
    title: string;
    description: string;
    category: 'ME' | 'WEB';
    createdAt: string;
}

interface AboutMilestonesProps {
    user: any;
    isAuthorized: boolean;
}

export const AboutMilestones: React.FC<AboutMilestonesProps> = ({ user, isAuthorized }) => {
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
    const [milestoneForm, setMilestoneForm] = useState({
        date: '',
        title: '',
        description: '',
        category: 'WEB' as 'ME' | 'WEB'
    });
    const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

    useLockBodyScroll(isModalOpen);

    useEffect(() => {
        fetchMilestones();
    }, []);

    const fetchMilestones = async () => {
        try {
            const response = await fetch(`${API_URL}/api/milestones`);
            if (response.ok) {
                const data = await response.json();
                setMilestones(data);
            }
        } catch (error) {
            console.error('Failed to fetch milestones:', error);
        }
    };

    const handleSaveMilestone = async () => {
        if (!user) return;

        try {
            const method = editingMilestone ? 'PUT' : 'POST';
            const url = editingMilestone
                ? `${API_URL}/api/milestones/${editingMilestone._id}`
                : `${API_URL}/api/milestones`;

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...milestoneForm,
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

    const handleDeleteMilestone = async () => {
        if (!editingMilestone || !user) return;

        if (!confirm('Are you sure you want to delete this milestone?')) return;

        try {
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

    const openMilestoneModal = (milestone?: Milestone) => {
        if (milestone) {
            setEditingMilestone(milestone);
            // Extract year-month from ISO date string to avoid timezone issues
            const dateStr = milestone.date;
            const date = new Date(dateStr);
            // Use UTC methods to avoid timezone conversion issues
            const yearMonth = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
            setMilestoneForm({
                date: yearMonth,
                title: milestone.title,
                description: milestone.description,
                category: milestone.category
            });
        } else {
            setEditingMilestone(null);
            const now = new Date();
            const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            setMilestoneForm({
                date: yearMonth,
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

    const renderDescriptionWithLinks = (text: string) => {
        const parts = text.split(/(https?:\/\/[^\s]+)/g);
        return parts.map((part, i) => {
            if (part.match(/https?:\/\/[^\s]+/)) {
                return (
                    <a
                        key={i}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline relative z-20"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {part}
                    </a>
                );
            }
            return part;
        });
    };

    // Group milestones by YYYY-MM
    const groupedMilestones = React.useMemo(() => {
        const groups: { [key: string]: Milestone[] } = {};
        milestones.forEach(m => {
            const d = new Date(m.date);
            const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(m);
        });
        return groups;
    }, [milestones]);

    const sortedGroupKeys = React.useMemo(() => {
        return Object.keys(groupedMilestones).sort().reverse();
    }, [groupedMilestones]);

    // Automatically expand the most recent (first) group on load
    useEffect(() => {
        if (sortedGroupKeys.length > 0 && expandedGroups.length === 0) {
            setExpandedGroups([sortedGroupKeys[0]]);
        }
    }, [sortedGroupKeys]);

    const toggleGroup = (key: string) => {
        setExpandedGroups(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    return (
        <div className="animate-fadeIn relative min-h-[400px]">
            {/* West of code ... */}
            {/* Milestones Groups */}
            <div className="py-12 space-y-8">
                {sortedGroupKeys.map(key => {
                    const group = groupedMilestones[key];
                    // Reverse to show newest first within the month
                    const items = [...group].reverse();

                    // Split counts
                    const meCount = group.filter(m => m.category === 'ME').length;
                    const webCount = group.filter(m => m.category === 'WEB').length;

                    const isExpanded = expandedGroups.includes(key);

                    const [year, month] = key.split('-');
                    const dateObj = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, 1));
                    const monthName = dateObj.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
                    const displayDate = `${monthName} ${year}`;

                    return (
                        <div key={key} className="relative w-full">
                            {/* Group Header */}
                            <div className="flex justify-center mb-8 relative z-20">
                                <div
                                    onClick={() => toggleGroup(key)}
                                    className={`
                                        cursor-pointer flex items-center bg-white rounded-full border border-slate-200 shadow-sm hover:shadow-md transition-all py-1 gap-4 select-none group/header
                                        ${meCount > 0 ? 'pl-1' : 'pl-6'} 
                                        ${webCount > 0 ? 'pr-1' : 'pr-6'}
                                    `}
                                >
                                    {meCount > 0 && (
                                        <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-md font-bold text-xl group-hover/header:bg-blue-600 transition-colors">
                                            {meCount}
                                        </div>
                                    )}

                                    <span className="font-bold text-slate-600 text-lg">{displayDate}</span>

                                    {webCount > 0 && (
                                        <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-md font-bold text-xl group-hover/header:bg-blue-600 transition-colors">
                                            {webCount}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Expanded Items */}
                            {isExpanded && (
                                <div className="space-y-12 animate-fadeIn pb-12">
                                    {items.map((milestone) => (
                                        <div key={milestone._id} className="relative flex items-center justify-center w-full group">
                                            {/* Center Dot */}
                                            <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-4 border-white z-10 bg-slate-300"></div>

                                            {/* Left Side (ME) */}
                                            <div className="w-1/2 pr-12 flex justify-end">
                                                {milestone.category === 'ME' && (
                                                    <div
                                                        onClick={() => isAuthorized && openMilestoneModal(milestone)}
                                                        className={`
                                                             relative bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-md w-full
                                                             ${isAuthorized ? 'cursor-pointer hover:border-blue-300 hover:shadow-md transition-all' : ''}
                                                         `}
                                                    >
                                                        <div className="absolute top-1/2 -right-12 w-12 h-0.5 bg-slate-300 -translate-y-1/2"></div>
                                                        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-4">
                                                            <div className="lg:border-l lg:border-transparent lg:pl-0 flex-1">
                                                                <h3 className="text-lg font-bold text-slate-800 mb-2">{milestone.title}</h3>
                                                                <p className="text-slate-600 text-sm whitespace-pre-wrap">{renderDescriptionWithLinks(milestone.description)}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right Side (WEB) */}
                                            <div className="w-1/2 pl-12 flex justify-start">
                                                {milestone.category === 'WEB' && (
                                                    <div
                                                        onClick={() => isAuthorized && openMilestoneModal(milestone)}
                                                        className={`
                                                             relative bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-md w-full
                                                             ${isAuthorized ? 'cursor-pointer hover:border-blue-300 hover:shadow-md transition-all' : ''}
                                                         `}
                                                    >
                                                        <div className="absolute top-1/2 -left-12 w-12 h-0.5 bg-slate-300 -translate-y-1/2"></div>
                                                        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-4">
                                                            <div className="lg:border-l lg:border-transparent lg:pl-0 flex-1">
                                                                <h3 className="text-lg font-bold text-slate-800 mb-2">{milestone.title}</h3>
                                                                <p className="text-slate-600 text-sm whitespace-pre-wrap">{renderDescriptionWithLinks(milestone.description)}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Admin Add Button - Fixed above Login */}
            {isAuthorized && (
                <div className="fixed bottom-24 left-6 z-50">
                    <button
                        onClick={() => openMilestoneModal()}
                        className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-600 transition-all hover:scale-110"
                        title="Add Milestone"
                    >
                        <Plus size={28} />
                    </button>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl relative">
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <h3 className="text-2xl font-bold text-slate-900 mb-6">
                            {editingMilestone ? 'Edit Milestone' : 'Add Milestone'}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Month</label>
                                <input
                                    type="month"
                                    value={milestoneForm.date}
                                    onChange={e => setMilestoneForm({ ...milestoneForm, date: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                                <select
                                    value={milestoneForm.category}
                                    onChange={e => setMilestoneForm({ ...milestoneForm, category: e.target.value as 'ME' | 'WEB' })}
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
                                    value={milestoneForm.title}
                                    onChange={e => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter milestone title"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                                <textarea
                                    value={milestoneForm.description}
                                    onChange={e => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                                    placeholder="Enter milestone description"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                {editingMilestone && (
                                    <button
                                        onClick={handleDeleteMilestone}
                                        className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                                    >
                                        <Trash2 size={18} />
                                        Delete
                                    </button>
                                )}
                                <button
                                    onClick={handleSaveMilestone}
                                    className="flex-1 px-6 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-colors"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={closeModal}
                                    className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
