import React, { useState } from 'react';
import { Laptop, GitBranch, Cpu, Cloud, Server, Globe, Database, Shield, Layout, ArrowRight, ArrowDown, X, ZoomIn } from 'lucide-react';

export const AboutTechStack: React.FC = () => {
    const [isZoomed, setIsZoomed] = useState(false);
    const diagramUrl = "https://storage.googleapis.com/distilledchild/about/tech-stack/tech-flow.png";

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header Section */}
            <div>
                <p className="text-slate-500 text-lg">
                    This website is designed as a modern, cloud-native full-stack application. It features automated deployment, secure server-side logic, and integration with cloud storage.
                </p>
            </div>

            {/* 1st Row: Full-width Architecture Diagram */}
            <div>
                <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Cloud size={20} className="text-blue-500" />
                    System Architecture Diagram
                </h4>
                <div
                    className="bg-slate-50 rounded-2xl overflow-hidden shadow-md border border-slate-100 flex flex-col items-center justify-center cursor-zoom-in group relative min-h-[250px]"
                    onClick={() => setIsZoomed(true)}
                >
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-300 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="bg-white/90 p-3 rounded-full shadow-lg text-slate-600 flex items-center gap-2 font-semibold text-sm">
                            <ZoomIn size={18} />
                            Zoom Diagram
                        </div>
                    </div>

                    {/* Placeholder illustration when image fails to load or before it's created */}
                    <img
                        src={diagramUrl}
                        alt="System Architecture & CI/CD Pipeline Diagram"
                        className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-[1.01]"
                        onError={(e) => {
                            // Fallback rendering if image doesn't exist yet
                            e.currentTarget.style.display = 'none';
                            const placeholder = e.currentTarget.parentElement?.querySelector('.diagram-placeholder');
                            if (placeholder) {
                                (placeholder as HTMLElement).style.display = 'flex';
                            }
                        }}
                    />

                    {/* Styled fallback UI if the image is missing */}
                    <div className="diagram-placeholder hidden w-full h-[300px] flex-col items-center justify-center text-slate-400 p-8 space-y-3">
                        <Cloud size={48} className="text-blue-300 animate-pulse" />
                        <p className="text-sm font-semibold">Architecture Diagram Image Pending</p>
                        <p className="text-xs text-slate-400 text-center max-w-md">
                            Generate your infographic image, upload it as <strong>tech-flow.png</strong> to your public folder, and it will render here automatically.
                        </p>
                    </div>
                </div>
            </div>

            {/* 2nd Row: 2 Rows of 3 Columns Technology Stack */}
            <div>
                <h4 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Server size={20} className="text-blue-500" />
                    Technology Details
                </h4>

                {/* 1 Row x 4 Columns Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Card 1: Frontend & UI */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                <Layout size={20} className="text-blue-600" />
                            </div>
                            <div>
                                <h5 className="font-bold text-slate-900 text-sm">Frontend & UI</h5>
                                <span className="text-xs text-slate-400">Core logic & presentation</span>
                            </div>
                        </div>
                        <ul className="text-slate-600 text-xs space-y-2">
                            <li className="flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-blue-500" />
                                <strong>React 18 & Vite</strong> - UI & Bundling
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-blue-500" />
                                <strong>TypeScript</strong> - Strict safety
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-blue-500" />
                                <strong>Tailwind CSS</strong> - Rapid styling
                            </li>
                        </ul>
                    </div>

                    {/* Card 2: Backend & API */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                <Server size={20} className="text-blue-600" />
                            </div>
                            <div>
                                <h5 className="font-bold text-slate-900 text-sm">Backend & API</h5>
                                <span className="text-xs text-slate-400">Node API server</span>
                            </div>
                        </div>
                        <ul className="text-slate-600 text-xs space-y-2">
                            <li className="flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-blue-500" />
                                <strong>Node.js</strong> - Event-driven engine
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-blue-500" />
                                <strong>Express</strong> - REST endpoint routes
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-blue-500" />
                                <strong>Secure Middleware</strong> - Cors & Auth
                            </li>
                        </ul>
                    </div>

                    {/* Card 3: Data & Storage */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                <Database size={20} className="text-blue-600" />
                            </div>
                            <div>
                                <h5 className="font-bold text-slate-900 text-sm">Data & Storage</h5>
                                <span className="text-xs text-slate-400">Structured data & files</span>
                            </div>
                        </div>
                        <ul className="text-slate-600 text-xs space-y-2">
                            <li className="flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-blue-500" />
                                <strong>MongoDB Atlas</strong> - Cloud hosting
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-blue-500" />
                                <strong>Google Cloud Storage</strong> - File bucket
                            </li>
                        </ul>
                    </div>

                    {/* Card 4: Cloud & Deployment */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                <Cloud size={20} className="text-blue-600" />
                            </div>
                            <div>
                                <h5 className="font-bold text-slate-900 text-sm">Cloud & Deployment</h5>
                                <span className="text-xs text-slate-400">Engine & Hosting</span>
                            </div>
                        </div>
                        <ul className="text-slate-600 text-xs space-y-2">
                            <li className="flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-blue-500" />
                                <strong>Vercel</strong> - Front-end static deployment
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-blue-500" />
                                <strong>Google Cloud Run</strong> - Container runtime
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-blue-500" />
                                <strong>GCP Secret Manager</strong> - Key injection
                            </li>
                        </ul>
                    </div>
                </div>
            </div>



            {/* Image Zoom Modal */}
            {isZoomed && (
                <div
                    className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 md:p-12 animate-fadeIn backdrop-blur-md cursor-zoom-out"
                    onClick={() => setIsZoomed(false)}
                >
                    <button
                        className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors bg-white/10 p-2 rounded-full hover:bg-white/20"
                        onClick={() => setIsZoomed(false)}
                        aria-label="Close Preview"
                        title="Close Preview"
                    >
                        <X size={32} />
                    </button>
                    <div
                        className="relative max-w-7xl max-h-full overflow-auto scrollbar-hide rounded-xl shadow-2xl animate-scaleIn"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={diagramUrl}
                            alt="System Architecture & CI/CD Pipeline Diagram Full Size"
                            className="w-full h-auto"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const modalPlaceholder = e.currentTarget.parentElement?.querySelector('.modal-placeholder');
                                if (modalPlaceholder) {
                                    (modalPlaceholder as HTMLElement).style.display = 'flex';
                                }
                            }}
                        />
                        <div className="modal-placeholder hidden w-[600px] h-[300px] bg-slate-800 rounded-xl flex-col items-center justify-center text-slate-300 p-8 space-y-3">
                            <Cloud size={48} className="text-blue-400 animate-pulse" />
                            <p className="text-sm font-semibold">Diagram Image Pending</p>
                            <p className="text-xs text-slate-400 text-center max-w-md">
                                Set up your <strong>tech-flow.png</strong> in the public folder to view the full size version.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
