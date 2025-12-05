import React from 'react';
import { Search } from 'lucide-react';
import { GenomeVisualizationEnhanced as GenomeVisualization } from '../components/GenomeVisualizationEnhanced';

export const ResearchHiCBrowser: React.FC = () => {
    return (
        <div className='space-y-8 animate-fadeIn'>
            <div className="border-b border-slate-100 pb-6">
                <h3 className='text-2xl font-bold text-slate-900 flex items-center gap-3'>
                    <Search size={24} className="text-teal-500" />
                    Hi-C Browser - Chromatin Loops & Gene Regulation
                </h3>
                <p className='text-slate-500 mt-2 text-lg'>
                    Interactive visualization of chromatin loops, transcription start site (TSS)/promoter locations, and gene last exon positions
                </p>
            </div>

            <div className='h-[500px] flex flex-col'>
                <GenomeVisualization />
            </div>
        </div>
    );
};
