import React from 'react';
import { Search } from 'lucide-react';
import { GenomeVisualizationEnhanced as GenomeVisualization } from '../components/GenomeVisualizationEnhanced';

export const ResearchLoopBrowser: React.FC = () => {
    return (
        <div className='space-y-8 animate-fadeIn'>
            <div className="space-y-4">
                <p className='text-slate-500 text-lg'>
                    Interactive visualization of chromatin loops, transcription start site (TSS)/promoter locations, and gene positions.
                </p>
                <div className='h-[650px] flex flex-col'>
                    <GenomeVisualization />
                </div>
            </div>
        </div>
    );
};
