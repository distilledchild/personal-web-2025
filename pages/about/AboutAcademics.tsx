import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { API_URL } from '../../utils/apiConfig';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

interface AboutAcademicData {
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

interface AboutAcademicsProps {
    user: any;
    isAuthorized: boolean;
}

export const AboutAcademics: React.FC<AboutAcademicsProps> = ({ user, isAuthorized }) => {
    const [aboutAcademic, setAboutAcademic] = useState<AboutAcademicData | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Academic Links Form
    const [academicLinksForm, setAcademicLinksForm] = useState({
        ORCiD: '',
        GoogleScholar: ''
    });

    useLockBodyScroll(isModalOpen);

    useEffect(() => {
        fetchAboutAcademic();
    }, []);

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

    const openAcademicModal = () => {
        if (aboutAcademic) {
            const { links } = aboutAcademic;

            // Set links form
            setAcademicLinksForm({
                ORCiD: links?.ORCiD || '',
                GoogleScholar: links?.GoogleScholar || ''
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    return (
        <div className="animate-fadeIn flex flex-col lg:flex-row gap-8 flex-1 min-h-0 relative">
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
                </div>
            </div>

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

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-4xl w-full p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <h3 className="text-2xl font-bold text-slate-900 mb-6">
                            Edit Academic Data
                        </h3>

                        <div className="space-y-6">
                            {/* Links Manager - User friendly */}
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                <h4 className="text-lg font-bold text-slate-800 mb-4">External Links</h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">ORCiD URL</label>
                                        <input
                                            type="text"
                                            value={academicLinksForm.ORCiD}
                                            onChange={e => setAcademicLinksForm(prev => ({ ...prev, ORCiD: e.target.value }))}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="https://orcid.org/..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Google Scholar URL</label>
                                        <input
                                            type="text"
                                            value={academicLinksForm.GoogleScholar}
                                            onChange={e => setAcademicLinksForm(prev => ({ ...prev, GoogleScholar: e.target.value }))}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="https://scholar.google.com/..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleSaveAcademic}
                                    className="px-6 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-colors"
                                >
                                    Save Changes
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
