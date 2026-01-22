import React from 'react';
import { Search } from 'lucide-react';
import { GenomeVisualizationEnhanced as GenomeVisualization } from '../components/GenomeVisualizationEnhanced';

export const ResearchHiCBrowser: React.FC = () => {
    return (
        <div className='space-y-8 animate-fadeIn'>
            <div>
                <p className='text-slate-500 text-lg'>
                    Interactive visualization of chromatin loops, transcription start site (TSS)/promoter locations, and gene last exon positions
                </p>
            </div>

            <div className='h-[500px] flex flex-col'>
                <GenomeVisualization />
            </div>
        </div>
    );
};
