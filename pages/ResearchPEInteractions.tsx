import React from 'react';
import { GitBranch, Dna, Share2, Layers } from 'lucide-react';

export const ResearchPEInteractions: React.FC = () => {
    return (
        <div className="space-y-12 animate-fadeIn pb-12">
            {/* Hero Section */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 p-8 md:p-12 shadow-2xl">
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-sm font-medium mb-6 backdrop-blur-sm border border-teal-500/30">
                        <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                        Manuscript in Preparation
                    </div>

                    <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-6 leading-tight">
                        Genome-Wide Annotation of <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">Promoter-Enhancer Interactions</span> via Chromatin Loops
                    </h1>

                    <p className="text-slate-300 text-lg md:text-xl max-w-3xl leading-relaxed">
                        Constructing a comprehensive map of chromatin interactions in the rat frontal cortex to delineate the 3D regulatory landscape controlling gene expression.
                    </p>
                </div>

                {/* Abstract decoration */}
                <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 opacity-10 pointer-events-none">
                    <Dna size={400} />
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Main Text */}
                <div className="lg:col-span-2 space-y-10">

                    {/* Overview Section */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                            <div className="p-2 bg-teal-50 text-teal-500 rounded-lg">
                                <Share2 size={24} />
                            </div>
                            Overview
                        </h2>
                        <p className="text-slate-600 leading-relaxed text-lg">
                            The laboratory rat (<span className="italic">Rattus norvegicus</span>) is a critical model for biomedical research, yet its functional genomic annotations lag significantly behind those of human and mouse. This project addresses this gap by constructing a comprehensive map of chromatin interactions in the rat frontal cortex. Leveraging high-throughput chromosome conformation capture (Hi-C) sequencing data from the Hybrid Rat Diversity Panel (HRDP), we aim to delineate the 3D regulatory landscape that controls gene expression.
                        </p>
                    </section>

                    {/* Methodology Section */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                            <div className="p-2 bg-teal-50 text-teal-500 rounded-lg">
                                <Layers size={24} />
                            </div>
                            Methodology & Pipeline
                        </h2>
                        <p className="text-slate-600 leading-relaxed mb-6">
                            To identify high-confidence Promoter-Enhancer (P-E) interactions, I developed a multi-stage computational pipeline that integrates 3D chromatin topology with 1D genomic features:
                        </p>

                        <div className="space-y-4">
                            <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 transition-hover hover:border-slate-200">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">1</div>
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-1">Hi-C Data Processing</h3>
                                    <p className="text-slate-600 text-sm leading-relaxed">
                                        Analyzed deep-sequencing data from 10 genetically diverse inbred rat strains using the Juicer pipeline, calling chromatin loops at multiple resolutions (5kb, 10kb, and 25kb).
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 transition-hover hover:border-slate-200">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">2</div>
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-1">Motif Integration</h3>
                                    <p className="text-slate-600 text-sm leading-relaxed">
                                        Curated over 3 million CTCF binding sites using FIMO scanning to define architectural boundaries.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 transition-hover hover:border-slate-200">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">3</div>
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-1">Dual-Criteria Filtering</h3>
                                    <p className="text-slate-600 text-sm leading-relaxed mb-2">
                                        Implemented a rigorous filtering strategy to distinguish functional regulatory loops from structural noise. This involves:
                                    </p>
                                    <ul className="list-disc list-inside text-slate-600 text-sm space-y-1 ml-2">
                                        <li><strong className="text-slate-700">Architectural Validation:</strong> Selecting loops anchored by strong CTCF motifs.</li>
                                        <li><strong className="text-slate-700">Functional Annotation:</strong> Mapping Transcription Start Sites (TSS) and promoters to loop anchors to pinpoint physical links between distal regulatory elements and target genes.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Column - Impact/Stats */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 text-white shadow-lg">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            <GitBranch className="text-white/80" />
                            Impact
                        </h2>
                        <p className="text-emerald-50 leading-relaxed font-medium">
                            This study establishes a foundational resource for rat genomics, enabling the interpretation of non-coding genetic variants.
                        </p>
                        <div className="my-6 h-px bg-white/20" />
                        <p className="text-sm text-emerald-100 leading-relaxed">
                            By linking distal enhancers to their target promoters, this interactive visualization allows researchers to explore the genetic architecture of complex traits and behavioral phenotypes in the rat model.
                        </p>
                    </div>

                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-900 mb-4">Key Metrics</h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-500">Strains Analyzed</span>
                                    <span className="font-bold text-slate-900">10</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div className="bg-gradient-to-r from-teal-400 to-teal-600 h-2 rounded-full w-full"></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-500">CTCF Sites</span>
                                    <span className="font-bold text-slate-900">&gt;3M</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div className="bg-gradient-to-r from-teal-400 to-teal-600 h-2 rounded-full w-[85%]"></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-500">Resolutions</span>
                                    <span className="font-bold text-slate-900">3 (5/10/25kb)</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div className="bg-gradient-to-r from-teal-400 to-teal-600 h-2 rounded-full w-[60%]"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
