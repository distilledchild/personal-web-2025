import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ScatterChart, Scatter, ZAxis } from 'recharts';
import { FileText, GitBranch, Database, Sliders, Search, Cat } from 'lucide-react';
import { ResearchHiCBrowser } from './ResearchHiCBrowser';
import { ResearchBreedchain } from './ResearchBreedchain';
import { ResearchPEInteractions } from './ResearchPEInteractions';
import { PageHeader } from '../components/PageHeader';

const mockInteractionData = Array.from({ length: 50 }, (_, i) => ({
  name: `Loc ${i * 10}kb`,
  interaction: Math.abs(Math.sin(i * 0.2) * 10) + Math.random() * 5,
  ctcf: Math.abs(Math.cos(i * 0.2) * 8),
  enhancer: i > 20 && i < 35 ? 15 : 2
}));

const mockScatterData = Array.from({ length: 100 }, () => ({
  x: Math.random() * 100,
  y: Math.random() * 100,
  z: Math.random() * 500, // expression
  cluster: Math.random() > 0.5 ? 'Cluster A' : 'Cluster B'
}));



const SingleCell = () => (
  <div className="space-y-8 animate-fadeIn">
    {/* <div className="border-b border-slate-100 pb-6"> */}
    <div>
      <p className="text-slate-500 text-lg">Dimensionality reduction (UMAP) and clustering of 10k PBMCs.</p>
    </div>

    <div className="h-[500px] w-full bg-slate-50 rounded-2xl p-6 border border-slate-100">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis type="number" dataKey="x" name="UMAP_1" stroke="#94a3b8" tick={false} />
          <YAxis type="number" dataKey="y" name="UMAP_2" stroke="#94a3b8" tick={false} />
          <ZAxis type="number" dataKey="z" range={[50, 400]} name="Expression" />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '12px' }} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Scatter name="Cluster A (Neural)" data={mockScatterData.filter(d => d.cluster === 'Cluster A')} fill="#DB2777" shape="circle" />
          <Scatter name="Cluster B (Progenitor)" data={mockScatterData.filter(d => d.cluster === 'Cluster B')} fill="#4ade80" shape="triangle" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>

    <div className="flex gap-4 overflow-x-auto pb-2">
      {['QC Passed: 98%', 'Doublets Removed', 'Mito < 5%'].map((tag, i) => (
        <span key={i} className="bg-white text-slate-700 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap border border-slate-200">
          {tag}
        </span>
      ))}
    </div>
  </div>
);

const EnhancerID = () => (
  <div className="space-y-8 animate-fadeIn">
    {/* <div className="border-b border-slate-100 pb-6"> */}
    <div>
      <p className="text-slate-500 text-lg">Deep learning prediction of enhancer regions using sequence motifs and conservation.</p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <h4 className="text-lg font-bold text-slate-900 mb-4">Model Architecture & Pipeline</h4>
        <p className="text-slate-600 mb-6 leading-relaxed">
          We utilize a CNN-LSTM hybrid architecture to capture both local motif patterns and long-range sequence dependencies. Input features include one-hot encoded DNA sequences, conservation scores (PhyloP), and chromatin accessibility signals (ATAC-seq).
        </p>

        <div className="bg-slate-900 rounded-2xl p-6 overflow-x-auto shadow-inner">
          <code className="text-sm font-mono leading-relaxed">
            <span className="text-purple-400">def</span> <span className="text-blue-400">predict_enhancer</span>(sequence, atac_signal):<br />
            &nbsp;&nbsp;<span className="text-slate-500"># Load pre-trained weights</span><br />
            &nbsp;&nbsp;model = load_model(<span className="text-yellow-300">'enhancer_net_v2.h5'</span>)<br />
            &nbsp;&nbsp;<span className="text-slate-500"># Feature extraction</span><br />
            &nbsp;&nbsp;features = extract_motifs(sequence)<br />
            &nbsp;&nbsp;conservation = get_phyloP_score(sequence)<br />
            &nbsp;&nbsp;<span className="text-purple-400">return</span> model.predict([features, conservation])
          </code>
        </div>
      </div>

      <div className="space-y-6">
        <div className="border border-slate-100 p-6 rounded-2xl">
          <h4 className="font-bold text-slate-900 mb-3 text-lg">Input Features</h4>
          <ul className="list-disc list-inside text-slate-700 space-y-2">
            <li><strong>Sequence:</strong> 1kb window centered on peak</li>
            <li><strong>Accessibility:</strong> ATAC-seq peak intensity</li>
            <li><strong>Epigenetics:</strong> H3K27ac ChIP-seq signal</li>
            <li><strong>Conservation:</strong> 100-way vertebrate alignment</li>
          </ul>
        </div>
        <div className="border border-slate-100 p-6 rounded-2xl">
          <h4 className="font-bold text-slate-900 mb-3 text-lg">Performance Metrics</h4>
          <ul className="list-disc list-inside text-slate-700 space-y-2">
            <li><strong>AUROC:</strong> 0.94</li>
            <li><strong>AUPR:</strong> 0.89</li>
            <li><strong>Validation:</strong> CRISPRi validated regions</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);

export const Research: React.FC = () => {
  const { submenu } = useParams<{ submenu?: string }>();
  const navigate = useNavigate();

  const tabs = [
    { label: 'Hi-C Browser', icon: Search, color: 'text-teal-500 border-teal-500', activeBg: 'bg-teal-50 ring-teal-200', slug: 'hicbrowser' },
    { label: 'Breedchain', icon: Cat, color: 'text-teal-500 border-teal-500', activeBg: 'bg-teal-50 ring-teal-200', slug: 'breedchain' },
    { label: 'PE Interactions', icon: GitBranch, color: 'text-teal-500 border-teal-500', activeBg: 'bg-teal-50 ring-teal-200', slug: 'peinteractions' },
    { label: 'Single-cell Seq', icon: Database, color: 'text-teal-500 border-teal-500', activeBg: 'bg-teal-50 ring-teal-200', slug: 'singlecellseq' },
    { label: 'DL & Enhancer', icon: FileText, color: 'text-teal-500 border-teal-500', activeBg: 'bg-teal-50 ring-teal-200', slug: 'deeplearningenhancer' },
  ];

  // Determine active tab from URL, default to first tab
  const activeTabIndex = tabs.findIndex(tab => tab.slug === submenu);
  const activeTab = activeTabIndex !== -1 ? activeTabIndex : 0;

  // Prefetch initial genome data (chr1) in background when Research page loads
  React.useEffect(() => {
    const prefetchInitialData = async () => {
      try {
        // Import dynamically to avoid blocking main bundle if possible, 
        // but here we just use the imported functions if we were to import them at top level.
        // Since we need to modify imports, let's assume we'll add imports at the top.
        const { loadChromosomeData, loadLoopDataForChr, loadGeneDataForChr } = await import('../utils/csvLoader');

        // Load chromosome list and chr1 data (default view)
        await Promise.all([
          loadChromosomeData(),
          loadLoopDataForChr('chr1'),
          loadGeneDataForChr('chr1')
        ]);
        console.log('Initial genome data prefetched');
      } catch (error) {
        console.error('Failed to prefetch genome data:', error);
      }
    };

    prefetchInitialData();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      <PageHeader
        title="Projects"
        tabs={tabs.map(tab => ({
          ...tab,
          id: tab.slug // Use slug as id for PageHeader
        }))}
        activeTab={submenu || 'hicbrowser'}
        onTabChange={(id) => navigate(`/research/${id}`)}
        activeColor="text-teal-500 border-teal-500"
      />

      {/* Scrollable Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          {(activeTab === 0) && <ResearchHiCBrowser />}
          {(activeTab === 1) && <ResearchBreedchain />}
          {(activeTab === 2) && <ResearchPEInteractions />}
          {(activeTab === 3) && <SingleCell />}
          {(activeTab === 4) && <EnhancerID />}
        </div>
      </div>
    </div>
  );
};