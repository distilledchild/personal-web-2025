import React, { useState, useEffect } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';

interface Milestone {
    _id: string;
    date: string;
    title: string;
    description: string;
    category: 'ME' | 'WEB';
    createdAt: string;
}

interface AboutMe {
    _id?: string;
    introduction: string;
    research_interests: string[];
    hobbies: string[];
    future_goal: string;
}

interface AboutAcademic {
    _id?: string;
    education: Array<{
        degree: string;
        institution: string;
        location: string;
        period: string;
        description: string;
        gpa: string;
        order: number;
    }>;
    experience: Array<{
        title: string;
        organization: string;
        location: string;
        period: string;
        description: string;
        responsibilities: string[];
        order: number;
    }>;
    publications: Array<{
        title: string;
        authors: string;
        journal: string;
        year: number;
        volume: string;
        pages: string;
        doi: string;
        pmid: string;
        type: string;
        order: number;
    }>;
    skills: {
        programming: Array<{ name: string; level: string; order: number }>;
        bioinformatics: Array<{ name: string; level: string; order: number }>;
        tools: Array<{ name: string; level: string; order: number }>;
        frameworks: Array<{ name: string; level: string; order: number }>;
    };
    awards: Array<{
        title: string;
        organization: string;
        year: number;
        description: string;
        order: number;
    }>;
    links?: {
        ORCiD: string;
        GoogleScholar: string;
    };
}

export const About: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'me' | 'website' | 'cv'>('me');
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [aboutMe, setAboutMe] = useState<AboutMe | null>(null);
    const [aboutAcademic, setAboutAcademic] = useState<AboutAcademic | null>(null);
    const [user, setUser] = useState<any>(null);
    const [isAuthorized, setIsAuthorized] = useState(false);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'milestone' | 'aboutMe' | 'academic'>('milestone');
    const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);

    // Milestone Form
    const [milestoneForm, setMilestoneForm] = useState({
        date: '',
        title: '',
        description: '',
        category: 'WEB' as 'ME' | 'WEB'
    });

    // About Me Form
    const [aboutMeForm, setAboutMeForm] = useState({
        introduction: '',
        research_interests: '',
        hobbies: '',
        future_goal: ''
    });

    // Academic Form (simplified - just as JSON editor)
    const [academicFormJson, setAcademicFormJson] = useState('');

    // Academic Links Form
    const [academicLinksForm, setAcademicLinksForm] = useState({
        ORCiD: '',
        GoogleScholar: ''
    });

    useEffect(() => {
        // Check user auth status
        const checkAuth = async () => {
            const storedUser = localStorage.getItem('user_profile');
            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);

                // Check authorization from MEMBER collection
                try {
                    const API_URL = window.location.hostname === 'localhost'
                        ? 'http://localhost:4000'
                        : 'https://personal-web-2025-production.up.railway.app';

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

        // Listen for storage changes (works across tabs)
        window.addEventListener('storage', checkAuth);

        // Poll for changes in same tab (since storage event doesn't fire in same tab)
        const interval = setInterval(checkAuth, 1000);

        return () => {
            window.removeEventListener('storage', checkAuth);
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        if (activeTab === 'website') {
            fetchMilestones();
        } else if (activeTab === 'me') {
            fetchAboutMe();
        } else if (activeTab === 'cv') {
            fetchAboutAcademic();
        }
    }, [activeTab]);

    const API_URL = window.location.hostname === 'localhost'
        ? 'http://localhost:4000'
        : 'https://personal-web-2025-production.up.railway.app';

    // Fetch functions
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

    const fetchAboutAcademic = async () => {
        try {
            const response = await fetch(`${API_URL}/api/about-academic?t=${new Date().getTime()}`);
            if (response.ok) {
                const data = await response.json();
                setAboutAcademic(data);
            }
        } catch (error) {
            console.error('Failed to fetch about academic:', error);
        }
    };

    // Save handlers
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

    const handleSaveAcademic = async () => {
        if (!user) return;

        try {
            if (!aboutAcademic?._id) {
                alert('No academic data found. Please create initial data first.');
                return;
            }

            const url = `${API_URL}/api/about-academic/${aboutAcademic._id}`;

            console.log('Saving academic links:', {
                ORCiD: academicLinksForm.ORCiD,
                GoogleScholar: academicLinksForm.GoogleScholar
            });

            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    links: {
                        ORCiD: academicLinksForm.ORCiD,
                        GoogleScholar: academicLinksForm.GoogleScholar
                    },
                    email: user.email
                })
            });

            if (response.ok) {
                fetchAboutAcademic();
                closeModal();
            } else {
                const errorData = await response.json();
                alert(`Failed to save: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Failed to save academic:', error);
            alert('Failed to save academic data');
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

    // Modal handlers
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
        setModalType('milestone');
        setIsModalOpen(true);
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
        setModalType('aboutMe');
        setIsModalOpen(true);
    };

    const openAcademicModal = () => {
        if (aboutAcademic) {
            const { _id, links, ...dataWithoutId } = aboutAcademic as any;
            setAcademicFormJson(JSON.stringify(dataWithoutId, null, 2));

            // Set links form separately
            setAcademicLinksForm({
                ORCiD: links?.ORCiD || '',
                GoogleScholar: links?.GoogleScholar || ''
            });
        }
        setModalType('academic');
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
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="text-4xl font-bold text-slate-900 mb-4">
                            Intro
                        </h2>
                    </div>

                    {/* Tabs - Equal spacing */}
                    <div className="flex justify-center gap-4">
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
                        <button
                            onClick={() => setActiveTab('cv')}
                            className={`
                                flex items-center gap-2 px-8 py-4 border-b-2 text-lg font-bold transition-all duration-300
                                ${activeTab === 'cv'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
                            `}
                        >
                            Academic
                        </button>
                    </div>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-6 pb-20">
                <div className="max-w-7xl mx-auto pt-8">
                    {/* Content */}
                    {activeTab === 'me' ? (
                        <div className="animate-fadeIn space-y-8 text-slate-700 leading-relaxed text-lg relative" style={{ textAlign: 'justify' }}>
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
                        </div>
                    ) : activeTab === 'website' ? (
                        <div className="animate-fadeIn relative min-h-[400px]">
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
                                                    onClick={() => isAuthorized && openMilestoneModal(milestone)}
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
                                                            {(() => {
                                                                const d = new Date(milestone.date);
                                                                const year = d.getUTCFullYear();
                                                                const month = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
                                                                return `${month} ${year}`;
                                                            })()}
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
                                                    onClick={() => isAuthorized && openMilestoneModal(milestone)}
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
                                                            {(() => {
                                                                const d = new Date(milestone.date);
                                                                const year = d.getUTCFullYear();
                                                                const month = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
                                                                return `${month} ${year}`;
                                                            })()}
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
                    ) : (
                        <div className="animate-fadeIn flex flex-col lg:flex-row gap-8 flex-1 min-h-0 relative">
                            {/* Admin Add Button */}
                            {isAuthorized && (
                                <div className="fixed bottom-24 left-6 z-50">
                                    <button
                                        onClick={openAcademicModal}
                                        className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-600 transition-all hover:scale-110"
                                        title="Edit Academic"
                                    >
                                        <Plus size={28} />
                                    </button>
                                </div>
                            )}

                            {/* Left Sidebar - Links Section */}
                            <div className="lg:w-64 flex-shrink-0 space-y-3 overflow-y-auto pr-2">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 sticky top-0 bg-white py-2">Links</h3>
                                <div className="space-y-3">
                                    {/* ORCiD Link */}
                                    {aboutAcademic?.links?.ORCiD && (
                                        <a
                                            href={aboutAcademic.links.ORCiD.startsWith('http') ? aboutAcademic.links.ORCiD : `https://${aboutAcademic.links.ORCiD}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group cursor-pointer transition-all duration-200 bg-slate-50 px-4 py-3 rounded-lg border border-slate-200 hover:bg-blue-50 hover:border-blue-200 block"
                                        >
                                            <p className="text-sm font-medium">
                                                <span style={{ color: '#A6A8AB' }}>ORC</span>
                                                <span style={{ color: '#A5CD39' }}>iD</span>
                                            </p>
                                        </a>
                                    )}

                                    {/* Google Scholar Link */}
                                    {aboutAcademic?.links?.GoogleScholar && (
                                        <a
                                            href={aboutAcademic.links.GoogleScholar.startsWith('http') ? aboutAcademic.links.GoogleScholar : `https://${aboutAcademic.links.GoogleScholar}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group cursor-pointer transition-all duration-200 bg-slate-50 px-4 py-3 rounded-lg border border-slate-200 hover:bg-blue-50 hover:border-blue-200 block"
                                        >
                                            <p className="text-sm font-medium text-slate-600 group-hover:text-blue-600 transition-colors">
                                                Google Scholar
                                            </p>
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Right Side - CV Content */}
                            <div className="flex-1 min-h-0 overflow-y-auto">
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                                    <h3 className="text-2xl font-bold text-slate-900 mb-6">Curriculum Vitae</h3>

                                    {/* PDF Viewer */}
                                    <div className="mb-8">
                                        <div className="w-full h-[800px] border border-slate-200 rounded-lg overflow-hidden">
                                            <iframe
                                                src="https://drive.google.com/file/d/1woLM4zcYV1kWI0sl4_OpLcAgQpLMmnma/preview"
                                                className="w-full h-full"
                                                allow="autoplay"
                                                title="Curriculum Vitae PDF"
                                            />
                                        </div>
                                    </div>

                                    {/* Education Section */}
                                    {/* <div className="mb-8">
                                        <h4 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Education</h4>
                                        <div className="space-y-4">
                                            {aboutAcademic?.education?.map((edu, idx) => (
                                                <div key={idx} className="mb-4">
                                                    <p className="text-lg font-bold text-slate-900">{edu.degree}</p>
                                                    <p className="text-slate-600">{edu.institution} • {edu.location}</p>
                                                    <p className="text-slate-500 text-sm">{edu.period}</p>
                                                    <p className="text-slate-600 mt-1">{edu.description}</p>
                                                    {edu.gpa && <p className="text-slate-500 text-sm">GPA: {edu.gpa}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    </div> */}

                                    {/* Experience Section */}
                                    {/* <div className="mb-8">
                                        <h4 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Experience</h4>
                                        <div className="space-y-4">
                                            {aboutAcademic?.experience?.map((exp, idx) => (
                                                <div key={idx} className="mb-4">
                                                    <p className="text-lg font-bold text-slate-900">{exp.title}</p>
                                                    <p className="text-slate-600">{exp.organization} • {exp.location}</p>
                                                    <p className="text-slate-500 text-sm">{exp.period}</p>
                                                    <p className="text-slate-600 mt-1">{exp.description}</p>
                                                    {exp.responsibilities && exp.responsibilities.length > 0 && (
                                                        <ul className="mt-2 ml-4 space-y-1">
                                                            {exp.responsibilities.map((resp, ridx) => (
                                                                <li key={ridx} className="text-slate-600 text-sm">• {resp}</li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div> */}

                                    {/* Publications Section */}
                                    {/* <div className="mb-8">
                                        <h4 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Publications</h4>
                                        <div className="space-y-4">
                                            {aboutAcademic?.publications?.map((pub, idx) => (
                                                <div key={idx} className="mb-3">
                                                    <p className="text-slate-900 font-medium">{pub.title}</p>
                                                    <p className="text-slate-600 text-sm">{pub.authors}</p>
                                                    <p className="text-slate-500 text-sm italic">{pub.journal}, {pub.year}</p>
                                                    {pub.doi && <p className="text-slate-500 text-xs">DOI: {pub.doi}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    </div> */}

                                    {/* Skills Section */}
                                    {/* <div>
                                        <h4 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Skills</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {aboutAcademic?.skills?.programming && (
                                                <div>
                                                    <p className="font-bold text-slate-700 mb-2">Programming</p>
                                                    <ul className="space-y-1">
                                                        {aboutAcademic.skills.programming.map((skill, idx) => (
                                                            <li key={idx} className="text-slate-600 text-sm">• {skill.name} ({skill.level})</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {aboutAcademic?.skills?.bioinformatics && (
                                                <div>
                                                    <p className="font-bold text-slate-700 mb-2">Bioinformatics</p>
                                                    <ul className="space-y-1">
                                                        {aboutAcademic.skills.bioinformatics.map((skill, idx) => (
                                                            <li key={idx} className="text-slate-600 text-sm">• {skill.name} ({skill.level})</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div> */}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    {modalType === 'milestone' ? (
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
                                        onClick={closeModal}
                                        className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveMilestone}
                                        className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : modalType === 'aboutMe' ? (
                        <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                            <button
                                onClick={closeModal}
                                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={24} />
                            </button>

                            <h3 className="text-2xl font-bold text-slate-900 mb-6">Edit About Me</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Introduction (HTML allowed)</label>
                                    <textarea
                                        value={aboutMeForm.introduction}
                                        onChange={e => setAboutMeForm({ ...aboutMeForm, introduction: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                                        placeholder="Enter introduction (HTML tags like <strong> allowed)"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Research Interests (one per line)</label>
                                    <textarea
                                        value={aboutMeForm.research_interests}
                                        onChange={e => setAboutMeForm({ ...aboutMeForm, research_interests: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                                        placeholder="3D Genomics&#10;Single-cell sequencing&#10;..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Hobbies (one per line)</label>
                                    <textarea
                                        value={aboutMeForm.hobbies}
                                        onChange={e => setAboutMeForm({ ...aboutMeForm, hobbies: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                                        placeholder="Riding a bike&#10;Camping&#10;..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Future Goal (HTML allowed)</label>
                                    <textarea
                                        value={aboutMeForm.future_goal}
                                        onChange={e => setAboutMeForm({ ...aboutMeForm, future_goal: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                                        placeholder="Enter future goals"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={closeModal}
                                        className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveAboutMe}
                                        className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl max-w-4xl w-full p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                            <button
                                onClick={closeModal}
                                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={24} />
                            </button>

                            <h3 className="text-2xl font-bold text-slate-900 mb-6">Edit Academic Links</h3>

                            <div className="space-y-4">
                                {/* Links Section */}
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                    <h4 className="text-lg font-bold text-slate-800 mb-4">Links</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">ORCiD URL</label>
                                            <input
                                                type="text"
                                                value={academicLinksForm.ORCiD}
                                                onChange={e => setAcademicLinksForm({ ...academicLinksForm, ORCiD: e.target.value })}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="https://orcid.org/0000-0001-8767-4080"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Google Scholar URL</label>
                                            <input
                                                type="text"
                                                value={academicLinksForm.GoogleScholar}
                                                onChange={e => setAcademicLinksForm({ ...academicLinksForm, GoogleScholar: e.target.value })}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="https://scholar.google.com/citations?user=..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={closeModal}
                                        className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveAcademic}
                                        className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
